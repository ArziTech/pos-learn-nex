"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { useSidebar } from "@/hooks/use-sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { Permission } from "@/types/permissions";

interface MobileMenuItemProps {
  permission: Permission;
  onClick: () => void;
}

function MobileMenuItem({ permission, onClick }: MobileMenuItemProps) {
  const pathname = usePathname();
  const isActive = pathname === permission.href;

  const Icon = permission.icon
    ? require(`lucide-react`)[permission.icon] || Home
    : Home;

  if (permission.isSection) {
    return (
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
          {permission.label}
        </h2>
      </div>
    );
  }

  return (
    <Link
      href={permission.href || "#"}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
        isActive && "bg-accent font-medium"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{permission.label}</span>
    </Link>
  );
}

export function MobileNav() {
  const { permissions, isLoading } = usePermission();
  const { isMobileOpen, setMobileOpen } = useSidebar();

  // Build menu items
  const menuItems = useMemo(() => {
    return permissions
      .filter((p) => p.showOnSidebar)
      .sort((a, b) => a.sequence - b.sequence);
  }, [permissions]);

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-14 items-center border-b px-4">
          <SheetTitle className="text-lg">App Name</SheetTitle>
        </div>

        <div className="flex-1 px-2 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <nav className="space-y-1">
              {menuItems.map((permission) => (
                <MobileMenuItem
                  key={permission.id}
                  permission={permission}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
