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
      await login(values.email, values.password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@email.com"
            value={values.email}
            onChange={handleChange('email')}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700"
            required
            autoComplete="email"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-900">
              Password
            </label>
            <a href="#" className="text-sm text-emerald-800 hover:text-emerald-900">
              Forgot?
            </a>
          </div>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={values.password}
            onChange={handleChange('password')}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700"
            required
            autoComplete="current-password"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3.5 mt-2"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-neutral-500 pt-1">
          Signing in as a driver? Use the same form your dashboard is chosen for you.
        </p>
      </form>
    </div>
  );
}
