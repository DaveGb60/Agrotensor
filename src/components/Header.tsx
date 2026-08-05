import { Trash2, Sun, Moon, Home, Menu, Heart, ExternalLink, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { DonateDialog } from '@/components/DonateDialog';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: adminLoading, session: adminSession } = useAdminAuth();
  const showAdminLink = !adminLoading && !!adminSession && isAdmin;

  const navItems = [
    { label: 'Projects', path: '/', icon: Home },
    { label: 'Cloud Backup', path: '/cloud', icon: ExternalLink },
    { label: 'Trash', path: '/trash', icon: Trash2 },
    ...(showAdminLink ? [{ label: 'Admin', path: '/admin', icon: Shield }] : []),
  ];

  const DonateInfo = () => (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-foreground">Support AgroTensor</h4>
      <p className="text-sm text-muted-foreground">
        Send a tip or donation via card, M-Pesa, mobile money, bank transfer, or USSD. Secured by Paystack.
      </p>
      <DonateDialog
        trigger={
          <Button size="sm" className="w-full gap-2">
            <Heart className="h-4 w-4" />
            Donate with Paystack
          </Button>
        }
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/landing/logo.png" 
            alt="AgroTensor Logo" 
            className="w-10 h-10 rounded-xl object-contain cursor-pointer"
            onClick={() => navigate('/')}
          />
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <h1 className="font-serif text-xl font-semibold text-foreground">AgroTensor</h1>
            <p className="text-xs text-muted-foreground">Offline Farm Records</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={cn(
                "gap-2",
                location.pathname === item.path && "bg-muted text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
          <div className="w-px h-6 bg-border mx-2" />
          
          {/* Donate Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Heart className="h-4 w-4" />
                Support
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <DonateInfo />
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-border mx-2" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </nav>
        
        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <nav className="flex flex-col gap-2 mt-8">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className="justify-start gap-3"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              ))}
              
              <div className="h-px bg-border my-4" />
              
              {/* Donate Section */}
              <div className="px-3">
                <DonateInfo />
              </div>
              
              <div className="h-px bg-border my-4" />
              <div className="flex items-center justify-between px-3">
                <span className="text-sm text-muted-foreground">Theme</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="gap-2"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="h-4 w-4" />
                      Dark
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" />
                      Light
                    </>
                  )}
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
