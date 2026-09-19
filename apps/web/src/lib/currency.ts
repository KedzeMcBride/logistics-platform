export function formatFCFA(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return '—';
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(value))} FCFA`;
}

export function formatXAF(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export const formatPrice = formatFCFA;
