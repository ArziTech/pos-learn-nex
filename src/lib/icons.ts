import {
  Home,
  Users,
  Settings,
  FileText,
  Calendar,
  LayoutDashboard,
  User,
  Shield,
  Key,
  Clock,
  CheckSquare,
  Banknote,
  BarChart3,
  Package,
  Receipt,
  TrendingUp,
  UserCircle,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  Home,
  Users,
  Settings,
  FileText,
  Calendar,
  LayoutDashboard,
  User,
  Shield,
  Key,
  Clock,
  CheckSquare,
  Banknote,
  BarChart3,
  Package,
  Receipt,
  TrendingUp,
  UserCircle,
  // Aliases for icons that don't exist in lucide-react
  CashRegister: Banknote,
  UsersCircle: Users,
}

export function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Home
  return iconMap[name] || Home
}
