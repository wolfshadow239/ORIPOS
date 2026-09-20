'use client';

import { useEffect, useState } from 'react';
import { useApp } from './Providers';
import { buildAll } from '@/lib/db';

export function useData() {
  const { tick } = useApp();
  // Lazy-initialise so the first render on the client already has data,
  // avoiding the null-flash that caused every page to briefly show <Loading>.
  const [data, setData] = useState<ReturnType<typeof buildAll> | null>(() => {
    if (typeof window === 'undefined') return null;
    return buildAll();
  });
  useEffect(() => {
    setData(buildAll());
  }, [tick]);
  return data;
}
