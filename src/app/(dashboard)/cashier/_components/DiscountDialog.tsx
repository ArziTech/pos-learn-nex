"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Percent, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type DiscountType = "PERCENTAGE" | "NOMINAL" | null;

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemPrice: number;
  currentDiscount?: {
    type: DiscountType;
    value: number;
  };
  onApply: (type: DiscountType, value: number) => void;
}

export function DiscountDialog({
  open,
  onOpenChange,
  itemName,
  itemPrice,
  currentDiscount,
  onApply,
}: DiscountDialogProps) {
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("0");

  useEffect(() => {
    if (open) {
      setDiscountType(currentDiscount?.type || "PERCENTAGE");
      setDiscountValue(currentDiscount?.value?.toString() || "0");
    }
  }, [open, currentDiscount]);

  const calculateDiscountAmount = (): number => {
    const value = parseFloat(discountValue) || 0;
    if (discountType === "PERCENTAGE") {
      return Math.min(Math.round((itemPrice * value) / 100), itemPrice);
    }
    return Math.min(value, itemPrice);
  };

  const discountAmount = calculateDiscountAmount();
  const finalPrice = itemPrice - discountAmount;

  const handleApply = () => {
    const value = parseFloat(discountValue) || 0;
    if (value <= 0) {
      onApply(null, 0);
    } else {
      onApply(discountType, value);
    }
    onOpenChange(false);
  };

  const handleRemove = () => {
    onApply(null, 0);
    onOpenChange(false);
  };

  const handlePercentageChange = (value: string) => {
    // Only allow 0-100 for percentage
    const numValue = parseFloat(value);
    if (value === "" || (numValue >= 0 && numValue <= 100)) {
      setDiscountValue(value);
    }
  };

  const handleNominalChange = (value: string) => {
    // Only allow positive values and not exceeding item price
    const numValue = parseFloat(value);
    if (value === "" || (numValue >= 0 && numValue <= itemPrice)) {
      setDiscountValue(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Diskon Item</DialogTitle>
          <DialogDescription>{itemName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original Price */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Harga Asli</span>
            <span className="font-medium">{formatCurrency(itemPrice)}</span>
          </div>

          {/* Discount Type Selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={discountType === "PERCENTAGE" ? "default" : "outline"}
              onClick={() => {
                setDiscountType("PERCENTAGE");
                setDiscountValue("0");
              }}
              className="flex-1"
            >
              <Percent className="w-4 h-4 mr-2" />
              Persen
            </Button>
            <Button
              type="button"
              variant={discountType === "NOMINAL" ? "default" : "outline"}
              onClick={() => {
                setDiscountType("NOMINAL");
                setDiscountValue("0");
              }}
              className="flex-1"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Nominal
            </Button>
          </div>

          {/* Discount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {discountType === "PERCENTAGE" ? "Diskon Persen" : "Diskon Nominal"}
            </label>
            <div className="relative">
              <Input
                type="number"
                value={discountValue}
                onChange={(e) =>
                  discountType === "PERCENTAGE"
                    ? handlePercentageChange(e.target.value)
                    : handleNominalChange(e.target.value)
                }
                min={0}
                max={discountType === "PERCENTAGE" ? 100 : itemPrice}
                step={discountType === "PERCENTAGE" ? 1 : 1000}
                className="text-lg"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {discountType === "PERCENTAGE" ? "%" : "Rp"}
              </span>
            </div>
          </div>

          {/* Discount Preview */}
          {discountAmount > 0 && (
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Diskon</span>
                <span className="text-destructive">-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Harga Akhir</span>
                <span className="text-primary">{formatCurrency(finalPrice)}</span>
              </div>
            </div>
          )}

          {/* Discount Badge */}
          {discountAmount > 0 && (
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {discountType === "PERCENTAGE"
                  ? `${discountValue}%`
                  : formatCurrency(discountAmount)}{" "}
                off = {formatCurrency(discountAmount)} diskon
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {currentDiscount?.value && currentDiscount.value > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              Hapus Diskon
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" onClick={handleApply}>
            Terapkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
