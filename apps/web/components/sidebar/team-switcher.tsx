"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"

type Team = {
  id: string
  name: string
}

function getInitial(name: string) {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]!.toUpperCase() : "T"
}

export function TeamSwitcher() {
  const { data: session, isPending } = authClient.useSession()

  const teams = React.useMemo<Team[]>(() => {
    const personalName = session?.user?.name
      ? `${session.user.name}'s Team`
      : "Personal Team"
    return [{ id: "personal", name: personalName }]
  }, [session?.user?.name])

  const [open, setOpen] = React.useState(false)
  const [activeTeamId, setActiveTeamId] = React.useState("personal")
  const activeTeam = teams.find((team) => team.id === activeTeamId) ?? teams[0]!

  if (isPending) {
    return (
      <div className="flex h-7 items-center gap-1.5 px-1.5">
        <Skeleton className="size-5 rounded-sm" />
        <Skeleton className="h-3 w-20" />
      </div>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 rounded-md px-1.5 hover:bg-muted/60 data-popup-open:bg-muted/60"
          />
        }
      >
        <div className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[11px] font-semibold text-foreground/80">
          {getInitial(activeTeam.name)}
        </div>
        <span className="truncate text-[13px] font-medium tracking-tight text-foreground/75 transition-colors group-hover/button:text-foreground">
          {activeTeam.name}
        </span>
        {open ? (
          <ChevronUp className="size-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-48 rounded-lg"
        side="bottom"
        align="start"
        sideOffset={6}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Teams</DropdownMenuLabel>
          {teams.map((team) => {
            const isActive = team.id === activeTeam.id
            return (
              <DropdownMenuItem
                key={team.id}
                onClick={() => setActiveTeamId(team.id)}
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[11px] font-semibold text-foreground">
                  {getInitial(team.name)}
                </div>
                <span className="truncate">{team.name}</span>
                {isActive && (
                  <Check className="ml-auto size-3.5 text-foreground" />
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Plus className="text-muted-foreground" />
            Create Team
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
