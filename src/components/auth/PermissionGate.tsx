"use client"

import { ReactNode } from "react"
import { usePermission } from "@/hooks/use-permission"

interface PermissionGateProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: ReactNode
  showLoading?: boolean
  loadingFallback?: ReactNode
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showLoading = false,
  loadingFallback = null,
}: PermissionGateProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
  } = usePermission()

  // Show loading state if enabled
  if (isLoading && showLoading) {
    return <>{loadingFallback}</>
  }

  // Determine if user has required permissions
  let hasAccess = false

  if (permission) {
    // Single permission check
    hasAccess = hasPermission(permission)
  } else if (permissions && permissions.length > 0) {
    // Multiple permissions check
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  } else {
    // No permission specified, deny access
    hasAccess = false
  }

  return <>{hasAccess ? children : fallback}</>
}
