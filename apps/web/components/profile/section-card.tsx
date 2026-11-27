import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"

export function ProfileCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card className={cn("gap-0 bg-outer-card p-0", className)} {...props} />
  )
}

export function ProfileCardHeader({
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn(
        "flex flex-row items-center justify-between gap-4 p-4",
        className
      )}
      {...props}
    />
  )
}

export function ProfileCardTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-sm font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

export function ProfileCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("mt-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export function ProfileCardContent({
  className,
  ...props
}: React.ComponentProps<typeof CardContent>) {
  return (
    <CardContent
      className={cn(
        "mx-2 mb-2 rounded-lg border border-inner-border bg-inner-card p-4",
        className
      )}
      {...props}
    />
  )
}
