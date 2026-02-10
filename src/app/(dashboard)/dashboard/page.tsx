"use client";

import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Package, Banknote, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";

interface DashboardStats {
  totalProducts: number;
  totalTransactions: number;
  todaySales: number;
  todayTransactionCount: number;
}

export default function DashboardPage() {
  const { hasPermission } = usePermission();

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: DashboardStats }>("/api/dashboard/stats");
      return response.data.data;
    },
  });

  const data = stats || {
    totalProducts: 0,
    totalTransactions: 0,
    todaySales: 0,
    todayTransactionCount: 0,
  };

  const statsCards = [
    {
      title: "Total Produk",
      value: data.totalProducts,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Transaksi Hari Ini",
      value: data.todayTransactionCount,
      icon: ShoppingCart,
      color: "text-green-600",
    },
    {
      title: "Penjualan Hari Ini",
      value: formatCurrency(data.todaySales),
      icon: Banknote,
      color: "text-amber-600",
    },
    {
      title: "Total Transaksi",
      value: data.totalTransactions,
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di sistem POS</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold mt-2">{card.value}</p>
                </div>
                <card.icon className={`w-8 h-8 ${card.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {hasPermission("cashier") && (
              <a
                href="/cashier"
                className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Banknote className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Transaksi Baru</p>
                  <p className="text-sm text-muted-foreground">Buka kasir</p>
                </div>
              </a>
            )}
            {hasPermission("product") && (
              <a
                href="/products"
                className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Package className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Kelola Produk</p>
                  <p className="text-sm text-muted-foreground">Tambah/edit produk</p>
                </div>
              </a>
            )}
            {hasPermission("transaction") && (
              <a
                href="/transactions"
                className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Riwayat Transaksi</p>
                  <p className="text-sm text-muted-foreground">Lihat semua transaksi</p>
                </div>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
