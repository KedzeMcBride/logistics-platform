'use client';

import { Mail, Phone, User } from 'lucide-react';

import type { DriverProfileDto } from '../use-driver';

type DriverAccountInfoProps = {
  driver: DriverProfileDto;
};

export function DriverAccountInfo({ driver }: DriverAccountInfoProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeader
        title="Account Information"
        description="Your personal and contact information."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <InfoItem icon={User} label="Full Name" value={driver.fullName} />

        <InfoItem icon={Mail} label="Email Address" value={driver.user.email} />

        <InfoItem icon={Phone} label="Phone Number" value={driver.user.phone ?? 'Not provided'} />

        <InfoItem icon={User} label="User ID" value={driver.userId} />
      </div>
    </section>
  );
}

type SectionHeaderProps = {
  title: string;
  description: string;
};

function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

type InfoItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
        <Icon className="h-5 w-5 text-gray-500" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>

        <p className="mt-1 truncate text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
