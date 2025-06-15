interface MatchResult {
  bestMatch: string
  bestRate: number
  confidence: number
  similarityScore: number
  jaccardScore: number
}

interface PricelistItem {
  description: string
  rate: number
}

export class CohereMatcher {
  private apiKey: string
  private readonly EMBEDDING_MODEL = "embed-v4.0"
  private readonly EMBEDDING_DIMENSION = 1536
  private readonly BATCH_SIZE = 96

  constructor(apiKey: string) {
    this.apiKey = apiKey
    console.log("🔵 CohereMatcher initialized with model:", this.EMBEDDING_MODEL)
  }

  async matchItems(
    inquiryItems: string[],
    pricelistItems: PricelistItem[],
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<MatchResult[]> {
    console.log("🔵 === COHERE MATCHING START ===")
    console.log("📊 Input validation:", {
      inquiryItemsCount: inquiryItems.length,
      pricelistItemsCount: pricelistItems.length,
      apiKeyLength: this.apiKey.length,
      model: this.EMBEDDING_MODEL,
      batchSize: this.BATCH_SIZE,
      timestamp: new Date().toISOString(),
    })

    console.log("📝 Sample inquiry items:", inquiryItems.slice(0, 3))
    console.log(
      "📝 Sample pricelist items:",
      pricelistItems.slice(0, 3).map((item) => ({
        description: item.description,
        rate: item.rate,
      })),
    )

    console.log("🔵 Starting Cohere matching process...")
    console.log("📊 Input data:", {
      inquiryItemsCount: inquiryItems.length,
      pricelistItemsCount: pricelistItems.length,
    })

    try {
      // Preprocess all text
      progressCallback?.(5, "Preprocessing text data...")

      console.log("🔄 === TEXT PREPROCESSING ===")
      console.log("📊 Preprocessing inquiry items...")
      const processedInquiry = inquiryItems.map((item, index) => {
        const processed = this.preprocessText(item)
        if (index < 3) {
          console.log(`📝 Inquiry ${index + 1}: "${item}" -> "${processed}"`)
        }
        return processed
      })

      console.log("📊 Preprocessing pricelist items...")
      const processedPricelist = pricelistItems.map((item, index) => {
        const processed = this.preprocessText(item.description)
        if (index < 3) {
          console.log(`📝 Pricelist ${index + 1}: "${item.description}" -> "${processed}"`)
        }
        return processed
      })

      // Get embeddings for pricelist (documents)
      progressCallback?.(10, "Getting embeddings for price list items...")
      console.log("🔄 Getting embeddings for pricelist items...")
      const pricelistEmbeddings = await this.getEmbeddings(processedPricelist, "search_document", progressCallback)

      // Get embeddings for inquiry (queries)
      progressCallback?.(60, "Getting embeddings for inquiry items...")
      console.log("🔄 Getting embeddings for inquiry items...")
      const inquiryEmbeddings = await this.getEmbeddings(processedInquiry, "search_query")

      // Calculate similarities
      progressCallback?.(80, "Calculating similarity scores using Cohere embed-v4.0...")
      console.log("🔄 Calculating similarity scores...")
      const results = this.calculateMatches(
        processedInquiry,
        processedPricelist,
        inquiryEmbeddings,
        pricelistEmbeddings,
        pricelistItems,
      )

      progressCallback?.(100, "Matching completed successfully")
      console.log("✅ Cohere matching completed successfully")
      console.log("📊 Results summary:", {
        resultsCount: results.length,
        averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
        highConfidenceCount: results.filter((r) => r.confidence >= 80).length,
      })

      return results
    } catch (error) {
      console.error("❌ Cohere matching failed:", error)
      throw new Error(`Cohere matching failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private async getEmbeddings(
    texts: string[],
    inputType: "search_document" | "search_query",
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<number[][]> {
    const embeddings: number[][] = []
    const totalBatches = Math.ceil(texts.length / this.BATCH_SIZE)

    console.log(`🔄 === GETTING EMBEDDINGS (${inputType}) ===`)
    console.log("📊 Embedding parameters:", {
      textsCount: texts.length,
      inputType,
      model: this.EMBEDDING_MODEL,
      dimension: this.EMBEDDING_DIMENSION,
      batchSize: this.BATCH_SIZE,
      totalBatches,
      timestamp: new Date().toISOString(),
    })

    console.log(`🔄 Processing ${totalBatches} batches for ${inputType}`)

    for (let i = 0; i < texts.length; i += this.BATCH_SIZE) {
      const batch = texts.slice(i, i + this.BATCH_SIZE)
      const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1

      progressCallback?.(
        Math.floor((batchNumber / totalBatches) * 40) + (inputType === "search_document" ? 10 : 60),
        `Getting embeddings batch ${batchNumber}/${totalBatches}...`,
      )

      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`)

      console.log(`🌐 API Call ${batchNumber}/${totalBatches}:`, {
        batchSize: batch.length,
        url: "https://api.cohere.ai/v2/embed",
        model: this.EMBEDDING_MODEL,
        inputType,
        timestamp: new Date().toISOString(),
      })

      try {
        const response = await fetch("https://api.cohere.ai/v2/embed", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texts: batch,
            model: this.EMBEDDING_MODEL,
            input_type: inputType,
            output_dimension: this.EMBEDDING_DIMENSION,
            embedding_types: ["float"],
          }),
        })

        console.log(`📡 API Response ${batchNumber}/${totalBatches}:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          timestamp: new Date().toISOString(),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("❌ Cohere API error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          })
          throw new Error(`Cohere API error: ${response.status} - ${errorData.message || response.statusText}`)
        }

        const data = await response.json()
        embeddings.push(...data.embeddings.float)
        console.log(`✅ Batch ${batchNumber} processed successfully`)
      } catch (error) {
        console.error(`❌ Failed to process batch ${batchNumber}:`, error)
        throw new Error(`Failed to get embeddings: ${error instanceof Error ? error.message : "Unknown error"}`)
      }

      // Small delay to respect rate limits
      if (i + this.BATCH_SIZE < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log(`✅ All embeddings processed: ${embeddings.length} vectors`)
    return embeddings
  }

  private calculateMatches(
    inquiryTexts: string[],
    pricelistTexts: string[],
    inquiryEmbeddings: number[][],
    pricelistEmbeddings: number[][],
    pricelistItems: PricelistItem[],
  ): MatchResult[] {
    console.log("🔄 === SIMILARITY CALCULATION ===")
    console.log("📊 Calculation parameters:", {
      inquiryCount: inquiryTexts.length,
      pricelistCount: pricelistTexts.length,
      embeddingDimension: inquiryEmbeddings[0]?.length,
      timestamp: new Date().toISOString(),
    })

    console.log("🔄 Calculating matches...")

    // Normalize embeddings for cosine similarity
    const normalizedInquiry = this.normalizeEmbeddings(inquiryEmbeddings)
    const normalizedPricelist = this.normalizeEmbeddings(pricelistEmbeddings)

    // Precompute token sets for Jaccard similarity
    const inquiryTokens = inquiryTexts.map((text) => this.getTokenSet(text))
    const pricelistTokens = pricelistTexts.map((text) => this.getTokenSet(text))

    const results: MatchResult[] = []

    // Add progress logging every 10 items
    for (let i = 0; i < inquiryTexts.length; i++) {
      if (i % 10 === 0 || i < 5) {
        console.log(`🔄 Processing inquiry item ${i + 1}/${inquiryTexts.length}: "${inquiryTexts[i]}"`)
      }

      let bestMatch = ""
      let bestRate = 0
      let bestScore = -1
      let bestSimilarity = 0
      let bestJaccard = 0

      for (let j = 0; j < pricelistTexts.length; j++) {
        const inquiryEmbed = normalizedInquiry[i]
        const pricelistEmbed = normalizedPricelist[j]
        const priceTokens = pricelistTokens[j]
        const queryTokens = inquiryTokens[i]

        // Cosine similarity
        const cosineSim = this.dotProduct(inquiryEmbed, pricelistEmbed)

        // Jaccard similarity
        const jaccardSim = this.jaccardSimilarity(queryTokens, priceTokens)

        // Combined score (85% cosine + 15% Jaccard)
        const combinedScore = 0.85 * cosineSim + 0.15 * jaccardSim

        if (combinedScore > bestScore) {
          bestScore = combinedScore
          bestMatch = pricelistItems[j].description
          bestRate = pricelistItems[j].rate
          bestSimilarity = cosineSim
          bestJaccard = jaccardSim
        }
      }

      results.push({
        bestMatch,
        bestRate,
        confidence: Math.round(bestScore * 100),
        similarityScore: Math.round(bestSimilarity * 100) / 100,
        jaccardScore: Math.round(bestJaccard * 100) / 100,
      })

      if (i < 5) {
        console.log(
          `✅ Best match for "${inquiryTexts[i]}": "${bestMatch}" (confidence: ${Math.round(bestScore * 100)}%)`,
        )
      }
    }

    console.log("✅ Match calculation completed")
    return results
  }

  private preprocessText(text: string): string {
    if (!text) return ""

    // Convert to lowercase and remove special characters
    let processed = text.toLowerCase()
    processed = processed.replace(/[^a-z0-9\s]/g, " ")
    processed = processed.replace(/\b\d+(?:\.\d+)?\b/g, " ") // Remove numbers
    processed = processed.replace(/\s+(mm|cm|m|inch|in|ft)\b/g, " ") // Remove units
    processed = processed.replace(/\s+/g, " ").trim()

    // Apply synonyms
    const synonymMap: { [key: string]: string } = {
      bricks: "brick",
      brickwork: "brick",
      blocks: "brick",
      blockwork: "brick",
      cement: "concrete",
      footing: "foundation",
      footings: "foundation",
      excavation: "excavate",
      excavations: "excavate",
      installation: "install",
      installing: "install",
      demolition: "demolish",
      supply: "provide",
      supplies: "provide",
    }

    const words = processed.split(" ").map((word) => {
      // Apply stemming-like reduction
      if (word.length > 3) {
        word = word.replace(/(ings|ing|ed|es|s)$/, "")
      }
      return synonymMap[word] || word
    })

    // Remove stop words
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

    return words.filter((word) => word && !stopWords.has(word)).join(" ")
  }

  private normalizeEmbeddings(embeddings: number[][]): number[][] {
    return embeddings.map((embedding) => {
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
      return embedding.map((val) => val / norm)
    })
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0)
  }

  private getTokenSet(text: string): Set<string> {
    const tokens = text.match(/\b[a-zA-Z0-9]+\b/g) || []
    return new Set(tokens)
  }

  private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter((x) => setB.has(x)))
    const union = new Set([...setA, ...setB])
    return union.size === 0 ? 0 : intersection.size / union.size
  }
}
