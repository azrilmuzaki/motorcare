export const toReadableDate = (
  value: string | Date,
  locale = 'id-ID',
): string => {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const isOverdue = (
  targetDate: string | Date,
  referenceDate: Date = new Date(),
): boolean => new Date(targetDate).getTime() < referenceDate.getTime();

export const daysBetween = (
  from: string | Date,
  to: string | Date,
): number => {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  const oneDay = 1000 * 60 * 60 * 24;

  return Math.ceil((end - start) / oneDay);
};
