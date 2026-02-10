"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Package, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axiosInstance from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RevenueChart } from "./_components/RevenueChart";
import { ProductTable } from "./_components/ProductTable";

interface Summary {
  totalRevenue: number;
  totalTransactions: number;
  totalItemsSold: number;
  averageTransactionValue: number;
}

interface ProductSales {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  transactionCount: number;
}

interface ReportData {
  summary: Summary;
  mostSoldProducts: ProductSales[];
  popularProducts: ProductSales[];
  topRevenueProducts: ProductSales[];
  dailyRevenue: { date: string; revenue: number }[];
  period: {
    start: string;
    end: string;
  };
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("today");

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["reports", period],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: ReportData }>("/api/reports", {
        params: { period },
      });
      console.log("Reports data:", response.data);
      return response.data.data;
    },
  });

  const summaryCards = [
    {
      title: "Total Pendapatan",
      value: reportData ? formatCurrency(reportData.summary.totalRevenue) : "-",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Transaksi",
      value: reportData?.summary.totalTransactions ?? 0,
      icon: BarChart3,
      color: "text-blue-600",
    },
    {
      title: "Total Item Terjual",
      value: reportData?.summary.totalItemsSold ?? 0,
      icon: Package,
      color: "text-purple-600",
    },
    {
      title: "Rata-rata Transaksi",
      value: reportData ? formatCurrency(reportData.summary.averageTransactionValue) : "-",
      icon: TrendingUp,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Laporan & Analitik</h1>
          <p className="text-muted-foreground">
            Pantau performa bisnis Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">7 Hari Terakhir</SelectItem>
              <SelectItem value="month">30 Hari Terakhir</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
              <SelectItem value="all">Semua Waktu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold mt-2">{card.value}</p>
                </div>
                <card.icon className={`w-8 h-8 ${card.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Pendapatan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Memuat data...
            </div>
          ) : (
            <RevenueChart data={reportData?.dailyRevenue || []} periodType={period} />
          )}
        </CardContent>
      </Card>

      {/* Product Tables */}
      <Tabs defaultValue="most-sold" className="space-y-4">
        <TabsList>
          <TabsTrigger value="most-sold">Terlaris (Kuantitas)</TabsTrigger>
          <TabsTrigger value="popular">Paling Populer (Transaksi)</TabsTrigger>
          <TabsTrigger value="revenue">Tertinggi Pendapatan</TabsTrigger>
        </TabsList>

        <TabsContent value="most-sold">
          <ProductTable
            data={reportData?.mostSoldProducts || []}
            columns={["productName", "totalQuantity", "totalRevenue"]}
            title="Produk Terlaris"
            description="Produk dengan jumlah penjualan tertinggi"
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="popular">
          <ProductTable
            data={reportData?.popularProducts || []}
            columns={["productName", "transactionCount", "totalQuantity"]}
            title="Produk Paling Populer"
            description="Produk yang paling sering dibeli"
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="revenue">
          <ProductTable
            data={reportData?.topRevenueProducts || []}
            columns={["productName", "totalRevenue", "totalQuantity"]}
            title="Produk Pendapatan Tertinggi"
            description="Produk dengan kontribusi pendapatan terbesar"
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Period Info */}
      {reportData && (
        <div className="text-sm text-muted-foreground text-center">
          Periode: {format(new Date(reportData.period.start), "dd MMM yyyy HH:mm", {
            locale: id,
          })} - {format(new Date(reportData.period.end), "dd MMM yyyy HH:mm", {
            locale: id,
          })}
        </div>
      )}
    </div>
  );
}
