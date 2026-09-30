'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Archive, ArrowDownToLine, ArrowRight, Bandage, BarChart3, Check, ChevronLeft, ChevronRight, CircleAlert, CircleCheck,
  ClipboardCheck, ClipboardList, Download, FilePenLine, FilePlus2, FileText, Files, FolderHeart, FolderOpen, Handshake,
  HeartPulse, History, ListChecks, LoaderCircle, LockKeyhole, Mail, MapPinned, MoreHorizontal, Package, Pencil, Phone, Plus, ReceiptText,
  RotateCcw, Save, ScanLine, Search, Settings2, ShieldCheck, Stethoscope, Syringe, Trash2, Truck, UserRound, UsersRound, X,
  type LucideIcon,
} from 'lucide-react';
import { moduleConfigs } from '@/lib/module-config';
import { useUiLocale } from '@/lib/ui-i18n';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { hasPermission, readSession } from '@/lib/auth-store';
import { loadModuleRecords, loadModuleTrash, type CrudDraft, type ModuleKey, type ModuleRecord } from '@/lib/module-data';

const icons: Record<string, LucideIcon> = { FolderHeart, Syringe, Package, MapPinned, Truck, Files, Stethoscope, Handshake, UsersRound, ListChecks, ReceiptText, Settings2 };

type Config = (typeof moduleConfigs)[ModuleKey];
type Action = 'view' | 'create' | 'update' | 'archive' | 'delete' | 'delete_permanent' | 'export';

const permissionModule: Record<ModuleKey, string> = {
  patients: 'patients', prescriptions: 'prescriptions', inventory: 'inventory', missions: 'missions', deliveries: 'deliveries',
  documents: 'documents', team: 'medical-staff', partners: 'partners', users: 'users', references: 'references', finance: 'finance', settings: 'settings',
};

function Status({ value, label = value }: { value: string; label?: string }) {
  const tone = value.includes('critique') || value === 'Annulée' || value === 'Absent' || value === 'Archivé' ? 'status--critical' : value.includes('attente') || value === 'À signer' || value === 'Planifiée' || value === 'Brouillon' || value === 'Partiellement payée' ? 'status--pending' : value === 'En cours' ? 'status--progress' : 'status--active';
  return <span className={`status ${tone}`}>{label}</span>;
}

function PrimaryCell({ value, module }: { value: string; module: string }) {
  const pieces = value.split('|');
  const title = pieces[0] ?? '';
  const sub = pieces[1] ?? '';
  const initials = pieces[pieces.length - 1] ?? '';
  const isIdentity = ['patients', 'team', 'partners', 'users'].includes(module);
  if (!isIdentity) return <div><div className="patient-cell__name">{title}</div>{sub && <div className="patient-cell__code">{sub}</div>}</div>;
  return <div className="patient-cell"><span className="patient-cell__avatar">{initials?.length <= 3 ? initials : title.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><div className="patient-cell__name">{title}</div><div className="patient-cell__code">{sub}</div></div></div>;
}

function recordKey(record: ModuleRecord) { return record.id ?? record.row[0] ?? 'record-without-id'; }
function titleOf(record: ModuleRecord) { return record.row[0]?.split('|')[0] ?? 'Élément'; }
function getApiModule(module: ModuleKey) { return permissionModule[module]; }
function splitName(label: string) { const parts = label.trim().split(/\s+/); return { firstName: parts.shift() ?? label.trim(), lastName: parts.join(' ') || 'À compléter' }; }

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatPhone(value: string) {
  const digits = value.replace(/[^\d+]/g, '').slice(0, 16);
  return digits.replace(/(\+\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');
}
function statusCode(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('archiv')) return 'ARCHIVED';
  if (normalized.includes('brouillon')) return 'DRAFT';
  if (normalized.includes('sign')) return 'SIGNED';
  if (normalized.includes('livr')) return 'DELIVERED';
  if (normalized.includes('cours')) return 'IN_PROGRESS';
  if (normalized.includes('attente')) return 'PENDING';
  if (normalized.includes('pay')) return 'PAID';
  return value || 'ACTIVE';
}

export function ModuleView({ module }: { module: ModuleKey }) {
  const config = moduleConfigs[module];
  const Icon = icons[config.icon] ?? ClipboardList;
  const { t } = useUiLocale();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('search') ?? '';
  const shouldCreate = searchParams.get('create') === '1';
  const createOpened = useRef(false);
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<string>(config.tabs[0]);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<ModuleRecord | null>(null);
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; record?: ModuleRecord } | null>(null);
  const [actionRecord, setActionRecord] = useState<ModuleRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<ModuleRecord | null>(null);
  const [trashItems, setTrashItems] = useState<ModuleRecord[]>([]);
  const [trashOpen, setTrashOpen] = useState(false);
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const can = (action: Action) => hasPermission(getApiModule(module) as never, action as never, readSession());

  useEffect(() => {
    let active = true;
    setPage(1);
    setQuery(module === 'patients' ? initialQuery : '');
    setActiveTab(config.tabs[0]);
    setRecords([]);
    setTrashItems([]);
    setLoading(true);
    setLoadError(null);
    void loadModuleRecords(module).then((remote) => {
      if (active) setRecords(remote ?? []);
    }).catch(() => {
      if (active) setLoadError('Impossible de charger les données depuis l’API.');
    }).finally(() => { if (active) setLoading(false); });
    void loadModuleTrash(module).then((remoteTrash) => {
      if (active && remoteTrash) setTrashItems(remoteTrash);
    });
    return () => { active = false; };
  }, [config.tabs, initialQuery, module, reloadToken]);

  const filtered = useMemo(() => {
    const tab = String(activeTab).toLowerCase();
    return records.filter((record) => {
      const content = record.row.join(' ').toLowerCase();
      if (!content.includes(query.trim().toLowerCase())) return false;
      if (tab.startsWith('tous') || tab === 'toutes') return true;
      if (tab.includes('critique')) return content.includes('critique');
      if (tab.includes('actif')) return content.includes('actif') && !content.includes('archivé');
      if (tab.includes('archiv')) return content.includes('archiv');
      if (tab.includes('compléter')) return content.includes('compléter');
      if (tab.includes('en attente')) return content.includes('attente') || content.includes('pending');
      if (tab.includes('récent') || tab.includes('import')) return true;
      const normalized = tab.replaceAll('les ', '').replaceAll('tous ', '').replaceAll('toutes ', '').replaceAll('s', '');
      return content.includes(normalized);
    });
  }, [activeTab, query, records]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleRecords = filtered.slice((page - 1) * pageSize, page * pageSize);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  function setPageAndClamp(next: number) { setPage(Math.min(pageCount, Math.max(1, next))); }
  function openCreate() { if (can('create')) setEditor({ mode: 'create' }); else notify('Vous ne disposez pas de la permission de création.'); }
  function openEdit(record: ModuleRecord) { if (can('update')) { setEditor({ mode: 'edit', record }); setActionRecord(null); } else notify('Vous ne disposez pas de la permission de modification.'); }

  useEffect(() => {
    if (shouldCreate && !createOpened.current) {
      createOpened.current = true;
      openCreate();
    }
    if (!shouldCreate) createOpened.current = false;
  }, [module, shouldCreate]);

  async function createRemoteRecord(draft: CrudDraft): Promise<void> {
    const { firstName, lastName } = splitName(draft.label);
    if (module === 'patients') {
      await apiClient.post('/patients', { firstName, lastName, phone: draft.phone || undefined, email: draft.email || undefined, notes: draft.notes || undefined });
      return;
    }
    if (module === 'inventory') {
      await apiClient.post('/inventory', { name: draft.label, category: draft.category || undefined, unit: draft.unit, quantity: Number(draft.quantity), minQuantity: draft.minQuantity ? Number(draft.minQuantity) : undefined, location: draft.notes || undefined });
      return;
    }
    if (module === 'missions') {
      await apiClient.post('/missions', { title: draft.label, scheduledAt: new Date(draft.scheduledAt).toISOString(), notes: draft.notes || undefined });
      return;
    }
    if (module === 'deliveries') {
      await apiClient.post('/deliveries', { scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : undefined, trackingNote: draft.notes || undefined });
      return;
    }
    if (module === 'documents') {
      await apiClient.post('/documents/metadata', { title: draft.label, category: draft.category || 'Document', entityType: 'OTHER', fileName: draft.label, mimeType: 'application/octet-stream', storageKey: `pending/${draft.label}`, sizeBytes: 0, metadata: { notes: draft.notes || undefined } });
      return;
    }
    if (module === 'team') {
      await apiClient.post('/medical-staff', { firstName, lastName, staffType: 'OTHER', specialty: draft.category || undefined, phone: draft.phone || undefined, email: draft.email || undefined });
      return;
    }
    if (module === 'partners') {
      await apiClient.post('/partners', { name: draft.label, kind: draft.category || 'Partenaire', contactName: `${firstName} ${lastName}`, phone: draft.phone || undefined, email: draft.email || undefined, notes: draft.notes || undefined });
      return;
    }
    if (module === 'users') {
      await apiClient.post('/users', { firstName, lastName, email: draft.email, phone: draft.phone || undefined });
      return;
    }
    if (module === 'prescriptions') {
      await apiClient.post('/prescriptions', { patientId: draft.patientId, prescriberId: draft.prescriberId, instructions: draft.notes || undefined, items: [{ manualName: draft.label, dosage: draft.category || undefined, instructions: draft.notes || undefined }] });
      return;
    }
    if (module === 'references') {
      await apiClient.post('/reference-data/types', { kind: 'CONSULTATION', code: draft.code, labels: { fr: draft.label, en: draft.label, ar: draft.label, es: draft.label }, icon: 'ListChecks' });
      return;
    }
    if (module === 'finance') {
      await apiClient.post('/finance', { kind: draft.label, currency: draft.currency, lines: [{ label: draft.label, quantity: 1, unitPriceHt: Number(draft.amountHt), vatRate: Number(draft.vatRate) }] });
      return;
    }
    throw new Error('Ce module ne propose pas cette opération via l’API.');
  }

  async function updateRemoteRecord(record: ModuleRecord, draft: CrudDraft): Promise<void> {
    if (!record.id) throw new Error('Identifiant API manquant.');
    const { firstName, lastName } = splitName(draft.label);
    if (module === 'patients') {
      await apiClient.patch(`/patients/${record.id}`, { firstName, lastName, phone: draft.phone || undefined, email: draft.email || undefined, notes: draft.notes || undefined });
      return;
    }
    if (module === 'inventory') {
      await apiClient.patch(`/inventory/${record.id}`, { name: draft.label, category: draft.category || undefined, unit: draft.unit || undefined, quantity: draft.quantity === '' ? undefined : Number(draft.quantity), minQuantity: draft.minQuantity === '' ? undefined : Number(draft.minQuantity), location: draft.notes || undefined });
      return;
    }
    if (module === 'missions') {
      await apiClient.patch(`/missions/${record.id}`, { title: draft.label, scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : undefined, notes: draft.notes || undefined });
      return;
    }
    if (module === 'deliveries') {
      await apiClient.patch(`/deliveries/${record.id}`, { scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : undefined, trackingNote: draft.notes || undefined, status: draft.status });
      return;
    }
    if (module === 'documents') {
      await apiClient.patch(`/documents/${record.id}`, { title: draft.label, category: draft.category || undefined, metadata: { notes: draft.notes || undefined } });
      return;
    }
    if (module === 'team') {
      await apiClient.patch(`/medical-staff/${record.id}`, { firstName, lastName, specialty: draft.category || undefined, phone: draft.phone || undefined, email: draft.email || undefined });
      return;
    }
    if (module === 'partners') {
      await apiClient.patch(`/partners/${record.id}`, { name: draft.label, kind: draft.category || undefined, phone: draft.phone || undefined, email: draft.email || undefined, notes: draft.notes || undefined });
      return;
    }
    if (module === 'users') {
      await apiClient.patch(`/users/${record.id}`, { firstName, lastName, email: draft.email || undefined, phone: draft.phone || undefined });
      return;
    }
    if (module === 'references') {
      const endpoint = record.row[1]?.toLowerCase().includes('médicament') ? 'medications' : 'types';
      if (endpoint === 'medications') await apiClient.patch(`/reference-data/${endpoint}/${record.id}`, { name: draft.label, form: draft.category || undefined });
      else await apiClient.patch(`/reference-data/${endpoint}/${record.id}`, { code: draft.code, labels: { fr: draft.label }, icon: 'ListChecks' });
      return;
    }
    if (module === 'finance') {
      await apiClient.patch(`/finance/${record.id}`, { kind: draft.label, currency: draft.currency || undefined, status: draft.status, notes: draft.notes || undefined });
      return;
    }
    if (module === 'prescriptions') {
      await apiClient.patch(`/prescriptions/${record.id}`, { patientId: draft.patientId, prescriberId: draft.prescriberId, instructions: draft.notes || undefined });
      return;
    }
    throw new Error('Ce module ne propose pas cette opération via l’API.');
  }

  async function saveRecord(mode: 'create' | 'edit', draft: CrudDraft, initial?: ModuleRecord) {
    try {
      if (mode === 'create') await createRemoteRecord(draft);
      else await updateRemoteRecord(initial ?? { row: [] }, draft);
      const refreshed = await loadModuleRecords(module);
      if (!refreshed) throw new Error('La liste du module n’a pas pu être resynchronisée.');
      setRecords(refreshed);
      const refreshedTrash = await loadModuleTrash(module);
      if (refreshedTrash) setTrashItems(refreshedTrash);
      setEditor(null);
      notify(mode === 'create' ? 'Entrée créée et relue depuis PostgreSQL' : 'Modifications enregistrées et relues depuis PostgreSQL');
    } catch (error) {
      notify(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : 'Impossible d’enregistrer cette entrée dans l’API.');
    }
  }

  async function archiveRemote(record: ModuleRecord) {
    if (!record.id || !record.remote) return;
    if (module === 'patients' && can('archive') && !can('delete')) {
      await apiClient.post(`/patients/${record.id}/archive`, {});
      return;
    }
    const endpoints: Partial<Record<ModuleKey, string>> = { patients: 'patients', prescriptions: 'prescriptions', inventory: 'inventory', missions: 'missions', deliveries: 'deliveries', documents: 'documents', team: 'medical-staff', partners: 'partners', users: 'users', finance: 'finance' };
    if (module === 'references') {
      const endpoint = record.row[1]?.toLowerCase().includes('médicament') ? 'medications' : 'types';
      await apiClient.delete(`/reference-data/${endpoint}/${record.id}`);
      return;
    }
    const endpoint = endpoints[module];
    if (endpoint) await apiClient.delete(`/${endpoint}/${record.id}`);
  }

  function requestDelete(record: ModuleRecord) {
    if (!can('delete') && !can('archive')) { notify('Vous ne disposez pas de la permission de suppression.'); return; }
    setActionRecord(null);
    setDeleteRecord(record);
  }

  async function moveToTrash(record: ModuleRecord) {
    setActionRecord(null);
    try {
      await archiveRemote(record);
      const [refreshed, refreshedTrash] = await Promise.all([loadModuleRecords(module), loadModuleTrash(module)]);
      if (!refreshed || !refreshedTrash) throw new Error('La corbeille n’a pas pu être resynchronisée.');
      setRecords(refreshed);
      setTrashItems(refreshedTrash);
      notify(`${titleOf(record)} placé dans la corbeille et relu depuis l’API`);
    } catch (error) {
      notify(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : 'Impossible de déplacer cette entrée vers la corbeille.');
    }
  }

  async function restoreRemote(record: ModuleRecord) {
    if (!record.id || !record.remote) throw new Error('Identifiant API manquant.');
    if (module === 'references') {
      const endpoint = record.row[1]?.toLowerCase().includes('médicament') ? 'medications' : 'types';
      await apiClient.post(`/reference-data/${endpoint}/${record.id}/restore`, {});
      return;
    }
    const endpoints: Partial<Record<ModuleKey, string>> = { patients: 'patients', prescriptions: 'prescriptions', inventory: 'inventory', missions: 'missions', deliveries: 'deliveries', documents: 'documents', team: 'medical-staff', partners: 'partners', users: 'users', finance: 'finance' };
    const endpoint = endpoints[module];
    if (endpoint) await apiClient.post(`/${endpoint}/${record.id}/restore`, {});
  }

  async function restoreRecord(record: ModuleRecord) {
    if (!can('update')) { notify('Vous ne disposez pas de la permission de restaurer cet élément.'); return; }
    try {
      await restoreRemote(record);
      const [refreshed, refreshedTrash] = await Promise.all([loadModuleRecords(module), loadModuleTrash(module)]);
      if (!refreshed || !refreshedTrash) throw new Error('Les listes n’ont pas pu être resynchronisées.');
      setRecords(refreshed);
      setTrashItems(refreshedTrash);
      notify(`${titleOf(record)} restauré et relu depuis l’API`);
    } catch (error) {
      notify(error instanceof ApiClientError ? `Restauration impossible : ${error.message}` : error instanceof Error ? error.message : 'Restauration impossible, veuillez réessayer');
    }
  }

  async function emptyTrash() {
    if (!can('delete_permanent')) { notify('Vous ne disposez pas de la permission de suppression définitive.'); return; }
    if (!window.confirm('Supprimer définitivement les éléments de la corbeille ? Cette action est irréversible.')) return;
    const remoteItems = trashItems.filter((record) => record.remote && record.id);
    try {
      const endpoint = module === 'references' ? undefined : ({ patients: 'patients', prescriptions: 'prescriptions', inventory: 'inventory', missions: 'missions', deliveries: 'deliveries', documents: 'documents', team: 'medical-staff', partners: 'partners', users: 'users', finance: 'finance' } as Partial<Record<ModuleKey, string>>)[module];
      if (module === 'references') {
        await Promise.all(remoteItems.map((record) => {
          const referenceEndpoint = record.row[1]?.toLowerCase().includes('médicament') ? 'medications' : 'types';
          return apiClient.delete(`/reference-data/${referenceEndpoint}/${record.id}/permanent`);
        }));
      } else if (endpoint) {
        await Promise.all(remoteItems.map((record) => apiClient.delete(`/${endpoint}/${record.id}/permanent`)));
      }
      const [refreshed, refreshedTrash] = await Promise.all([loadModuleRecords(module), loadModuleTrash(module)]);
      if (!refreshed || !refreshedTrash) throw new Error('La corbeille n’a pas pu être resynchronisée.');
      setRecords(refreshed);
      setTrashItems(refreshedTrash);
      setTrashOpen(false);
      notify('Corbeille vidée et relue depuis l’API');
    } catch (error) {
      notify(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : 'Impossible de vider complètement la corbeille.');
    }
  }

  function exportCsv() {
    if (!can('export')) { notify('Vous ne disposez pas de la permission d’export.'); return; }
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [config.columns.map((column) => escape(t(column))).join(';'), ...filtered.map((record) => record.row.map((cell) => escape(cell.replaceAll('|', ' · '))).join(';'))].join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `mediflow-${module}-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
    notify(`${filtered.length} entrée(s) exportée(s)`);
  }

  if (module === 'settings') return <SettingsPanel onNotify={notify} canEdit={can('update')} />;

  return <div className="page-container">
    <section className="page-heading"><div><div className="eyebrow">{t(config.eyebrow)}</div><h1>{t(config.title)}</h1><p>{t(config.description)}</p></div><div className="heading-actions"><button className="icon-button action-icon action-icon--trash" aria-label={t('Corbeille')} title={can('view') ? t('Corbeille') : 'Consultation non autorisée'} disabled={!can('view')} onClick={() => setTrashOpen(true)}><Trash2 />{trashItems.length > 0 && <span className="action-count">{trashItems.length}</span>}</button><button className="btn btn-secondary" onClick={exportCsv} disabled={!can('export')}><Download /> {t('Exporter')}</button><button className="btn btn-primary" onClick={openCreate} disabled={!can('create')}><Plus /><span>{t(config.primary)}</span></button></div></section>
    <section className="card module-list-card"><div className="module-toolbar"><div className="filter-search"><Search /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={`${t('Rechercher')} dans ${t(config.title).toLowerCase()}...`} aria-label={`${t('Rechercher')} dans ${t(config.title)}`} /></div><div className="filter-tabs">{config.tabs.map((tab) => <button type="button" className={`filter-tab ${activeTab === tab ? 'is-active' : ''}`} key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}>{t(tab)}</button>)}</div><button type="button" className="btn btn-secondary" onClick={() => { setQuery(''); setActiveTab(config.tabs[0]); setPage(1); notify('Filtres réinitialisés'); }}><ListChecks /> {t('Filtres')}</button></div>
      {loading && <div className="sync-status"><LoaderCircle className="spin" /> Chargement depuis PostgreSQL…</div>}
      {loadError && !loading ? <div className="empty-state empty-state--error"><div className="empty-state__icon"><CircleAlert /></div><h3>Données indisponibles</h3><p>{loadError}</p><button type="button" className="btn btn-secondary" onClick={() => setReloadToken((value) => value + 1)}><RotateCcw /> Réessayer</button></div> : !loading && visibleRecords.length === 0 ? <div className="empty-state"><div className="empty-state__icon"><Search /></div><h3>{query || activeTab !== config.tabs[0] ? 'Aucun résultat' : 'Aucune donnée enregistrée'}</h3><p>{query || activeTab !== config.tabs[0] ? 'Modifiez votre recherche ou vos filtres.' : 'Les enregistrements créés dans PostgreSQL apparaîtront ici.'}</p></div> : !loading && <div className="table-wrap"><table className="data-table"><thead><tr>{config.columns.map((column) => <th key={column}>{t(column)}</th>)}<th aria-label={t('Actions')}>{t('Actions')}</th></tr></thead><tbody>{visibleRecords.map((record) => <tr key={recordKey(record)} onClick={() => setSelected(record)} className="cursor-pointer"><td><PrimaryCell value={record.row[0] ?? ''} module={module} /></td>{record.row.slice(1).map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cellIndex === record.row.length - 2 ? <Status value={cell} label={t(cell)} /> : (cell.includes('|') && ['prescriptions', 'missions', 'deliveries'].includes(module) && cellIndex === 0 ? <PrimaryCell value={cell} module="patients" /> : cell)}</td>)}<td><button type="button" className="icon-button action-icon action-icon--more" aria-label={`${t('Actions')} ${titleOf(record)}`} title={t('Actions')} onClick={(event) => { event.stopPropagation(); setActionRecord(record); }}><MoreHorizontal /></button></td></tr>)}</tbody></table></div>}
      <div className="table-footer"><span className="table-footer__count">{filtered.length} résultat{filtered.length > 1 ? 's' : ''} · source : PostgreSQL</span><div className="pagination"><button type="button" aria-label="Page précédente" disabled={page <= 1} onClick={() => setPageAndClamp(page - 1)}><ChevronLeft /></button><button type="button" className="is-current">{page}</button><button type="button" aria-label="Page suivante" disabled={page >= pageCount} onClick={() => setPageAndClamp(page + 1)}><ChevronRight /></button></div></div>
    </section>
    {selected && (module === 'patients' ? <PatientDrawer record={selected} canEdit={can('update')} canPrescriptions={hasPermission('prescriptions', 'view', readSession())} canDocuments={hasPermission('documents', 'view', readSession())} onClose={() => setSelected(null)} onNotify={notify} onEdit={() => { setSelected(null); openEdit(selected); }} /> : <RecordDetailsDialog record={selected} config={config} t={t} onClose={() => setSelected(null)} />)}
    {actionRecord && <ActionSheet module={module} record={actionRecord} t={t} can={can} onClose={() => setActionRecord(null)} onView={() => { setSelected(actionRecord); setActionRecord(null); }} onEdit={() => openEdit(actionRecord)} onArchive={() => requestDelete(actionRecord)} onDelete={() => requestDelete(actionRecord)} />}
    {editor && <CrudDialog key={`${editor.mode}-${recordKey(editor.record ?? { row: ['new'] })}`} module={module} config={config} mode={editor.mode} initial={editor.record} t={t} onClose={() => setEditor(null)} onSave={(mode, draft) => saveRecord(mode, draft, editor.record)} />}
    {deleteRecord && <DeleteConfirmDialog record={deleteRecord} t={t} onClose={() => setDeleteRecord(null)} onConfirm={() => { const record = deleteRecord; setDeleteRecord(null); moveToTrash(record); }} />}
    {trashOpen && <TrashDialog items={trashItems} t={t} canRestore={can('update')} canEmpty={can('delete_permanent')} onClose={() => setTrashOpen(false)} onRestore={restoreRecord} onEmpty={emptyTrash} />}
    {toast && <div className="toast" role="status"><CircleCheck />{toast}</div>}
  </div>;
}

function ActionSheet({ module, record, t, can, onClose, onView, onEdit, onArchive, onDelete }: { module: ModuleKey; record: ModuleRecord; t: (value: string) => string; can: (action: Action) => boolean; onClose: () => void; onView: () => void; onEdit: () => void; onArchive: () => void; onDelete: () => void }) {
  const title = titleOf(record);
  const archiveModules = ['patients', 'team', 'partners', 'users'];
  const actionItems = [
    { key: 'view' as const, label: t('Consulter'), description: 'Ouvrir la fiche détaillée', icon: ClipboardCheck, onClick: onView, allowed: can('view'), tone: 'action-tile--view' },
    { key: 'update' as const, label: t('Modifier'), description: 'Éditer avec validation', icon: FilePenLine, onClick: onEdit, allowed: can('update'), tone: 'action-tile--edit' },
    ...(archiveModules.includes(module) ? [{ key: 'archive' as const, label: t('Archiver'), description: 'Retirer des listes actives', icon: Archive, onClick: onArchive, allowed: can('archive'), tone: 'action-tile--archive' }] : []),
    ...(archiveModules.includes(module) && module !== 'patients' ? [] : [{ key: 'delete' as const, label: t('Supprimer'), description: 'Déplacer vers la corbeille', icon: Trash2, onClick: onDelete, allowed: can('delete'), tone: 'action-tile--delete' }]),
  ];
  const allowedCount = actionItems.filter((item) => item.allowed).length;

  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="action-sheet glass-panel" role="dialog" aria-modal="true" aria-labelledby="action-sheet-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="dialog__header">
        <div><div className="eyebrow">Actions</div><h2 id="action-sheet-title">{title}</h2><p>Chaque action est validée par l’API et respecte les permissions de votre session.</p></div>
        <button className="icon-button" type="button" aria-label={t('Fermer')} onClick={onClose}><X /></button>
      </div>
      <div className="action-grid">
        {actionItems.map(({ key, label, description, icon: ActionIcon, onClick, allowed, tone }) => <button key={key} type="button" className={`action-tile ${tone} ${allowed ? '' : 'is-disabled'}`} disabled={!allowed} aria-disabled={!allowed} title={allowed ? label : 'Permission non accordée'} onClick={allowed ? onClick : undefined}>
          {allowed ? <ActionIcon /> : <LockKeyhole />}
          <span>{label}</span>
          <small>{allowed ? description : 'Permission non accordée pour votre rôle'}</small>
        </button>)}
      </div>
      {allowedCount === 0 && <div className="action-sheet__notice"><LockKeyhole /> Votre session ne possède aucune permission d’action sur cet enregistrement. Rechargez vos permissions ou contactez un administrateur.</div>}
    </section>
  </div>;
}

function CrudDialog({ module, config, mode, initial, t, onClose, onSave }: { module: ModuleKey; config: Config; mode: 'create' | 'edit'; initial?: ModuleRecord; t: (value: string) => string; onClose: () => void; onSave: (mode: 'create' | 'edit', draft: CrudDraft) => Promise<void> | void }) {
  const parts = initial?.row[0]?.split('|') ?? [];
  const source = initial?.data ?? {};
  const initialLabel = source.name ?? source.title ?? (source.firstName && source.lastName ? `${source.firstName} ${source.lastName}` : undefined) ?? parts[0] ?? '';
  const [label, setLabel] = useState(String(initialLabel));
  const [code, setCode] = useState(String(source.code ?? parts[1] ?? ''));
  const [phone, setPhone] = useState(String(source.phone ?? ''));
  const [email, setEmail] = useState(String(source.email ?? ''));
  const [category, setCategory] = useState(String(source.category ?? source.kind ?? ''));
  const [unit, setUnit] = useState(String(source.unit ?? ''));
  const [quantity, setQuantity] = useState(String(source.quantity ?? ''));
  const [minQuantity, setMinQuantity] = useState(String(source.minQuantity ?? ''));
  const sourceLine = Array.isArray(source.lines) && source.lines[0] && typeof source.lines[0] === 'object' ? source.lines[0] as Record<string, unknown> : undefined;
  const [currency, setCurrency] = useState(String(source.currency ?? ''));
  const [amountHt, setAmountHt] = useState(String(sourceLine?.unitPriceHt ?? ''));
  const [vatRate, setVatRate] = useState(String(sourceLine?.vatRate ?? ''));
  const [status, setStatus] = useState(statusCode(String(source.status ?? parts.at(-1) ?? 'ACTIVE')));
  const [scheduledAt, setScheduledAt] = useState(source.scheduledAt ? String(source.scheduledAt).slice(0, 16) : '');
  const [patientId, setPatientId] = useState(String(source.patientId ?? ''));
  const [prescriberId, setPrescriberId] = useState(String(source.prescriberId ?? ''));
  const [notes, setNotes] = useState(String(source.notes ?? ''));
  const [tab, setTab] = useState<'identity' | 'analysis' | 'care' | 'notes'>('identity');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const title = mode === 'create' ? t(config.primary) : `${t('Modifier')} · ${t(config.title)}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim()) { setError('Le libellé ou le nom est obligatoire.'); setTab('identity'); return; }
    if (module === 'references' && !code.trim()) { setError('Le code du référentiel est obligatoire.'); setTab('identity'); return; }
    if (module === 'missions' && !scheduledAt) { setError('La date de planification est obligatoire.'); setTab('identity'); return; }
    if (module === 'inventory' && mode === 'create' && quantity === '') { setError('La quantité initiale est obligatoire.'); setTab('identity'); return; }
    if (module === 'finance' && mode === 'create' && (!currency || amountHt === '' || vatRate === '')) { setError('La devise, le montant hors taxes et le taux de TVA sont obligatoires.'); setTab('identity'); return; }
    if (module === 'prescriptions' && (!patientId.trim() || !prescriberId.trim())) { setError('Les identifiants patient et prescripteur sont obligatoires pour une ordonnance.'); setTab('identity'); return; }
    const draft: CrudDraft = { label: label.trim(), code: code.trim().toUpperCase(), phone, email: email.trim(), category: category.trim(), unit: unit.trim(), quantity, minQuantity, currency, amountHt, vatRate, status, scheduledAt, patientId: patientId.trim(), prescriberId: prescriberId.trim(), notes: notes.trim() };
    setPending(true);
    try { await onSave(mode, draft); } finally { setPending(false); }
  }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel crud-dialog" role="dialog" aria-modal="true" aria-labelledby="crud-dialog-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">{mode === 'create' ? 'Nouveau workflow' : 'Fiche sécurisée'}</div><h2 id="crud-dialog-title">{title}</h2><p>Les champs marqués d’un astérisque sont obligatoires. Les modifications sont persistées avant synchronisation.</p></div><button className="icon-button" type="button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div><div className="dialog-tabs"><button className={tab === 'identity' ? 'is-active' : ''} type="button" onClick={() => setTab('identity')}><UserRound /> {t('Identité')}</button><button className={tab === 'analysis' ? 'is-active' : ''} type="button" onClick={() => setTab('analysis')}><ClipboardCheck /> {t('Analyses')}</button><button className={tab === 'care' ? 'is-active' : ''} type="button" onClick={() => setTab('care')}><HeartPulse /> {t('Soins spéciaux')}</button><button className={tab === 'notes' ? 'is-active' : ''} type="button" onClick={() => setTab('notes')}><FileText /> {t('Notes et remarques')}</button></div><form className="dialog__body" onSubmit={submit}>{tab === 'identity' && <div className="form-grid"><label>Nom ou libellé *<input autoFocus required value={label} onChange={(event) => setLabel(event.target.value)} aria-invalid={Boolean(error)} placeholder="Nom complet ou désignation" /></label><label>Code de référence {module === 'references' ? '*' : ''}<input required={module === 'references'} readOnly={module === 'patients'} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder={module === 'patients' ? 'Généré par PostgreSQL' : 'CODE-000001'} /></label>{['patients', 'team', 'partners', 'users'].includes(module) && <label>Téléphone<input value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} inputMode="tel" placeholder="+33 6 00 00 00 00" /></label>}{['patients', 'team', 'partners', 'users'].includes(module) && <label>Adresse e-mail<input required={module === 'users'} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contact@exemple.fr" /></label>}{['inventory', 'references', 'partners'].includes(module) && <label>Catégorie / type<input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Catégorie métier" /></label>}{module === 'inventory' && <><label>Unité de stock *<input required value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="unité, boîte, flacon…" /></label><label>Quantité initiale {mode === 'create' ? '*' : ''}<input required={mode === 'create'} type="number" min="0" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Non renseignée" /></label><label>Seuil minimum<input type="number" min="0" step="any" value={minQuantity} onChange={(event) => setMinQuantity(event.target.value)} placeholder="Non renseigné" /></label></>}{module === 'finance' && <><label>Devise *<select required={mode === 'create'} value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="">Sélectionner</option><option value="EUR">EUR</option><option value="CAD">CAD</option><option value="USD">USD</option></select></label><label>Montant hors taxes {mode === 'create' ? '*' : ''}<input required={mode === 'create'} type="number" min="0" step="0.01" value={amountHt} onChange={(event) => setAmountHt(event.target.value)} placeholder="Montant saisi par l’utilisateur" /></label><label>TVA (%) {mode === 'create' ? '*' : ''}<input required={mode === 'create'} type="number" min="0" step="0.001" value={vatRate} onChange={(event) => setVatRate(event.target.value)} placeholder="Taux configuré" /></label></>}{['missions', 'deliveries'].includes(module) && <label>Échéance<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label>}{module === 'prescriptions' && <><label>Identifiant patient *<input required value={patientId} onChange={(event) => setPatientId(event.target.value)} placeholder="UUID du patient" /></label><label>Identifiant prescripteur *<input required value={prescriberId} onChange={(event) => setPrescriberId(event.target.value)} placeholder="UUID du personnel médical" /></label></>}<label>Statut<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ACTIVE">Actif</option><option value="DRAFT">Brouillon</option><option value="PLANNED">Planifiée</option><option value="IN_PROGRESS">En cours</option><option value="DELIVERED">Livrée</option><option value="PAID">Payée</option><option value="ARCHIVED">Archivé</option></select></label><p className="form-grid__full form-help">Les champs métier complémentaires sont disponibles dans les onglets Analyses, Soins spéciaux et Notes.</p></div>}{tab === 'analysis' && <div className="workflow-panel"><div className="workflow-panel__intro"><ClipboardCheck /><div><strong>Workflow des analyses</strong><span>Suivez les étapes de prescription, prélèvement, validation et archivage.</span></div></div>{['Demande enregistrée', 'Prélèvement planifié', 'Résultat contrôlé', 'Résultat transmis au patient'].map((step, index) => <label className="workflow-step" key={step}><input type="checkbox" defaultChecked={index === 0} /><span className="workflow-step__number">{index + 1}</span><span><strong>{step}</strong><small>Responsable, date et pièce jointe obligatoires</small></span></label>)}<p className="workflow-panel__hint"><FilePlus2 /> Ajoutez la pièce jointe depuis la gestion documentaire après l’enregistrement du workflow.</p></div>}{tab === 'care' && <div className="workflow-panel"><div className="workflow-panel__intro workflow-panel__intro--coral"><HeartPulse /><div><strong>Soins spéciaux</strong><span>Définissez les précautions et consignes visibles par l’équipe.</span></div></div><div className="care-checks"><label><input type="checkbox" /> Allergie ou intolérance</label><label><input type="checkbox" /> Mobilité réduite</label><label><input type="checkbox" /> Isolement requis</label><label><input type="checkbox" /> Matériel spécifique</label></div><label className="form-grid__full">Consignes de soins<textarea rows={4} placeholder="Précautions, fréquence, matériel, personne à prévenir…" /></label></div>}{tab === 'notes' && <div className="notes-panel"><label>Notes et remarques<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} placeholder="Ajoutez les observations utiles à l’équipe…" /></label><div className="notes-panel__hint"><History /> Chaque modification est historisée et associée à votre utilisateur.</div></div>}{error && <div className="form-error" role="alert"><CircleAlert />{error}</div>}<div className="dialog__footer"><button type="button" className="btn btn-secondary" onClick={onClose}>{t('Annuler')}</button><button type="submit" className="btn btn-primary" disabled={pending}>{pending ? <LoaderCircle className="spin" /> : <Save />} {pending ? 'Enregistrement…' : t('Enregistrer')}</button></div></form></section></div>;
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (value instanceof Date) return value.toLocaleString('fr-FR');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function RecordDetailsDialog({ record, config, t, onClose }: { record: ModuleRecord; config: Config; t: (value: string) => string; onClose: () => void }) {
  const rawFields = Object.entries(record.data ?? {}).filter(([key, value]) => !['id', 'createdAt', 'updatedAt', 'deletedAt'].includes(key) && (typeof value !== 'object' || value === null)).slice(0, 10);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="record-details-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Consultation détaillée</div><h2 id="record-details-title">{titleOf(record)}</h2><p>{record.id ? `Identifiant API : ${record.id}` : 'Identifiant API indisponible.'}</p></div><button className="icon-button" type="button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div><div className="dialog__body detail-list">{config.columns.map((column, index) => <div className="detail-row" key={`column-${column}`}><span className="detail-row__icon"><FileText /></span><div><div className="detail-row__label">{t(column)}</div><div className="detail-row__value">{(record.row[index] ?? '—').replaceAll('|', ' · ')}</div></div></div>)}{rawFields.map(([key, value]) => <div className="detail-row" key={`raw-${key}`}><span className="detail-row__icon"><ClipboardList /></span><div><div className="detail-row__label">{key}</div><div className="detail-row__value">{displayValue(value)}</div></div></div>)}{record.deletionReason && <div className="detail-row"><span className="detail-row__icon is-danger"><Trash2 /></span><div><div className="detail-row__label">Motif de retrait</div><div className="detail-row__value">{record.deletionReason}</div></div></div>}</div><div className="dialog__footer"><button className="btn btn-primary" type="button" onClick={onClose}><Check /> {t('Fermer')}</button></div></section></div>;
}

function DeleteConfirmDialog({ record, t, onClose, onConfirm }: { record: ModuleRecord; t: (value: string) => string; onClose: () => void; onConfirm: () => void }) {
  const title = titleOf(record);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Suppression protégée</div><h2 id="delete-dialog-title">Retirer « {title} » ?</h2><p>L’élément sera déplacé vers la corbeille. La suppression définitive nécessite une confirmation séparée.</p></div><button className="icon-button" type="button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div><div className="dialog__body delete-dialog__body"><div className="delete-summary"><Trash2 /><div><strong>{title}</strong><span>{record.row[0]?.split('|')[1] ?? 'Élément métier'}</span></div></div><p className="delete-dialog__note">Aucune donnée métier locale n’est conservée : l’état du retrait est relu depuis l’API et exposé dans la corbeille.</p><div className="form-error form-error--warning"><CircleAlert /> La suppression est logique : l’élément pourra être restauré depuis la corbeille.</div></div><div className="dialog__footer"><button className="btn btn-secondary" type="button" onClick={onClose}>{t('Annuler')}</button><button className="btn btn-danger" type="button" onClick={onConfirm}><Trash2 /> Confirmer le retrait</button></div></section></div>;
}

function TrashDialog({ items, t, canRestore, canEmpty, onClose, onRestore, onEmpty }: { items: ModuleRecord[]; t: (value: string) => string; canRestore: boolean; canEmpty: boolean; onClose: () => void; onRestore: (record: ModuleRecord) => void; onEmpty: () => void }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel trash-dialog" role="dialog" aria-modal="true" aria-labelledby="trash-dialog-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Récupération</div><h2 id="trash-dialog-title">{t('Corbeille')}</h2><p>Les éléments peuvent être restaurés avant suppression définitive.</p></div><button className="icon-button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div>{items.length === 0 ? <div className="trash-empty"><Trash2 /><h3>{t('Aucune entrée dans la corbeille.')}</h3><p>Les suppressions et archivages apparaîtront ici.</p></div> : <div className="trash-list">{items.map((record) => <div className="trash-item" key={recordKey(record)}><div className="action-icon action-icon--delete"><Trash2 /></div><div><strong>{titleOf(record)}</strong><span>{record.row[0]?.split('|')[1] ?? 'Élément archivé'}</span></div><button className="btn btn-secondary" disabled={!canRestore} title={canRestore ? t('Restaurer') : 'Permission de restauration requise'} onClick={() => onRestore(record)}><RotateCcw /> {t('Restaurer')}</button></div>)}</div>}<div className="dialog__footer"><button className="btn btn-secondary" onClick={onClose}>{t('Fermer')}</button>{items.length > 0 && <button className="btn btn-danger" disabled={!canEmpty} title={canEmpty ? 'Supprimer définitivement' : 'Permission delete_permanent requise'} onClick={onEmpty}><Trash2 /> Vider la corbeille</button>}</div></section></div>;
}

function PatientDrawer({ record, canEdit, canPrescriptions, canDocuments, onClose, onNotify, onEdit }: { record: ModuleRecord; canEdit: boolean; canPrescriptions: boolean; canDocuments: boolean; onClose: () => void; onNotify: (message: string) => void; onEdit: () => void }) {
  const [name, code, age, initials] = (record.row[0] ?? '').split('|');
  const data = record.data ?? {};
  const phone = String(data.phone ?? 'Téléphone non renseigné');
  const email = String(data.email ?? 'E-mail non renseigné');
  const notes = String(data.notes ?? 'Aucune remarque clinique renseignée.');
  const nextAction = Array.isArray(data.actions) ? (data.actions[0] as Record<string, unknown> | undefined) : undefined;
  const status = String(data.status ?? '');
  return <div className="drawer-backdrop" onClick={onClose}><aside className="patient-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div className="patient-cell"><span className="patient-cell__avatar drawer-avatar">{initials}</span><div><div className="patient-cell__name">{name}</div><div className="patient-cell__code">{code} · {age}</div></div></div><div className="drawer-head__actions"><button className="icon-button action-icon action-icon--edit" aria-label="Modifier" title={canEdit ? 'Modifier' : 'Modification non autorisée'} disabled={!canEdit} onClick={onEdit}><FilePenLine /></button><button className="icon-button" aria-label="Fermer" onClick={onClose}><X /></button></div></div><div className="drawer-body"><div className={`status ${status === 'ACTIVE' ? 'status--active' : 'status--pending'}`}>{status ? status : 'Statut non renseigné'}</div><div className="drawer-section"><div className="drawer-label">Coordonnées</div><div className="drawer-contact"><span><PhoneIcon /> {phone}</span><span><MailIcon /> {email}</span></div></div><div className="drawer-section"><div className="drawer-label">Résumé clinique</div><p className="drawer-copy">{notes}</p></div><div className="drawer-section"><div className="drawer-label">Dernière action enregistrée</div>{nextAction ? <div className="drawer-highlight"><CalendarIcon /><div><strong>{String(nextAction.summary ?? 'Action')}</strong><span>{nextAction.occurredAt ? dateLabel(String(nextAction.occurredAt)) : 'Date non renseignée'}</span></div></div> : <p className="drawer-copy">Aucune action clinique enregistrée.</p>}</div><div className="drawer-section"><div className="drawer-label">Accès rapides</div><div className="drawer-actions">{canPrescriptions && <Link href="/prescriptions" onClick={onClose}><Syringe /> Ordonnance</Link>}{canDocuments && <Link href="/documents" onClick={onClose}><FilePlus2 /> Document</Link>}<Link href={`/patients/${code}#audit`} onClick={() => { onNotify('Historique du dossier ouvert'); onClose(); }}><ClipboardList /> Historique</Link></div></div><Link className="btn btn-primary w-full" href={`/patients/${code}`} onClick={onClose}>Ouvrir le dossier complet <ArrowRight /></Link></div></aside></div>;
}

function PhoneIcon() { return <Phone aria-hidden="true" />; }
function MailIcon() { return <Mail aria-hidden="true" />; }

function CalendarIcon() { return <div className="drawer-icon"><ScanLine /></div>; }

function SettingsPanel({ onNotify, canEdit }: { onNotify: (message: string) => void; canEdit: boolean }) {
  const [finance, setFinance] = useState(false);
  const [captcha, setCaptcha] = useState(false);
  const [twoFa, setTwoFa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appName, setAppName] = useState('');
  const [structure, setStructure] = useState('');
  const [language, setLanguage] = useState('');
  const [currency, setCurrency] = useState('');
  const [prefix, setPrefix] = useState('');
  const [vat, setVat] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    void apiClient.get<Record<string, unknown>>('/settings').then((settings) => {
      if (!active) return;
      const app = settings.app && typeof settings.app === 'object' ? settings.app as Record<string, unknown> : settings;
      const stringValue = (key: string) => typeof app[key] === 'string' ? String(app[key]) : '';
      setAppName(stringValue('appName'));
      setStructure(stringValue('structure'));
      setLanguage(stringValue('language'));
      setCurrency(stringValue('currency'));
      setPrefix(stringValue('prefix'));
      setVat(stringValue('vat'));
      setSessionMinutes(stringValue('sessionMinutes'));
      setFinance(app.finance === true);
      setCaptcha(app.captcha === true);
      setTwoFa(app.twoFa === true);
      setLoadError(null);
    }).catch(() => {
      if (active) setLoadError('Impossible de charger les paramètres depuis PostgreSQL.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveSettings() {
    if (!canEdit) { onNotify('Vous ne disposez pas de la permission de modifier les paramètres.'); return; }
    const value = { appName, structure, language, currency, prefix, vat, sessionMinutes, finance, captcha, twoFa };
    setSaving(true);
    try {
      await apiClient.put('/settings/app', { value });
      onNotify('Paramètres enregistrés dans PostgreSQL');
    } catch (error) {
      onNotify(error instanceof ApiClientError ? error.message : 'Impossible d’enregistrer les paramètres dans l’API.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="page-container"><section className="page-heading"><div><div className="eyebrow">Administration</div><h1>Paramètres</h1><p>Les valeurs affichées sont chargées depuis les paramètres persistés de la structure.</p></div><button type="button" className="btn btn-primary" onClick={saveSettings} disabled={saving || loading || !canEdit}>{saving ? <LoaderCircle className="spin" /> : <Check />} {saving ? 'Enregistrement…' : 'Enregistrer'}</button></section>{loadError && <div className="state-banner state-banner--error" role="alert"><CircleAlert /><span>{loadError}</span><button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>Réessayer</button></div>}<div className="settings-grid"><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Identité de l’application</h2><p className="card__subtitle">Valeurs de configuration enregistrées par la structure.</p></div><Settings2 /></div><div className="card__body form-grid"><label>Nom de l’application<input value={appName} onChange={(event) => setAppName(event.target.value)} placeholder="Non configuré" /></label><label>Nom de la structure<input value={structure} onChange={(event) => setStructure(event.target.value)} placeholder="Non configuré" /></label><label>Langue par défaut<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="">Non configurée</option><option value="fr">Français</option><option value="ar">العربية — Arabe</option><option value="en">English</option><option value="es">Español</option></select></label><label>Devise par défaut<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="">Non configurée</option><option value="EUR">EUR — Euro</option><option value="USD">USD — Dollar américain</option><option value="GBP">GBP — Livre sterling</option></select></label></div></section><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Sécurité & authentification</h2><p className="card__subtitle">Valeurs récupérées de la configuration API.</p></div><ShieldCheck /></div><div className="card__body setting-list"><Toggle label="Authentification à deux facteurs (TOTP)" description="Recommandée pour tous les comptes" value={twoFa} onChange={setTwoFa} disabled={!canEdit || loading} /><Toggle label="Captcha à la connexion" description="Protection anti-abus configurée par la structure" value={captcha} onChange={setCaptcha} disabled={!canEdit || loading} /><div className="setting-row"><div><strong>Session d’accès</strong><span>Expiration de l’access token, si configurée</span></div><select value={sessionMinutes} onChange={(event) => setSessionMinutes(event.target.value)} disabled={!canEdit || loading}><option value="">Non configurée</option><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 heure</option></select></div></div></section><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Modules optionnels</h2><p className="card__subtitle">Préférences persistées pour l’application.</p></div><Package /></div><div className="card__body setting-list"><Toggle label="Gestion financière" description="Consultations, missions et dépenses" value={finance} onChange={setFinance} disabled={!canEdit || loading} /><div className="setting-row"><div><strong>Stockage documentaire</strong><span>La configuration est gérée par l’API de stockage.</span></div><span>API</span></div></div></section><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Préférences de données</h2><p className="card__subtitle">Codification et qualité des exports.</p></div><ReceiptText /></div><div className="card__body setting-list"><div className="setting-row"><div><strong>Préfixe des dossiers patient</strong><span>Format configuré par la structure</span></div><input className="setting-short" value={prefix} onChange={(event) => setPrefix(event.target.value.toUpperCase().slice(0, 8))} placeholder="Non configuré" disabled={!canEdit || loading} /></div><div className="setting-row"><div><strong>TVA par défaut</strong><span>Appliquée aux nouvelles lignes financières</span></div><div className="input-suffix"><input className="setting-short" value={vat} onChange={(event) => setVat(event.target.value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="—" disabled={!canEdit || loading} /><span>%</span></div></div><Link className="btn btn-secondary self-start" href="/documents"><FileText /> Ouvrir la gestion documentaire</Link></div></section></div><div className="settings-note"><LockKeyhole /> Les changements sont journalisés et nécessitent la permission <strong>settings:update</strong>.</div></div>;
}
function Toggle({ label, description, value, onChange, disabled = false }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) { return <div className="setting-row"><div><strong>{label}</strong><span>{description}</span></div><button type="button" className={`toggle ${value ? 'is-on' : ''}`} aria-pressed={value} disabled={disabled} onClick={() => onChange(!value)}><span /></button></div>; }
