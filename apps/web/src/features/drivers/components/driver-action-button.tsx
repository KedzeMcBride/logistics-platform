'use client';

import type { ReactNode } from 'react';

type DriverActionButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

export function DriverActionButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
}: DriverActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-3 rounded-lg',
        'bg-[#488aec] px-6 py-3',
        'text-xs font-bold uppercase tracking-wide text-white',
        'shadow-[0_4px_6px_-1px_rgba(72,138,236,0.19),0_2px_4px_-1px_rgba(72,138,236,0.09)]',
        'transition-all duration-500',
        'hover:-translate-y-0.5',
        'hover:shadow-[0_10px_15px_-3px_rgba(72,138,236,0.31),0_4px_6px_-2px_rgba(72,138,236,0.09)]',
        'focus:outline-none focus:ring-2 focus:ring-[#488aec]/40 focus:ring-offset-2',
        'active:translate-y-0 active:opacity-85 active:shadow-none',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none',
      ].join(' ')}
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5 shrink-0"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13.5 3H12H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H11M13.5 3L19 8.625M13.5 3V7.625C13.5 8.17728 13.9477 8.625 14.5 8.625H19M19 8.625V11.8125"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M17 15V18M17 21V18M17 18H14M17 18H20"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      {children}
    </button>
  );
}
