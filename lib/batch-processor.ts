import { ExcelParser } from "./excel-parser"
import { CohereMatcher } from "./cohere-matcher"
import { OpenAIMatcher } from "./openai-matcher"
import { HybridMatcher } from "./hybrid-matcher"
import { MongoDBService } from "./mongodb-service"

interface BatchJob {
  id: string
  files: File[]
  model: "v0" | "v1" | "v2"
  clientName: string
  projectName: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  results: BatchResult[]
  startTime: Date
  endTime?: Date
  error?: string
}

interface BatchResult {
  fileName: string
  itemCount: number
  averageConfidence: number
  processingTime: number
  results: any[]
  error?: string
}

type ProgressCallback = (jobId: string, progress: number, message: string, fileIndex?: number) => void

export class BatchProcessor {
  private static instance: BatchProcessor
  private jobs: Map<string, BatchJob> = new Map()
  private progressCallbacks: Map<string, ProgressCallback> = new Map()

  static getInstance(): BatchProcessor {
    if (!BatchProcessor.instance) {
      BatchProcessor.instance = new BatchProcessor()
    }
    return BatchProcessor.instance
  }

  async createBatchJob(
    files: File[],
    model: "v0" | "v1" | "v2",
    clientName: string,
    projectName: string,
  ): Promise<string> {
    const jobId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const job: BatchJob = {
      id: jobId,
      files,
      model,
      clientName,
      projectName,
      status: "pending",
      progress: 0,
      results: [],
      startTime: new Date(),
    }

    this.jobs.set(jobId, job)

    // Start processing in background
    this.processBatchJob(jobId)

    return jobId
  }

  subscribeToProgress(jobId: string, callback: ProgressCallback): void {
    this.progressCallbacks.set(jobId, callback)
  }

  unsubscribeFromProgress(jobId: string): void {
    this.progressCallbacks.delete(jobId)
  }

  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId)
  }

  getAllJobs(): BatchJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  }

  private async processBatchJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) return

    try {
      job.status = "processing"
      this.notifyProgress(jobId, 5, "Initializing batch processing...")

      // Get API settings
      const settings = await MongoDBService.getApiSettings()
      this.validateApiKeys(job.model, settings)

      // Load price list once for all files
      this.notifyProgress(jobId, 10, "Loading price list from database...")
      const { descriptions: pricelistDescriptions, rates: pricelistRates } = await MongoDBService.loadPriceList()

      // Initialize matcher
      const matcher = this.createMatcher(job.model, settings)

      // Process each file
      const totalFiles = job.files.length
      const results: BatchResult[] = []

      for (let i = 0; i < totalFiles; i++) {
        const file = job.files[i]
        const fileStartTime = Date.now()

        try {
          this.notifyProgress(
            jobId,
            15 + (i / totalFiles) * 70,
            `Processing file ${i + 1}/${totalFiles}: ${file.name}`,
            i,
          )

          // Parse Excel file
          const parsedData = await ExcelParser.parseBoQFile(file)
          const inquiryDescriptions = parsedData.flatMap((sheet) => sheet.items.map((item) => item.description))

          if (inquiryDescriptions.length === 0) {
            results.push({
              fileName: file.name,
              itemCount: 0,
              averageConfidence: 0,
              processingTime: Date.now() - fileStartTime,
              results: [],
              error: "No valid inquiry items found",
            })
            continue
          }

          // Perform matching
          const matchResults = await this.performMatching(
            matcher,
            inquiryDescriptions,
            pricelistDescriptions,
            pricelistRates,
            (progress, message) => {
              const overallProgress = 15 + (i / totalFiles) * 70 + (progress / 100) * (70 / totalFiles)
              this.notifyProgress(jobId, overallProgress, `File ${i + 1}: ${message}`, i)
            },
          )

          // Format results
          const formattedResults = matchResults.map((result, index) => ({
            originalDescription: inquiryDescriptions[index],
            matchedDescription: result.description || result.bestMatch,
            rate: result.rate || result.bestRate,
            confidence: result.confidence,
            quantity: parsedData[0]?.items[index]?.quantity || 1,
            unit: parsedData[0]?.items[index]?.unit || "nr",
            total: (parsedData[0]?.items[index]?.quantity || 1) * (result.rate || result.bestRate),
          }))

          const averageConfidence = matchResults.reduce((sum, r) => sum + r.confidence, 0) / matchResults.length

          results.push({
            fileName: file.name,
            itemCount: inquiryDescriptions.length,
            averageConfidence,
            processingTime: Date.now() - fileStartTime,
            results: formattedResults,
          })
        } catch (error) {
          results.push({
            fileName: file.name,
            itemCount: 0,
            averageConfidence: 0,
            processingTime: Date.now() - fileStartTime,
            results: [],
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      // Complete job
      job.results = results
      job.status = "completed"
      job.endTime = new Date()
      job.progress = 100

      this.notifyProgress(jobId, 100, `Batch processing completed. Processed ${totalFiles} files.`)
    } catch (error) {
      job.status = "failed"
      job.error = error instanceof Error ? error.message : "Unknown error"
      job.endTime = new Date()

      this.notifyProgress(jobId, 0, `Batch processing failed: ${job.error}`)
    }
  }

  private validateApiKeys(model: string, settings: any): void {
    if (model === "v1" && !settings.openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }
    if ((model === "v0" || model === "v2") && !settings.cohereApiKey) {
      throw new Error("Cohere API key not configured")
    }
    if (model === "v2" && (!settings.cohereApiKey || !settings.openaiApiKey)) {
      throw new Error("Both Cohere and OpenAI API keys required for hybrid mode")
    }
  }

  private createMatcher(model: string, settings: any): CohereMatcher | OpenAIMatcher | HybridMatcher {
    switch (model) {
      case "v0":
        return new CohereMatcher(settings.cohereApiKey)
      case "v1":
        return new OpenAIMatcher(settings.openaiApiKey)
      case "v2":
        return new HybridMatcher(settings.cohereApiKey, settings.openaiApiKey)
      default:
        throw new Error("Invalid model specified")
    }
  }

  private async performMatching(
    matcher: CohereMatcher | OpenAIMatcher | HybridMatcher,
    inquiryDescriptions: string[],
    pricelistDescriptions: string[],
    pricelistRates: number[],
    onProgress?: (progress: number, message: string) => void,
  ): Promise<any[]> {
    if (matcher instanceof CohereMatcher) {
      const pricelistItems = pricelistDescriptions.map((desc, index) => ({
        description: desc,
        rate: pricelistRates[index],
      }))
      return await matcher.matchItems(inquiryDescriptions, pricelistItems, onProgress)
    } else if (matcher instanceof OpenAIMatcher) {
      return await matcher.matchItems(inquiryDescriptions, pricelistDescriptions, pricelistRates, onProgress)
    } else if (matcher instanceof HybridMatcher) {
      return await matcher.matchItems(inquiryDescriptions, pricelistDescriptions, pricelistRates, onProgress)
    }
    throw new Error("Unknown matcher type")
  }

  private notifyProgress(jobId: string, progress: number, message: string, fileIndex?: number): void {
    const job = this.jobs.get(jobId)
    if (job) {
      job.progress = Math.round(progress)
    }

    const callback = this.progressCallbacks.get(jobId)
    if (callback) {
      callback(jobId, Math.round(progress), message, fileIndex)
    }
  }

  async exportBatchResults(jobId: string): Promise<Blob> {
    const job = this.jobs.get(jobId)
    if (!job || job.status !== "completed") {
      throw new Error("Job not found or not completed")
    }

    // Create a summary Excel file with all results
    const summaryData = [
      ["File Name", "Items Processed", "Average Confidence", "Processing Time (ms)", "Status"],
      ...job.results.map((result) => [
        result.fileName,
        result.itemCount,
        `${result.averageConfidence.toFixed(1)}%`,
        result.processingTime,
        result.error ? "Failed" : "Success",
      ]),
    ]

    // Add detailed results for each file
    for (const result of job.results) {
      if (result.results.length > 0) {
        summaryData.push([]) // Empty row
        summaryData.push([`Results for ${result.fileName}`])
        summaryData.push(["Description", "Matched Item", "Rate", "Confidence", "Quantity", "Total"])
        summaryData.push(
          ...result.results.map((item) => [
            item.originalDescription,
            item.matchedDescription,
            item.rate,
            `${item.confidence}%`,
            item.quantity,
            item.total,
          ]),
        )
      }
    }

    // Create Excel workbook
    const XLSX = await import("xlsx")
    const worksheet = XLSX.utils.aoa_to_sheet(summaryData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Results Summary")

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  }
}
