import { MongoDBService } from "./mongodb-service"

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  CHF: "CHF",
  CNY: "¥",
  INR: "₹",
  AED: "د.إ",
  SAR: "﷼",
}

// Currency names mapping
const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  JPY: "Japanese Yen",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
}

// Get current currency from database or default to USD
export async function getCurrentCurrency(): Promise<string> {
  try {
    const currency = await MongoDBService.getCurrency()
    console.log("💰 Current currency from database:", currency)
    return currency || "USD"
  } catch (error) {
    console.error("❌ Error getting currency, using USD:", error)
    return "USD"
  }
}

// Format currency amount with proper symbol and formatting
export async function formatCurrency(amount?: number): Promise<string> {
  if (amount === undefined || amount === null || isNaN(amount)) return "-"

  try {
    const currency = await getCurrentCurrency()
    const symbol = CURRENCY_SYMBOLS[currency] || "$"

    // Format number with proper locale
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)

    console.log(`💰 Formatting ${amount} as ${currency}: ${symbol}${formatted}`)
    return `${symbol}${formatted}`
  } catch (error) {
    console.error("❌ Error formatting currency:", error)
    return `$${amount.toFixed(2)}`
  }
}

// Synchronous version for client-side use (requires currency to be passed)
export function formatCurrencySync(amount?: number, currency = "USD"): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "-"

  const symbol = CURRENCY_SYMBOLS[currency] || "$"

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${symbol}${formatted}`
}

// Get currency symbol
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || "$"
}

// Get currency name
export function getCurrencyName(currency: string): string {
  return CURRENCY_NAMES[currency] || "US Dollar"
}

// Get all available currencies
export function getAvailableCurrencies() {
  return Object.keys(CURRENCY_SYMBOLS).map((code) => ({
    code,
    name: CURRENCY_NAMES[code],
    symbol: CURRENCY_SYMBOLS[code],
  }))
}
