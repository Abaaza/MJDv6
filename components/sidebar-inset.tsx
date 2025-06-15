import * as React from "react"
import { cn } from "@/lib/utils"

const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("flex min-h-svh flex-1 flex-col bg-background", className)} {...props} />
  },
)
SidebarInset.displayName = "SidebarInset"

export { SidebarInset }
