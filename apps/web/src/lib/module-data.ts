import type { Paginated } from './api-client';
import { apiClient } from './api-client';
import { moduleConfigs } from './mock-data';

export type ModuleKey = keyof typeof moduleConfigs;

export type ModuleRecord = {
  id?: string;
  row: string[];
  remote?: boolean;
};

export type CrudDraft = {
  label: string;
  code: string;
  phone: string;
  notes: string;
};

export const moduleRows: Record<string, Array<string[]>> = {
  patients: [
    ['Camille Bernard|PAT-000847|42 ans|CB', 'Consultation cardiologie', 'Domicile · Lyon 6e', 'Actif', 'Aujourd’hui, 08:42'],
    ['Youssef Haddad|PAT-000846|65 ans|YH', 'Soins infirmiers', 'Domicile · Lyon 3e', 'Actif', 'Aujourd’hui, 08:17'],
    ['Élodie Petit|PAT-000845|33 ans|EP', 'Ordonnance créée', 'Centre Saint-Clair', 'Suivi', 'Hier, 17:36'],
    ['Marc Dubois|PAT-000844|57 ans|MD', 'Résultat biologique', 'Domicile · Villeurbanne', 'Actif', 'Hier, 15:22'],
    ['Aïcha Benali|PAT-000843|71 ans|AB', 'Pansement complexe', 'Domicile · Caluire', 'Actif', 'Hier, 11:04'],
    ['Louis Morel|PAT-000842|48 ans|LM', 'Consultation générale', 'Centre Saint-Clair', 'À compléter', '23 oct. 2024'],
  ],
  prescriptions: [
    ['ORD-001932|Camille Bernard|PAT-000847', 'Camille Bernard|PAT-000847', 'Dr. Sofia Martin', '24 oct. 2024 · 08:40', 'Signée'],
    ['ORD-001931|Youssef Haddad|PAT-000846', 'Youssef Haddad|PAT-000846', 'Dr. Sofia Martin', '23 oct. 2024 · 16:10', 'À signer'],
    ['ORD-001930|Élodie Petit|PAT-000845', 'Élodie Petit|PAT-000845', 'Dr. Sofia Martin', '23 oct. 2024 · 14:28', 'Délivrée'],
    ['ORD-001929|Marc Dubois|PAT-000844', 'Marc Dubois|PAT-000844', 'Dr. Léa Moreau', '22 oct. 2024 · 11:50', 'Brouillon'],
    ['ORD-001928|Aïcha Benali|PAT-000843', 'Aïcha Benali|PAT-000843', 'Dr. Sofia Martin', '22 oct. 2024 · 10:24', 'Délivrée'],
  ],
  inventory: [
    ['INV-000001|Gants nitrile — taille M|Protection', 'Protection', '42 boîtes / min. 20', 'Réserve A · Étagère 02', 'Disponible'],
    ['INV-000002|Pansements stériles 10 × 10|Soins', 'Soins', '8 boîtes / min. 12', 'Réserve A · Étagère 04', 'Stock critique'],
    ['INV-000003|Seringues 5 ml|Injection', 'Injection', '31 boîtes / min. 15', 'Réserve B · Étagère 01', 'Disponible'],
    ['INV-000004|Compresses stériles|Soins', 'Soins', '16 boîtes / min. 10', 'Réserve A · Étagère 03', 'Disponible'],
    ['INV-000005|Désinfectant cutané|Hygiène', 'Hygiène', '4 flacons / min. 8', 'Réserve B · Étagère 05', 'Stock critique'],
  ],
  missions: [
    ['MIS-000248|Soins à domicile', 'Youssef Haddad|PAT-000846', 'Nina Rossi · Infirmière', 'Aujourd’hui · 10:30', 'En cours'],
    ['MIS-000249|Livraison matériel', 'Centre Médical Croix-Rousse', 'Thomas Nguyen · Technicien', 'Aujourd’hui · 11:45', 'Planifiée'],
    ['MIS-000250|Pansement complexe', 'Aïcha Benali|PAT-000843', 'Nina Rossi · Infirmière', 'Aujourd’hui · 14:00', 'Planifiée'],
    ['MIS-000247|Prélèvement biologique', 'Marc Dubois|PAT-000844', 'Thomas Nguyen · Technicien', 'Terminée · 09:10', 'Terminée'],
    ['MIS-000246|Suivi cardiologie', 'Camille Bernard|PAT-000847', 'Dr. Sofia Martin', '23 oct. · 15:00', 'Terminée'],
  ],
  deliveries: [
    ['LIV-000381|Colis pharmacie secteur Est', 'Pharmacie des Terreaux', 'MIS-000249', 'Aujourd’hui · 11:45', 'En cours'],
    ['LIV-000380|Dispositifs de soins', 'Centre Médical Croix-Rousse', 'MIS-000244', 'Aujourd’hui · 09:30', 'Livrée'],
    ['LIV-000379|Traitement Camille B.', 'Camille Bernard', '—', '23 oct. · 16:00', 'Livrée'],
    ['LIV-000378|Consommables infirmiers', 'Cabinet du Parc', 'MIS-000241', '23 oct. · 13:15', 'Annulée'],
  ],
  documents: [
    ['CR-cardio-bernard.pdf|Compte-rendu cardiologie', 'Compte-rendu', 'PAT-000847 · Camille Bernard', 'v2', 'Aujourd’hui, 08:45'],
    ['resultats-labo-dubois.pdf|Résultats laboratoire', 'Résultat', 'PAT-000844 · Marc Dubois', 'v1', 'Hier, 15:22'],
    ['ORD-001932.pdf|Ordonnance signée', 'Ordonnance', 'ORD-001932 · Camille Bernard', 'v1', 'Aujourd’hui, 08:42'],
    ['ECG-bernard.png|Tracé ECG — octobre', 'Imagerie', 'PAT-000847 · Camille Bernard', 'v1', 'Aujourd’hui, 08:38'],
    ['fiche-mission-248.pdf|Fiche de mission', 'Mission', 'MIS-000248 · Youssef Haddad', 'v3', 'Aujourd’hui, 08:17'],
  ],
  team: [
    ['Sofia Martin|Cardiologie|SM', 'Médecin', 'Cardiologie', '24 / 28 créneaux', 'Actif'],
    ['Nina Rossi|Soins à domicile|NR', 'Infirmière', 'Soins à domicile', '18 / 20 créneaux', 'Actif'],
    ['Thomas Nguyen|Biologie|TN', 'Technicien', 'Biologie médicale', '12 / 16 créneaux', 'Actif'],
    ['Léa Moreau|Médecine interne|LM', 'Médecin', 'Médecine interne', '20 / 24 créneaux', 'Actif'],
    ['Inès Garcia|Soins infirmiers|IG', 'Infirmière', 'Pansements', 'Congé jusqu’au 28 oct.', 'Absent'],
  ],
  partners: [
    ['Centre Médical Croix-Rousse|Établissement|CM', 'Établissement de santé', 'Claire Fontaine · Directrice', 'Aujourd’hui, 09:20', 'Actif'],
    ['Pharmacie des Terreaux|Fournisseur|PT', 'Fournisseur', 'Julien Armand · Pharmacien', 'Hier, 16:10', 'Actif'],
    ['Cabinet du Parc|Client|CP', 'Client', 'Sophie Rey · Secrétariat', '22 oct. 2024', 'Actif'],
    ['Laboratoire Biolyon|Laboratoire|LB', 'Partenaire laboratoire', 'Omar Haddad · Responsable', '18 oct. 2024', 'Actif'],
  ],
  users: [
    ['Sofia Martin|sofia.martin@mediflow.local|SM', 'Administratrice · Médecin', 'Aujourd’hui, 08:42', 'Activée', 'Actif'],
    ['Nina Rossi|nina.rossi@mediflow.local|NR', 'Infirmière · Terrain', 'Aujourd’hui, 07:58', 'Activée', 'Actif'],
    ['Thomas Nguyen|thomas.nguyen@mediflow.local|TN', 'Technicien', 'Hier, 18:12', 'Activée', 'Actif'],
    ['Léa Moreau|lea.moreau@mediflow.local|LM', 'Médecin prescripteur', '23 oct. 2024', 'Non activée', 'Invitation en attente'],
  ],
  references: [
    ['Consultation générale|CONSULT-GEN|Stéthoscope', 'Type d’acte', 'CONSULT-GEN', 'Aujourd’hui, 08:15', 'Actif'],
    ['Cardiologie|CARDIO|HeartPulse', 'Type d’acte', 'CARDIO', '22 oct. 2024', 'Actif'],
    ['Pansement|PANSEMENT|Bandage', 'Soin infirmier', 'PANSEMENT', '20 oct. 2024', 'Actif'],
    ['Paracétamol 1 g|MED-001|Comprimé', 'Médicament', 'MED-001', '18 oct. 2024', 'Actif'],
    ['Amoxicilline 500 mg|MED-002|Gélule', 'Médicament', 'MED-002', '18 oct. 2024', 'Actif'],
  ],
  finance: [
    ['FAC-000128|Consultations octobre', 'Centre Médical Croix-Rousse', '24 oct. 2024', '4 820,00 €', 'Émise'],
    ['FAC-000127|Livraisons secteur Est', 'Pharmacie des Terreaux', '23 oct. 2024', '1 240,00 €', 'Payée'],
    ['FAC-000126|Suivi à domicile', 'Cabinet du Parc', '22 oct. 2024', '2 680,00 €', 'Partiellement payée'],
    ['FAC-000125|Interventions septembre', 'Centre Médical Croix-Rousse', '30 sept. 2024', '5 140,00 €', 'Payée'],
  ],
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

export function fallbackRecords(module: ModuleKey): ModuleRecord[] {
  return (moduleRows[module] ?? []).map((row) => ({ row }));
}

export async function loadModuleRecords(module: ModuleKey): Promise<ModuleRecord[] | null> {
  try {
    switch (module) {
      case 'patients': {
        const result = await apiClient.get<Paginated<Record<string, unknown>>>('/patients?page=1&pageSize=100');
        return result.data.map((item) => ({ id: String(item.id), remote: true, row: [`${item.firstName} ${item.lastName}|${item.code}|${age(String(item.birthDate ?? ''))}|${initials(String(item.firstName), String(item.lastName))}`, 'Dossier patient', '—', status(item.status), date(item.updatedAt)] }));
      }
      case 'prescriptions': {
        const result = await apiClient.get<Paginated<Record<string, unknown>>>('/prescriptions?page=1&pageSize=100');
        return result.data.map((item) => { const patient = item.patient as Record<string, unknown> | undefined; const prescriber = item.prescriber as Record<string, unknown> | undefined; const patientName = `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim(); return { id: String(item.id), remote: true, row: [`${item.code}|${patientName}|${patient?.code ?? ''}`, `${patientName}|${patient?.code ?? ''}`, `Dr. ${prescriber?.firstName ?? ''} ${prescriber?.lastName ?? ''}`.trim(), date(item.createdAt), status(item.status)] }; });
      }
      case 'inventory': {
        const result = await apiClient.get<Record<string, unknown>[]>('/inventory');
        return result.map((item) => ({ id: String(item.id), remote: true, row: [`${item.code}|${item.name}|${item.category ?? 'Stock'}`, String(item.category ?? 'Stock'), `${item.quantity ?? 0} ${item.unit ?? ''} / min. ${item.minQuantity ?? 0}`, String(item.location ?? '—'), Number(item.quantity ?? 0) <= Number(item.minQuantity ?? 0) ? 'Stock critique' : 'Disponible'] }));
      }
      case 'missions': {
        const result = await apiClient.get<Record<string, unknown>[]>('/missions');
        return result.map((item) => { const patient = item.patient as Record<string, unknown> | undefined; return { id: String(item.id), remote: true, row: [`${item.code}|${item.title}`, patient ? `${patient.firstName} ${patient.lastName}|${patient.code}` : 'Partenaire', String(item.assignedToId ?? 'Équipe à affecter'), date(item.scheduledAt), status(item.status)] }; });
      }
      case 'deliveries': {
        const result = await apiClient.get<Record<string, unknown>[]>('/deliveries');
        return result.map((item) => ({ id: String(item.id), remote: true, row: [`${item.code}|Bordereau`, String((item.partner as Record<string, unknown> | undefined)?.name ?? 'Destinataire'), '—', date(item.scheduledAt), status(item.status)] }));
      }
      case 'documents': {
        const result = await apiClient.get<Record<string, unknown>[]>('/documents');
        return result.map((item) => ({ id: String(item.id), remote: true, row: [`${item.fileName}|${item.title}`, String(item.category ?? 'Document'), String(item.entityType ?? '—'), 'v1', date(item.createdAt)] }));
      }
      case 'team': {
        const result = await apiClient.get<Record<string, unknown>[]>('/medical-staff');
        return result.map((item) => ({ id: String(item.id), remote: true, row: [`${item.firstName} ${item.lastName}|${item.specialty ?? '—'}|${initials(String(item.firstName), String(item.lastName))}`, String(item.staffType ?? 'Équipe'), String(item.specialty ?? '—'), 'Disponibilité à définir', item.isActive === false ? 'Absent' : 'Actif'] }));
      }
      case 'partners': {
        const result = await apiClient.get<Record<string, unknown>[]>('/partners');
        return result.map((item) => ({ id: String(item.id), remote: true, row: [`${item.name}|${item.kind ?? 'Partenaire'}|${initials(String(item.name).split(' ')[0], String(item.name).split(' ').slice(1).join(' '))}`, String(item.kind ?? 'Partenaire'), String(item.contactEmail ?? 'Contact à renseigner'), date(item.updatedAt), item.isActive === false ? 'Archivé' : 'Actif'] }));
      }
      case 'users': {
        const result = await apiClient.get<Record<string, unknown>[]>('/users');
        return result.map((item) => ({ id: String(item.id), remote: true, row: [`${item.firstName} ${item.lastName}|${item.email}|${initials(String(item.firstName), String(item.lastName))}`, 'Rôles à consulter', date(item.lastLoginAt), item.totpEnabled ? 'Activée' : 'Non activée', status(item.status)] }));
      }
      case 'references': {
        const [types, medications] = await Promise.all([
          apiClient.get<Record<string, unknown>[]>('/reference-data/types'),
          apiClient.get<Record<string, unknown>[]>('/reference-data/medications'),
        ]);
        return [...types.map((item) => ({ id: String(item.id), remote: true, row: [`${String((item.labels as Record<string, string> | undefined)?.fr ?? item.code)}|${item.code}|${item.icon ?? 'ListChecks'}`, 'Type d’acte', String(item.code), date(item.updatedAt), 'Actif'] })), ...medications.map((item) => ({ id: String(item.id), remote: true, row: [`${item.name}|${item.code}|${item.form ?? 'Médicament'}`, 'Médicament', String(item.code), date(item.updatedAt), 'Actif'] }))];
      }
      case 'finance': {
        const result = await apiClient.get<Record<string, unknown>[]>('/finance');
        return result.map((item) => ({ id: String(item.id), remote: true, row: [`${item.code}|${item.kind}`, String((item.partner as Record<string, unknown> | undefined)?.name ?? 'Partenaire'), date(item.createdAt), `${item.totalTtc ?? 0} ${item.currency ?? 'EUR'}`, status(item.status)] }));
      }
      case 'settings': return null;
    }
  } catch {
    // The UI remains usable in local demonstration mode when the API or the
    // database is not running. Mutations are still persisted in the browser.
    return null;
  }
}
