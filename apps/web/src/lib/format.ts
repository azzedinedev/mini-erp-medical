export function formatNumber(value: number): string { return new Intl.NumberFormat('fr-FR').format(value); }
export function formatCurrency(value: number, currency = 'EUR'): string { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
export function initials(firstName: string, lastName: string): string { return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(); }
