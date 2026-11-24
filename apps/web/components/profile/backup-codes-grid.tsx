"use client"

import * as React from "react"
import { toast } from "sonner"
import { Check, Copy, Download } from "lucide-react"

import { downloadBackupCodes } from "@/lib/security"
import { Button } from "@workspace/ui/components/button"

export function BackupCodesGrid({
  codes,
  email,
}: {
  codes: string[]
  email?: string
}) {
  const [copied, setCopied] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"))
      setCopied(true)
      toast.success("Backup codes copied")
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy backup codes")
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-sidebar-border bg-card/40 p-3">
        {codes.map((code) => (
          <code
            key={code}
            className="rounded px-2 py-1 text-center font-mono text-xs tracking-wider text-foreground select-all"
          >
            {code}
          </code>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy all"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="flex-1"
          onClick={() => downloadBackupCodes(codes, email)}
        >
          <Download />
          Download
        </Button>
      </div>
    </div>
  )
}
