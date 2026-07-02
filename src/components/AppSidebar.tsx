import { Home, Trash2, Cloud, Shield, Heart, Sun, Moon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { DonateDialog } from "@/components/DonateDialog";
import { cn } from "@/lib/utils";

const primaryItems = [
  { label: "Projects", path: "/app", icon: Home },
  { label: "Cloud Backup", path: "/cloud", icon: Cloud },
  { label: "Trash", path: "/trash", icon: Trash2 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, loading: adminLoading, session: adminSession } = useAdminAuth();
  const showAdminLink = !adminLoading && !!adminSession && isAdmin;

  const items = [
    ...primaryItems,
    ...(showAdminLink ? [{ label: "Admin", path: "/admin", icon: Shield }] : []),
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <NavLink to="/app" className="flex items-center gap-3 px-2 py-2">
          <img
            src="/favicon.png"
            alt="AgroTensor"
            className="h-8 w-8 rounded-lg object-contain shrink-0"
          />
          {!collapsed && (
            <div className="leading-tight overflow-hidden">
              <p className="font-serif text-sm font-semibold truncate">
                AgroTensor
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                Offline Farm Records
              </p>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)} tooltip={item.label}>
                    <NavLink to={item.path} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className={cn(collapsed && "sr-only")}>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border gap-2">
        <DonateDialog
          trigger={
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <Heart className="h-4 w-4 shrink-0" />
              <span className={cn(collapsed && "sr-only")}>Support</span>
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-2"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4 shrink-0" />
          ) : (
            <Sun className="h-4 w-4 shrink-0" />
          )}
          <span className={cn(collapsed && "sr-only")}>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
