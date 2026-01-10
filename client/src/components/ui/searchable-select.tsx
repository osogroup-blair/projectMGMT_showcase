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
}

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
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const selectedOption = options.find((opt) => opt.value === value)

    const handleSelect = (optionValue: string) => {
      onValueChange?.(optionValue)
      setOpen(false)
      setSearchQuery("")
    }

    const defaultTriggerContent = (
      <>
        {selectedOption?.icon && <span className="mr-2 flex-shrink-0">{selectedOption.icon}</span>}
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </>
    )

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
