import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';

/**
 * Slim top bar used by standalone pages (e.g. AdminAuth) that live outside
 * the AppShell. In-app pages get their navigation from the collapsible
 * sidebar instead.
 */
export function Header() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-3 focus:outline-none"
        >
          <img
            src="/favicon.png"
            alt="AgroTensor Logo"
            className="w-10 h-10 rounded-xl object-contain"
          />
          <div className="text-left">
            <h1 className="font-serif text-xl font-semibold text-foreground">AgroTensor</h1>
            <p className="text-xs text-muted-foreground">Offline Farm Records</p>
          </div>
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
