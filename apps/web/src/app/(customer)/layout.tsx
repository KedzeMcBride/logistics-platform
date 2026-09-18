import { SiteHeader } from '@/components/layout/site-header';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
