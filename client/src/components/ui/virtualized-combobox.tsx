"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  searchTerms?: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface VirtualizedComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  triggerClassName?: string
  disabled?: boolean
  itemHeight?: number
  maxHeight?: number
  "data-testid"?: string
}

const ITEM_HEIGHT = 36
const MAX_VISIBLE_HEIGHT = 300
const BUFFER_SIZE = 5

export function VirtualizedCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  triggerClassName,
  disabled = false,
  itemHeight = ITEM_HEIGHT,
  maxHeight = MAX_VISIBLE_HEIGHT,
  "data-testid": testId,
}: VirtualizedComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [scrollTop, setScrollTop] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const searchLower = search.toLowerCase()
    return options.filter((option) => {
      const labelMatch = option.label.toLowerCase().includes(searchLower)
      const searchTermsMatch = option.searchTerms?.toLowerCase().includes(searchLower)
      return labelMatch || searchTermsMatch
    })
  }, [options, search])

  const selectedOption = options.find((opt) => opt.value === value)

  const visibleCount = Math.ceil(maxHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - BUFFER_SIZE)
  const endIndex = Math.min(
    filteredOptions.length,
    startIndex + visibleCount + BUFFER_SIZE * 2
  )

  const totalHeight = filteredOptions.length * itemHeight
  const offsetY = startIndex * itemHeight

  const visibleOptions = filteredOptions.slice(startIndex, endIndex)

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const handleSelect = React.useCallback(
    (optionValue: string) => {
      onValueChange(optionValue === value ? "" : optionValue)
      setOpen(false)
      setSearch("")
    },
    [onValueChange, value]
  )

  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setScrollTop(0)
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            triggerClassName
          )}
          data-testid={testId}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            {selectedOption?.label || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[--radix-popover-trigger-width] p-0", className)}
        align="start"
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            data-testid={testId ? `${testId}-search` : undefined}
          />
        </div>

        {filteredOptions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div
            ref={listRef}
            className="overflow-y-auto overflow-x-hidden"
            style={{ maxHeight }}
            onScroll={handleScroll}
          >
            <div style={{ height: totalHeight, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: offsetY,
                  left: 0,
                  right: 0,
                }}
              >
                {visibleOptions.map((option) => (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={value === option.value}
                    data-disabled={option.disabled}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      value === option.value && "bg-accent text-accent-foreground",
                      option.disabled && "pointer-events-none opacity-50"
                    )}
                    style={{ height: itemHeight }}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    data-testid={testId ? `${testId}-option-${option.value}` : undefined}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.icon}
                    <span className="truncate">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
