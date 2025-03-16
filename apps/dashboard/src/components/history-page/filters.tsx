"use client"

import type React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, CircleDashed, Tag, X } from "lucide-react"
import { type Dispatch, type SetStateAction, useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"

interface AnimateChangeInHeightProps {
  children: React.ReactNode
  className?: string
}

export const AnimateChangeInHeight: React.FC<AnimateChangeInHeightProps> = ({ children, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | "auto">("auto")

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        // We only have one entry, so we can use entries[0].
        const observedHeight = entries[0].contentRect.height
        setHeight(observedHeight)
      })

      resizeObserver.observe(containerRef.current)

      return () => {
        // Cleanup the observer when the component is unmounted
        resizeObserver.disconnect()
      }
    }
  }, [])

  return (
    <motion.div
      className={cn(className, "overflow-hidden")}
      style={{ height }}
      animate={{ height }}
      transition={{ duration: 0.1, dampping: 0.2, ease: "easeIn" }}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  )
}

// Update the FilterType enum to only include Type, Status, and Tags
export enum FilterType {
  TYPE = "Type",
  STATUS = "Status",
  TAGS = "Tags",
}

// Add new enums for Type and Status options
export enum Type {
  SINGLEPLAYER = "singleplayer",
  MULTIPLAYER = "multiplayer",
  DOCUMENT = "document",
  RANDOM = "random",
}

export enum Status {
  PASSED = "passed",
  FAILED = "failed",
}

export enum FilterOperator {
  IS = "is",
  IS_NOT = "is not",
  IS_ANY_OF = "is any of",
  INCLUDE = "include",
  DO_NOT_INCLUDE = "do not include",
  INCLUDE_ANY_OF = "include any of",
  INCLUDE_ALL_OF = "include all of",
  EXCLUDE_ALL_OF = "exclude all of",
  EXCLUDE_IF_ANY_OF = "exclude if any of",
}

export type FilterOption = {
  name: FilterType | Status | Type | string
  icon: React.ReactNode | undefined
  label?: string
}

export type Filter = {
  id: string
  type: FilterType
  operator: FilterOperator
  value: string[]
}

const FilterIcon = ({
  type,
}: {
  type: FilterType | Status | Type | string
}) => {
  switch (type) {
    case FilterType.TYPE:
      return <Tag className="size-3.5" />
    case Type.SINGLEPLAYER:
    case Type.MULTIPLAYER:
    case Type.DOCUMENT:
    case Type.RANDOM:
      return <Tag className="size-3.5" />
    case FilterType.STATUS:
      return <CircleDashed className="size-3.5" />
    case Status.PASSED:
      return <Check className="size-3.5" />
    case Status.FAILED:
      return <X className="size-3.5" />
    case FilterType.TAGS:
      return <Tag className="size-3.5" />
    default:
      return <Tag className="size-3.5" />
  }
}

// Update filterViewOptions to only show the three filter types
export const filterViewOptions: FilterOption[][] = [
  [
    {
      name: FilterType.TYPE,
      icon: <Tag className="size-3.5" />,
    },
    {
      name: FilterType.STATUS,
      icon: <CircleDashed className="size-3.5" />,
    },
    {
      name: FilterType.TAGS,
      icon: <Tag className="size-3.5" />,
    },
  ],
]

// Update filter options for each type
export const typeFilterOptions: FilterOption[] = Object.values(Type).map((type) => ({
  name: type,
  icon: <Tag className="size-3.5" />,
}))

export const statusFilterOptions: FilterOption[] = Object.values(Status).map((status) => ({
  name: status,
  icon: status === Status.PASSED ? <Check className="size-3.5" /> : <X className="size-3.5" />,
}))

export const tagFilterOptions: FilterOption[] = ["f1", "anime", "school", "math", "history"].map((tag) => ({
  name: tag,
  icon: <Tag className="size-3.5" />,
}))

// Update the mapping of filter types to their options
export const filterViewToFilterOptions: Record<FilterType, FilterOption[]> = {
  [FilterType.TYPE]: typeFilterOptions,
  [FilterType.STATUS]: statusFilterOptions,
  [FilterType.TAGS]: tagFilterOptions,
}

const filterOperators = ({
  filterType,
  filterValues,
}: {
  filterType: FilterType
  filterValues: string[]
}) => {
  switch (filterType) {
    case FilterType.STATUS:
    case FilterType.TYPE:
      if (Array.isArray(filterValues) && filterValues.length > 1) {
        return [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT]
      } else {
        return [FilterOperator.IS, FilterOperator.IS_NOT]
      }
    case FilterType.TAGS:
      if (Array.isArray(filterValues) && filterValues.length > 1) {
        return [
          FilterOperator.INCLUDE_ANY_OF,
          FilterOperator.INCLUDE_ALL_OF,
          FilterOperator.EXCLUDE_ALL_OF,
          FilterOperator.EXCLUDE_IF_ANY_OF,
        ]
      } else {
        return [FilterOperator.INCLUDE, FilterOperator.DO_NOT_INCLUDE]
      }
    default:
      return []
  }
}

const FilterOperatorDropdown = ({
  filterType,
  operator,
  filterValues,
  setOperator,
}: {
  filterType: FilterType
  operator: FilterOperator
  filterValues: string[]
  setOperator: (operator: FilterOperator) => void
}) => {
  const operators = filterOperators({ filterType, filterValues })
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="bg-muted hover:bg-muted/50 px-1.5 py-1 text-muted-foreground hover:text-primary transition shrink-0">
        {operator}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-fit">
        {operators.map((operator) => (
          <DropdownMenuItem key={operator} onClick={() => setOperator(operator)}>
            {operator}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const FilterValueCombobox = ({
  filterType,
  filterValues,
  setFilterValues,
}: {
  filterType: FilterType
  filterValues: string[]
  setFilterValues: (filterValues: string[]) => void
}) => {
  const [open, setOpen] = useState(false)
  const [commandInput, setCommandInput] = useState("")
  const commandInputRef = useRef<HTMLInputElement>(null)
  const nonSelectedFilterValues = filterViewToFilterOptions[filterType]?.filter(
    (filter) => !filterValues.includes(filter.name),
  )
  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          setTimeout(() => {
            setCommandInput("")
          }, 200)
        }
      }}
    >
      <PopoverTrigger
        className="rounded-none px-1.5 py-1 bg-muted hover:bg-muted/50 transition
  text-muted-foreground hover:text-primary shrink-0"
      >
        <div className="flex gap-1.5 items-center">
          <div className="flex items-center flex-row -space-x-1.5">
            <AnimatePresence mode="popLayout">
              {filterValues?.slice(0, 3).map((value) => (
                <motion.div
                  key={value}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <FilterIcon type={value as FilterType} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {filterValues?.length === 1 ? filterValues?.[0] : `${filterValues?.length} selected`}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <AnimateChangeInHeight>
          <Command>
            <CommandInput
              placeholder={filterType}
              className="h-9"
              value={commandInput}
              onInputCapture={(e) => {
                setCommandInput(e.currentTarget.value)
              }}
              ref={commandInputRef}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filterValues.map((value) => (
                  <CommandItem
                    key={value}
                    className="group flex gap-2 items-center"
                    onSelect={() => {
                      setFilterValues(filterValues.filter((v) => v !== value))
                      setTimeout(() => {
                        setCommandInput("")
                      }, 200)
                      setOpen(false)
                    }}
                  >
                    <Checkbox checked={true} />
                    <FilterIcon type={value as FilterType} />
                    {value}
                  </CommandItem>
                ))}
              </CommandGroup>
              {nonSelectedFilterValues?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    {nonSelectedFilterValues.map((filter: FilterOption) => (
                      <CommandItem
                        className="group flex gap-2 items-center"
                        key={filter.name}
                        value={filter.name}
                        onSelect={(currentValue: string) => {
                          setFilterValues([...filterValues, currentValue])
                          setTimeout(() => {
                            setCommandInput("")
                          }, 200)
                          setOpen(false)
                        }}
                      >
                        <Checkbox checked={false} className="opacity-0 group-data-[selected=true]:opacity-100" />
                        {filter.icon}
                        <span className="text-accent-foreground">{filter.name}</span>
                        {filter.label && <span className="text-muted-foreground text-xs ml-auto">{filter.label}</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </AnimateChangeInHeight>
      </PopoverContent>
    </Popover>
  )
}

export default function Filters({
  filters,
  setFilters,
}: {
  filters: Filter[]
  setFilters: Dispatch<SetStateAction<Filter[]>>
}) {
  return (
    <div className="flex gap-2">
      {filters
        .filter((filter) => filter.value?.length > 0)
        .map((filter) => (
          <div key={filter.id} className="flex gap-[1px] items-center text-xs">
            <div className="flex gap-1.5 shrink-0 rounded-l bg-muted px-1.5 py-1 items-center">
              <FilterIcon type={filter.type} />
              {filter.type}
            </div>
            <FilterOperatorDropdown
              filterType={filter.type}
              operator={filter.operator}
              filterValues={filter.value}
              setOperator={(operator) => {
                setFilters((prev) => prev.map((f) => (f.id === filter.id ? { ...f, operator } : f)))
              }}
            />
            <FilterValueCombobox
              filterType={filter.type}
              filterValues={filter.value}
              setFilterValues={(filterValues) => {
                setFilters((prev) => prev.map((f) => (f.id === filter.id ? { ...f, value: filterValues } : f)))
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setFilters((prev) => prev.filter((f) => f.id !== filter.id))
              }}
              className="bg-muted rounded-l-none rounded-r-sm h-6 w-6 text-muted-foreground hover:text-primary hover:bg-muted/50 transition shrink-0"
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
    </div>
  )
}

