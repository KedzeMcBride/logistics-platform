'use client';

import type { DriverAvailability } from '@repo/shared';

type DriverAvailabilityToggleProps = {
  availability: DriverAvailability;
  disabled?: boolean;
  onChange: (availability: DriverAvailability) => void;
};

export function DriverAvailabilityToggle({
  availability,
  disabled = false,
  onChange,
}: DriverAvailabilityToggleProps) {
  const isOnline = availability === 'ONLINE';

  function handleChange() {
    if (disabled) return;

    onChange(isOnline ? 'OFFLINE' : 'ONLINE');
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <label
        htmlFor="driver-availability-toggle"
        className={[
          'inline-block select-none',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ].join(' ')}
      >
        <input
          id="driver-availability-toggle"
          type="checkbox"
          checked={isOnline}
          onChange={handleChange}
          disabled={disabled}
          className="peer sr-only"
          aria-label={
            isOnline ? 'Set driver availability to offline' : 'Set driver availability to online'
          }
        />

        <div
          className={[
            'relative h-[3.2em] w-[6em] rounded-[3em]',
            'border-4 shadow-[inset_0_4px_8px_rgba(0,0,0,0.65),0_10px_25px_rgba(0,0,0,0.45)]',
            'transition-all duration-500 ease-in-out',
            isOnline ? 'border-[#131715] bg-[#0b120f]' : 'border-[#16171d] bg-[#0e0f12]',
          ].join(' ')}
        >
          {/* ONLINE indicator */}
          <div
            className={[
              'pointer-events-none absolute left-[0.9em] top-1/2',
              'flex h-[0.85em] w-[0.85em] -translate-y-1/2',
              'items-center justify-center',
              'transition-all duration-500',
              isOnline
                ? 'scale-[1.15] rotate-[5deg] opacity-85 drop-shadow-[0_0_4px_rgba(0,255,170,0.5)]'
                : 'scale-[0.8] opacity-[0.12]',
            ].join(' ')}
          >
            <svg
              viewBox="0 0 8 8"
              className="h-full w-full text-[#00ffaa]"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M1,4h2v2H1zm1,1h2v2H2zm1,1h2v2H3zm1,-2h2v3H4zm1,-2h2v3H5zm1,-2h2v3H6z" />
            </svg>
          </div>

          {/* OFFLINE indicator */}
          <div
            className={[
              'pointer-events-none absolute right-[0.9em] top-1/2',
              'flex h-[0.85em] w-[0.85em] -translate-y-1/2',
              'items-center justify-center',
              'transition-all duration-500',
              isOnline
                ? 'scale-[0.8] -rotate-[5deg] opacity-[0.1]'
                : 'scale-[1.1] opacity-70 drop-shadow-[0_0_3px_rgba(255,0,127,0.4)]',
            ].join(' ')}
          >
            <svg
              viewBox="0 0 8 8"
              className="h-full w-full text-[#ff007f]"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3,3h2v2H3zM2,2h2v2H2zM1,1h2v2H1zM4,2h2v2H4zM5,1h2v2H5zM2,4h2v2H2zM1,5h2v2H1zM4,4h2v2H4zM5,5h2v2H5z" />
            </svg>
          </div>

          {/* Coin/thumb */}
          <div
            className={[
              'absolute left-[0.12em] top-[0.12em]',
              'flex h-[2.45em] w-[2.45em] items-center justify-center',
              'overflow-hidden rounded-full',
              'border-[3.5px] border-[#16171d]',
              'transition-all duration-500',
              '[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
              'shadow-[inset_0_3px_0_rgba(255,255,255,0.28),inset_0_-3px_0_rgba(0,0,0,0.28),0_4px_8px_rgba(0,0,0,0.45)]',
              isOnline
                ? 'translate-x-[2.83em] rotate-[360deg] bg-[#00ffaa] shadow-[inset_0_3px_0_rgba(255,255,255,0.32),inset_0_-3px_0_rgba(0,0,0,0.22),0_4px_8px_rgba(0,0,0,0.45),0_0_18px_rgba(0,255,170,0.5)]'
                : 'translate-x-0 rotate-0 bg-[#ff007f] shadow-[inset_0_3px_0_rgba(255,255,255,0.28),inset_0_-3px_0_rgba(0,0,0,0.28),0_4px_8px_rgba(0,0,0,0.45),0_0_15px_rgba(255,0,127,0.35)]',
            ].join(' ')}
          >
            {/* Shine */}
            <div
              className={[
                'absolute left-[-130%] top-0 h-full w-[60%]',
                'skew-x-[-25deg]',
                'bg-gradient-to-r from-transparent via-white/30 to-transparent',
                'transition-all duration-500',
                '[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
                isOnline ? 'left-[130%]' : 'left-[-130%]',
              ].join(' ')}
            />

            {/* Sad face */}
            <div
              className={[
                'absolute z-10 h-[1.35em] w-[1.35em]',
                'text-[#16171d]',
                'transition-all duration-500',
                '[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
                isOnline ? '-rotate-180 scale-[0.7] opacity-0' : 'rotate-0 scale-100 opacity-100',
              ].join(' ')}
            >
              <svg
                viewBox="0 0 16 16"
                className="h-full w-full"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M3,2h3v1H3zm7,1h3v-1h-3z" />
                <path d="M4,4h2v3H4zm6,0h2v3h-2z" />
                <path d="M3,11h2v2H3zm8,0h2v2h-2zm-6,-2h6v2H5z" />
              </svg>
            </div>

            {/* Happy face */}
            <div
              className={[
                'absolute z-10 h-[1.35em] w-[1.35em]',
                'text-[#16171d]',
                'transition-all duration-500',
                '[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
                isOnline ? 'rotate-0 scale-100 opacity-100' : 'rotate-180 scale-[0.7] opacity-0',
              ].join(' ')}
            >
              <svg
                viewBox="0 0 16 16"
                className="h-full w-full"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M3,2h3v1H3zm7,0h3v1h-3z" />
                <path d="M4,4h2v3H4zm6,0h2v3h-2z" />
                <path d="M3,9h2v2H3zm8,0h2v2h-2zm-6,2h6v2H5z" />
              </svg>
            </div>
          </div>
        </div>
      </label>

      <div className="text-center">
        <p
          className={['text-sm font-bold', isOnline ? 'text-emerald-600' : 'text-pink-600'].join(
            ' ',
          )}
        >
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          {disabled
            ? 'Updating availability...'
            : isOnline
              ? 'Tap to go offline'
              : 'Tap to go online'}
        </p>
      </div>
    </div>
  );
}
