import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNavBar } from "@/components/MobileNavBar";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Layout wrapper for authenticated / in-app routes. On md+ screens renders
 * the collapsible sidebar. On mobile the sidebar is hidden and replaced by a
 * fixed bottom navigation bar.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 flex h-10 items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-2 backdrop-blur">
            <div className="hidden md:flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-xs text-muted-foreground">
                Toggle navigation
              </span>
            </div>
            <div className="ml-auto">
              <NetworkStatusIndicator />
            </div>
          </div>
          <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
        </div>
        <MobileNavBar />
      </div>
    </SidebarProvider>
  );
}

