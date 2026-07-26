import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { sidebarItems } from "@/components/SidebarItems";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUser, logout } = useAuth();
  const user = getUser();

  return (
    <SidebarProvider defaultOpen={true} className="h-full">
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-16 border-b flex items-center gap-2 px-4">
          <img src="./logo_nome.png" alt="AuraSync" className="h-8 group-data-[collapsible=icon]:hidden" />
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.url || location.pathname.startsWith(item.url + "/")}
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sm">
                <User className="h-4 w-4 text-sidebar-foreground" />
                <span className="flex-1 text-left truncate">
                  {user ? `${user.first_name} ${user.last_name}` : "Admin"}
                </span>
                <ChevronDown className="h-3 w-3 text-sidebar-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex flex-col flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
