import Link from 'next/link';

import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mt-10 sm:mt-16">
      <h1 className="text-4xl font-bold text-neutral-900 mb-2">Sign in</h1>
      <p className="text-neutral-500 mb-8">One account for sending and tracking deliveries.</p>

      <LoginForm />

      <p className="text-center text-sm text-neutral-500 mt-6">
        No account?{' '}
        <Link href="/register" className="font-semibold text-emerald-800">
          Create one
        </Link>
      </p>
    </div>
  );
}
