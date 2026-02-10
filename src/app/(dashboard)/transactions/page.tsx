"use client";

import { useState, useRef } from "react";
import { Receipt, Eye, XCircle, AlertTriangle } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import {
  DataTable,
  DataTableRef,
} from "@/components/scm-ui/Datatable/Datatable";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { FetchResult } from "@/types/pagination";
import axiosInstance from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { TransactionDetailDialog } from "./_components/TransactionDetailDialog";
import { CancelTransactionDialog } from "./_components/CancelTransactionDialog";

export type { Transaction };

interface TransactionItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Transaction {
  id: number;
  invoiceNo: string;
  totalAmount: number;
  status: "COMPLETED" | "CANCELED";
  createdAt: string;
  canceledAt: string | null;
  cashier: {
    id: string;
    name: string | null;
    username: string;
  };
  items: TransactionItem[];
  cancelLogs?: {
    id: number;
    reason: string;
    canceledAt: string;
    canceledBy: string;
  }[];
}

export default function TransactionsPage() {
  const { hasPermission, isLoading } = usePermission();
  const tableRef = useRef<DataTableRef>(null);

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Fetch transactions action for DataTable
  const fetchTransactions = async (params: {
    page: number;
    pageSize: number;
    search: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
  }): Promise<FetchResult<Transaction>> => {
    try {
      const response = await axiosInstance.get<FetchResult<Transaction>>("/api/transactions", {
        params: {
          page: params.page,
          limit: params.pageSize,
          search: params.search,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  };

  // Handlers
  const openDetailDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailDialogOpen(true);
  };

  const openCancelDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsCancelDialogOpen(true);
  };

  const invalidateTable = () => {
    tableRef.current?.invalidate();
  };

  // Check if transaction can be canceled (within 24 hours and not already canceled)
  const canCancelTransaction = (transaction: Transaction): boolean => {
    if (transaction.status === "CANCELED") return false;

    const now = new Date();
    const transactionDate = new Date(transaction.createdAt);
    const hoursDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);

    return hoursDiff <= 24;
  };

  // Permission check
  if (!hasPermission("transaction") && !isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Anda tidak memiliki akses untuk melihat halaman ini
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>
          <p className="text-muted-foreground">
            Lihat semua riwayat transaksi penjualan
          </p>
        </div>
      </div>

      {/* DataTable */}
      <Card>
        <CardContent className="pt-6">
          <DataTable<Transaction>
            ref={tableRef}
            fetchAction={fetchTransactions}
            queryKey="transactions"
            searchPlaceholder="Cari invoice..."
            columns={[
              { key: "invoiceNo", label: "No. Invoice", sortable: true },
              { key: "date", label: "Tanggal", sortable: true },
              { key: "cashier", label: "Kasir", sortable: false },
              { key: "items", label: "Items", sortable: false },
              { key: "total", label: "Total", sortable: true },
              { key: "status", label: "Status", sortable: false },
              { key: "actions", label: "Aksi", sortable: false },
            ]}
            rows={(transactions) =>
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.invoiceNo}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{format(new Date(transaction.createdAt), "dd MMM yyyy, HH:mm", {
                        locale: id,
                      })}</div>
                      {transaction.canceledAt && (
                        <div className="text-xs text-destructive">
                          Dibatalkan: {format(new Date(transaction.canceledAt), "dd MMM yyyy, HH:mm", {
                          locale: id,
                        })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.cashier.name || transaction.cashier.username}
                  </TableCell>
                  <TableCell>{transaction.items.length} item</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(transaction.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={transaction.status === "COMPLETED" ? "default" : "destructive"}
                      className={
                        transaction.status === "COMPLETED"
                          ? "bg-green-500 hover:bg-green-600"
                          : ""
                      }
                    >
                      {transaction.status === "COMPLETED" ? "Selesai" : "Batal"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetailDialog(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canCancelTransaction(transaction) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openCancelDialog(transaction)}
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            }
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <TransactionDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        transaction={selectedTransaction}
      />

      {/* Cancel Dialog */}
      <CancelTransactionDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        transaction={selectedTransaction}
        onSuccess={invalidateTable}
      />
    </div>
  );
}
