"use client";

import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  error?: string;
}

export function DatePicker({
  value,
  onChange,
  disabled,
  error,
}: DatePickerProps) {
  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value
              ? format(value, "dd MMM yyyy", { locale: id })
              : "Pilih tanggal"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={value}
            onSelect={onChange}
            disabled={disabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
