export interface Permission {
  id: number
  code: string
  label: string
  href: string | null
  description: string | null
  icon: string | null
  module: string | null
  isSection: boolean
  sequence: number
  parentId: number | null
  showOnSidebar: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserPermissions {
  permissions: Permission[]
  byPassAllFeatures: boolean
  roleName: string
}

export interface PermissionCheck {
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasAllPermissions: (codes: string[]) => boolean
  permissions: Permission[]
  byPassAllFeatures: boolean
  isLoading: boolean
}
