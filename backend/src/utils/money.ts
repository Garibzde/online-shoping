export const toCents = (price: { toNumber: () => number }): number =>
  Math.round(price.toNumber() * 100);

export const formatCents = (cents: number): string => (cents / 100).toFixed(2);