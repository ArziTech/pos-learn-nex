"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, Receipt, Percent } from "lucide-react";
import { CartItem, TransactionDiscount } from "./CashierPageClient";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DiscountDialog } from "./DiscountDialog";

interface CashierCartProps {
  cart: CartItem[];
  totalAmount: number;
  totalItems: number;
  subtotal: number;
  transactionDiscount: TransactionDiscount;
  transactionDiscountAmount: number;
  totalItemDiscounts: number;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
  onClear: () => void;
  onCheckout: () => void;
  isCheckingOut: boolean;
  onApplyItemDiscount: (itemId: number, type: 'PERCENTAGE' | 'NOMINAL' | null, value: number) => void;
  onApplyTransactionDiscount: (type: 'PERCENTAGE' | 'NOMINAL' | null, value: number) => void;
}

export function CashierCart({
  cart,
  totalAmount,
  totalItems,
  subtotal,
  transactionDiscount,
  transactionDiscountAmount,
  totalItemDiscounts,
  onUpdateQuantity,
  onRemove,
  onClear,
  onCheckout,
  isCheckingOut,
  onApplyItemDiscount,
  onApplyTransactionDiscount,
}: CashierCartProps) {
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [transactionDiscountMode, setTransactionDiscountMode] = useState<'PERCENTAGE' | 'NOMINAL'>('PERCENTAGE');
  const [transactionDiscountValue, setTransactionDiscountValue] = useState('');

  const handleOpenItemDiscount = (item: CartItem) => {
    setSelectedItem(item);
    setDiscountDialogOpen(true);
  };

  const handleApplyItemDiscount = (type: 'PERCENTAGE' | 'NOMINAL' | null, value: number) => {
    if (selectedItem) {
      onApplyItemDiscount(selectedItem.id, type, value);
    }
  };

  const handleApplyTransactionDiscount = () => {
    const value = parseFloat(transactionDiscountValue) || 0;
    if (value > 0) {
      onApplyTransactionDiscount(transactionDiscountMode, value);
    } else {
      onApplyTransactionDiscount(null, 0);
    }
    setTransactionDiscountValue('');
  };

  const handleRemoveTransactionDiscount = () => {
    onApplyTransactionDiscount(null, 0);
    setTransactionDiscountValue('');
  };

  return (
    <>
      <Card className="sticky top-6 h-fit max-h-[calc(100vh-120px)] flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Keranjang
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <Receipt className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Keranjang kosong</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tambahkan produk untuk memulai
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {cart.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemove}
                    onOpenDiscount={() => handleOpenItemDiscount(item)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>

        {cart.length > 0 && (
          <>
            <Separator />

            {/* Transaction Discount Section */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Diskon Transaksi
                </span>
                {transactionDiscount.type && transactionDiscount.value > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveTransactionDiscount}
                    className="h-6 text-destructive hover:text-destructive"
                  >
                    Hapus
                  </Button>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={transactionDiscountMode === 'PERCENTAGE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransactionDiscountMode('PERCENTAGE')}
                  className="shrink-0"
                >
                  %
                </Button>
                <Input
                  type="number"
                  placeholder={transactionDiscountMode === 'PERCENTAGE' ? '0' : '0'}
                  value={
                    transactionDiscount.type && transactionDiscount.type === transactionDiscountMode
                      ? transactionDiscount.value.toString()
                      : transactionDiscountValue
                  }
                  onChange={(e) => setTransactionDiscountValue(e.target.value)}
                  onFocus={() => {
                    if (transactionDiscount.type && transactionDiscount.type !== transactionDiscountMode) {
                      setTransactionDiscountValue('');
                    }
                  }}
                  onBlur={handleApplyTransactionDiscount}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyTransactionDiscount();
                      e.currentTarget.blur();
                    }
                  }}
                  min={0}
                  max={transactionDiscountMode === 'PERCENTAGE' ? 100 : subtotal}
                  step={transactionDiscountMode === 'PERCENTAGE' ? 1 : 1000}
                  className="flex-1"
                />
              </div>
            </div>

            <Separator />
            <CardFooter className="flex-col gap-4 p-4">
              {/* Subtotal */}
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {/* Item Discounts */}
                {totalItemDiscounts > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Diskon Item</span>
                    <span>-{formatCurrency(totalItemDiscounts)}</span>
                  </div>
                )}

                {/* Transaction Discount */}
                {transactionDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>
                      Diskon Transaksi (
                      {transactionDiscount.type === 'PERCENTAGE'
                        ? `${transactionDiscount.value}%`
                        : formatCurrency(transactionDiscount.value)}
                      )
                    </span>
                    <span>-{formatCurrency(transactionDiscountAmount)}</span>
                  </div>
                )}

                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full space-y-2">
                <Button
                  onClick={onCheckout}
                  disabled={isCheckingOut}
                  className="w-full"
                  size="lg"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  {isCheckingOut ? "Memproses..." : "Bayar Sekarang"}
                </Button>
                <Button
                  onClick={onClear}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Kosongkan Keranjang
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Item Discount Dialog */}
      {selectedItem && (
        <DiscountDialog
          open={discountDialogOpen}
          onOpenChange={setDiscountDialogOpen}
          itemName={selectedItem.name}
          itemPrice={selectedItem.price}
          currentDiscount={{
            type: selectedItem.discountType || null,
            value: selectedItem.discountValue || 0,
          }}
          onApply={handleApplyItemDiscount}
        />
      )}
    </>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
  onOpenDiscount: () => void;
}

function CartItemCard({ item, onUpdateQuantity, onRemove, onOpenDiscount }: CartItemCardProps) {
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [isEditing, setIsEditing] = useState(false);

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
  };

  const handleQuantityBlur = () => {
    const newQuantity = parseInt(quantity) || 1;
    const clampedQuantity = Math.max(1, Math.min(newQuantity, item.stock));
    setQuantity(clampedQuantity.toString());
    onUpdateQuantity(item.id, clampedQuantity);
    setIsEditing(false);
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleQuantityBlur();
    } else if (e.key === "Escape") {
      setQuantity(item.quantity.toString());
      setIsEditing(false);
    }
  };

  const incrementQuantity = () => {
    const newQuantity = Math.min(item.quantity + 1, item.stock);
    setQuantity(newQuantity.toString());
    onUpdateQuantity(item.id, newQuantity);
  };

  const decrementQuantity = () => {
    const newQuantity = Math.max(item.quantity - 1, 1);
    setQuantity(newQuantity.toString());
    onUpdateQuantity(item.id, newQuantity);
  };

  const currentPrice = item.discountedPrice || item.price;
  const hasDiscount = item.discountType && item.discountValue && item.discountValue > 0;

  return (
    <div className="rounded-lg border p-3 space-y-3">
      {/* Product Name */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
        <div className="flex gap-1">
          <Button
            onClick={onOpenDiscount}
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
            title="Diskon"
          >
            <Percent className="w-3 h-3" />
          </Button>
          <Button
            onClick={() => onRemove(item.id)}
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Price with discount display */}
      <div className="space-y-1">
        {hasDiscount ? (
          <>
            <p className="text-xs text-muted-foreground line-through">
              {formatCurrency(item.price)}
            </p>
            <p className="text-sm font-medium text-primary">
              {formatCurrency(currentPrice)}
              <span className="ml-1 text-xs text-destructive">
                ({item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : formatCurrency(item.discountValue || 0)} off)
              </span>
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
        )}
      </div>

      {/* Quantity Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            onClick={decrementQuantity}
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={item.quantity <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onBlur={handleQuantityBlur}
            onKeyDown={handleQuantityKeyDown}
            onFocus={() => setIsEditing(true)}
            min={1}
            max={item.stock}
            className={`w-16 h-7 text-center text-sm ${
              isEditing ? "border-primary" : ""
            }`}
          />
          <Button
            onClick={incrementQuantity}
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={item.quantity >= item.stock}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <p className="font-bold text-sm">{formatCurrency(currentPrice * parseInt(quantity) || item.subtotal)}</p>
      </div>

      {/* Stock Info */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Stok: {item.stock}</span>
        {item.quantity >= item.stock && (
          <span className="text-amber-600">Maksimal stok</span>
        )}
      </div>
    </div>
  );
}
