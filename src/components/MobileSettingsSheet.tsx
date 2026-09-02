import { ReactNode } from "react";
import { Moon, Sun, LifeBuoy, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/useTheme";

interface MobileSettingsSheetProps {
  trigger: ReactNode;
}

/**
 * Mobile-only settings panel. Holds app-wide preferences (theme) plus quick
 * links; future settings should be added here as new sections.
 */
export function MobileSettingsSheet({ trigger }: MobileSettingsSheetProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <SheetHeader className="text-left">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>App preferences on this device</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Dark mode</p>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? "Currently dark" : "Currently light"}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
          </div>

          <Separator className="my-3" />

          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => navigate("/recover")}
          >
            <LifeBuoy className="h-4 w-4" />
            Data recovery
          </Button>

          <div className="flex items-center gap-3 px-3 pt-3 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            Made by Gfibion Genesis
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
