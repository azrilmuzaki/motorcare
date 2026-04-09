export const formatCurrency = (
  amount: number,
  locale = 'id-ID',
  currency = 'IDR',
): string =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatOdometer = (
  distanceKm: number,
  locale = 'id-ID',
): string => `${new Intl.NumberFormat(locale).format(distanceKm)} km`;

export const toTitleCase = (value: string): string =>
  value.replace(/\w\S*/g, word => {
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
