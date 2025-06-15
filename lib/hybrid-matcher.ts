import { CohereMatcher } from "./cohere-matcher"
import { OpenAIMatcher } from "./openai-matcher"

interface HybridMatchResult {
  description: string
  rate: number
  confidence: number
  cohereScore: number
  openaiScore: number
  combinedScore: number
  source: "cohere" | "openai" | "consensus"
}

export class HybridMatcher {
  private cohereMatcher: CohereMatcher
  private openaiMatcher: OpenAIMatcher

  constructor(cohereApiKey: string, openaiApiKey: string) {
    this.cohereMatcher = new CohereMatcher(cohereApiKey)
    this.openaiMatcher = new OpenAIMatcher(openaiApiKey)
  }

  async matchItems(
    inquiryDescriptions: string[],
    pricelistDescriptions: string[],
    pricelistRates: number[],
    onProgress?: (progress: string) => void,
  ): Promise<HybridMatchResult[]> {
    try {
      onProgress?.("Starting hybrid matching with both Cohere and OpenAI...")

      // Run both matchers in parallel
      onProgress?.("Running Cohere matching...")
      const cohereResultsPromise = this.cohereMatcher.matchItems(
        inquiryDescriptions,
        pricelistDescriptions,
        pricelistRates,
        (progress) => onProgress?.(`Cohere: ${progress}`),
      )

      onProgress?.("Running OpenAI matching...")
      const openaiResultsPromise = this.openaiMatcher.matchItems(
        inquiryDescriptions,
        pricelistDescriptions,
        pricelistRates,
        (progress) => onProgress?.(`OpenAI: ${progress}`),
      )

      // Wait for both to complete
      const [cohereResults, openaiResults] = await Promise.all([cohereResultsPromise, openaiResultsPromise])

      onProgress?.("Combining results from both models...")

      // Combine results using weighted scoring
      const hybridResults: HybridMatchResult[] = []

      for (let i = 0; i < inquiryDescriptions.length; i++) {
        const cohereResult = cohereResults[i]
        const openaiResult = openaiResults[i]

        // Find the indices of the matched items in the pricelist
        const cohereIndex = pricelistDescriptions.findIndex((desc) => desc === cohereResult.description)
        const openaiIndex = pricelistDescriptions.findIndex((desc) => desc === openaiResult.description)

        // Normalize confidence scores (0-1)
        const cohereConfidence = cohereResult.confidence / 100
        const openaiConfidence = openaiResult.confidence / 100

        // Weighted combination (can be adjusted based on performance)
        const cohereWeight = 0.6 // Cohere tends to be faster and good for construction terms
        const openaiWeight = 0.4 // OpenAI tends to be more accurate for complex descriptions

        let finalResult: HybridMatchResult

        // If both models agree on the same item (high consensus)
        if (cohereIndex === openaiIndex && cohereIndex !== -1) {
          const combinedConfidence = cohereWeight * cohereConfidence + openaiWeight * openaiConfidence
          finalResult = {
            description: cohereResult.description,
            rate: cohereResult.rate,
            confidence: Math.round(combinedConfidence * 100),
            cohereScore: cohereConfidence,
            openaiScore: openaiConfidence,
            combinedScore: combinedConfidence,
            source: "consensus",
          }
        }
        // If models disagree, choose the one with higher confidence
        else if (cohereConfidence > openaiConfidence) {
          finalResult = {
            description: cohereResult.description,
            rate: cohereResult.rate,
            confidence: cohereResult.confidence,
            cohereScore: cohereConfidence,
            openaiScore: openaiConfidence,
            combinedScore: cohereConfidence,
            source: "cohere",
          }
        } else {
          finalResult = {
            description: openaiResult.description,
            rate: openaiResult.rate,
            confidence: openaiResult.confidence,
            cohereScore: cohereConfidence,
            openaiScore: openaiConfidence,
            combinedScore: openaiConfidence,
            source: "openai",
          }
        }

        hybridResults.push(finalResult)
      }

      onProgress?.("Hybrid matching complete!")
      return hybridResults
    } catch (error) {
      console.error("Hybrid matching error:", error)
      throw new Error(`Hybrid matching failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Method to get detailed comparison for analysis
  async getDetailedComparison(
    inquiryDescriptions: string[],
    pricelistDescriptions: string[],
    pricelistRates: number[],
    onProgress?: (progress: string) => void,
  ): Promise<{
    cohereResults: any[]
    openaiResults: any[]
    hybridResults: HybridMatchResult[]
    agreement: number // Percentage of items where both models agreed
  }> {
    const cohereResults = await this.cohereMatcher.matchItems(
      inquiryDescriptions,
      pricelistDescriptions,
      pricelistRates,
      (progress) => onProgress?.(`Cohere: ${progress}`),
    )

    const openaiResults = await this.openaiMatcher.matchItems(
      inquiryDescriptions,
      pricelistDescriptions,
      pricelistRates,
      (progress) => onProgress?.(`OpenAI: ${progress}`),
    )

    const hybridResults = await this.matchItems(inquiryDescriptions, pricelistDescriptions, pricelistRates, onProgress)

    // Calculate agreement percentage
    let agreements = 0
    for (let i = 0; i < cohereResults.length; i++) {
      if (cohereResults[i].description === openaiResults[i].description) {
        agreements++
      }
    }
    const agreement = (agreements / cohereResults.length) * 100

    return {
      cohereResults,
      openaiResults,
      hybridResults,
      agreement,
    }
  }
}
