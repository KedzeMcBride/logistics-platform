'use client';

import type { DeliveryPriority } from '@repo/shared';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { formatFCFA } from '@/lib/currency';
import { cn } from '@/lib/utils';

import { type DeliveryDto, createDelivery, quoteDelivery } from './use-deliveries';

type FormState = {
  // Step 1
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  // Step 2
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  // Step 3
  packageDescription: string;
  packageSizeCategory: 'SMALL' | 'MEDIUM' | 'LARGE';
  packageWeightKg: number;
  // Step 4
  recipientName: string;
  recipientPhone: string;
  // Step 5
  priority: DeliveryPriority;
  notes: string;
};

const INITIAL_STATE: FormState = {
  pickupAddress: '123 Main Street, Springfield, IL',
  pickupLat: 39.7817,
  pickupLng: -89.6501,
  destinationAddress: '456 Corporate Blvd, Springfield, IL',
  destinationLat: 39.7995,
  destinationLng: -89.644,
  packageDescription: '',
  packageSizeCategory: 'SMALL',
  packageWeightKg: 1,
  recipientName: '',
  recipientPhone: '',
  priority: 'STANDARD',
  notes: '',
};

type Quote = {
  distanceKm: number;
  durationMin: number;
  pricing: {
    baseFee: number;
    distanceFee: number;
    weightFee: number;
    prioritySurcharge: number;
    total: number;
    currency: 'XAF';
  };
};

const STEPS = ['Pickup', 'Destination', 'Package', 'Recipient', 'Priority', 'Review'] as const;

export function CreateDeliveryForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function refreshQuote() {
    setIsQuoting(true);
    try {
      const result = await quoteDelivery({
        pickupLat: form.pickupLat,
        pickupLng: form.pickupLng,
        destinationLat: form.destinationLat,
        destinationLng: form.destinationLng,
        packageWeightKg: form.packageWeightKg,
        priority: form.priority,
      });
      setQuote(result);
    } catch {
      // Silently ignore; user can retry
    } finally {
      setIsQuoting(false);
    }
  }

  function next() {
    if (step === 4) {
      // Moving to review — fetch quote
      void refreshQuote();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit(): Promise<DeliveryDto> {
    setIsSubmitting(true);
    setError(null);
    try {
      const delivery = await createDelivery({
        pickupAddress: form.pickupAddress,
        pickupLat: form.pickupLat,
        pickupLng: form.pickupLng,
        destinationAddress: form.destinationAddress,
        destinationLat: form.destinationLat,
        destinationLng: form.destinationLng,
        packageDescription: form.packageDescription,
        packageSizeCategory: form.packageSizeCategory,
        packageWeightKg: form.packageWeightKg,
        priority: form.priority,
        recipientName: form.recipientName,
        recipientPhone: form.recipientPhone,
        notes: form.notes || undefined,
      });
      window.location.href = `/deliveries/${delivery.id}`;
      return delivery;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create delivery');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                i < step
                  ? 'bg-emerald-800 text-white'
                  : i === step
                    ? 'bg-emerald-800 text-white'
                    : 'bg-neutral-100 text-neutral-400',
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'hidden text-xs font-medium sm:inline',
                i <= step ? 'text-neutral-900' : 'text-neutral-400',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 flex-1', i < step ? 'bg-emerald-800' : 'bg-neutral-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && <StepPickup form={form} update={update} />}
      {step === 1 && <StepDestination form={form} update={update} />}
      {step === 2 && <StepPackage form={form} update={update} />}
      {step === 3 && <StepRecipient form={form} update={update} />}
      {step === 4 && <StepPriority form={form} update={update} />}
      {step === 5 && <StepReview form={form} quote={quote} isQuoting={isQuoting} />}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || isSubmitting}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create delivery
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

type StepProps = {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
};

function StepPickup({ form, update }: StepProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-neutral-900">Where should we pick up?</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Enter the pickup address. For this demo, coordinates are pre-filled.
      </p>
      <Field
        label="Pickup address"
        value={form.pickupAddress}
        onChange={(v) => update('pickupAddress', v)}
        placeholder="123 Main Street, Springfield, IL"
      />
    </div>
  );
}

function StepDestination({ form, update }: StepProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-neutral-900">Where should we deliver?</h3>
      <p className="mt-1 text-sm text-neutral-500">Enter the destination address.</p>
      <Field
        label="Destination address"
        value={form.destinationAddress}
        onChange={(v) => update('destinationAddress', v)}
        placeholder="456 Corporate Blvd, Springfield, IL"
      />
    </div>
  );
}

function StepPackage({ form, update }: StepProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-neutral-900">Tell us about the package</h3>
      <p className="mt-1 text-sm text-neutral-500">This helps us price the delivery accurately.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">Description</label>
          <textarea
            value={form.packageDescription}
            onChange={(e) => update('packageDescription', e.target.value)}
            rows={3}
            placeholder="What are you sending?"
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">Size</label>
          <div className="grid grid-cols-3 gap-3">
            {(['SMALL', 'MEDIUM', 'LARGE'] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => update('packageSizeCategory', size)}
                className={cn(
                  'rounded-xl border p-4 text-sm font-semibold transition-colors',
                  form.packageSizeCategory === size
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                    : 'border-neutral-300 text-neutral-700 hover:border-neutral-400',
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">Weight (kg)</label>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={form.packageWeightKg}
            onChange={(e) => update('packageWeightKg', Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
          />
        </div>
      </div>
    </div>
  );
}

function StepRecipient({ form, update }: StepProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-neutral-900">Who&apos;s receiving the package?</h3>
      <p className="mt-1 text-sm text-neutral-500">
        We&apos;ll notify them when the delivery is on the way.
      </p>
      <div className="mt-6 space-y-5">
        <Field
          label="Recipient name"
          value={form.recipientName}
          onChange={(v) => update('recipientName', v)}
          placeholder="Jane Doe"
        />
        <Field
          label="Recipient phone"
          value={form.recipientPhone}
          onChange={(v) => update('recipientPhone', v)}
          placeholder="+237 6XX XXX XXX"
          type="tel"
        />
      </div>
    </div>
  );
}

function StepPriority({ form, update }: StepProps) {
  const options: { value: DeliveryPriority; label: string; hint: string }[] = [
    { value: 'STANDARD', label: 'Standard', hint: 'Within 2-3 days' },
    { value: 'EXPRESS', label: 'Express', hint: 'Within 24 hours · +1000 FCFA' },
    { value: 'SAME_DAY', label: 'Same day', hint: 'Today · +2500 FCFA' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-neutral-900">How fast do you need it?</h3>
      <p className="mt-1 text-sm text-neutral-500">Choose a priority level.</p>
      <div className="mt-6 space-y-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => update('priority', opt.value)}
            className={cn(
              'w-full rounded-xl border p-4 text-left transition-colors',
              form.priority === opt.value
                ? 'border-emerald-800 bg-emerald-50'
                : 'border-neutral-300 hover:border-neutral-400',
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'text-sm font-semibold',
                  form.priority === opt.value ? 'text-emerald-900' : 'text-neutral-900',
                )}
              >
                {opt.label}
              </span>
              <div
                className={cn(
                  'h-4 w-4 rounded-full border-2',
                  form.priority === opt.value
                    ? 'border-emerald-800 bg-emerald-800'
                    : 'border-neutral-300',
                )}
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">{opt.hint}</p>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-neutral-900 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={2}
          placeholder="Any special instructions?"
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
        />
      </div>
    </div>
  );
}

function StepReview({
  form,
  quote,
  isQuoting,
}: {
  form: FormState;
  quote: Quote | null;
  isQuoting: boolean;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-neutral-900">Review your delivery</h3>
      <p className="mt-1 text-sm text-neutral-500">Check everything looks right before creating.</p>

      <div className="mt-6 space-y-4">
        <SummaryRow label="From" value={form.pickupAddress} />
        <SummaryRow label="To" value={form.destinationAddress} />
        <SummaryRow
          label="Package"
          value={`${form.packageSizeCategory} · ${form.packageWeightKg} kg`}
        />
        <SummaryRow label="Recipient" value={`${form.recipientName} · ${form.recipientPhone}`} />
        <SummaryRow label="Priority" value={form.priority} />
        {form.notes && <SummaryRow label="Notes" value={form.notes} />}
      </div>

      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        {isQuoting ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-800" />
            <span className="text-sm text-emerald-900">Calculating price...</span>
          </div>
        ) : quote ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-900">Estimated total</span>
              <span className="text-2xl font-bold text-emerald-900">
                {formatFCFA(quote.pricing.total)}
              </span>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-emerald-800">
              <QuoteLine label="Base fee" value={quote.pricing.baseFee} />
              <QuoteLine
                label={`Distance (${quote.distanceKm} km)`}
                value={quote.pricing.distanceFee}
              />
              <QuoteLine label="Weight" value={quote.pricing.weightFee} />
              {quote.pricing.prioritySurcharge > 0 && (
                <QuoteLine label="Priority" value={quote.pricing.prioritySurcharge} />
              )}
              <div className="border-t border-emerald-200 pt-1.5 text-emerald-900">
                <div className="flex justify-between font-semibold">
                  <span>Estimated duration</span>
                  <span>{quote.durationMin} min</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-emerald-800">Unable to calculate price. Try again.</p>
        )}
      </div>
    </div>
  );
}

function QuoteLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{formatFCFA(value)}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-neutral-100 pb-3">
      <span className="text-sm font-medium text-neutral-500">{label}</span>
      <span className="text-right text-sm text-neutral-900">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="mt-5">
      <label className="block text-sm font-semibold text-neutral-900 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
      />
    </div>
  );
}
