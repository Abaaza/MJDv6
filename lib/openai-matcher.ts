interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

interface MatchResult {
  description: string
  rate: number
  confidence: number
  similarity: number
  jaccardScore: number
}

export class OpenAIMatcher {
  private apiKey: string
  private model = "text-embedding-3-large"
  private batchSize = 100

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // Preprocessing functions matching your Python script exactly
  private applySynonyms(text: string): string {
    const synonymMap: { [key: string]: string } = {
      bricks: "brick",
      brickwork: "brick",
      blocks: "brick",
      blockwork: "brick",
      cement: "concrete",
      concrete: "concrete",
      footing: "foundation",
      footings: "foundation",
      excavation: "excavate",
      excavations: "excavate",
      excavate: "excavate",
      dig: "excavate",
      installation: "install",
      installing: "install",
      installed: "install",
      demolition: "demolish",
      demolish: "demolish",
      demolishing: "demolish",
      remove: "demolish",
      supply: "provide",
      supplies: "provide",
      providing: "provide",
    }

    const parts = text.split(" ").map((word) => {
      let processedWord = synonymMap[word] || word
      // Apply stemming-like reduction
      if (processedWord.length > 3) {
        processedWord = processedWord.replace(/(ings|ing|ed|es|s)$/, "")
      }
      return processedWord
    })

    return parts.join(" ")
  }

  private removeStopWords(text: string): string {
    const stopWords = new Set([
      "the",
      "and",
      "of",
      "to",
      "in",
      "for",
      "on",
      "at",
      "by",
      "from",
      "with",
      "a",
      "an",
      "be",
      "is",
      "are",
      "as",
      "it",
      "its",
      "into",
      "or",
    ])

    return text
      .split(" ")
      .filter((word) => word && !stopWords.has(word))
      .join(" ")
  }

  private preprocessText(text: string): string {
    if (!text) return ""

    // Convert to lowercase and remove special characters
    let processed = text.toLowerCase()
    processed = processed.replace(/[^a-z0-9\s]/g, " ")
    processed = processed.replace(/\b\d+(?:\.\d+)?\b/g, " ") // Remove numbers
    processed = processed.replace(/\s+(mm|cm|m|inch|in|ft)\b/g, " ") // Remove units
    processed = processed.replace(/\s+/g, " ").trim()

    // Apply synonyms and stemming
    processed = this.applySynonyms(processed)

    // Remove stop words
    processed = this.removeStopWords(processed)

    return processed
  }

  private async getEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = []

    // Process in batches
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize)

      try {
        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            input: batch,
          }),
        })

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
        }

        const data: OpenAIEmbeddingResponse = await response.json()

        // Add embeddings in order
        for (const item of data.data) {
          embeddings[i + item.index] = item.embedding
        }

        // Rate limiting - wait between batches
        if (i + this.batchSize < texts.length) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error(`Error processing batch ${i / this.batchSize + 1}:`, error)
        throw error
      }
    }

    return embeddings
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    return dotProduct / (magnitudeA * magnitudeB)
  }

  private jaccardSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(text1.match(/\b[a-zA-Z0-9]+\b/g) || [])
    const tokens2 = new Set(text2.match(/\b[a-zA-Z0-9]+\b/g) || [])

    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)))
    const union = new Set([...tokens1, ...tokens2])

    return union.size === 0 ? 0 : intersection.size / union.size
  }

  private normalizeEmbeddings(embeddings: number[][]): number[][] {
    return embeddings.map((embedding) => {
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
      return embedding.map((val) => val / magnitude)
    })
  }

  async matchItems(
    inquiryDescriptions: string[],
    pricelistDescriptions: string[],
    pricelistRates: number[],
    onProgress?: (progress: string) => void,
  ): Promise<MatchResult[]> {
    try {
      onProgress?.("Preprocessing inquiry descriptions...")
      const processedInquiry = inquiryDescriptions.map((desc) => this.preprocessText(desc))

      onProgress?.("Preprocessing pricelist descriptions...")
      const processedPricelist = pricelistDescriptions.map((desc) => this.preprocessText(desc))

      onProgress?.("Computing embeddings for pricelist descriptions...")
      const pricelistEmbeddings = await this.getEmbeddings(processedPricelist)

      onProgress?.("Computing embeddings for inquiry descriptions...")
      const inquiryEmbeddings = await this.getEmbeddings(processedInquiry)

      onProgress?.("Normalizing embeddings...")
      const normalizedPricelistEmbeddings = this.normalizeEmbeddings(pricelistEmbeddings)
      const normalizedInquiryEmbeddings = this.normalizeEmbeddings(inquiryEmbeddings)

      onProgress?.("Calculating similarity scores...")
      const results: MatchResult[] = []

      for (let i = 0; i < inquiryDescriptions.length; i++) {
        const inquiryEmbed = normalizedInquiryEmbeddings[i]
        const inquiryText = processedInquiry[i]

        let bestMatch = {
          index: 0,
          cosineScore: 0,
          jaccardScore: 0,
          combinedScore: 0,
        }

        // Calculate similarities with all pricelist items
        for (let j = 0; j < pricelistDescriptions.length; j++) {
          const pricelistEmbed = normalizedPricelistEmbeddings[j]
          const pricelistText = processedPricelist[j]

          // Cosine similarity
          const cosineScore = this.cosineSimilarity(inquiryEmbed, pricelistEmbed)

          // Jaccard similarity
          const jaccardScore = this.jaccardSimilarity(inquiryText, pricelistText)

          // Combined score (85% cosine + 15% jaccard - matching your Python script)
          const combinedScore = 0.85 * cosineScore + 0.15 * jaccardScore

          if (combinedScore > bestMatch.combinedScore) {
            bestMatch = {
              index: j,
              cosineScore,
              jaccardScore,
              combinedScore,
            }
          }
        }

        results.push({
          description: pricelistDescriptions[bestMatch.index],
          rate: pricelistRates[bestMatch.index],
          confidence: Math.round(bestMatch.combinedScore * 100),
          similarity: bestMatch.cosineScore,
          jaccardScore: bestMatch.jaccardScore,
        })

        onProgress?.(`Processed ${i + 1}/${inquiryDescriptions.length} items`)
      }

      onProgress?.("Matching complete!")
      return results
    } catch (error) {
      console.error("OpenAI matching error:", error)
      throw new Error(`OpenAI matching failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}
