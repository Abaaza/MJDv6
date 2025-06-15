interface ModelPerformance {
  model: "v0" | "v1" | "v2"
  totalJobs: number
  totalItems: number
  averageConfidence: number
  averageProcessingTime: number
  successRate: number
  lastUsed: Date
  confidenceDistribution: {
    high: number // >80%
    medium: number // 60-80%
    low: number // <60%
  }
}

interface ComparisonResult {
  description: string
  cohereMatch: string
  cohereConfidence: number
  openaiMatch: string
  openaiConfidence: number
  hybridMatch: string
  hybridConfidence: number
  agreement: boolean
}

export class PerformanceAnalytics {
  private static instance: PerformanceAnalytics
  private performanceData: Map<string, ModelPerformance> = new Map()
  private comparisonHistory: ComparisonResult[] = []

  static getInstance(): PerformanceAnalytics {
    if (!PerformanceAnalytics.instance) {
      PerformanceAnalytics.instance = new PerformanceAnalytics()
    }
    return PerformanceAnalytics.instance
  }

  recordJobPerformance(
    model: "v0" | "v1" | "v2",
    itemCount: number,
    averageConfidence: number,
    processingTime: number,
    success: boolean,
  ): void {
    const existing = this.performanceData.get(model) || {
      model,
      totalJobs: 0,
      totalItems: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      successRate: 0,
      lastUsed: new Date(),
      confidenceDistribution: { high: 0, medium: 0, low: 0 },
    }

    // Update metrics
    existing.totalJobs += 1
    existing.totalItems += itemCount
    existing.averageConfidence =
      (existing.averageConfidence * (existing.totalJobs - 1) + averageConfidence) / existing.totalJobs
    existing.averageProcessingTime =
      (existing.averageProcessingTime * (existing.totalJobs - 1) + processingTime) / existing.totalJobs
    existing.successRate = (existing.successRate * (existing.totalJobs - 1) + (success ? 1 : 0)) / existing.totalJobs
    existing.lastUsed = new Date()

    this.performanceData.set(model, existing)
  }

  recordConfidenceDistribution(model: "v0" | "v1" | "v2", confidences: number[]): void {
    const performance = this.performanceData.get(model)
    if (!performance) return

    const distribution = { high: 0, medium: 0, low: 0 }
    for (const confidence of confidences) {
      if (confidence >= 80) distribution.high++
      else if (confidence >= 60) distribution.medium++
      else distribution.low++
    }

    // Convert to percentages
    const total = confidences.length
    performance.confidenceDistribution = {
      high: (distribution.high / total) * 100,
      medium: (distribution.medium / total) * 100,
      low: (distribution.low / total) * 100,
    }

    this.performanceData.set(model, performance)
  }

  addComparison(comparison: ComparisonResult): void {
    this.comparisonHistory.push(comparison)
    // Keep only last 1000 comparisons
    if (this.comparisonHistory.length > 1000) {
      this.comparisonHistory = this.comparisonHistory.slice(-1000)
    }
  }

  getModelPerformance(model: "v0" | "v1" | "v2"): ModelPerformance | null {
    return this.performanceData.get(model) || null
  }

  getAllPerformanceData(): ModelPerformance[] {
    return Array.from(this.performanceData.values())
  }

  getModelComparison(): {
    totalComparisons: number
    cohereVsOpenaiAgreement: number
    cohereVsHybridAgreement: number
    openaiVsHybridAgreement: number
    bestPerformingModel: string
  } {
    const comparisons = this.comparisonHistory
    const total = comparisons.length

    if (total === 0) {
      return {
        totalComparisons: 0,
        cohereVsOpenaiAgreement: 0,
        cohereVsHybridAgreement: 0,
        openaiVsHybridAgreement: 0,
        bestPerformingModel: "insufficient-data",
      }
    }

    let cohereOpenaiAgreement = 0
    let cohereHybridAgreement = 0
    let openaiHybridAgreement = 0

    for (const comparison of comparisons) {
      if (comparison.cohereMatch === comparison.openaiMatch) cohereOpenaiAgreement++
      if (comparison.cohereMatch === comparison.hybridMatch) cohereHybridAgreement++
      if (comparison.openaiMatch === comparison.hybridMatch) openaiHybridAgreement++
    }

    // Determine best performing model based on average confidence
    const performances = this.getAllPerformanceData()
    const bestModel = performances.reduce(
      (best, current) => {
        if (!best || current.averageConfidence > best.averageConfidence) {
          return current
        }
        return best
      },
      null as ModelPerformance | null,
    )

    return {
      totalComparisons: total,
      cohereVsOpenaiAgreement: (cohereOpenaiAgreement / total) * 100,
      cohereVsHybridAgreement: (cohereHybridAgreement / total) * 100,
      openaiVsHybridAgreement: (openaiHybridAgreement / total) * 100,
      bestPerformingModel: bestModel?.model || "insufficient-data",
    }
  }

  getRecommendation(): {
    recommendedModel: "v0" | "v1" | "v2"
    reason: string
    confidence: number
  } {
    const performances = this.getAllPerformanceData()

    if (performances.length === 0) {
      return {
        recommendedModel: "v0",
        reason: "No performance data available. Cohere is recommended as the default.",
        confidence: 50,
      }
    }

    // Score each model based on multiple factors
    const scores = performances.map((perf) => {
      let score = 0
      let factors = 0

      // Confidence score (40% weight)
      score += (perf.averageConfidence / 100) * 40
      factors += 40

      // Success rate (30% weight)
      score += perf.successRate * 30
      factors += 30

      // Speed score (20% weight) - inverse of processing time
      const maxTime = Math.max(...performances.map((p) => p.averageProcessingTime))
      const speedScore = maxTime > 0 ? (1 - perf.averageProcessingTime / maxTime) * 20 : 20
      score += speedScore
      factors += 20

      // Usage frequency (10% weight)
      const maxJobs = Math.max(...performances.map((p) => p.totalJobs))
      const usageScore = maxJobs > 0 ? (perf.totalJobs / maxJobs) * 10 : 10
      score += usageScore
      factors += 10

      return { model: perf.model, score: score / factors, performance: perf }
    })

    const best = scores.reduce((best, current) => (current.score > best.score ? current : best))

    let reason = ""
    if (best.model === "v0") {
      reason = "Cohere provides the best balance of speed and accuracy for construction terminology."
    } else if (best.model === "v1") {
      reason = "OpenAI delivers superior accuracy for complex descriptions and technical specifications."
    } else {
      reason = "Hybrid mode combines the strengths of both models for maximum accuracy."
    }

    return {
      recommendedModel: best.model,
      reason,
      confidence: Math.round(best.score),
    }
  }

  exportAnalytics(): any {
    return {
      modelPerformances: this.getAllPerformanceData(),
      modelComparison: this.getModelComparison(),
      recommendation: this.getRecommendation(),
      recentComparisons: this.comparisonHistory.slice(-100), // Last 100 comparisons
      generatedAt: new Date(),
    }
  }
}
