import { API_PREFIX, APP_NAME, PORTS } from '@repo/shared';

type ServiceStatus = {
  label: string;
  value: string;
};

export function StatusPanel() {
  const services: ServiceStatus[] = [
    { label: 'Web', value: `localhost:${PORTS.WEB}` },
    { label: 'API', value: `localhost:${PORTS.API}${API_PREFIX}` },
    { label: 'App', value: APP_NAME },
  ];

  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
      {services.map((service) => (
        <StatusCard key={service.label} {...service} />
      ))}
    </div>
  );
}

function StatusCard({ label, value }: ServiceStatus) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-slate-700">
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm text-emerald-400">{value}</p>
    </div>
  );
}
