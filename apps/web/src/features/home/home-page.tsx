import Link from 'next/link';

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full border border-slate-700 bg-slate-900/50 px-4 py-1 text-xs uppercase tracking-widest text-slate-400">
          Logistics Platform
        </span>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Delivery, orchestrated.</h1>
        <p className="max-w-xl text-lg text-slate-400">
          A real-time logistics platform with live tracking, driver assignment, admin ops, and
          AI-assisted dispatch.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
