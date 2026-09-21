import Link from 'next/link';
import { Package } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-200 bg-neutral-100/95 px-6 py-6 backdrop-blur sm:px-10">
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

      <main className="flex flex-1 flex-col items-center px-6">{children}</main>
    </div>
  );
}
