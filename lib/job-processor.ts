import { CohereMatcher } from "./cohere-matcher"
import { ExcelParser } from "./excel-parser"
import { MongoDBService } from "./mongodb-service"

interface JobData {
  id: string
  projectId: string
  file: File
  clientName: string
  projectName: string
  model: string
}

class JobProcessor {
  private static instance: JobProcessor
  private jobQueue: JobData[] = []
  private processing = false

  static getInstance(): JobProcessor {
    if (!JobProcessor.instance) {
      JobProcessor.instance = new JobProcessor()
    }
    return JobProcessor.instance
  }

  async addJob(jobData: JobData): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Save initial job status
    await MongoDBService.saveMatchingJob({
      projectId: jobData.projectId,
      model: jobData.model,
      status: "pending",
      progress: 0,
      logs: ["Job queued for processing"],
      fileInfo: {
        name: jobData.file.name,
        size: jobData.file.size,
        type: jobData.file.type,
      },
    })

    this.jobQueue.push({ ...jobData, id: jobId })

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue()
    }

    return jobId
  }

  private async processQueue() {
    if (this.processing || this.jobQueue.length === 0) return

    this.processing = true

    while (this.jobQueue.length > 0) {
      const job = this.jobQueue.shift()!
      await this.processJob(job)
    }

    this.processing = false
  }

  private async processJob(job: JobData) {
    try {
      console.log(`Processing job ${job.id} for project ${job.projectId}`)

      // Update job status
      await MongoDBService.updateMatchingJob(job.id, {
        status: "processing",
        progress: 5,
        logs: ["Starting job processing..."],
      })

      // Get API settings
      const settings = await MongoDBService.getApiSettings()
      if (!settings.cohereApiKey) {
        throw new Error("Cohere API key not configured")
      }

      // Parse Excel file
      await MongoDBService.updateMatchingJob(job.id, {
        progress: 10,
        logs: ["Parsing BoQ file..."],
      })

      const parsedData = await ExcelParser.parseBoQFile(job.file)
      const inquiryItems = parsedData.flatMap((sheet) =>
        sheet.items.filter((item) => !ExcelParser.isNonItem(item.description)).map((item) => item.description),
      )

      await MongoDBService.updateMatchingJob(job.id, {
        progress: 20,
        logs: [`Extracted ${inquiryItems.length} line items from inquiry.`],
      })

      // Load price list
      await MongoDBService.updateMatchingJob(job.id, {
        progress: 25,
        logs: ["Loading price list from database..."],
      })

      const { descriptions, rates, items } = await MongoDBService.loadPriceList()
      const pricelistItems = items.map((item, index) => ({
        description: descriptions[index],
        rate: rates[index],
      }))

      await MongoDBService.updateMatchingJob(job.id, {
        progress: 30,
        logs: [`Found ${pricelistItems.length} items in price database.`],
      })

      // Initialize Cohere matcher
      const matcher = new CohereMatcher(settings.cohereApiKey!)

      // Perform matching with progress updates
      const results = await matcher.matchItems(inquiryItems, pricelistItems, async (progress, message) => {
        await MongoDBService.updateMatchingJob(job.id, {
          progress: 30 + Math.floor(progress * 0.6), // Scale to 30-90%
          logs: [message],
        })
      })

      // Format results
      const matchedItems = inquiryItems.map((inquiry, index) => ({
        boqDescription: inquiry,
        boqUnit: "m3", // Would come from parsed data
        boqQty: 100, // Would come from parsed data
        matchedItemDescription: results[index].bestMatch,
        matchedRate: results[index].bestRate,
        confidence: results[index].confidence / 100,
      }))

      const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length / 100

      // Complete job
      await MongoDBService.updateMatchingJob(job.id, {
        status: "completed",
        progress: 100,
        logs: [`Matching completed with average confidence: ${(averageConfidence * 100).toFixed(1)}%`],
        results: matchedItems,
      })

      console.log(`Job ${job.id} completed successfully`)
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)

      await MongoDBService.updateMatchingJob(job.id, {
        status: "failed",
        progress: 0,
        logs: [`Error: ${error instanceof Error ? error.message : "Unknown error"}`],
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }
}

export const jobProcessor = JobProcessor.getInstance()
