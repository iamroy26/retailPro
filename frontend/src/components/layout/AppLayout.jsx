import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import AppSidebar from './AppSidebar';
import TopBar from './TopBar';

const STORAGE_KEY = 'retailpro.sidebar.collapsed';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-border/80 bg-white/90 shadow-[8px_0_28px_rgba(23,23,23,0.035)] backdrop-blur-xl transition-[width] duration-300 ease-out lg:flex lg:flex-col ${
          collapsed ? 'w-[78px]' : 'w-[258px]'
        }`}
      >
        <AppSidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-out ${collapsed ? 'lg:pl-[78px]' : 'lg:pl-[258px]'}`}>
        <TopBar collapsed={collapsed} onToggleCollapse={toggleCollapsed} onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[272px] border-r border-border bg-white/95 p-0 text-foreground shadow-2xl backdrop-blur-xl lg:hidden">
          <SheetTitle className="sr-only">Main navigation</SheetTitle>
          <AppSidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}