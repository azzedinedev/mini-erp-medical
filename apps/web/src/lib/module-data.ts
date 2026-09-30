import type { Paginated } from './api-client';
import { apiClient } from './api-client';
import { moduleConfigs } from './module-config';

export type ModuleKey = keyof typeof moduleConfigs;

export type ModuleRecord = {
  id?: string;
  row: string[];
  remote?: boolean;
  data?: Record<string, unknown>;
  deletedAt?: string;
  deletionReason?: string;
};

export type CrudDraft = {
  label: string;
  code: string;
  phone: string;
  email: string;
  category: string;
  unit: string;
  quantity: string;
  minQuantity: string;
  currency: string;
  amountHt: string;
  vatRate: string;
  status: string;
  scheduledAt: string;
  patientId: string;
  prescriberId: string;
  notes: string;
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Actif', ARCHIVED: 'Archivé', INACTIVE: 'Inactif', DRAFT: 'Brouillon', SIGNED: 'Signée', DISPENSED: 'Délivrée',
  CANCELLED: 'Annulée', PLANNED: 'Planifiée', IN_PROGRESS: 'En cours', COMPLETED: 'Terminée', DELIVERED: 'Livrée', PENDING: 'En attente',
  ISSUED: 'Émise', PAID: 'Payée', PARTIALLY_PAID: 'Partiellement payée', INVITED: 'Invitation en attente', SUSPENDED: 'Suspendu',
};

function status(value: unknown) { return statusLabels[String(value)] ?? String(value ?? 'À compléter'); }
function date(value: unknown) { return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(value))) : '—'; }
function initials(firstName = '', lastName = '') { return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase(); }
function age(birthDate?: string) { if (!birthDate) return '—'; const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / 31_557_600_000); return `${years} ans`; }
function stockSummary(item: Record<string, unknown>) {
  const quantity = item.quantity === undefined || item.quantity === null ? null : String(item.quantity);
  const minimum = item.minQuantity === undefined || item.minQuantity === null ? null : String(item.minQuantity);
  if (quantity === null) return 'Quantité non renseignée';
  return minimum === null ? `${quantity} ${item.unit ?? ''}`.trim() : `${quantity} ${item.unit ?? ''} / min. ${minimum}`;
}
function stockStatus(item: Record<string, unknown>) {
  const quantity = Number(item.quantity);
  const minimum = Number(item.minQuantity);
  if (!Number.isFinite(quantity) || !Number.isFinite(minimum)) return 'Seuil non renseigné';
  return quantity <= minimum ? 'Stock critique' : 'Disponible';
}


export async function loadModuleRecords(module: ModuleKey): Promise<ModuleRecord[] | null> {
  try {
    switch (module) {
      case 'patients': {
        const result = await apiClient.get<Paginated<Record<string, unknown>>>('/patients?page=1&pageSize=100');
        return result.data.map((item) => ({ id: String(item.id), remote: true, data: item, row: [`${item.firstName} ${item.lastName}|${item.code}|${age(String(item.birthDate ?? ''))}|${initials(String(item.firstName), String(item.lastName))}`, 'Dossier patient', '—', status(item.status), date(item.updatedAt)] }));
      }
      case 'prescriptions': {
        const result = await apiClient.get<Paginated<Record<string, unknown>>>('/prescriptions?page=1&pageSize=100');
        return result.data.map((item) => { const patient = item.patient as Record<string, unknown> | undefined; const prescriber = item.prescriber as Record<string, unknown> | undefined; const patientName = `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim(); return { id: String(item.id), remote: true, data: item, row: [`${item.code}|${patientName}|${patient?.code ?? ''}`, `${patientName}|${patient?.code ?? ''}`, `Dr. ${prescriber?.firstName ?? ''} ${prescriber?.lastName ?? ''}`.trim(), date(item.createdAt), status(item.status)] }; });
      }
      case 'inventory': {
        const result = await apiClient.get<Record<string, unknown>[]>('/inventory');
        return result.map((item) => ({ id: String(item.id), remote: true, data: item, row: [`${item.code}|${item.name}|${item.category ?? 'Non renseignée'}`, String(item.category ?? 'Non renseignée'), stockSummary(item), String(item.location ?? 'Non renseigné'), stockStatus(item)] }));
      }
      case 'missions': {
        const result = await apiClient.get<Record<string, unknown>[]>('/missions');
        return result.map((item) => { const patient = item.patient as Record<string, unknown> | undefined; return { id: String(item.id), remote: true, data: item, row: [`${item.code}|${item.title}`, patient ? `${patient.firstName} ${patient.lastName}|${patient.code}` : 'Partenaire', item.assignedTo ? `${String((item.assignedTo as Record<string, unknown>).firstName ?? '')} ${String((item.assignedTo as Record<string, unknown>).lastName ?? '')}`.trim() || 'Équipe non assignée' : 'Équipe non assignée', date(item.scheduledAt), status(item.status)] }; });
      }
      case 'deliveries': {
        const result = await apiClient.get<Record<string, unknown>[]>('/deliveries');
        return result.map((item) => ({ id: String(item.id), remote: true, data: item, row: [`${item.code}|Bordereau`, String((item.partner as Record<string, unknown> | undefined)?.name ?? 'Destinataire'), '—', date(item.scheduledAt), status(item.status)] }));
      }
      case 'documents': {
        const result = await apiClient.get<Record<string, unknown>[]>('/documents');
        return result.map((item) => ({ id: String(item.id), remote: true, data: item, row: [`${item.fileName}|${item.title}`, String(item.category ?? 'Document'), String(item.entityType ?? '—'), 'v1', date(item.createdAt)] }));
      }
      case 'team': {
        const result = await apiClient.get<Record<string, unknown>[]>('/medical-staff');
        return result.map((item) => ({ id: String(item.id), remote: true, data: item, row: [`${item.firstName} ${item.lastName}|${item.specialty ?? '—'}|${initials(String(item.firstName), String(item.lastName))}`, String(item.staffType ?? 'Équipe'), String(item.specialty ?? '—'), item.availability ? JSON.stringify(item.availability) : 'Disponibilité non renseignée', item.isActive === true ? 'Actif' : item.isActive === false ? 'Inactif' : 'Statut non renseigné'] }));
      }
      case 'partners': {
        const result = await apiClient.get<Record<string, unknown>[]>('/partners');
        return result.map((item) => ({ id: String(item.id), remote: true, data: item, row: [`${item.name}|${item.kind ?? 'Partenaire'}|${initials(String(item.name).split(' ')[0], String(item.name).split(' ').slice(1).join(' '))}`, String(item.kind ?? 'Partenaire'), String(item.email ?? item.contactName ?? 'Contact à renseigner'), date(item.updatedAt), item.isActive === true ? 'Actif' : item.isActive === false ? 'Archivé' : 'Statut non renseigné'] }));
      }
      case 'users': {
        const result = await apiClient.get<Record<string, unknown>[]>('/users');
        return result.map((item) => ({ id: String(item.id), remote: true, data: item, row: [`${item.firstName} ${item.lastName}|${item.email}|${initials(String(item.firstName), String(item.lastName))}`, 'Rôles à consulter', date(item.lastLoginAt), item.totpEnabled ? 'Activée' : 'Non activée', status(item.status)] }));
      }
      case 'references': {
        const [types, medications] = await Promise.all([
          apiClient.get<Record<string, unknown>[]>('/reference-data/types'),
          apiClient.get<Record<string, unknown>[]>('/reference-data/medications'),
        ]);
        return [...types.map((item) => ({ id: String(item.id), remote: true, data: item, row: [`${String((item.labels as Record<string, string> | undefined)?.fr ?? item.code)}|${item.code}|${item.icon ?? 'ListChecks'}`, 'Type d’acte', String(item.code), date(item.updatedAt), 'Actif'] })), ...medications.map((item) => ({ id: String(item.id), remote: true, data: item, row: [`${item.name}|${item.code}|${item.form ?? 'Médicament'}`, 'Médicament', String(item.code), date(item.updatedAt), 'Actif'] }))];
      }
      case 'finance': {
        const result = await apiClient.get<Record<string, unknown>[]>('/finance');
        return result.map((item) => ({ id: String(item.id), remote: true, data: item, row: [`${item.code}|${item.kind}`, String((item.partner as Record<string, unknown> | undefined)?.name ?? 'Partenaire'), date(item.createdAt), item.totalTtc === undefined || item.totalTtc === null ? 'Montant non renseigné' : `${item.totalTtc} ${item.currency ?? ''}`.trim(), status(item.status)] }));
      }
      case 'settings': return null;
    }
  } catch (error) {
    throw error;
  }
}

function remoteTrashRecord(module: ModuleKey, item: Record<string, unknown>, referenceKind?: 'type' | 'medication'): ModuleRecord {
  const patient = item.patient as Record<string, unknown> | undefined;
  const prescriber = item.prescriber as Record<string, unknown> | undefined;
  const partner = item.partner as Record<string, unknown> | undefined;
  const firstName = String(item.firstName ?? '');
  const lastName = String(item.lastName ?? '');
  const fullName = `${firstName} ${lastName}`.trim() || String(item.name ?? item.title ?? item.code ?? 'Élément');
  switch (module) {
    case 'patients':
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.deletedAt ?? ''), row: [`${fullName}|${item.code ?? '—'}|${age(String(item.birthDate ?? ''))}|${initials(firstName, lastName)}`, 'Dossier patient', '—', 'Archivé', date(item.deletedAt ?? item.updatedAt)] };
    case 'prescriptions':
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.deletedAt ?? ''), row: [`${item.code ?? '—'}|${patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() : 'Patient'}|${patient?.code ?? ''}`, `${patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() : 'Patient'}|${patient?.code ?? ''}`, `Dr. ${prescriber?.firstName ?? ''} ${prescriber?.lastName ?? ''}`.trim(), date(item.createdAt), 'Archivé'] };
    case 'inventory':
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.deletedAt ?? ''), row: [`${item.code ?? '—'}|${item.name ?? 'Nom non renseigné'}|${item.category ?? 'Non renseignée'}`, String(item.category ?? 'Non renseignée'), stockSummary(item), String(item.location ?? 'Non renseigné'), 'Archivé'] };
    case 'missions':
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.deletedAt ?? ''), row: [`${item.code ?? '—'}|${item.title ?? 'Mission'}`, patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}|${patient.code ?? ''}` : String(partner?.name ?? 'Partenaire'), String(item.assignedToId ?? 'Équipe'), date(item.scheduledAt), 'Archivé'] };
    case 'deliveries':
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.deletedAt ?? ''), row: [`${item.code ?? '—'}|Bordereau`, String(partner?.name ?? 'Destinataire'), '—', date(item.scheduledAt), 'Archivé'] };
    case 'documents':
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.deletedAt ?? ''), row: [`${item.fileName ?? 'document'}|${item.title ?? 'Document'}`, String(item.category ?? 'Document'), String(item.entityType ?? '—'), 'v1', date(item.deletedAt ?? item.updatedAt)] };
    case 'team':
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.deletedAt ?? ''), row: [`${fullName}|${item.specialty ?? '—'}|${initials(firstName, lastName)}`, String(item.staffType ?? 'Équipe'), String(item.specialty ?? '—'), '—', 'Archivé'] };
    case 'partners':
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.deletedAt ?? ''), row: [`${item.name ?? 'Partenaire'}|${item.kind ?? 'Partenaire'}|${initials(String(item.name ?? '').split(' ')[0], String(item.name ?? '').split(' ').slice(1).join(' '))}`, String(item.kind ?? 'Partenaire'), String(item.email ?? item.contactName ?? 'Contact à renseigner'), date(item.deletedAt ?? item.updatedAt), 'Archivé'] };
    case 'users':
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.deletedAt ?? ''), row: [`${fullName}|${item.email ?? '—'}|${initials(firstName, lastName)}`, 'Rôles à consulter', date(item.lastLoginAt), item.totpEnabled ? 'Activée' : 'Non activée', 'Archivé'] };
    case 'references': {
      if (referenceKind === 'medication') return { id: String(item.id), remote: true, data: item, deletedAt: String(item.archivedAt ?? ''), row: [`${item.name ?? 'Médicament'}|${item.code ?? '—'}|${item.form ?? 'Médicament'}`, 'Médicament', String(item.code ?? '—'), date(item.archivedAt ?? item.updatedAt), 'Archivé'] };
      const labels = item.labels as Record<string, string> | undefined;
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.archivedAt ?? ''), row: [`${labels?.fr ?? item.code ?? 'Référence'}|${item.code ?? '—'}|${item.icon ?? 'ListChecks'}`, 'Type d’acte', String(item.code ?? '—'), date(item.archivedAt ?? item.updatedAt), 'Archivé'] };
    }
    case 'finance':
      return { id: String(item.id), remote: true, data: item, deletedAt: String(item.deletedAt ?? ''), row: [`${item.code ?? '—'}|${item.kind ?? 'Document financier'}`, String(partner?.name ?? 'Partenaire'), date(item.createdAt), item.totalTtc === undefined || item.totalTtc === null ? 'Montant non renseigné' : `${item.totalTtc} ${item.currency ?? ''}`.trim(), 'Archivé'] };
    case 'settings':
      return { id: String(item.id), remote: true, data: item, row: [fullName, '—', '—', 'Archivé'] };
  }
}

export async function loadModuleTrash(module: ModuleKey): Promise<ModuleRecord[] | null> {
  try {
    switch (module) {
      case 'patients': return (await apiClient.get<Record<string, unknown>[]>('/patients/trash')).map((item) => remoteTrashRecord(module, item));
      case 'prescriptions': return (await apiClient.get<Record<string, unknown>[]>('/prescriptions/trash')).map((item) => remoteTrashRecord(module, item));
      case 'inventory': return (await apiClient.get<Record<string, unknown>[]>('/inventory/trash')).map((item) => remoteTrashRecord(module, item));
      case 'missions': return (await apiClient.get<Record<string, unknown>[]>('/missions/trash')).map((item) => remoteTrashRecord(module, item));
      case 'deliveries': return (await apiClient.get<Record<string, unknown>[]>('/deliveries/trash')).map((item) => remoteTrashRecord(module, item));
      case 'documents': return (await apiClient.get<Record<string, unknown>[]>('/documents/trash')).map((item) => remoteTrashRecord(module, item));
      case 'team': return (await apiClient.get<Record<string, unknown>[]>('/medical-staff/trash')).map((item) => remoteTrashRecord(module, item));
      case 'partners': return (await apiClient.get<Record<string, unknown>[]>('/partners/trash')).map((item) => remoteTrashRecord(module, item));
      case 'users': return (await apiClient.get<Record<string, unknown>[]>('/users/trash')).map((item) => remoteTrashRecord(module, item));
      case 'finance': return (await apiClient.get<Record<string, unknown>[]>('/finance/trash')).map((item) => remoteTrashRecord(module, item));
      case 'references': {
        const [types, medications] = await Promise.all([
          apiClient.get<Record<string, unknown>[]>('/reference-data/types/trash'),
          apiClient.get<Record<string, unknown>[]>('/reference-data/medications/trash'),
        ]);
        return [...types.map((item) => remoteTrashRecord(module, item, 'type')), ...medications.map((item) => remoteTrashRecord(module, item, 'medication'))];
      }
      case 'settings': return null;
    }
  } catch (error) {
    throw error;
  }
}
