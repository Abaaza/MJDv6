import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MongoDBConfig } from "@/components/mongodb-config"

export default function DatabasePage() {
  return (
    <Tabs defaultValue="connection" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="connection">Connection</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
        <TabsTrigger value="seed">Seed Data</TabsTrigger>
        <TabsTrigger value="migrations">Migrations</TabsTrigger>
      </TabsList>
      <TabsContent value="connection">Make sure your MongoDB instance is running.</TabsContent>
      <TabsContent value="config" className="space-y-6">
        <MongoDBConfig />
      </TabsContent>
      <TabsContent value="seed">Seed your database with initial data.</TabsContent>
      <TabsContent value="migrations">Run database migrations.</TabsContent>
    </Tabs>
  )
}
