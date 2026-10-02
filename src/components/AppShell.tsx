import { ReactNode, useState } from "react";
import { Settings, BarChart3 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { FarmInsightsDialog } from "@/components/insights/FarmInsightsDialog";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNavBar } from "@/components/MobileNavBar";
import { MobileSettingsSheet } from "@/components/MobileSettingsSheet";
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
  const [insightsOpen, setInsightsOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 flex h-10 items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-2 backdrop-blur">
            <div className="flex items-center gap-2">
              <MobileSettingsSheet
                trigger={
                  <button
                    type="button"
                    aria-label="Settings"
                    className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                }
              />
              <div className="hidden md:flex items-center gap-2">
                <SidebarTrigger />
                <span className="text-xs text-muted-foreground">
                  Toggle navigation
                </span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {!pathname.startsWith("/ai") && (
                <button
                  type="button"
                  onClick={() => setInsightsOpen(true)}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                  Farm Insights
                </button>
              )}
              <NetworkStatusIndicator />
            </div>
          </div>
          <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
        </div>
        <MobileNavBar />
        <FarmInsightsDialog open={insightsOpen} onOpenChange={setInsightsOpen} />
      </div>
    </SidebarProvider>
  );
}

