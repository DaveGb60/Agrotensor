import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

/**
 * Shared layout for legal documents (Privacy Policy, Terms of Service).
 * Works both standalone (from the landing page) and inside the app shell.
 */
export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  useEffect(() => {
    document.title = `${title} — AgroTensor`;
    return () => {
      document.title = "AgroTensor — Smart Farm Intelligence";
    };
  }, [title]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back">
            <Link to="/app">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-24">
        <p className="mb-6 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
        <div className="space-y-6 text-sm leading-relaxed text-foreground/90 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>

        <div className="mt-10 flex gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
          <span className="ml-auto">Made by Gfibion Genesis</span>
        </div>
      </main>
    </div>
  );
}
