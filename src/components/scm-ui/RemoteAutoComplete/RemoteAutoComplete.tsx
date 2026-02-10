/**
 * Generic AutoComplete Component with Infinite Scroll
 *
 * A highly reusable and modular autocomplete component that can work with any API endpoint
 * and any data type. Features infinite scroll pagination for large datasets. Simply configure
 * the API endpoint, data transformation, pagination parameters, and optional custom rendering functions.
 *
 * @example Basic Usage:
 * ```tsx
 * <RemoteAutoComplete<MyDataType>
 *   value={selectedValue}
 *   onValueChange={(value, option) => setSelectedValue(value)}
 *   fetchAction={fetchMyData}
 *   queryKey={["/api/my-data"]}
 *   transformData={(items) => items.map(item => ({
 *     value: item.id,
 *     label: item.name,
 *     subLabel: item.description
 *   }))}
 * />
 * ```
 *
 * @example With Custom Rendering:
 * ```tsx
 * <RemoteAutoComplete<User>
 *   // ... other props
 *   renderOption={(option) => (
 *     <div className="flex items-center gap-2">
 *       <div>
 *         <div>{option.label}</div>
 *         <div className="text-sm text-gray-500">{option.subLabel}</div>
 *       </div>
 *     </div>
 *   )}
 *   getDisplayText={(option) => `${option.label} (${option.subLabel})`}
 * />
 * ```
 *
 * @example With Filters:
 * ```tsx
 * <RemoteAutoComplete<Student>
 *   // ... other props
 *   queryKey={["/api/students", classId, gradeLevel]}
 * />
 * ```
 */
"use client";

import { useState, useRef, useCallback, useLayoutEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PopoverTrigger, Popover, PopoverContent } from "../Popover/Popover";
import { cn } from "@/lib/utils";
import { FetchResult } from "@/types/pagination";
import { useDebounce } from "use-debounce";
import { useInfiniteQuery } from "@tanstack/react-query";

export interface RemoteAutoCompleteOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface RemoteAutoCompleteProps<T> {
  value?: RemoteAutoCompleteOption;
  onValueChange: (value: string, option?: RemoteAutoCompleteOption) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
  fetchAction: (params: {
    page: number;
    pageSize: number;
    search: string;
  }) => Promise<FetchResult<T>>;

  // API Configuration
  queryKey: string | string[];
  pageSize?: number; // Number of items per page (default: 10)

  // Data transformation
  transformData: (data: T[]) => RemoteAutoCompleteOption[];

  // Custom rendering
  renderOption?: (option: RemoteAutoCompleteOption) => React.ReactNode;
  getDisplayText?: (option: RemoteAutoCompleteOption) => string; // For input display
}

// Default option renderer - extracted outside component to prevent recreation
const defaultRenderOption = (option: RemoteAutoCompleteOption) => (
  <div className="flex flex-col">
    <span className="font-medium">{option.label}</span>
    {option.subLabel && (
      <span className="text-xs text-muted-foreground">{option.subLabel}</span>
    )}
  </div>
);

export function RemoteAutoComplete<T>({
  value,
  onValueChange,
  placeholder = "Pilih opsi...",
  error,
  disabled = false,
  className,
  allowClear = true,
  queryKey,
  fetchAction,
  pageSize = 10,
  transformData,
  renderOption,
  getDisplayText,
}: RemoteAutoCompleteProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>(
    undefined
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [debouncedSearch] = useDebounce(searchInput, 300);

  // DERIVED STATE: Compute display value from props and state
  // No synchronization needed - always correct by construction
  const displayValue = isTyping
    ? searchInput
    : value
    ? getDisplayText
      ? getDisplayText(value)
      : value.label
    : "";

  // Measure container width when popover opens
  // useLayoutEffect runs synchronously after DOM updates but before paint
  useLayoutEffect(() => {
    if (open && containerRef.current) {
      setDropdownWidth(containerRef.current.offsetWidth);
    }
  }, [open]);

  const {
    data,
    isLoading,
    error: fetchError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: Array.isArray(queryKey)
      ? [...queryKey, debouncedSearch]
      : [queryKey, debouncedSearch],
    queryFn: async ({ pageParam: currentPage = 1 }) => {
      const response = await fetchAction({
        page: currentPage,
        pageSize,
        search: debouncedSearch,
      });

      const items = response.data || [];
      const hasMore = response.pagination
        ? response.pagination.page < response.pagination.totalPages
        : false;

      return {
        items,
        nextPage: hasMore ? currentPage + 1 : undefined,
        hasNextPage: hasMore,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    initialPageParam: 1,
    enabled: true,
  });

  // Flatten all pages data
  const allItems = data?.pages.flatMap((page) => page.items) || [];

  // Transform raw data to options
  const options = transformData(allItems);

  // Filter options based on search (client-side filtering for already loaded data)
  const filteredOptions = options.filter((option) => {
    if (!searchInput.trim()) return true; // Show all if no search
    const searchText = option.label;
    return searchText.toLowerCase().includes(searchInput.toLowerCase());
  });

  // Intersection observer for infinite scroll
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;
      if (!hasNextPage) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);

      // Cleanup function
      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Handle selection
  const handleSelect = (option: RemoteAutoCompleteOption) => {
    setSearchInput("");
    setIsTyping(false);
    onValueChange(option.value, option);
    setOpen(false);
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange("", undefined);
    setSearchInput("");
    setIsTyping(false);
    setOpen(false);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchInput(newValue);
    setIsTyping(true);

    // Clear selection when user starts typing something different
    if (value) {
      const expectedValue = getDisplayText
        ? getDisplayText(value)
        : value.label;
      if (newValue !== expectedValue) {
        onValueChange("", undefined);
      }
    }

    // Open dropdown when user types
    if (!open) {
      setOpen(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Reset typing state when input loses focus
    // Small delay to allow click on dropdown items
    setTimeout(() => {
      setIsTyping(false);
      setSearchInput("");
    }, 200);
  };

  const handleInputClick = () => {
    if (disabled) {
      return;
    }
    setOpen(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setIsTyping(false);
        setSearchInput("");
        break;
      case "Enter":
        if (open && filteredOptions.length === 1) {
          e.preventDefault();
          handleSelect(filteredOptions[0]);
        }
        break;
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Popover modal open={open} onOpenChange={disabled ? () => {} : setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <div className="relative">
            <Input
              ref={inputRef}
              value={displayValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onClick={handleInputClick}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "w-full pr-16 cursor-pointer",
                error && "border-red-500 focus:border-red-500",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
              autoComplete="off"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-invalid={!!error}
              aria-describedby={error ? `${value}-error` : undefined}
            />

            {/* Action buttons */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {value && allowClear && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-100 rounded-sm z-10"
                  tabIndex={-1}
                  aria-label="Clear selection"
                >
                  <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                </button>
              )}
              <button
                disabled={disabled}
                type="button"
                onClick={(e) => {
                  if (disabled) return;
                  e.stopPropagation();
                  setOpen(!open);
                }}
                className={cn(
                  "p-1 hover:bg-gray-100 rounded-sm",
                  disabled && "cursor-not-allowed hover:bg-transparent"
                )}
                tabIndex={-1}
                aria-label="Toggle dropdown"
              >
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </button>
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 bg-background shadow-md rounded-md border"
          style={{
            width: dropdownWidth || "auto",
          }}
          onOpenAutoFocus={(e: Event) => e.preventDefault()}
          side="bottom"
          align="start"
        >
          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Memuat data...
              </div>
            )}

            {fetchError && (
              <div className="px-3 py-2 text-sm text-red-500">
                Gagal memuat data
              </div>
            )}

            {!isLoading && !fetchError && filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {searchInput.trim() ? "Data tidak ditemukan" : "Belum ada data"}
              </div>
            )}

            {!isLoading && !fetchError && filteredOptions.length > 0 && (
              <div className="py-1">
                {filteredOptions.map((option, index) => {
                  const isLast = index === filteredOptions.length - 1;
                  return (
                    <div
                      key={option.value}
                      ref={isLast ? lastElementRef : null}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent text-sm",
                        value?.value === option.value && "bg-accent"
                      )}
                      onClick={() => handleSelect(option)}
                      role="option"
                      aria-selected={value?.value === option.value}
                    >
                      {renderOption
                        ? renderOption(option)
                        : defaultRenderOption(option)}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value?.value === option.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </div>
                  );
                })}

                {/* Loading indicator for next page */}
                {isFetchingNextPage && (
                  <div className="px-3 py-2 text-sm text-muted-foreground flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    Memuat lebih banyak...
                  </div>
                )}

                {/* End indicator */}
                {!hasNextPage && filteredOptions.length > pageSize && (
                  <div className="px-3 py-1 text-xs text-muted-foreground text-center border-t">
                    Semua data telah dimuat
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Error message */}
      {error && (
        <p id={`${value}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
