import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    label: 'Selling',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/pos', label: 'Point of Sale', icon: ShoppingCart, emphasis: true },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/products', label: 'Products', icon: Package },
      { to: '/categories', label: 'Categories', icon: Tags },
      { to: '/inventory', label: 'Inventory', icon: Boxes },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/sales', label: 'Sales history', icon: Receipt },
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/suppliers', label: 'Suppliers', icon: Truck },
      { to: '/expenses', label: 'Expenses', icon: Wallet },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

const FLAT = NAV_SECTIONS.flatMap((section) => section.items);

export function findNavItem(pathname) {
  return FLAT.find((item) => item.to === pathname) ?? null;
}

export function breadcrumbsFor(pathname) {
  if (pathname === '/') return [{ label: 'Dashboard', to: '/' }];
  const item = findNavItem(pathname);
  if (!item) return [{ label: 'Not found' }];
  return [{ label: 'Home', to: '/' }, { label: item.label }];
}