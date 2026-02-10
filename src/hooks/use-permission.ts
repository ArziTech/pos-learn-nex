"use client"

import { useMemo } from "react"
import { usePermissionContext } from "@/providers/permission-provider"
import type { PermissionCheck } from "@/types/permissions"

export function usePermission(): PermissionCheck {
  const { permissions: userPermissions, isLoading } = usePermissionContext()

  const permissionCheck = useMemo((): PermissionCheck => {
    const permissions = userPermissions?.permissions ?? []
    const byPassAllFeatures = userPermissions?.byPassAllFeatures ?? false

    return {
      hasPermission: (code: string) => {
        if (byPassAllFeatures) return true
        return permissions.some((p) => p.code === code && p.isActive)
      },

      hasAnyPermission: (codes: string[]) => {
        if (byPassAllFeatures) return true
        if (codes.length === 0) return false
        return codes.some((code) =>
          permissions.some((p) => p.code === code && p.isActive)
        )
      },

      hasAllPermissions: (codes: string[]) => {
        if (byPassAllFeatures) return true
        if (codes.length === 0) return true
        return codes.every((code) =>
          permissions.some((p) => p.code === code && p.isActive)
        )
      },

      permissions,
      byPassAllFeatures,
      isLoading,
    }
  }, [userPermissions, isLoading])

  return permissionCheck
}
