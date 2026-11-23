"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BookOpen,
  ChevronsUpDown,
  ExternalLink,
  LogOut,
  Monitor,
  Moon,
  CircleUser,
  Sun,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"

function getInitial(name: string, email: string) {
  const source = name.trim() || email.trim()
  return source ? source[0]!.toUpperCase() : "?"
}

export function SidebarFooter({
  user,
}: {
  user: { name: string; email: string; image?: string }
}) {
  const router = useRouter()
  const { isMobile, state } = useSidebar()
  const { theme, setTheme } = useTheme()

  const initial = getInitial(user.name, user.email)

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login")
        },
      },
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="sm"
                title={
                  state === "collapsed" && !isMobile
                    ? user.name || user.email
                    : undefined
                }
                className="group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-6! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="size-5 shrink-0 group-data-[collapsible=icon]:size-6">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="text-[11px]">{initial}</AvatarFallback>
            </Avatar>

            <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{user.name}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--anchor-width) min-w-52 rounded-lg"
            side={state === "collapsed" && !isMobile ? "right" : "top"}
            align={state === "collapsed" && !isMobile ? "end" : "start"}
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1.5 py-1.5 text-left text-sm">
                  <div className="grid flex-1 text-left text-xs leading-tight">
                    <span className="truncate text-sm font-medium text-popover-foreground">
                      {user.name}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/profile" />}>
                <CircleUser className="text-muted-foreground" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun className="size-4 text-muted-foreground dark:hidden" />
                  <Moon className="hidden size-4 text-muted-foreground dark:block" />
                  Appearance
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={theme ?? "system"}
                    onValueChange={setTheme}
                  >
                    <DropdownMenuRadioItem value="light">
                      <Sun className="text-muted-foreground" />
                      Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon className="text-muted-foreground" />
                      Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Monitor className="text-muted-foreground" />
                      System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                  <a
                    href="https://github.com/linuskang/upstream"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <ExternalLink className="text-muted-foreground" />
                GitHub
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/docs" />}>
                <BookOpen className="text-muted-foreground" />
                Documentation
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                <LogOut />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
