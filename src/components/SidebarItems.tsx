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

export interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

export const sidebarSections: SidebarSection[] = [
  {
    label: "Visão geral",
    items: [{ title: "Painel", url: "/", icon: LayoutDashboard, permission: "dashboard.view" }],
  },
  {
    label: "Operação",
    items: [
      { title: "Pedidos", url: "/orders", icon: ShoppingCart, permission: "orders.view" },
      { title: "Venda externa", url: "/sales", icon: Wallet, permission: "sales.create" },
      { title: "Produtos", url: "/products", icon: Package, permission: "products.view" },
      { title: "Inventário", url: "/inventory", icon: BarChart3, permission: "inventory.view" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Clientes", url: "/customers", icon: UserRound, permission: "customers.view" },
      { title: "Custos", url: "/costs", icon: BadgePercent, permission: "costs.manage" },
      { title: "Usuários", url: "/users", icon: Users, permission: "users.manage" },
    ],
  },
];

export const sidebarItems: SidebarItem[] = sidebarSections.flatMap((section) => section.items);

/** Section and page of a path, for the header breadcrumb. */
export function locateSidebarItem(pathname: string): { section: string; item: SidebarItem } | null {
  for (const section of sidebarSections) {
    const item = section.items.find((i) => (i.url === "/" ? pathname === "/" : pathname === i.url || pathname.startsWith(`${i.url}/`)));
    if (item) return { section: section.label, item };
  }
  return null;
}
