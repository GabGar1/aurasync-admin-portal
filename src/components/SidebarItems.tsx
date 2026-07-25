import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
} from "lucide-react";

export const sidebarItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Pedidos", url: "/orders", icon: ShoppingCart },
  { title: "Inventário", url: "/inventory", icon: BarChart3 },
  { title: "Usuários", url: "/users", icon: Users },
];
