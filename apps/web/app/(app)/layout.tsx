import { cookies } from "next/headers"

import { AppSidebar } from "@/components/sidebar"
import {
  AppBreadcrumb,
  BreadcrumbProvider,
} from "@/components/sidebar/breadcrumb"
import { InsetHeader } from "@/components/sidebar/inset-header"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarState ? sidebarState === "true" : true

  return (
    <BreadcrumbProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <InsetHeader>
            <SidebarTrigger className="-ml-1 md:hidden" />
            <div className="flex items-center gap-0.5">
              <TeamSwitcher />
              <AppBreadcrumb />
            </div>
          </InsetHeader>
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  )
}
