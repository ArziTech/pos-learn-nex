"use client";

import { useState, useRef } from "react";
import { Pencil, Trash2, Plus, Package, History } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import {
  DataTable,
  DataTableRef,
} from "@/components/scm-ui/Datatable/Datatable";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FetchResult } from "@/types/pagination";
import axiosInstance from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { CreateProductDialog } from "./_components/CreateProductDialog";
import { EditProductDialog } from "./_components/EditProductDialog";
import { DeleteProductDialog } from "./_components/DeleteProductDialog";
import { ProductActivityDialog } from "./_components/ProductActivityDialog";

interface Product {
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
}

export default function ProductsPage() {
  const { hasPermission, isLoading } = usePermission();
  const tableRef = useRef<DataTableRef>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch products action for DataTable
  const fetchProducts = async (params: {
    page: number;
    pageSize: number;
    search: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
  }): Promise<FetchResult<Product>> => {
    try {
      const response = await axiosInstance.get<FetchResult<Product>>("/api/products", {
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
      console.error("Error fetching products:", error);
      throw error;
    }
  };

  // Handlers
  const invalidateTable = () => {
    tableRef.current?.invalidate();
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const openActivityDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsActivityDialogOpen(true);
  };

  // Permission check
  if (!hasPermission("product") && !isLoading) {
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
          <h1 className="text-3xl font-bold">Manajemen Produk</h1>
          <p className="text-muted-foreground">
            Kelola produk dan stok barang
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* DataTable */}
      <Card>
        <CardContent className="pt-6">
          <DataTable<Product>
            ref={tableRef}
            fetchAction={fetchProducts}
            queryKey="products"
            searchPlaceholder="Cari produk..."
            columns={[
              { key: "name", label: "Nama Produk", sortable: true },
              { key: "sku", label: "SKU", sortable: true },
              { key: "category", label: "Kategori", sortable: false },
              { key: "price", label: "Harga", sortable: true },
              { key: "stock", label: "Stok", sortable: false },
              { key: "status", label: "Status", sortable: false },
              { key: "actions", label: "Aksi", sortable: false },
              { key: "history", label: "", sortable: false },
            ]}
            rows={(products) =>
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.sku}
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="outline">{product.category.title}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        (product.stock?.quantity || 0) <= 10
                          ? "text-red-600 font-medium"
                          : ""
                      }
                    >
                      {product.stock?.quantity ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.isActive ? "default" : "secondary"}
                      className={
                        product.isActive ? "bg-green-500 hover:bg-green-600" : ""
                      }
                    >
                      {product.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openActivityDialog(product)}
                        title="Lihat Riwayat"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(product)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            }
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateProductDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={invalidateTable}
      />

      <EditProductDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        product={selectedProduct}
        onSuccess={invalidateTable}
      />

      <DeleteProductDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        product={selectedProduct}
        onSuccess={invalidateTable}
      />

      <ProductActivityDialog
        open={isActivityDialogOpen}
        onOpenChange={setIsActivityDialogOpen}
        productId={selectedProduct?.id || 0}
        productName={selectedProduct?.name || ""}
      />
    </div>
  );
}
