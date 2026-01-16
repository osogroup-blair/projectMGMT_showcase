"use client"

import * as React from "react"
import { User } from "lucide-react"
import { VirtualizedCombobox, ComboboxOption } from "./virtualized-combobox"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { cn } from "@/lib/utils"

export interface UserOption {
  id: string
  name: string
  email?: string
  avatarUrl?: string | null
  role?: string
}

interface UserComboboxProps {
  users: UserOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  triggerClassName?: string
  disabled?: boolean
  showUnassigned?: boolean
  unassignedLabel?: string
  "data-testid"?: string
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function UserAvatar({ user, size = "sm" }: { user: UserOption; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6"
  const textClass = size === "sm" ? "text-[10px]" : "text-xs"
  
  return (
    <Avatar className={cn(sizeClass, "shrink-0")}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
      <AvatarFallback className={textClass}>
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  )
}

export function UserCombobox({
  users,
  value,
  onValueChange,
  placeholder = "Select user...",
  searchPlaceholder = "Search users...",
  emptyMessage = "No users found.",
  className,
  triggerClassName,
  disabled = false,
  showUnassigned = true,
  unassignedLabel = "Unassigned",
  "data-testid": testId,
}: UserComboboxProps) {
  const options: ComboboxOption[] = React.useMemo(() => {
    const userOptions: ComboboxOption[] = users.map((user) => ({
      value: user.id,
      label: user.name,
      searchTerms: `${user.email || ""} ${user.role || ""}`,
      icon: <UserAvatar user={user} />,
    }))

    if (showUnassigned) {
      return [
        {
          value: "",
          label: unassignedLabel,
          icon: (
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
          ),
        },
        ...userOptions,
      ]
    }

    return userOptions
  }, [users, showUnassigned, unassignedLabel])

  return (
    <VirtualizedCombobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      className={className}
      triggerClassName={triggerClassName}
      disabled={disabled}
      data-testid={testId}
    />
  )
}
