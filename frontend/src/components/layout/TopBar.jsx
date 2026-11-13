import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Menu, PanelLeft, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConnectionBadge from '@/components/common/ConnectionBadge';
import { breadcrumbsFor } from './navConfig';

export default function TopBar({ collapsed, onToggleCollapse, onOpenMobileNav }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const crumbs = breadcrumbsFor(location.pathname);

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </Button>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
          {crumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />}
              {crumb.to && index < crumbs.length - 1 ? (
                <Link to={crumb.to} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ConnectionBadge className="hidden sm:flex" compact />
          <Button
            variant="outline"
            size="sm"
            className={cn('hidden gap-2 rounded-lg sm:inline-flex')}
            onClick={() => navigate('/pos')}
          >
            <ShoppingCart className="h-4 w-4" />
            Open POS
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-left transition-colors hover:bg-muted/70"
              >
                <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </span>
                <span className="hidden max-w-[140px] leading-tight sm:block">
                  <span className="block truncate text-xs font-semibold">{user?.full_name || 'Signed in'}</span>
                  <span className="block truncate text-[11px] capitalize text-muted-foreground">{user?.role || 'user'}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate text-sm font-medium">{user?.full_name || 'Signed in'}</span>
                <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>Store settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
