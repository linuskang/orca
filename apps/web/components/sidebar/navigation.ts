import {
  Bell,
  Braces,
  Container,
  FolderKanban,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  Plug,
  Server,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        title: "Projects",
        icon: FolderKanban,
        href: "/projects",
      },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      {
        title: "Servers",
        icon: Server,
        href: "/servers",
      },
      {
        title: "Sources",
        icon: GitBranch,
        href: "/sources",
      },
      {
        title: "Destinations",
        icon: Container,
        href: "/destinations",
      },
      {
        title: "Connections",
        icon: Plug,
        href: "/connections",
      },
      {
        title: "Shared Variables",
        icon: Braces,
        href: "/shared-variables",
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Team",
        icon: Users,
        href: "/team",
      },
      {
        title: "Notifications",
        icon: Bell,
        href: "/notifications",
      },
      {
        title: "Keys",
        icon: KeyRound,
        href: "/keys",
      },
      {
        title: "Settings",
        icon: Settings,
        href: "/settings",
      },
    ],
  },
]
