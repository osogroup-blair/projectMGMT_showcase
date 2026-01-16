"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SearchableSelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  searchTerms?: string
}

const ITEM_HEIGHT = 36
const MAX_VISIBLE_HEIGHT = 300
const BUFFER_SIZE = 5
const VIRTUALIZATION_THRESHOLD = 100

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  "data-testid"?: string
  renderTrigger?: (selectedOption: SearchableSelectOption | undefined, open: boolean) => React.ReactNode
  renderOption?: (option: SearchableSelectOption, isSelected: boolean) => React.ReactNode
  virtualized?: boolean | "auto"
}

const SearchableSelect = React.forwardRef<HTMLButtonElement, SearchableSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Select an option...",
      searchPlaceholder = "Search...",
      emptyMessage = "No results found.",
      disabled = false,
      className,
      triggerClassName,
      contentClassName,
      "data-testid": dataTestId,
      renderTrigger,
      renderOption,
      virtualized = "auto",
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [scrollTop, setScrollTop] = React.useState(0)
    const listRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const selectedOption = options.find((opt) => opt.value === value)

    const shouldVirtualize = virtualized === true || 
      (virtualized === "auto" && options.length > VIRTUALIZATION_THRESHOLD)

    const filteredOptions = React.useMemo(() => {
      if (!shouldVirtualize || !searchQuery.trim()) return options
      const searchLower = searchQuery.toLowerCase()
      return options.filter((option) => {
        const labelMatch = option.label.toLowerCase().includes(searchLower)
        const searchTermsMatch = option.searchTerms?.toLowerCase().includes(searchLower)
        return labelMatch || searchTermsMatch
      })
    }, [options, searchQuery, shouldVirtualize])

    const visibleCount = Math.ceil(MAX_VISIBLE_HEIGHT / ITEM_HEIGHT)
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
    const endIndex = Math.min(
      filteredOptions.length,
      startIndex + visibleCount + BUFFER_SIZE * 2
    )
    const totalHeight = filteredOptions.length * ITEM_HEIGHT
    const offsetY = startIndex * ITEM_HEIGHT
    const visibleOptions = shouldVirtualize 
      ? filteredOptions.slice(startIndex, endIndex)
      : filteredOptions

    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    }, [])

    const handleSelect = (optionValue: string) => {
      onValueChange?.(optionValue)
      setOpen(false)
      setSearchQuery("")
    }

    React.useEffect(() => {
      if (!open) {
        setSearchQuery("")
        setScrollTop(0)
      }
    }, [open])

    const defaultTriggerContent = (
      <>
        {selectedOption?.icon && <span className="mr-2 flex-shrink-0">{selectedOption.icon}</span>}
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </>
    )

    if (shouldVirtualize) {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              data-testid={dataTestId}
              className={cn(
                "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 font-normal",
                !selectedOption && "text-muted-foreground",
                triggerClassName,
                className
              )}
            >
              {renderTrigger ? renderTrigger(selectedOption, open) : defaultTriggerContent}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn("w-[--radix-popover-trigger-width] p-0", contentClassName)}
            align="start"
          >
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                data-testid={dataTestId ? `${dataTestId}-search` : undefined}
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
                style={{ maxHeight: MAX_VISIBLE_HEIGHT }}
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
                    {visibleOptions.map((option) => {
                      const isSelected = value === option.value
                      return (
                        <div
                          key={option.value}
                          role="option"
                          aria-selected={isSelected}
                          data-disabled={option.disabled}
                          className={cn(
                            "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 text-sm outline-none",
                            "hover:bg-accent hover:text-accent-foreground",
                            isSelected && "bg-accent text-accent-foreground",
                            option.disabled && "pointer-events-none opacity-50"
                          )}
                          style={{ height: ITEM_HEIGHT }}
                          onClick={() => !option.disabled && handleSelect(option.value)}
                          data-testid={dataTestId ? `${dataTestId}-option-${option.value}` : undefined}
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {renderOption ? renderOption(option, isSelected) : (
                            <>
                              {option.icon && <span className="shrink-0">{option.icon}</span>}
                              <span className="truncate">{option.label}</span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            data-testid={dataTestId}
            className={cn(
              "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 font-normal",
              !selectedOption && "text-muted-foreground",
              triggerClassName,
              className
            )}
          >
            {renderTrigger ? renderTrigger(selectedOption, open) : defaultTriggerContent}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("w-[--radix-popover-trigger-width] p-0", contentClassName)}
          align="start"
        >
          <Command shouldFilter={true}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = value === option.value
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      disabled={option.disabled}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {renderOption ? renderOption(option, isSelected) : (
                        <>
                          {option.icon && <span className="mr-2">{option.icon}</span>}
                          {option.label}
                        </>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

SearchableSelect.displayName = "SearchableSelect"

interface SearchableSelectGroupProps {
  label: string
  children: React.ReactNode
}

const SearchableSelectGroup: React.FC<SearchableSelectGroupProps> = ({
  label,
  children,
}) => {
  return (
    <CommandGroup heading={label}>
      {children}
    </CommandGroup>
  )
}

export { SearchableSelect, SearchableSelectGroup }
