"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { SidebarFooter as Footer } from "@/components/sidebar/footer"
import { navigation } from "@/components/sidebar/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function AppSidebar({
  collapsible = "icon",
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session, isPending } = authClient.useSession()

  return (
    <Sidebar collapsible={collapsible} {...props}>
      <SidebarHeader>
        <div className="flex items-baseline gap-1 p-2 pt-1 group-data-[collapsible=icon]:hidden">
          <h1 className="text-md font-semibold tracking-tight transition-colors hover:text-primary/80">
            <Link href="/dashboard">Orca</Link>
          </h1>

          <span className="text-[11px] font-medium tracking-tight text-muted-foreground hover:text-primary">
            <Link
              href="https://linus.my/orca/latest"
              target="_blank"
              rel="noreferrer"
            >
              v0.0.1
            </Link>
          </span>
        </div>
        <div className="hidden size-8 rounded-md bg-muted group-data-[collapsible=icon]:block" />
      </SidebarHeader>

      <SidebarContent className="-mt-2 gap-1 pt-0 pb-1 group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:gap-0.5 group-data-[collapsible=icon]:py-1">
        {navigation.map((group) => (
          <SidebarGroup
            key={group.title}
            className="py-1 first:pt-0 group-data-[collapsible=icon]:py-0"
          >
            <SidebarGroupLabel className="h-7 px-2 text-[11px] font-medium text-muted-foreground group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:-mt-7">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-8 text-[13px] text-sidebar-foreground/75 transition-colors group-data-[collapsible=icon]:justify-center hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:text-muted-foreground hover:[&_svg]:text-sidebar-foreground data-active:[&_svg]:text-sidebar-accent-foreground"
                      >
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:w-full">
            {isPending ? (
              <div className="flex h-7 items-center gap-2 px-1.5 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:p-0">
                <Skeleton className="size-5 shrink-0 rounded-md group-data-[collapsible=icon]:size-6" />
                <Skeleton className="h-3.5 flex-1 group-data-[collapsible=icon]:hidden" />
              </div>
            ) : session?.user ? (
              <Footer
                user={{
                  name: session.user.name,
                  email: session.user.email,
                  image: session.user.image ?? undefined,
                }}
              />
            ) : null}
          </div>
          <SidebarTrigger className="size-7 shrink-0 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-6" />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
