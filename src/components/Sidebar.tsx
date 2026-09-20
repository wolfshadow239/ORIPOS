
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, ReceiptText, Package, BarChart3, Users, Settings, LogOut,
} from 'lucide-react';
import { useApp } from './Providers';
import { useData } from './hooks';
import { lowStockList } from '@/lib/ai';
import { cn } from './ui';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
  { href: '/pos', label: 'POS Terminal', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
  { href: '/orders', label: 'Orders', icon: ReceiptText, roles: ['admin', 'manager', 'cashier'] },
  { href: '/inventory', label: 'Inventory', icon: Package, roles: ['admin', 'manager'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'manager'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'manager'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

const ROLE_LABEL: Record<string, string> = { admin: 'Administrator', manager: 'Store Manager', cashier: 'Cashier' };

export default function Sidebar() {
  const { user, store, storeId, logout } = useApp();
  const data = useData();
  const pathname = usePathname();

  if (!user || !data) return null;

  const low = lowStockList(data.products, data.stock, storeId, data.orders, data.settings);
  const items = NAV.filter(n => n.roles.includes(user.role));

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-brand-deep text-slate-300 z-40">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-accent flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-brand/40">
            O
          </div>
          <div>
            <div className="text-white font-bold tracking-tight leading-tight">Orison POS</div>
            <div className="text-[11px] text-slate-400">Samsung Experience Stores</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map(n => {
          const active = pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                active ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'hover:bg-white/5 hover:text-white',
              )}
            >
              <n.icon size={17} />
              {n.label}
              {n.href === '/inventory' && low.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white rounded-full px-1.5 py-0.5">{low.length}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-accent to-brand flex items-center justify-center text-white text-sm font-bold">
            {user.name.split(' ').map(x => x[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate">{user.name}</div>
            <div className="text-[11px] text-slate-400 truncate">
              {ROLE_LABEL[user.role]} · {store.short}
            </div>
          </div>
          <button onClick={logout} title="Sign out" className="text-slate-400 hover:text-white transition">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
