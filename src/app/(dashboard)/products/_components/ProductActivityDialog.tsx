"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, History, Plus, Minus, Edit, Trash2, Power, Package } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";

interface ProductActivityLog {
  id: number;
  productId: number;
  activityType: string;
  description: string;
  changes: Record<string, any> | null;
  previousValue: number | null;
  newValue: number | null;
  userId: string;
  userName: string | null;
  createdAt: string;
}

interface ProductActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productName: string;
}

export function ProductActivityDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: ProductActivityDialogProps) {
  const [page, setPage] = useState(1);
  const limit = 20;

  // Reset page when dialog opens
  useEffect(() => {
    if (open) {
      setPage(1);
    }
  }, [open]);

  // Fetch activity logs
  const { data, isLoading, isError } = useQuery({
    queryKey: ["product-activity", productId, page],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/products/${productId}/activity`,
        { params: { page, limit } }
      );
      return response.data;
    },
    enabled: open,
  });

  const activities: ProductActivityLog[] = data?.data || [];
  const pagination = data?.pagination;

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "CREATED":
        return <Package className="w-4 h-4 text-green-500" />;
      case "STOCK_ADDED":
        return <Plus className="w-4 h-4 text-green-500" />;
      case "STOCK_REMOVED":
        return <Minus className="w-4 h-4 text-red-500" />;
      case "PRICE_CHANGED":
        return <Edit className="w-4 h-4 text-amber-500" />;
      case "UPDATED":
        return <Edit className="w-4 h-4 text-blue-500" />;
      case "ACTIVATED":
        return <Power className="w-4 h-4 text-green-500" />;
      case "DEACTIVATED":
        return <Power className="w-4 h-4 text-red-500" />;
      case "DELETED":
        return <Trash2 className="w-4 h-4 text-destructive" />;
      default:
        return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityBadgeVariant = (activityType: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (activityType) {
      case "CREATED":
      case "STOCK_ADDED":
      case "ACTIVATED":
        return "default";
      case "STOCK_REMOVED":
      case "DEACTIVATED":
      case "DELETED":
        return "destructive";
      case "PRICE_CHANGED":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getActivityLabel = (activityType: string) => {
    switch (activityType) {
      case "CREATED":
        return "Dibuat";
      case "STOCK_ADDED":
        return "Stok Ditambah";
      case "STOCK_REMOVED":
        return "Stok Dikurangi";
      case "PRICE_CHANGED":
        return "Harga Diubah";
      case "UPDATED":
        return "Diperbarui";
      case "ACTIVATED":
        return "Diaktifkan";
      case "DEACTIVATED":
        return "Dinonaktifkan";
      case "DELETED":
        return "Dihapus";
      default:
        return activityType;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Aktivitas Produk
          </DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Memuat riwayat...</div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-destructive">Gagal memuat riwayat</div>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Belum ada riwayat aktivitas</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex gap-3">
                      {/* Icon & Timeline */}
                      <div className="flex flex-col items-center">
                        <div className="p-2 rounded-full bg-muted">
                          {getActivityIcon(activity.activityType)}
                        </div>
                        {index < activities.length - 1 && (
                          <div className="w-0.5 h-full bg-border min-h-[60px] mt-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getActivityBadgeVariant(activity.activityType)}>
                                {getActivityLabel(activity.activityType)}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(activity.createdAt), "dd MMM yyyy, HH:mm", {
                                  locale: id,
                                })}
                              </span>
                            </div>
                            <p className="text-sm">{activity.description}</p>
                            {activity.userName && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Oleh: {activity.userName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Additional details for specific activity types */}
                        {activity.changes && (
                          <div className="mt-2 text-xs bg-muted rounded p-2">
                            {activity.changes.difference !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Perubahan:</span>
                                <span className={activity.changes.difference >= 0 ? "text-green-600" : "text-red-600"}>
                                  {activity.changes.difference >= 0 ? "+" : ""}
                                  {activity.changes.difference}
                                </span>
                              </div>
                            )}
                            {activity.changes.previousPrice !== undefined && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Harga Lama:</span>
                                  <span>{formatCurrency(activity.changes.previousPrice)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Harga Baru:</span>
                                  <span>{formatCurrency(activity.changes.newPrice)}</span>
                                </div>
                              </>
                            )}
                            {activity.changes.previousQuantity !== undefined && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Stok Lama:</span>
                                  <span>{activity.changes.previousQuantity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Stok Baru:</span>
                                  <span>{activity.changes.newQuantity}</span>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Halaman {pagination.page} dari {pagination.totalPages}
                    ({pagination.total} aktivitas)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
