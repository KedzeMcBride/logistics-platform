'use client';

import { FormEvent, useState } from 'react';

import { useAuth } from '../use-auth';

type AccountType = 'customer' | 'driver';

interface SignUpFormValues {
  accountType: AccountType;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

function HeadsetIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 13a9 9 0 0 1 18 0" />
      <rect x="3" y="13" width="4" height="7" rx="1.5" />
      <rect x="17" y="13" width="4" height="7" rx="1.5" />
      <path d="M19 20a5 5 0 0 1-5 3h-2" />
    </svg>
  );
}

export function RegisterForm() {
  const { register } = useAuth();
  const [values, setValues] = useState<SignUpFormValues>({
    accountType: 'customer',
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof SignUpFormValues>(field: K, value: SignUpFormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
        role: values.accountType === 'customer' ? 'CUSTOMER' : 'DRIVER',
      });
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions: {
    type: AccountType;
    icon: (className: string) => React.ReactNode;
    title: string;
    subtitle: string;
  }[] = [
    {
      type: 'customer',
      icon: (className) => <BriefcaseIcon className={className} />,
      title: 'Send deliveries',
      subtitle: 'Customer account',
    },
    {
      type: 'driver',
      icon: (className) => <HeadsetIcon className={className} />,
      title: 'Deliver packages',
      subtitle: 'Driver account',
    },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            I&apos;m signing up as
          </label>
          <div className="grid grid-cols-2 gap-3">
            {accountOptions.map((option) => {
              const selected = values.accountType === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setField('accountType', option.type)}
                  disabled={isSubmitting}
                  className={`text-left rounded-xl border p-4 transition-colors disabled:opacity-60 ${
                    selected
                      ? 'border-emerald-800 bg-emerald-800/10'
                      : 'border-neutral-300 bg-white hover:border-neutral-400'
                  }`}
                >
                  {option.icon(
                    `w-6 h-6 mb-3 ${selected ? 'text-emerald-900' : 'text-neutral-600'}`,
                  )}
                  <div
                    className={`font-semibold text-[15px] ${
                      selected ? 'text-emerald-900' : 'text-neutral-900'
                    }`}
                  >
                    {option.title}
                  </div>
                  <div className="text-sm text-neutral-500">{option.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-neutral-900 mb-2">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Ekema Divine"
            value={values.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700"
            required
            autoComplete="name"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700"
            required
            autoComplete="email"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-neutral-900 mb-2">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+237 6XX XXX XXX"
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700"
            required
            autoComplete="tel"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-neutral-900 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={(e) => setField('password', e.target.value)}
            minLength={8}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700"
            required
            autoComplete="new-password"
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
          className="w-full rounded-lgclassName=inline-flex items-center gap-3 rounded-lg bg-[#488aec] px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-[0_4px_6px_-1px_rgba(72,138,236,0.19),0_2px_4px_-1px_rgba(72,138,236,0.09)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgba(72,138,236,0.31),0_4px_6px_-2px_rgba(72,138,236,0.09)] focus:outline-none focus:ring-2 focus:ring-[#488aec]/40 focus:ring-offset-2 active:translate-y-0 active:opacity-85 active:shadow-none"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
