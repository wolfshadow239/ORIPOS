
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/types';
import { STORES } from '@/lib/stores';
import { loadDB } from '@/lib/db';
import { registerRefresh } from '@/lib/actions';
import { getSessionUser, setSessionUser } from '@/lib/auth';

interface Ctx {
  user: User | null;
  store: (typeof STORES)[number];
  storeId: string;
  setStoreId: (id: string) => void;
  tick: number;
  refresh: () => void;
  login: (u: User) => void;
  logout: () => void;
}

const C = createContext<Ctx | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState<string>('amanora');
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadDB();
    registerRefresh(() => setTick(t => t + 1));
    const u = getSessionUser();
    setUser(u);
    if (u) setStoreId(u.storeId || 'amanora');
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user && pathname !== '/login') router.replace('/login');
    if (user && pathname === '/login') router.replace('/dashboard');
  }, [ready, user, pathname, router]);

  const store = STORES.find(s => s.id === storeId) || STORES[0];
  const login = useCallback((u: User) => {
    setSessionUser(u.id);
    setUser(u);
    setStoreId(u.storeId || 'amanora');
  }, []);
  const logout = useCallback(() => {
    setSessionUser(null);
    setUser(null);
    router.replace('/login');
  }, [router]);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  return (
    <C.Provider value={{ user, store, storeId, setStoreId, tick, refresh, login, logout }}>
      {children}
    </C.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(C);
  if (!ctx) throw new Error('useApp must be used inside Providers');
  return ctx;
}
