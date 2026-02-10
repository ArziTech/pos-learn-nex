"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios from "@/lib/axios";
import type { UserPermissions } from "@/types/permissions";

interface PermissionContextValue {
  permissions: UserPermissions | null;
  isLoading: boolean;
  error: Error | null;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined
);

async function fetchPermissions(): Promise<UserPermissions> {
  const response = await axios.get<UserPermissions>("/api/permissions/me");
  return response.data;
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const {
    data: permissions,
    isLoading,
    error,
  } = useQuery<UserPermissions, Error>({
    queryKey: ["permissions", session?.user?.id],
    queryFn: fetchPermissions,
    enabled: status === "authenticated" && !!session?.user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });

  const value: PermissionContextValue = {
    permissions: permissions ?? null,
    isLoading: status === "loading" || isLoading,
    error: error ?? null,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error(
      "usePermissionContext must be used within a PermissionProvider"
    );
  }
  return context;
}
