"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

export function InsetHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"header">) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const checkScroll = (event?: Event) => {
      const doc = document.documentElement
      const body = document.body

      let scrollTop = window.scrollY || doc.scrollTop || body.scrollTop || 0
      let scrollHeight = Math.max(doc.scrollHeight, body.scrollHeight)
      let clientHeight = window.innerHeight || doc.clientHeight

      // Check if a nested element triggered the scroll event
      if (event?.target && event.target instanceof HTMLElement) {
        const el = event.target
        if (el.scrollHeight > el.clientHeight + 2) {
          scrollTop = el.scrollTop
          scrollHeight = el.scrollHeight
          clientHeight = el.clientHeight
        }
      }

      const isScrollable = scrollHeight > clientHeight + 2
      const hasScrolledDown = scrollTop > 0

      setIsScrolled(isScrollable && hasScrolledDown)
    }

    checkScroll()

    const rafId = requestAnimationFrame(() => checkScroll())

    window.addEventListener("scroll", checkScroll, { passive: true, capture: true })
    window.addEventListener("resize", checkScroll, { passive: true })

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        checkScroll()
      })
      resizeObserver.observe(document.body)
      if (document.documentElement) {
        resizeObserver.observe(document.documentElement)
      }
    }

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", checkScroll, { capture: true } as EventListenerOptions)
      window.removeEventListener("resize", checkScroll)
      resizeObserver?.disconnect()
    }
  }, [pathname])

  return (
    <header
      data-slot="inset-header"
      className={cn(
        "sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 px-4 transition-[background-color,border-color,backdrop-filter] duration-200 md:peer-data-[variant=inset]:rounded-t-xl",
        isScrolled
          ? "border-b border-border dark:border-sidebar-border bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60"
          : "border-b border-transparent bg-transparent",
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
}
