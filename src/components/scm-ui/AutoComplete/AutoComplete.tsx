"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover/Popover";
import { cn } from "@/lib/utils";

export interface AutoCompleteOption {
  value: string;
  label: string;
  subLabel?: string;
}

export interface AutoCompleteProps {
  value?: AutoCompleteOption;
  onValueChange: (value: string, option?: AutoCompleteOption) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
  options: AutoCompleteOption[];
  renderOption?: (option: AutoCompleteOption) => React.ReactNode;
  getDisplayText?: (option: AutoCompleteOption) => string;
}

// Default option renderer - extracted outside component to prevent recreation
const defaultRenderOption = (option: AutoCompleteOption) => (
  <div className="flex flex-col">
    <span className="font-medium">{option.label}</span>
    {option.subLabel && (
      <span className="text-xs text-muted-foreground">{option.subLabel}</span>
    )}
  </div>
);

export function AutoComplete({
  value,
  onValueChange,
  placeholder = "Pilih opsi...",
  error,
  disabled = false,
  className,
  allowClear = true,
  options,
  renderOption,
  getDisplayText,
}: AutoCompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>(
    undefined
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // DERIVED STATE: Compute display value from props and state
  // No useEffect needed - this runs on every render automatically
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

  // Filter options based on search
  const filteredOptions = options.filter((option) => {
    const searchTerm = searchInput.trim();
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      (option.subLabel && option.subLabel.toLowerCase().includes(searchLower))
    );
  });

  // Handle selection
  const handleSelect = (option: AutoCompleteOption) => {
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
              aria-describedby={error ? `${value?.value}-error` : undefined}
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
                type="button"
                disabled={disabled}
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
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {searchInput.trim() ? "Data tidak ditemukan" : "Belum ada data"}
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent text-sm",
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
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Error message */}
      {error && (
        <p id={`${value?.value}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
