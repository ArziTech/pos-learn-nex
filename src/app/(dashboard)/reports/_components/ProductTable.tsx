"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Package, DollarSign, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductSales {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  transactionCount: number;
}

interface ProductTableProps {
  data: ProductSales[];
  columns: string[];
  title: string;
  description: string;
  isLoading: boolean;
}

export function ProductTable({
  data,
  columns,
  title,
  description,
  isLoading,
}: ProductTableProps) {
  const renderCell = (item: ProductSales, column: string) => {
    switch (column) {
      case "productName":
        return (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{item.productName}</span>
          </div>
        );
      case "totalQuantity":
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{item.totalQuantity}</Badge>
            <span className="text-muted-foreground text-sm">item</span>
          </div>
        );
      case "totalRevenue":
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-medium">{formatCurrency(item.totalRevenue)}</span>
          </div>
        );
      case "transactionCount":
        return (
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{item.transactionCount}</span>
            <span className="text-muted-foreground text-sm">transaksi</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getColumnLabel = (column: string) => {
    switch (column) {
      case "productName":
        return "Nama Produk";
      case "totalQuantity":
        return "Total Terjual";
      case "totalRevenue":
        return "Pendapatan";
      case "transactionCount":
        return "Jumlah Transaksi";
      default:
        return column;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              {columns.map((column) => (
                <TableHead key={column}>{getColumnLabel(column)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.productId}>
                  <TableCell>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? "bg-amber-100 text-amber-700"
                          : index === 1
                            ? "bg-gray-100 text-gray-700"
                            : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column}>{renderCell(item, column)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
