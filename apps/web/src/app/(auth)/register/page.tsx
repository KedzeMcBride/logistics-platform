import Link from 'next/link';

import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md mt-6 sm:mt-10 pb-16">
      <h1 className="text-4xl font-bold text-neutral-900 mb-2">Create your account</h1>
      <p className="text-neutral-500 mb-8">
        Tell us how you&apos;ll use Portway this decides what your dashboard looks like.
      </p>

      <RegisterForm />

      <p className="text-center text-sm text-neutral-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[#488aec]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
