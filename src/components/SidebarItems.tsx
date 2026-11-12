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

import type { Permission } from "@/lib/permissions";

export interface SidebarItem {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  /** Same permission the route requires (see App.tsx), so the menu never links to a forbidden page. */
  permission: Permission;
}

export const sidebarItems: SidebarItem[] = [
  { title: "Painel", url: "/", icon: LayoutDashboard, permission: "dashboard.view" },
  { title: "Produtos", url: "/products", icon: Package, permission: "products.view" },
  { title: "Pedidos", url: "/orders", icon: ShoppingCart, permission: "orders.view" },
  { title: "Inventário", url: "/inventory", icon: BarChart3, permission: "inventory.view" },
  { title: "Custos", url: "/costs", icon: BadgePercent, permission: "costs.manage" },
  { title: "Venda externa", url: "/sales", icon: Wallet, permission: "sales.create" },
  { title: "Clientes", url: "/customers", icon: UserRound, permission: "customers.view" },
  { title: "Usuários", url: "/users", icon: Users, permission: "users.manage" },
];
