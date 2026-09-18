import Link from 'next/link';
import { Package } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-6">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
          <Package className="h-6 w-6 text-emerald-800" strokeWidth={2.5} />
          <span>Portway</span>
        </Link>
        <nav className="flex items-center gap-6 text-[15px]">
          <Link href="/login" className="font-semibold text-neutral-900">
            Sign in
          </Link>
          <Link href="/register" className="text-neutral-500 hover:text-neutral-700">
            Create account
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center px-6">{children}</main>
    </div>
  );
}
