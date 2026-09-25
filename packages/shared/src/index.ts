export const SUPPORTED_LOCALES = ['fr', 'ar', 'en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'update',
  'delete',
  'archive',
  'export',
] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const MODULE_KEYS = [
  'patients',
  'prescriptions',
  'inventory',
  'deliveries',
  'missions',
  'documents',
  'medical-staff',
  'partners',
  'users',
  'references',
  'finance',
  'settings',
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export type PermissionKey = `${ModuleKey}:${PermissionAction}`;

export const PRESCRIPTION_STATUSES = ['DRAFT', 'SIGNED', 'DISPENSED', 'CANCELLED'] as const;
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUSES)[number];

export const MISSION_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];

export const DELIVERY_STATUSES = ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  locale: Locale;
  theme: string;
  roles: Array<{ id: string; name: string; permissions: PermissionKey[] }>;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  code?: string;
  requestId?: string;
}

export function formatCode(prefix: string, sequence: number, padding = 6): string {
  return `${prefix}-${String(sequence).padStart(padding, '0')}`;
}

export function hasPermission(user: AuthUser | null, module: ModuleKey, action: PermissionAction): boolean {
  if (!user) return false;
  const permission = `${module}:${action}` as PermissionKey;
  return user.roles.some((role) => role.permissions.includes(permission));
}
