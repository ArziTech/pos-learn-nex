"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { CashierProductList } from "./CashierProductList";
import { CashierCart } from "./CashierCart";
import { PaymentDialog } from "./PaymentDialog";

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  subtotal: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  categoryId: number | null;
  isActive: boolean;
  stock?: {
    quantity: number;
  } | null;
  category?: {
    id: number;
    title: string;
  } | null;
  availableStock?: number;
}

export function CashierPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", searchQuery],
    queryFn: async () => {
      const response = await axiosInstance.get("/api/products", {
        params: { search: searchQuery, limit: 50 },
      });
      return response.data.data || [];
    },
  });

  // Calculate reserved stock (items in cart)
  const reservedStock = useMemo(() => {
    const reserved = new Map<number, number>();
    cart.forEach((item) => {
      reserved.set(item.productId, (reserved.get(item.productId) || 0) + item.quantity);
    });
    return reserved;
  }, [cart]);

  // Products with available stock (database stock - reserved in cart)
  const productsWithAvailableStock = useMemo(() => {
    return products.map((product: Product) => ({
      ...product,
      availableStock: Math.max(0, (product.stock?.quantity ?? 0) - (reservedStock.get(product.id) || 0)),
    }));
  }, [products, reservedStock]);

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (items: CartItem[]) => {
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      const response = await axiosInstance.post("/api/transactions", {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Transaksi berhasil!", {
        description: `Invoice: ${data.data.invoiceNo}`,
      });
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: any) => {
      toast.error("Gagal membuat transaksi", {
        description: error.response?.data?.error || error.message,
      });
    },
  });

  const addToCart = useCallback(
    (product: Product) => {
      const dbStock = product.stock?.quantity ?? 0;
      const reserved = reservedStock.get(product.id) || 0;
      const availableStock = dbStock - reserved;

      if (availableStock <= 0) {
        toast.error("Stok habis!", {
          description: `${product.name} tidak tersedia.`,
        });
        return;
      }

      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.productId === product.id);

        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (newQuantity > dbStock) {
            toast.error("Stok tidak mencukupi!", {
              description: `Maksimal ${dbStock} ${product.name}.`,
            });
            return prevCart;
          }
          return prevCart.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: newQuantity,
                  subtotal: item.price * newQuantity,
                }
              : item
          );
        }

        return [
          ...prevCart,
          {
            id: Date.now(),
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            stock: dbStock,
            subtotal: product.price,
          },
        ];
      });
    },
    [reservedStock]
  );

  const updateQuantity = useCallback((itemId: number, newQuantity: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === itemId) {
            // Validate quantity against database stock (not available stock)
            const validatedQuantity = Math.max(1, Math.min(newQuantity, item.stock));
            if (validatedQuantity !== newQuantity) {
              if (newQuantity > item.stock) {
                toast.error("Stok tidak mencukupi!");
              }
            }
            return {
              ...item,
              quantity: validatedQuantity,
              subtotal: item.price * validatedQuantity,
            };
          }
          return item;
        })
    );
  }, []);

  const removeFromCart = useCallback((itemId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong!", {
        description: "Tambahkan produk sebelum checkout.",
      });
      return;
    }
    // Open payment dialog instead of directly creating transaction
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setCart([]);
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kasir</h1>
          <p className="text-muted-foreground">Buat transaksi penjualan</p>
        </div>
        {cart.length > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {totalItems} item
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Cari Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Cari berdasarkan nama atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </CardContent>
          </Card>

          {/* Product List */}
          <CashierProductList
            products={productsWithAvailableStock}
            isLoading={isLoading}
            onAddToCart={addToCart}
            cart={cart}
          />
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <CashierCart
            cart={cart}
            totalAmount={totalAmount}
            totalItems={totalItems}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onClear={clearCart}
            onCheckout={handleCheckout}
            isCheckingOut={createTransactionMutation.isPending}
          />
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        cart={cart}
        totalAmount={totalAmount}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
