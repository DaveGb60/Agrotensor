import { Home, Trash2, Cloud, Shield, Coffee } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { DonateDialog } from "@/components/DonateDialog";
import { cn } from "@/lib/utils";

const leadingItems = [
  { label: "Projects", path: "/app", icon: Home },
  { label: "Cloud", path: "/cloud", icon: Cloud },
];

const trailingItems = [{ label: "Trash", path: "/trash", icon: Trash2 }];

/**
 * Fixed bottom navigation bar for mobile screens. Hidden on md+ where the
 * collapsible sidebar takes over. Support sits in the centre slot.
 */
export function MobileNavBar() {
  const { pathname } = useLocation();
  const { isAdmin, loading: adminLoading, session: adminSession } = useAdminAuth();
  const showAdminLink = !adminLoading && !!adminSession && isAdmin;

  const after = [
    ...trailingItems,
    ...(showAdminLink ? [{ label: "Admin", path: "/admin", icon: Shield }] : []),
  ];

  const isActive = (path: string) => pathname === path;

  const renderItem = (item: { label: string; path: string; icon: typeof Home }) => {
    const active = isActive(item.path);
    return (
      <li key={item.path} className="flex-1">
        <NavLink
          to={item.path}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
            active ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
          <span>{item.label}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around">
        {leadingItems.map(renderItem)}

        <li className="flex-1">
          <DonateDialog
            trigger={
              <button
                type="button"
                aria-label="Support AgroTensor"
                className="w-full h-full flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Coffee className="h-7 w-7 text-primary" strokeWidth={2} />
                <span>Support</span>
              </button>
            }
          />
        </li>

        {after.map(renderItem)}
      </ul>
    </nav>
  );
}
