"use client";

import { useState, useRef } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
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
import { Role, User } from "@prisma/client";
import { CreateUserDialog } from "./_components/CreateUserDialog";
import { EditUserDialog } from "./_components/EditUserDialog";
import { DeleteUserDialog } from "./_components/DeleteUserDialog";

export default function UsersPage() {
  const { hasPermission, isLoading } = usePermission();
  const tableRef = useRef<DataTableRef>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users action for DataTable
  const fetchUsers = async (params: {
    page: number;
    pageSize: number;
    search: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
  }): Promise<FetchResult<User & { role: Role }>> => {
    try {
      const response = await axiosInstance.get<
        FetchResult<User & { role: Role }>
      >("/api/users", {
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
      console.error("Error fetching users:", error);
      throw error;
    }
  };

  // Handlers
  const invalidateTable = () => {
    tableRef.current?.invalidate();
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Permission check
  if (!hasPermission("user") && !isLoading) {
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
          <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
          <p className="text-muted-foreground">
            Kelola pengguna dan hak akses mereka
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      {/* DataTable */}
      <Card>
        <CardContent className="pt-6">
          <DataTable<User & { role: Role }>
            ref={tableRef}
            fetchAction={fetchUsers}
            queryKey="users"
            searchPlaceholder="Cari user..."
            columns={[
              { key: "username", label: "Username", sortable: true },
              { key: "name", label: "Nama", sortable: true },
              { key: "email", label: "Email", sortable: true },
              { key: "role", label: "Role", sortable: false },
              { key: "status", label: "Status", sortable: false },
              { key: "actions", label: "Aksi", sortable: false },
            ]}
            rows={(users) =>
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status ? "default" : "destructive"}
                      className={
                        user.status ? "bg-green-500 hover:bg-green-600" : ""
                      }
                    >
                      {user.status ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(user)}
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
      <CreateUserDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={invalidateTable}
      />

      <EditUserDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        user={selectedUser}
        onSuccess={invalidateTable}
      />

      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={selectedUser}
        onSuccess={invalidateTable}
      />
    </div>
  );
}
