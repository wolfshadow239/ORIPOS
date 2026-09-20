
'use client';

import { useEffect, useState } from 'react';
import { useApp } from './Providers';
import { buildAll } from '@/lib/db';

export function useData() {
  const { tick } = useApp();
  const [data, setData] = useState<ReturnType<typeof buildAll> | null>(null);
  useEffect(() => {
    setData(buildAll());
  }, [tick]);
  return data;
}
