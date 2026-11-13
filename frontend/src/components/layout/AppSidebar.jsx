import { NavLink } from 'react-router-dom';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS } from './navConfig';

function SidebarLink({ item, collapsed, onNavigate }) {
  const Icon = item.icon;
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
            'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground',
            isActive && 'bg-sidebar-accent text-primary',
            collapsed && 'justify-center px-0',
          )
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={cn(
                'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary opacity-0 transition-opacity',
                isActive && 'opacity-100',
              )}
            />
            <Icon className={cn('h-[18px] w-[18px] shrink-0', item.emphasis && !isActive && 'text-primary')} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </>
        )}
      </NavLink>
    </li>
  );
}

export default function AppSidebar({ collapsed = false, onToggleCollapse, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center gap-3 border-b border-border px-4', collapsed && 'justify-center px-0')}>
        <img src="/retailpro-icon.svg" alt="" className="h-9 w-9 shrink-0 rounded-xl shadow-lifted" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-heading text-[15px] font-semibold leading-tight text-foreground">RetailPro</p>
            <p className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Point of Sale</p>
          </div>
        )}
      </div>

      <nav className="thin-scroll flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            {!collapsed && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{section.label}</p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to="/pos"
          onClick={onNavigate}
          className={cn(
            'mb-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90',
          )}
        >
          <span className="truncate">{collapsed ? 'POS' : 'New sale'}</span>
        </NavLink>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'hidden w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex',
              collapsed && 'justify-center px-0',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft className="h-4 w-4" />
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </div>
  );
}