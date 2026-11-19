import { Button } from "@workspace/ui/components/button"

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md flex-col gap-4 text-center">
        <h1 className="text-3xl font-semibold">Marketing</h1>
        <p className="text-muted-foreground">Welcome to the marketing site.</p>
        <Button>Get started</Button>
      </div>
    </div>
  )
}
