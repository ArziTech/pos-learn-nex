"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { useSidebar } from "@/hooks/use-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Permission } from "@/types/permissions";

interface MenuItemProps {
  permission: Permission;
  isCollapsed: boolean;
  children?: Permission[];
}

function MenuItem({ permission, isCollapsed, children }: MenuItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = children && children.length > 0;
  const isActive = pathname === permission.href;

  // Determine icon component - memoized to prevent recreation on re-renders
  /* eslint-disable react-hooks/static-components */
  const Icon = useMemo(() => getIcon(permission.icon), [permission.icon]);
  /* eslint-enable react-hooks/static-components */

  if (permission.isSection) {
    return (
      <div className="px-3 py-2">
        {!isCollapsed && (
          <h2 className="mt-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
            {permission.label}
          </h2>
        )}
        {isCollapsed && <div className="h-px bg-border my-2" />}
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
            isActive
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "hover:bg-accent"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{permission.label}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </button>
        {isOpen && !isCollapsed && (
          <div className="ml-6 mt-1 space-y-1">
            {children.map((child) => (
              <Link
                key={child.id}
                href={child.href || "#"}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  pathname === child.href
                    ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90"
                    : "hover:bg-accent"
                )}
              >
                <span>{child.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={permission.href || "#"}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        isActive
          ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          : "hover:bg-accent"
      )}
      title={isCollapsed ? permission.label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span>{permission.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const { permissions, isLoading } = usePermission();
  const { isCollapsed, toggleCollapse } = useSidebar();

  // Build hierarchical menu structure
  const menuItems = useMemo(() => {
    const sidebarPermissions = permissions
      .filter((p) => p.showOnSidebar)
      .sort((a, b) => a.sequence - b.sequence);

    // Separate parent and child items
    const parentItems = sidebarPermissions.filter((p) => !p.parentId);
    const childrenMap = new Map<number, Permission[]>();

    sidebarPermissions.forEach((p) => {
      if (p.parentId) {
        const children = childrenMap.get(p.parentId) || [];
        children.push(p);
        childrenMap.set(p.parentId, children);
      }
    });

    return parentItems.map((parent) => ({
      parent,
      children: childrenMap.get(parent.id) || [],
    }));
  }, [permissions]);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-background transition-all duration-300 h-screen",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!isCollapsed && <h2 className="text-lg font-semibold">App Name</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="shrink-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 px-2 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <nav className="space-y-1 h-full">
            {menuItems.map(({ parent, children }) => (
              <MenuItem
                key={parent.id}
                permission={parent}
                isCollapsed={isCollapsed}
              >
                {children}
              </MenuItem>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}
