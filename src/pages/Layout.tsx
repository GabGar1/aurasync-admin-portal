import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { sidebarSections, locateSidebarItem } from "@/components/SidebarItems";
import { can } from "@/lib/permissions";
import { roleLabel } from "@/lib/formatters";
import ChangeOwnPasswordDialog from "@/components/ChangeOwnPasswordDialog";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, KeyRound, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import type { User } from "@/types";

function initials(user: User | null): string {
  if (!user) return "?";
  return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      <img src="/brand/logo-mark.png" alt="" className="h-8 w-8 shrink-0" />
      <span className="truncate text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">AuraSync</span>
    </div>
  );
}

function UserMenu({ onChangePassword }: { onChangePassword: () => void }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent" tooltip="Conta">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initials(user)}
          </span>
          <span className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-medium">{user ? `${user.first_name} ${user.last_name}` : "Usuário"}</span>
            <span className="truncate text-xs text-muted-foreground">{user ? roleLabel(user.role) : ""}</span>
          </span>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm">{user?.email}</span>
          <span className="block text-xs text-muted-foreground">{user ? roleLabel(user.role) : ""}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4" />
            Tema
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme ?? "light"} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light"><Sun className="mr-2 h-4 w-4" />Claro</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark"><Moon className="mr-2 h-4 w-4" />Escuro</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system"><Monitor className="mr-2 h-4 w-4" />Do sistema</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={onChangePassword}>
          <KeyRound className="mr-2 h-4 w-4" />
          Alterar minha senha
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppSidebar({ onChangePassword }: { onChangePassword: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  function go(url: string) {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b px-3">
        <BrandMark />
      </SidebarHeader>
      <SidebarContent>
        {sidebarSections.map((section) => {
          const items = section.items.filter((item) => can(user?.role, item.permission));
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        isActive={locateSidebarItem(location.pathname)?.item.url === item.url}
                        onClick={() => go(item.url)}
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
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu onChangePassword={onChangePassword} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

/** Top bar: the only way to open the menu on phones, plus where you are. */
function AppHeader() {
  const location = useLocation();
  const current = locateSidebarItem(location.pathname);
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4">
      <SidebarTrigger aria-label="Abrir ou fechar o menu" />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <nav aria-label="Você está em" className="flex min-w-0 items-center gap-1.5 text-sm">
        {current ? (
          <>
            <span className="hidden text-muted-foreground sm:inline">{current.section}</span>
            <span className="hidden text-muted-foreground sm:inline">/</span>
            <span className="truncate font-medium">{current.item.title}</span>
          </>
        ) : (
          <span className="font-medium">AuraSync</span>
        )}
      </nav>
    </header>
  );
}

export default function Layout() {
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen={true} className="h-full">
      <AppSidebar onChangePassword={() => setPasswordOpen(true)} />
      <SidebarInset className="min-w-0">
        <main className="flex flex-1 flex-col overflow-y-auto">
          <AppHeader />
          <Outlet />
        </main>
        <Toaster />
      </SidebarInset>
      <ChangeOwnPasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </SidebarProvider>
  );
}
