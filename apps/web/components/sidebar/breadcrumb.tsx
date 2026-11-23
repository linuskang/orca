"use client"

import * as React from "react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"

export type BreadcrumbEntry = {
  label: string
  href?: string
}

type BreadcrumbContextValue = {
  items: BreadcrumbEntry[]
  setItems: React.Dispatch<React.SetStateAction<BreadcrumbEntry[]>>
}

const BreadcrumbContext = React.createContext<BreadcrumbContextValue | null>(
  null
)

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [items, setItems] = React.useState<BreadcrumbEntry[]>([])

  const value = React.useMemo(() => ({ items, setItems }), [items])

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function PageBreadcrumb({ items }: { items: BreadcrumbEntry[] }) {
  const context = React.useContext(BreadcrumbContext)
  const setItems = context?.setItems
  const serialized = JSON.stringify(items)

  React.useEffect(() => {
    if (!setItems) return
    const next = JSON.parse(serialized) as BreadcrumbEntry[]
    setItems(next)
    return () => {
      setItems([])
    }
  }, [serialized, setItems])

  return null
}

export function AppBreadcrumb() {
  const context = React.useContext(BreadcrumbContext)
  const items = context?.items ?? []

  if (items.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-2.5 text-[13px]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const key = `${item.href ?? item.label}-${index}`

          return (
            <React.Fragment key={key}>
              <BreadcrumbSeparator className="text-muted-foreground/45">
                /
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink
                    render={<Link href={item.href} />}
                    aria-current={isLast ? "page" : undefined}
                    className={
                      isLast
                        ? "font-medium text-foreground/75 hover:text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  >
                    {item.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage
                    className={
                      isLast
                        ? "font-medium text-foreground/75"
                        : "text-muted-foreground"
                    }
                  >
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
