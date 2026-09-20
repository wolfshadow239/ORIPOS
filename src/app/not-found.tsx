
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-accent flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-brand/30">
        O
      </div>
      <h1 className="text-2xl font-bold text-ink mt-6">Page not found</h1>
      <p className="text-slate-500 mt-2 text-sm max-w-sm">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
