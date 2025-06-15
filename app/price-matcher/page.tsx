import { PriceMatchUI } from "@/components/price-match-ui"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function PriceMatcherPage() {
  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader>
          <CardTitle>Price Matching Service</CardTitle>
          <CardDescription>
            Upload a Bill of Quantities (BoQ) file to match items against your price list using different AI models.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PriceMatchUI />
        </CardContent>
      </Card>
    </div>
  )
}
