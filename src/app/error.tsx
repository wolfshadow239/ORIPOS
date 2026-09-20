
'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Orison POS error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-6 text-center">
      <h1 className="text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="text-slate-500 mt-2 text-sm max-w-sm">
        An unexpected error occurred. Your data is safe — try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition"
      >
        Retry
      </button>
    </div>
  );
}
