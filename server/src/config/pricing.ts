export const PRICING = {
  basic: { base: 299, label: 'Basic', deliveryHours: 48 },
  standard: { base: 599, label: 'Standard', deliveryHours: 48 },
  comprehensive: { base: 1199, label: 'Comprehensive', deliveryHours: 48 },
};

export const URGENCY_MULTIPLIER = {
  standard: 1.0,
  express: 1.5,
  urgent: 2.0,
};

export const URGENCY_HOURS = {
  standard: 48,
  express: 24,
  urgent: 12,
};

export function calculatePrice(reportType: keyof typeof PRICING, urgency: keyof typeof URGENCY_MULTIPLIER): number {
  const base = PRICING[reportType]?.base || 0;
  const mult = URGENCY_MULTIPLIER[urgency] || 1.0;
  return Math.round(base * mult);
}
