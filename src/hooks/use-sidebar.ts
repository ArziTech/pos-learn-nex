"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggleCollapse: () => void
  toggleMobile: () => void
  setMobileOpen: (open: boolean) => void
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggleCollapse: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),
      toggleMobile: () =>
        set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      setMobileOpen: (open) => set({ isMobileOpen: open }),
    }),
    {
      name: "sidebar-storage",
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
)
