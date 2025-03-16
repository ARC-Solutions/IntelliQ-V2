"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, ListFilter } from "lucide-react";
import Filters, { Filter } from "@/components/ui/filters";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { nanoid } from "nanoid";
import { AnimateChangeInHeight } from "@/components/ui/filters";
import {
  DueDate,
  type Filter as FilterType,
  FilterOperator,
  type FilterOption,
  FilterType as FilterTypeEnum,
  filterViewOptions,
  getFilterViewToFilterOptions,
} from "@/components/ui/filters";
import { Dispatch, SetStateAction } from "react";

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
};

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

interface MenuBarProps {
  filters: Filter[];
  setFilters: Dispatch<SetStateAction<Filter[]>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  availableTags: {
    tag: string;
    count: number;
  }[];
}

export function MenuBar({
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  availableTags,
}: MenuBarProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<FilterTypeEnum | null>(
    null,
  );
  const [commandInput, setCommandInput] = React.useState("");
  const commandInputRef = React.useRef<HTMLInputElement>(null);

  // Get the filter options with available tags
  const filterViewToFilterOptions = React.useMemo(
    () => getFilterViewToFilterOptions(availableTags),
    [availableTags],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    console.log("Search input changed:", e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search submitted:", searchQuery);
    // Focus back on the input after submission
    const searchInput = e.currentTarget.querySelector("input");
    if (searchInput) {
      searchInput.focus();
    }
  };

  return (
    <motion.nav
      className="p-2 rounded-2xl bg-[#0c0d0d] backdrop-blur-lg border border-[#c8b6ff]/20 shadow-lg relative overflow-hidden w-full max-w-4xl"
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        className="absolute -inset-2 bg-gradient-radial from-transparent via-[#c8b6ff]/30 via-30% to-transparent rounded-3xl z-0 pointer-events-none"
        variants={navGlowVariants}
      />
      <div className="flex items-center gap-4 relative z-10">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            name="searchQuery"
            placeholder="Search history..."
            className="w-full pl-10 pr-4 py-2 bg-[#040404] text-[#c8b6ff] placeholder-[#c8b6ff]/50 rounded-xl border border-[#c8b6ff]/20 focus:outline-none focus:border-[#c8b6ff]/50 transition-colors"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button
            type="submit"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer"
          >
            <Search className="h-5 w-5 text-[#c8b6ff]/70" />
          </button>
        </form>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 flex-wrap">
            <Filters
              filters={filters}
              setFilters={setFilters}
              availableTags={availableTags}
            />
            {filters.filter((filter) => filter.value?.length > 0).length >
              0 && (
              <Button
                variant="outline"
                size="sm"
                className="transition group h-6 text-xs items-center rounded-sm bg-[#0c0d0d] text-[#c8b6ff] border-[#c8b6ff]/20 hover:bg-[#c8b6ff]/10 hover:text-[#c8b6ff]"
                onClick={() => setFilters([])}
              >
                Clear
              </Button>
            )}
            <Popover
              open={open}
              onOpenChange={(open) => {
                setOpen(open);
                if (!open) {
                  setTimeout(() => {
                    setSelectedView(null);
                    setCommandInput("");
                  }, 200);
                }
              }}
            >
              <PopoverTrigger asChild>
                <motion.div
                  className="block rounded-xl overflow-visible group relative"
                  style={{ perspective: "600px" }}
                  whileHover="hover"
                  initial="initial"
                >
                  <motion.div
                    className="absolute inset-0 z-0 pointer-events-none"
                    variants={glowVariants}
                    style={{
                      background:
                        "radial-gradient(circle, rgba(200,182,255,0.15) 0%, rgba(200,182,255,0.06) 50%, rgba(200,182,255,0) 100%)",
                      opacity: 0,
                      borderRadius: "16px",
                    }}
                  />
                  <motion.div
                    className="flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent text-[#c8b6ff]/70 group-hover:text-[#c8b6ff] transition-colors rounded-xl cursor-pointer"
                    variants={itemVariants}
                    transition={sharedTransition}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "center bottom",
                    }}
                  >
                    <ListFilter className="h-5 w-5" />
                    <span>
                      {filters.length > 0
                        ? `Filters (${filters.length})`
                        : "Filter"}
                    </span>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 bg-transparent text-[#c8b6ff]/70 group-hover:text-[#c8b6ff] transition-colors rounded-xl cursor-pointer"
                    variants={backVariants}
                    transition={sharedTransition}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "center top",
                      rotateX: 90,
                    }}
                  >
                    <ListFilter className="h-5 w-5" />
                    <span>
                      {filters.length > 0
                        ? `Filters (${filters.length})`
                        : "Filter"}
                    </span>
                  </motion.div>
                </motion.div>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 bg-[#0c0d0d] border border-[#c8b6ff]/20 text-[#c8b6ff] max-h-[300px] overflow-auto">
                <AnimateChangeInHeight>
                  <Command>
                    <CommandInput
                      placeholder={selectedView ? selectedView : "Filter..."}
                      className="h-9"
                      value={commandInput}
                      onInputCapture={(e) => {
                        setCommandInput(e.currentTarget.value);
                      }}
                      ref={commandInputRef}
                    />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      {selectedView ? (
                        <CommandGroup>
                          {filterViewToFilterOptions[selectedView].map(
                            (filter: FilterOption) => (
                              <CommandItem
                                className="group text-[#c8b6ff]/70 flex gap-2 items-center"
                                key={filter.name}
                                value={filter.name}
                                onSelect={(currentValue) => {
                                  setFilters((prev) => [
                                    ...prev,
                                    {
                                      id: nanoid(),
                                      type: selectedView,
                                      operator:
                                        selectedView ===
                                          FilterTypeEnum.DUE_DATE &&
                                        currentValue !== DueDate.IN_THE_PAST
                                          ? FilterOperator.BEFORE
                                          : FilterOperator.IS,
                                      value: [currentValue],
                                    },
                                  ]);
                                  setTimeout(() => {
                                    setSelectedView(null);
                                    setCommandInput("");
                                  }, 200);
                                  setOpen(false);
                                }}
                              >
                                {filter.icon}
                                <span className="text-[#c8b6ff]">
                                  {filter.name}
                                </span>
                                {filter.label && (
                                  <span className="text-[#c8b6ff]/50 text-xs ml-auto">
                                    {filter.label}
                                  </span>
                                )}
                              </CommandItem>
                            ),
                          )}
                        </CommandGroup>
                      ) : (
                        filterViewOptions.map(
                          (group: FilterOption[], index: number) => (
                            <React.Fragment key={index}>
                              <CommandGroup>
                                {group.map((filter: FilterOption) => (
                                  <CommandItem
                                    className="group text-[#c8b6ff]/70 flex gap-2 items-center"
                                    key={filter.name}
                                    value={filter.name}
                                    onSelect={(currentValue) => {
                                      setSelectedView(
                                        currentValue as FilterTypeEnum,
                                      );
                                      setCommandInput("");
                                      commandInputRef.current?.focus();
                                    }}
                                  >
                                    {filter.icon}
                                    <span className="text-[#c8b6ff]">
                                      {filter.name}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                              {index < filterViewOptions.length - 1 && (
                                <CommandSeparator />
                              )}
                            </React.Fragment>
                          ),
                        )
                      )}
                    </CommandList>
                  </Command>
                </AnimateChangeInHeight>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
