import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Layout wrapper for authenticated / in-app routes. Renders a collapsible
 * sidebar on desktop and an off-canvas sheet on mobile (handled by the
 * shadcn Sidebar primitive). The floating trigger stays visible so users
 * can always reopen the sidebar after collapsing it.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 flex h-10 items-center gap-2 border-b border-border/60 bg-background/80 px-2 backdrop-blur">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground">
              Toggle navigation
            </span>
          </div>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
