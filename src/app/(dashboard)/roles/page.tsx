"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Shield, KeySquare } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axiosInstance from "@/lib/axios";
import { Role, Permission } from "@prisma/client";
import { CreateRoleDialog } from "./_components/CreateRoleDialog";
import { EditRoleDialog } from "./_components/EditRoleDialog";
import { DeleteRoleDialog } from "./_components/DeleteRoleDialog";
import { CreatePermissionDialog } from "./_components/CreatePermissionDialog";
import { EditPermissionDialog } from "./_components/EditPermissionDialog";
import { DeletePermissionDialog } from "./_components/DeletePermissionDialog";
import { useQuery } from "@tanstack/react-query";

interface RoleWithPermissions {
  id: number;
  name: string;
  description: string | null;
  byPassAllFeatures: boolean;
  isActive: boolean;
  permissions: Permission[];
  permissionIds: number[];
}

export default function RolesPage() {
  const { hasPermission, isLoading } = usePermission();

  // Modal states
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false);
  const [isCreatePermissionModalOpen, setIsCreatePermissionModalOpen] = useState(false);
  const [isEditPermissionModalOpen, setIsEditPermissionModalOpen] = useState(false);
  const [isDeletePermissionDialogOpen, setIsDeletePermissionDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  // Fetch roles
  const { data: rolesData, isLoading: isRolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ["roles-full"],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: RoleWithPermissions[] }>("/api/roles");
      return response.data;
    },
  });

  // Fetch permissions
  const { data: permissionsData, isLoading: isPermissionsLoading, refetch: refetchPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: Permission[] }>("/api/permissions");
      return response.data;
    },
  });

  const roles = rolesData?.data || [];
  const permissions = permissionsData?.data || [];

  // Handlers
  const openEditRoleModal = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setIsEditRoleModalOpen(true);
  };

  const openDeleteRoleDialog = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setIsDeleteRoleDialogOpen(true);
  };

  const openEditPermissionModal = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsEditPermissionModalOpen(true);
  };

  const openDeletePermissionDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsDeletePermissionDialogOpen(true);
  };

  const invalidateRoles = () => {
    refetchRoles();
  };

  const invalidatePermissions = () => {
    refetchPermissions();
  };

  const invalidateAll = () => {
    refetchRoles();
    refetchPermissions();
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
          <h1 className="text-3xl font-bold">Manajemen Role & Permission</h1>
          <p className="text-muted-foreground">
            Kelola role dan hak akses pengguna
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreatePermissionModalOpen(true)} variant="outline">
            <KeySquare className="mr-2 h-4 w-4" />
            Tambah Permission
          </Button>
          <Button onClick={() => setIsCreateRoleModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Role
          </Button>
        </div>
      </div>

      {/* Tabs for Roles and Permissions */}
      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          {isRolesLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : roles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Belum ada role</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEdit={openEditRoleModal}
                  onDelete={openDeleteRoleDialog}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <PermissionTable
            permissions={permissions}
            isLoading={isPermissionsLoading}
            onEdit={openEditPermissionModal}
            onDelete={openDeletePermissionDialog}
          />
        </TabsContent>
      </Tabs>

      {/* Role Dialogs */}
      <CreateRoleDialog
        open={isCreateRoleModalOpen}
        onOpenChange={setIsCreateRoleModalOpen}
        onSuccess={invalidateAll}
      />

      <EditRoleDialog
        open={isEditRoleModalOpen}
        onOpenChange={setIsEditRoleModalOpen}
        role={selectedRole}
        onSuccess={invalidateRoles}
      />

      <DeleteRoleDialog
        open={isDeleteRoleDialogOpen}
        onOpenChange={setIsDeleteRoleDialogOpen}
        role={selectedRole}
        onSuccess={invalidateRoles}
      />

      {/* Permission Dialogs */}
      <CreatePermissionDialog
        open={isCreatePermissionModalOpen}
        onOpenChange={setIsCreatePermissionModalOpen}
        onSuccess={invalidatePermissions}
      />

      <EditPermissionDialog
        open={isEditPermissionModalOpen}
        onOpenChange={setIsEditPermissionModalOpen}
        permission={selectedPermission}
        onSuccess={invalidatePermissions}
      />

      <DeletePermissionDialog
        open={isDeletePermissionDialogOpen}
        onOpenChange={setIsDeletePermissionDialogOpen}
        permission={selectedPermission}
        onSuccess={invalidatePermissions}
      />
    </div>
  );
}

interface RoleCardProps {
  role: RoleWithPermissions;
  onEdit: (role: RoleWithPermissions) => void;
  onDelete: (role: RoleWithPermissions) => void;
}

function RoleCard({ role, onEdit, onDelete }: RoleCardProps) {
  const permissionsByModule = role.permissions.reduce((acc, perm) => {
    if (!acc[perm.module || "other"]) {
      acc[perm.module || "other"] = [];
    }
    acc[perm.module || "other"].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{role.name}</h3>
              {role.byPassAllFeatures && (
                <Badge variant="secondary" className="text-xs">
                  Super Admin
                </Badge>
              )}
            </div>
            {role.description && (
              <p className="text-sm text-muted-foreground">{role.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(role)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(role)}
              disabled={role.name === "SUPERADMIN"}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {role.byPassAllFeatures ? (
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-sm font-medium text-primary">
              Role ini memiliki akses penuh ke semua fitur
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {role.permissions.length} Permission
              </span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
              {role.permissions.map((permission) => (
                <Badge
                  key={permission.id}
                  variant="outline"
                  className="text-xs"
                >
                  {permission.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PermissionTableProps {
  permissions: Permission[];
  isLoading: boolean;
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
}

function PermissionTable({ permissions, isLoading, onEdit, onDelete }: PermissionTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (permissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <KeySquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Belum ada permission</p>
        </CardContent>
      </Card>
    );
  }

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, perm) => {
    const module = perm.module || "other";
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {(Object.entries(permissionsByModule) as [string, Permission[]][]).map(([module, modulePermissions]) => (
            <div key={module} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                  {module}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {modulePermissions.length}
                </Badge>
              </div>
              <div className="grid gap-2">
                {modulePermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{permission.label}</span>
                        {permission.isSection && (
                          <Badge variant="secondary" className="text-xs">
                            Section
                          </Badge>
                        )}
                        {permission.showOnSidebar && (
                          <Badge variant="outline" className="text-xs">
                            Sidebar
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground font-mono">
                          {permission.code}
                        </span>
                        {permission.href && (
                          <span className="text-xs text-muted-foreground">
                            → {permission.href}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(permission)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(permission)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
