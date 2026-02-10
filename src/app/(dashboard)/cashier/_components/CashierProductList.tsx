"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { Product, CartItem } from "./CashierPageClient";
import { formatCurrency } from "@/lib/utils";

interface CashierProductListProps {
  products: Product[];
  isLoading: boolean;
  onAddToCart: (product: Product) => void;
  cart: CartItem[];
}

export function CashierProductList({
  products,
  isLoading,
  onAddToCart,
  cart,
}: CashierProductListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const cartItem = cart.find((item) => item.productId === product.id);
        const inCart = cartItem?.quantity || 0;
        const dbStock = product.stock?.quantity ?? 0;
        const availableStock = product.availableStock ?? 0;
        const isOutOfStock = !product.isActive || availableStock <= 0;

        return (
          <Card
            key={product.id}
            className={`
              transition-all hover:shadow-md
              ${isOutOfStock ? "opacity-60" : ""}
            `}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Product Header */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium line-clamp-2">{product.name}</h3>
                    {isOutOfStock && (
                      <Badge variant="destructive" className="shrink-0 text-xs">
                        Habis
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>

                {/* Category Badge */}
                {product.category && (
                  <Badge variant="outline" className="text-xs">
                    {product.category.title}
                  </Badge>
                )}

                {/* Price and Stock */}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">
                    {formatCurrency(product.price)}
                  </p>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Tersedia: {availableStock}
                    </p>
                    {dbStock !== availableStock && (
                      <p className="text-xs text-muted-foreground">
                        (Total: {dbStock})
                      </p>
                    )}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={() => onAddToCart(product)}
                  disabled={isOutOfStock}
                  className="w-full"
                  variant={inCart > 0 ? "secondary" : "default"}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {inCart > 0 ? `Tambah (${inCart})` : "Tambah"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
