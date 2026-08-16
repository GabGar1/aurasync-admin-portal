import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Wallet,
  BadgePercent,
  UserRound,
} from "lucide-react";

export interface SidebarItem {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, adminOnly: true },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Pedidos", url: "/orders", icon: ShoppingCart },
  { title: "Inventário", url: "/inventory", icon: BarChart3 },
  { title: "Custos", url: "/costs", icon: BadgePercent, adminOnly: true },
  { title: "Venda Externa", url: "/sales", icon: Wallet, adminOnly: true },
  { title: "Clientes", url: "/customers", icon: UserRound, adminOnly: true },
  { title: "Usuários", url: "/users", icon: Users },
];
