"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { navigation } from "@/components/sidebar/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function AppBreadcrumb() {
  const pathname = usePathname()

  const matched = React.useMemo(() => {
    for (const group of navigation) {
      for (const item of group.items) {
        if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
          const rest = pathname
            .slice(item.href.length)
            .split("/")
            .filter(Boolean)
          return { group, item, rest }
        }
      }
    }
    return null
  }, [pathname])

  if (!matched) {
    const segments = pathname.split("/").filter(Boolean)
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>
              {segments.length > 0
                ? formatSegment(segments[segments.length - 1]!)
                : "Orca"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const { group, item, rest } = matched

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:inline-flex">
          <span className="text-muted-foreground">{group.title}</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:inline-flex" />
        <BreadcrumbItem>
          {rest.length > 0 ? (
            <BreadcrumbLink render={<Link href={item.href} />}>
              {item.title}
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{item.title}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {rest.map((segment, index) => {
          const href = `${item.href}/${rest.slice(0, index + 1).join("/")}`
          const isLast = index === rest.length - 1

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {formatSegment(segment)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
