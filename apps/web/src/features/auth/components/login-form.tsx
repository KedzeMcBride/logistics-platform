'use client';

import { FormEvent, useState } from 'react';

import { useAuth } from '../use-auth';

interface SignInFormValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const { login } = useAuth();
  const [values, setValues] = useState<SignInFormValues>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof SignInFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(values.email, values.password);

      if (user.role === 'DRIVER') {
        window.location.href = '/driver/dashboard';
      } else if (user.role === 'CUSTOMER') {
        window.location.href = '/customer/dashboard';
      } else {
        setError('Your account does not have a supported dashboard.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-neutral-900">
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder="name@email.com"
            value={values.email}
            onChange={handleChange('email')}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
            required
            autoComplete="email"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-900">
              Password
            </label>

            <a href="#" className="text-sm text-[#488aec] hover:text-emerald-900">
              Forgot?
            </a>
          </div>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={values.password}
            onChange={handleChange('password')}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
            required
            autoComplete="current-password"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-3 rounded-lg bg-[#488aec] px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-[0_4px_6px_-1px_rgba(72,138,236,0.19),0_2px_4px_-1px_rgba(72,138,236,0.09)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgba(72,138,236,0.31),0_4px_6px_-2px_rgba(72,138,236,0.09)] focus:outline-none focus:ring-2 focus:ring-[#488aec]/40 focus:ring-offset-2 active:translate-y-0 active:opacity-85 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="pt-1 text-center text-sm text-neutral-500">
          Signing in as a driver? Use the same form; your dashboard is chosen automatically.
        </p>
      </form>
    </div>
  );
}
