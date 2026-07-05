import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AppShell } from "@/components/AppShell";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Trash from "./pages/Trash";
import CloudBackup from "./pages/CloudBackup";
import DataRecovery from "./pages/DataRecovery";
import Admin from "./pages/Admin";
import AdminAuth from "./pages/AdminAuth";
import NotFound from "./pages/NotFound";
import { getAllProjects } from "@/lib/db";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("agrotensor_skip_landing", "true");
      localStorage.setItem("agrotensor_seen_app", "true");
    }
  }, []);

  return <AppShell>{children}</AppShell>;
};

const AppEntryGate = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const determineEntry = async () => {
      if (typeof window === "undefined") {
        setShowLanding(true);
        setIsChecking(false);
        return;
      }

      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      const hasSkippedLanding = localStorage.getItem("agrotensor_skip_landing") === "true";
      const hasSeenApp = localStorage.getItem("agrotensor_seen_app") === "true";

      if (isStandalone || hasSkippedLanding || hasSeenApp) {
        setShowLanding(false);
        setIsChecking(false);
        return;
      }

      try {
        const projects = await getAllProjects();
        const hasExistingData = projects.length > 0;
        setShowLanding(!hasExistingData);
      } catch {
        setShowLanding(true);
      } finally {
        setIsChecking(false);
      }
    };

    determineEntry();
  }, []);

  if (isChecking) return null;

  if (showLanding) {
    return <Landing />;
  }

  return <Navigate to="/app" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppEntryGate />} />
            <Route path="/app" element={<AppLayout><Index /></AppLayout>} />
            <Route path="/trash" element={<AppLayout><Trash /></AppLayout>} />
            <Route path="/cloud" element={<AppLayout><CloudBackup /></AppLayout>} />
            <Route path="/recover" element={<AppLayout><DataRecovery /></AppLayout>} />
            <Route path="/admin" element={<AppLayout><Admin /></AppLayout>} />
            <Route path="/admin-auth" element={<AdminAuth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
