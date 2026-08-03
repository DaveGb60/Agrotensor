import { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AppShell } from "@/components/AppShell";
import Index from "./pages/Index";

// Secondary routes are code-split so the first load (which must succeed for the
// service worker to install on a weak connection) stays as small as possible.
const Landing = lazy(() => import("./pages/Landing"));
const Trash = lazy(() => import("./pages/Trash"));
const CloudBackup = lazy(() => import("./pages/CloudBackup"));
const DataRecovery = lazy(() => import("./pages/DataRecovery"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const NotFound = lazy(() => import("./pages/NotFound"));
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
          <Suspense fallback={null}>
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
