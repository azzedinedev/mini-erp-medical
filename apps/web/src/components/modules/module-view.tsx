'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Archive, ArrowDownToLine, ArrowRight, Bandage, BarChart3, Check, ChevronLeft, ChevronRight, CircleAlert, CircleCheck,
  ClipboardCheck, ClipboardList, Download, FilePenLine, FilePlus2, FileText, Files, FolderHeart, FolderOpen, Handshake,
  HeartPulse, History, ListChecks, LoaderCircle, LockKeyhole, MapPinned, MoreHorizontal, Package, Pencil, Plus, ReceiptText,
  RotateCcw, Save, ScanLine, Search, Settings2, ShieldCheck, Stethoscope, Syringe, Trash2, Truck, UserRound, UsersRound, X,
  type LucideIcon,
} from 'lucide-react';
import { moduleConfigs } from '@/lib/mock-data';
import { useUiLocale } from '@/lib/ui-i18n';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { hasPermission, readSession } from '@/lib/auth-store';
import { fallbackRecords, loadModuleRecords, type CrudDraft, type ModuleKey, type ModuleRecord } from '@/lib/module-data';

const icons: Record<string, LucideIcon> = { FolderHeart, Syringe, Package, MapPinned, Truck, Files, Stethoscope, Handshake, UsersRound, ListChecks, ReceiptText, Settings2 };

type Config = (typeof moduleConfigs)[ModuleKey];
type Action = 'view' | 'create' | 'update' | 'archive' | 'delete' | 'export';

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

function storageKey(module: ModuleKey, suffix = 'records') { return `mediflow.${suffix}.${module}`; }
function readStored<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : null; } catch { return null; }
}
function normalizeRecords(value: unknown): ModuleRecord[] | null {
  if (!Array.isArray(value)) return null;
  const normalized = value.map((item) => {
    if (item && typeof item === 'object' && 'row' in item && Array.isArray((item as { row?: unknown }).row)) return item as ModuleRecord;
    if (Array.isArray(item)) return { row: item.filter((cell): cell is string => typeof cell === 'string') };
    return null;
  }).filter((item): item is ModuleRecord => Boolean(item));
  return normalized.length ? normalized : [];
}
function writeStored(key: string, value: unknown) {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value));
}
function recordKey(record: ModuleRecord) { return record.id ?? record.row[0] ?? Math.random().toString(36); }
function titleOf(record: ModuleRecord) { return record.row[0]?.split('|')[0] ?? 'Élément'; }
function getApiModule(module: ModuleKey) { return permissionModule[module]; }
function splitName(label: string) { const parts = label.trim().split(/\s+/); return { firstName: parts.shift() ?? label.trim(), lastName: parts.join(' ') || 'À compléter' }; }

function formatPhone(value: string) {
  const digits = value.replace(/[^\d+]/g, '').slice(0, 16);
  return digits.replace(/(\+\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');
}

export function ModuleView({ module }: { module: ModuleKey }) {
  const config = moduleConfigs[module];
  const Icon = icons[config.icon] ?? ClipboardList;
  const { t } = useUiLocale();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('search') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<string>(config.tabs[0]);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<ModuleRecord | null>(null);
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; record?: ModuleRecord } | null>(null);
  const [actionRecord, setActionRecord] = useState<ModuleRecord | null>(null);
  const [trashItems, setTrashItems] = useState<ModuleRecord[]>([]);
  const [trashOpen, setTrashOpen] = useState(false);
  const [records, setRecords] = useState<ModuleRecord[]>(() => fallbackRecords(module));
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const can = (action: Action) => hasPermission(getApiModule(module) as never, action as never, readSession());

  useEffect(() => {
    let active = true;
    setHydrated(false);
    setPage(1);
    setQuery(module === 'patients' ? initialQuery : '');
    setActiveTab(config.tabs[0]);
    const saved = normalizeRecords(readStored<unknown>(storageKey(module)));
    const savedTrash = normalizeRecords(readStored<unknown>(storageKey(module, 'trash')));
    if (saved) setRecords(saved);
    else setRecords(fallbackRecords(module));
    setTrashItems(savedTrash ?? []);
    setHydrated(true);
    if (!saved) {
      setLoading(true);
      void loadModuleRecords(module).then((remote) => {
        if (active && remote) setRecords(remote);
      }).finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [config.tabs, initialQuery, module]);

  useEffect(() => {
    if (!hydrated) return;
    writeStored(storageKey(module), records);
    writeStored(storageKey(module, 'trash'), trashItems);
  }, [hydrated, module, records, trashItems]);

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

  async function createRemoteRecord(draft: CrudDraft): Promise<ModuleRecord | null> {
    const { firstName, lastName } = splitName(draft.label);
    if (module === 'patients') {
      const created = await apiClient.post<Record<string, unknown>>('/patients', { firstName, lastName, phone: draft.phone || undefined, notes: draft.notes || undefined });
      return { id: String(created.id), remote: true, row: [`${created.firstName ?? firstName} ${created.lastName ?? lastName}|${created.code ?? draft.code}|—|${String(firstName[0] ?? '')}${String(lastName[0] ?? '')}`, 'Dossier patient', '—', 'Actif', 'À l’instant'] };
    }
    if (module === 'inventory') {
      const created = await apiClient.post<Record<string, unknown>>('/inventory', { name: draft.label, category: 'À classer', unit: 'unité', quantity: 0, minQuantity: 0 });
      return { id: String(created.id), remote: true, row: [`${created.code ?? draft.code}|${created.name ?? draft.label}|À classer`, 'À classer', '0 unité / min. 0', 'À définir', 'Disponible'] };
    }
    if (module === 'missions') {
      const created = await apiClient.post<Record<string, unknown>>('/missions', { title: draft.label, scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), notes: draft.notes || undefined });
      return { id: String(created.id), remote: true, row: [`${created.code ?? draft.code}|${draft.label}`, 'À affecter', 'À affecter', 'À planifier', 'Planifiée'] };
    }
    if (module === 'references') {
      const created = await apiClient.post<Record<string, unknown>>('/reference-data/types', { kind: 'CONSULTATION', code: draft.code || `REF-${Date.now()}`, labels: { fr: draft.label, en: draft.label, ar: draft.label, es: draft.label }, icon: 'ListChecks' });
      return { id: String(created.id), remote: true, row: [`${draft.label}|${created.code ?? draft.code}|ListChecks`, 'Type d’acte', String(created.code ?? draft.code), 'À l’instant', 'Actif'] };
    }
    if (module === 'finance') {
      const created = await apiClient.post<Record<string, unknown>>('/finance', { kind: draft.label, currency: 'EUR', lines: [{ label: draft.label, quantity: 1, unitPriceHt: 0, vatRate: 20 }] });
      return { id: String(created.id), remote: true, row: [`${created.code ?? draft.code}|${draft.label}`, 'À facturer', 'À l’instant', '0 EUR', 'Brouillon'] };
    }
    return null;
  }

  async function updateRemoteRecord(record: ModuleRecord, draft: CrudDraft): Promise<ModuleRecord | null> {
    if (!record.id || module !== 'patients') return null;
    const { firstName, lastName } = splitName(draft.label);
    const updated = await apiClient.patch<Record<string, unknown>>(`/patients/${record.id}`, { firstName, lastName, phone: draft.phone || undefined, notes: draft.notes || undefined });
    return { ...record, remote: true, row: [`${updated.firstName ?? firstName} ${updated.lastName ?? lastName}|${updated.code ?? draft.code}|—|${String(firstName[0] ?? '')}${String(lastName[0] ?? '')}`, record.row[1] ?? 'Dossier patient', record.row[2] ?? '—', record.row[3] ?? 'Actif', 'À l’instant'] };
  }

  async function saveRecord(row: string[], mode: 'create' | 'edit', draft: CrudDraft, initial?: ModuleRecord) {
    let next: ModuleRecord = { id: initial?.id, remote: initial?.remote, row };
    try {
      const remote = mode === 'create' ? await createRemoteRecord(draft) : await updateRemoteRecord(initial ?? next, draft);
      if (remote) next = remote;
      setRecords((current) => mode === 'create' ? [next, ...current] : current.map((item) => recordKey(item) === recordKey(initial ?? next) ? next : item));
      setEditor(null);
      if (remote) notify(mode === 'create' ? 'Entrée créée et synchronisée' : 'Modifications enregistrées et synchronisées');
      else notify(mode === 'create' ? 'Entrée enregistrée localement : ce module ne propose pas encore de création API.' : 'Modifications enregistrées localement : synchronisation API indisponible pour ce module.');
    } catch (error) {
      setRecords((current) => mode === 'create' ? [next, ...current] : current.map((item) => recordKey(item) === recordKey(initial ?? next) ? next : item));
      setEditor(null);
      notify(error instanceof ApiClientError ? `Enregistré localement : ${error.message}` : 'Enregistré localement, synchronisation à réessayer');
    }
  }

  async function archiveRemote(record: ModuleRecord) {
    if (!record.id || !record.remote) return;
    if (module === 'patients') await apiClient.delete(`/patients/${record.id}`);
    else if (module === 'users' || module === 'team' || module === 'partners') await apiClient.delete(`/${module === 'team' ? 'medical-staff' : module}/${record.id}`);
  }

  function moveToTrash(record: ModuleRecord) {
    if (!can('delete') && !can('archive')) { notify('Vous ne disposez pas de la permission de suppression.'); return; }
    setRecords((current) => current.filter((item) => recordKey(item) !== recordKey(record)));
    setTrashItems((current) => [...current, record]);
    setActionRecord(null);
    const remoteArchive = Boolean(record.remote && record.id && ['patients', 'users', 'team', 'partners'].includes(module));
    void archiveRemote(record).catch((error) => notify(error instanceof ApiClientError ? `Retiré localement : ${error.message}` : 'Retiré localement, synchronisation à réessayer'));
    notify(remoteArchive ? `${titleOf(record)} placé dans la corbeille et synchronisé` : `${titleOf(record)} placé dans la corbeille locale; API de suppression à compléter pour ce module`);
  }

  async function restoreRemote(record: ModuleRecord) {
    if (!record.id || !record.remote) return;
    if (module === 'patients') await apiClient.post(`/patients/${record.id}/restore`, {});
  }

  function restoreRecord(record: ModuleRecord) {
    if (!can('update') && !can('delete')) { notify('Vous ne disposez pas de la permission de restaurer cet élément.'); return; }
    setTrashItems((current) => current.filter((item) => recordKey(item) !== recordKey(record)));
    setRecords((current) => [...current, record]);
    const remoteRestore = Boolean(record.remote && record.id && module === 'patients');
    void restoreRemote(record).catch(() => notify('Restauré localement, synchronisation à réessayer'));
    notify(remoteRestore ? `${titleOf(record)} restauré et synchronisé` : `${titleOf(record)} restauré localement; API de restauration à compléter pour ce module`);
  }

  async function emptyTrash() {
    if (!can('delete')) { notify('Vous ne disposez pas de la permission de suppression définitive.'); return; }
    if (!window.confirm('Supprimer définitivement les éléments de la corbeille ? Cette action est irréversible.')) return;
    const remoteItems = trashItems.filter((record) => record.remote && record.id);
    setTrashItems([]);
    setTrashOpen(false);
    try {
      if (module === 'patients') await Promise.all(remoteItems.map((record) => apiClient.delete(`/patients/${record.id}/permanent`)));
      notify(module === 'patients' || remoteItems.length === 0 ? 'Corbeille vidée' : 'Corbeille locale vidée; la suppression définitive API est disponible pour les patients uniquement');
    } catch (error) {
      notify(error instanceof ApiClientError ? `Corbeille locale vidée : ${error.message}` : 'Corbeille locale vidée; certaines suppressions restent à synchroniser');
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
    <section className="page-heading"><div><div className="eyebrow">{t(config.eyebrow)}</div><h1>{t(config.title)}</h1><p>{t(config.description)}</p></div><div className="heading-actions"><button className="icon-button action-icon action-icon--trash" aria-label={t('Corbeille')} title={t('Corbeille')} onClick={() => setTrashOpen(true)}><Trash2 />{trashItems.length > 0 && <span className="action-count">{trashItems.length}</span>}</button><button className="btn btn-secondary" onClick={exportCsv} disabled={!can('export')}><Download /> {t('Exporter')}</button><button className="btn btn-primary" onClick={openCreate} disabled={!can('create')}><Plus /><span>{t(config.primary)}</span></button></div></section>
    {config.stats.length > 0 && <section className="module-stats">{config.stats.map(([label, value, hint]) => <div className="module-stat" key={label}><div className="module-stat__label">{t(label)}</div><div className="module-stat__value">{value}</div><div className="module-stat__hint">{t(hint)}</div></div>)}</section>}
    <section className="card module-list-card"><div className="module-toolbar"><div className="filter-search"><Search /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={`${t('Rechercher')} dans ${t(config.title).toLowerCase()}...`} aria-label={`${t('Rechercher')} dans ${t(config.title)}`} /></div><div className="filter-tabs">{config.tabs.map((tab) => <button className={`filter-tab ${activeTab === tab ? 'is-active' : ''}`} key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}>{t(tab)}</button>)}</div><button className="btn btn-secondary" onClick={() => { setQuery(''); setActiveTab(config.tabs[0]); setPage(1); notify('Filtres réinitialisés'); }}><ListChecks /> {t('Filtres')}</button></div>
      {loading && <div className="sync-status"><LoaderCircle className="spin" /> Synchronisation avec MediFlow…</div>}
      {visibleRecords.length === 0 ? <div className="empty-state"><div className="empty-state__icon"><Search /></div><h3>Aucun résultat</h3><p>Modifiez votre recherche ou vos filtres pour retrouver une entrée.</p></div> : <div className="table-wrap"><table className="data-table"><thead><tr>{config.columns.map((column) => <th key={column}>{t(column)}</th>)}<th aria-label={t('Actions')}>{t('Actions')}</th></tr></thead><tbody>{visibleRecords.map((record) => <tr key={recordKey(record)} onClick={() => module === 'patients' ? setSelected(record) : undefined} className={module === 'patients' ? 'cursor-pointer' : ''}><td><PrimaryCell value={record.row[0] ?? ''} module={module} /></td>{record.row.slice(1).map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cellIndex === record.row.length - 2 ? <Status value={cell} label={t(cell)} /> : (cell.includes('|') && ['prescriptions', 'missions', 'deliveries'].includes(module) && cellIndex === 0 ? <PrimaryCell value={cell} module="patients" /> : cell)}</td>)}<td><button className="icon-button action-icon action-icon--more" aria-label={`${t('Actions')} ${titleOf(record)}`} title={t('Actions')} onClick={(event) => { event.stopPropagation(); setActionRecord(record); }}><MoreHorizontal /></button></td></tr>)}</tbody></table></div>}
      <div className="table-footer"><span className="table-footer__count">{filtered.length} résultat{filtered.length > 1 ? 's' : ''} · {loading ? 'synchronisation…' : 'enregistré localement'}</span><div className="pagination"><button aria-label="Page précédente" disabled={page <= 1} onClick={() => setPageAndClamp(page - 1)}><ChevronLeft /></button><button className="is-current">{page}</button><button aria-label="Page suivante" disabled={page >= pageCount} onClick={() => setPageAndClamp(page + 1)}><ChevronRight /></button></div></div>
    </section>
    {selected && (module === 'patients' ? <PatientDrawer patient={selected.row[0] ?? ''} canEdit={can('update')} onClose={() => setSelected(null)} onNotify={notify} onEdit={() => { setSelected(null); openEdit(selected); }} /> : <RecordDetailsDialog record={selected} config={config} t={t} onClose={() => setSelected(null)} />)}
    {actionRecord && <ActionSheet record={actionRecord} t={t} can={can} onClose={() => setActionRecord(null)} onView={() => { setSelected(actionRecord); setActionRecord(null); }} onEdit={() => openEdit(actionRecord)} onArchive={() => moveToTrash(actionRecord)} onDelete={() => moveToTrash(actionRecord)} />}
    {editor && <CrudDialog key={`${editor.mode}-${recordKey(editor.record ?? { row: ['new'] })}`} module={module} config={config} mode={editor.mode} initial={editor.record} t={t} onClose={() => setEditor(null)} onSave={(row, mode, draft) => saveRecord(row, mode, draft, editor.record)} />}
    {trashOpen && <TrashDialog items={trashItems} t={t} onClose={() => setTrashOpen(false)} onRestore={restoreRecord} onEmpty={emptyTrash} />}
    {toast && <div className="toast" role="status"><CircleCheck />{toast}</div>}
  </div>;
}

function ActionSheet({ record, t, can, onClose, onView, onEdit, onArchive, onDelete }: { record: ModuleRecord; t: (value: string) => string; can: (action: Action) => boolean; onClose: () => void; onView: () => void; onEdit: () => void; onArchive: () => void; onDelete: () => void }) {
  const title = titleOf(record);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="action-sheet glass-panel" role="dialog" aria-modal="true" aria-labelledby="action-sheet-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Actions</div><h2 id="action-sheet-title">{title}</h2><p>Chaque action est enregistrée localement et synchronisée avec l’API quand elle est disponible.</p></div><button className="icon-button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div><div className="action-grid">{can('view') && <button className="action-tile action-tile--view" onClick={onView}><ClipboardCheck /><span>{t('Consulter')}</span><small>Ouvrir la fiche détaillée</small></button>}{can('update') && <button className="action-tile action-tile--edit" onClick={onEdit}><FilePenLine /><span>{t('Modifier')}</span><small>Éditer avec validation</small></button>}{can('archive') && <button className="action-tile action-tile--archive" onClick={onArchive}><Archive /><span>{t('Archiver')}</span><small>Retirer des listes actives</small></button>}{can('delete') && <button className="action-tile action-tile--delete" onClick={onDelete}><Trash2 /><span>{t('Supprimer')}</span><small>Déplacer vers la corbeille</small></button>}</div></section></div>;
}

function CrudDialog({ module, config, mode, initial, t, onClose, onSave }: { module: ModuleKey; config: Config; mode: 'create' | 'edit'; initial?: ModuleRecord; t: (value: string) => string; onClose: () => void; onSave: (row: string[], mode: 'create' | 'edit', draft: CrudDraft) => Promise<void> | void }) {
  const parts = initial?.row[0]?.split('|') ?? [];
  const [label, setLabel] = useState(parts[0] ?? '');
  const [code, setCode] = useState(parts[1] ?? (module === 'patients' ? 'PAT-000000' : `${module.slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-6)}`));
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<'identity' | 'analysis' | 'care' | 'notes'>('identity');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const title = mode === 'create' ? t(config.primary) : `${t('Modifier')} · ${t(config.title)}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim()) { setError('Le libellé ou le nom est obligatoire.'); setTab('identity'); return; }
    if (module === 'patients' && !/^PAT-\d{6}$/i.test(code.trim())) { setError('Le code patient doit respecter le format PAT-000000.'); setTab('identity'); return; }
    const identity = `${label.trim()}|${code.trim().toUpperCase()}|${parts[2] ?? label.trim().split(' ').map((item) => item[0]).join('').slice(0, 2).toUpperCase()}`;
    const next = initial ? [...initial.row] : Array.from({ length: Math.max(config.columns.length, 2) }, (_, index) => index === 0 ? identity : index === config.columns.length - 1 ? 'Actif' : index === 1 ? 'À renseigner' : 'À renseigner');
    next[0] = identity;
    if (initial && next.length > 1 && notes) next[1] = notes;
    const draft = { label: label.trim(), code: code.trim().toUpperCase(), phone, notes };
    setPending(true);
    try { await onSave(next, mode, draft); } finally { setPending(false); }
  }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel crud-dialog" role="dialog" aria-modal="true" aria-labelledby="crud-dialog-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">{mode === 'create' ? 'Nouveau workflow' : 'Fiche sécurisée'}</div><h2 id="crud-dialog-title">{title}</h2><p>Les champs marqués d’un astérisque sont obligatoires. Les modifications sont persistées avant synchronisation.</p></div><button className="icon-button" type="button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div><div className="dialog-tabs"><button className={tab === 'identity' ? 'is-active' : ''} type="button" onClick={() => setTab('identity')}><UserRound /> {t('Identité')}</button><button className={tab === 'analysis' ? 'is-active' : ''} type="button" onClick={() => setTab('analysis')}><ClipboardCheck /> {t('Analyses')}</button><button className={tab === 'care' ? 'is-active' : ''} type="button" onClick={() => setTab('care')}><HeartPulse /> {t('Soins spéciaux')}</button><button className={tab === 'notes' ? 'is-active' : ''} type="button" onClick={() => setTab('notes')}><FileText /> {t('Notes et remarques')}</button></div><form className="dialog__body" onSubmit={submit}>{tab === 'identity' && <div className="form-grid"><label>Nom ou libellé *<input autoFocus required value={label} onChange={(event) => setLabel(event.target.value)} aria-invalid={Boolean(error)} placeholder="Nom complet ou désignation" /></label><label>Code de référence {module === 'patients' ? '*' : ''}<input required={module === 'patients'} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder={module === 'patients' ? 'PAT-000000' : 'CODE-000001'} /></label><label>Téléphone<input value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} inputMode="tel" placeholder="+33 6 00 00 00 00" /></label><label>Statut<select defaultValue={initial?.row.at(-1) ?? 'Actif'}><option>Actif</option><option>À compléter</option><option>Archivé</option><option>Brouillon</option></select></label><label className="form-grid__full">Étiquette / catégorie<input placeholder="Ajouter une étiquette métier" /></label></div>}{tab === 'analysis' && <div className="workflow-panel"><div className="workflow-panel__intro"><ClipboardCheck /><div><strong>Workflow des analyses</strong><span>Suivez les étapes de prescription, prélèvement, validation et archivage.</span></div></div>{['Demande enregistrée', 'Prélèvement planifié', 'Résultat contrôlé', 'Résultat transmis au patient'].map((step, index) => <label className="workflow-step" key={step}><input type="checkbox" defaultChecked={index === 0} /><span className="workflow-step__number">{index + 1}</span><span><strong>{step}</strong><small>Responsable, date et pièce jointe obligatoires</small></span></label>)}<p className="workflow-panel__hint"><FilePlus2 /> Ajoutez la pièce jointe depuis la gestion documentaire après l’enregistrement du workflow.</p></div>}{tab === 'care' && <div className="workflow-panel"><div className="workflow-panel__intro workflow-panel__intro--coral"><HeartPulse /><div><strong>Soins spéciaux</strong><span>Définissez les précautions et consignes visibles par l’équipe.</span></div></div><div className="care-checks"><label><input type="checkbox" /> Allergie ou intolérance</label><label><input type="checkbox" /> Mobilité réduite</label><label><input type="checkbox" /> Isolement requis</label><label><input type="checkbox" /> Matériel spécifique</label></div><label className="form-grid__full">Consignes de soins<textarea rows={4} placeholder="Précautions, fréquence, matériel, personne à prévenir…" /></label></div>}{tab === 'notes' && <div className="notes-panel"><label>Notes et remarques<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} placeholder="Ajoutez les observations utiles à l’équipe…" /></label><div className="notes-panel__hint"><History /> Chaque modification est historisée et associée à votre utilisateur.</div></div>}{error && <div className="form-error" role="alert"><CircleAlert />{error}</div>}<div className="dialog__footer"><button type="button" className="btn btn-secondary" onClick={onClose}>{t('Annuler')}</button><button type="submit" className="btn btn-primary" disabled={pending}>{pending ? <LoaderCircle className="spin" /> : <Save />} {pending ? 'Enregistrement…' : t('Enregistrer')}</button></div></form></section></div>;
}

function RecordDetailsDialog({ record, config, t, onClose }: { record: ModuleRecord; config: Config; t: (value: string) => string; onClose: () => void }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="record-details-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Consultation</div><h2 id="record-details-title">{titleOf(record)}</h2><p>{record.id ? `Identifiant ${record.id}` : 'Donnée de démonstration persistée dans ce navigateur.'}</p></div><button className="icon-button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div><div className="dialog__body detail-list">{config.columns.map((column, index) => <div className="detail-row" key={column}><span className="detail-row__icon"><FileText /></span><div><div className="detail-row__label">{t(column)}</div><div className="detail-row__value">{(record.row[index] ?? '—').replaceAll('|', ' · ')}</div></div></div>)}</div><div className="dialog__footer"><button className="btn btn-primary" onClick={onClose}><Check /> {t('Fermer')}</button></div></section></div>;
}

function TrashDialog({ items, t, onClose, onRestore, onEmpty }: { items: ModuleRecord[]; t: (value: string) => string; onClose: () => void; onRestore: (record: ModuleRecord) => void; onEmpty: () => void }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel trash-dialog" role="dialog" aria-modal="true" aria-labelledby="trash-dialog-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Récupération</div><h2 id="trash-dialog-title">{t('Corbeille')}</h2><p>Les éléments peuvent être restaurés avant suppression définitive.</p></div><button className="icon-button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div>{items.length === 0 ? <div className="trash-empty"><Trash2 /><h3>{t('Aucune entrée dans la corbeille.')}</h3><p>Les suppressions et archivages apparaîtront ici.</p></div> : <div className="trash-list">{items.map((record) => <div className="trash-item" key={recordKey(record)}><div className="action-icon action-icon--delete"><Trash2 /></div><div><strong>{titleOf(record)}</strong><span>{record.row[0]?.split('|')[1] ?? 'Élément archivé'}</span></div><button className="btn btn-secondary" onClick={() => onRestore(record)}><RotateCcw /> {t('Restaurer')}</button></div>)}</div>}<div className="dialog__footer"><button className="btn btn-secondary" onClick={onClose}>{t('Fermer')}</button>{items.length > 0 && <button className="btn btn-danger" onClick={onEmpty}><Trash2 /> Vider la corbeille</button>}</div></section></div>;
}

function PatientDrawer({ patient, canEdit, onClose, onNotify, onEdit }: { patient: string; canEdit: boolean; onClose: () => void; onNotify: (message: string) => void; onEdit: () => void }) {
  const [name, code, age, initials] = patient.split('|');
  return <div className="drawer-backdrop" onClick={onClose}><aside className="patient-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div className="patient-cell"><span className="patient-cell__avatar drawer-avatar">{initials}</span><div><div className="patient-cell__name">{name}</div><div className="patient-cell__code">{code} · {age}</div></div></div><div className="drawer-head__actions"><button className="icon-button action-icon action-icon--edit" aria-label="Modifier" title={canEdit ? 'Modifier' : 'Modification non autorisée'} disabled={!canEdit} onClick={onEdit}><FilePenLine /></button><button className="icon-button" aria-label="Fermer" onClick={onClose}><X /></button></div></div><div className="drawer-body"><div className="status status--active">Dossier actif</div><div className="drawer-section"><div className="drawer-label">Prochaine intervention</div><div className="drawer-highlight"><CalendarIcon /><div><strong>Consultation cardiologie</strong><span>24 octobre · 09:00 · Dr. Sofia Martin</span></div></div></div><div className="drawer-section"><div className="drawer-label">Résumé clinique</div><p className="drawer-copy">Suivi régulier. Les éléments importants du dossier et les allergies connues sont visibles ici.</p></div><div className="drawer-section"><div className="drawer-label">Accès rapides</div><div className="drawer-actions"><Link href="/prescriptions" onClick={onClose}><Syringe /> Ordonnance</Link><Link href="/documents" onClick={onClose}><FilePlus2 /> Document</Link><Link href={`/patients/${code}#audit`} onClick={() => { onNotify('Historique du dossier ouvert'); onClose(); }}><ClipboardList /> Historique</Link></div></div><Link className="btn btn-primary w-full" href={`/patients/${code}`} onClick={onClose}>Ouvrir le dossier complet <ArrowRight /></Link></div></aside></div>;
}

function CalendarIcon() { return <div className="drawer-icon"><ScanLine /></div>; }

function SettingsPanel({ onNotify, canEdit }: { onNotify: (message: string) => void; canEdit: boolean }) {
  const [finance, setFinance] = useState(true);
  const [captcha, setCaptcha] = useState(false);
  const [twoFa, setTwoFa] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appName, setAppName] = useState('MediFlow');
  const [structure, setStructure] = useState('Clinique Saint-Clair');
  const [language, setLanguage] = useState('fr');
  const [currency, setCurrency] = useState('EUR');
  const [prefix, setPrefix] = useState('PAT');
  const [vat, setVat] = useState('20');
  useEffect(() => { const saved = readStored<Record<string, string>>('mediflow.settings'); if (saved) { setAppName(saved.appName ?? 'MediFlow'); setStructure(saved.structure ?? 'Clinique Saint-Clair'); setLanguage(saved.language ?? 'fr'); setCurrency(saved.currency ?? 'EUR'); setPrefix(saved.prefix ?? 'PAT'); setVat(saved.vat ?? '20'); } }, []);
  async function saveSettings() { if (!canEdit) { onNotify('Vous ne disposez pas de la permission de modifier les paramètres.'); return; } const value = { appName, structure, language, currency, prefix, vat, finance, captcha, twoFa }; setSaving(true); writeStored('mediflow.settings', value); try { await apiClient.put('/settings/app', { value }); onNotify('Paramètres enregistrés et synchronisés'); } catch { onNotify('Paramètres enregistrés localement; synchronisation à réessayer'); } finally { setSaving(false); } }
  return <div className="page-container"><section className="page-heading"><div><div className="eyebrow">Administration</div><h1>Paramètres</h1><p>Configurez l’identité, les modules, la sécurité et les préférences de MediFlow.</p></div><button className="btn btn-primary" onClick={saveSettings} disabled={saving || !canEdit}>{saving ? <LoaderCircle className="spin" /> : <Check />} {saving ? 'Enregistrement…' : 'Enregistrer'}</button></section><div className="settings-grid"><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Identité de l’application</h2><p className="card__subtitle">Ces informations apparaissent sur les documents officiels.</p></div><Settings2 /></div><div className="card__body form-grid"><label>Nom de l’application<input value={appName} onChange={(event) => setAppName(event.target.value)} /></label><label>Nom de la structure<input value={structure} onChange={(event) => setStructure(event.target.value)} /></label><label className="form-grid__full">Logo<input type="file" accept="image/png,image/svg+xml" /></label><label>Langue par défaut<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="fr">Français</option><option value="ar">العربية — Arabe</option><option value="en">English</option><option value="es">Español</option></select></label><label>Devise par défaut<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="EUR">EUR — Euro</option><option value="USD">USD — Dollar américain</option><option value="GBP">GBP — Livre sterling</option></select></label></div></section><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Sécurité & authentification</h2><p className="card__subtitle">Renforcez la protection des données de santé.</p></div><ShieldCheck /></div><div className="card__body setting-list"><Toggle label="Authentification à deux facteurs (TOTP)" description="Recommandée pour tous les comptes" value={twoFa} onChange={setTwoFa} disabled={!canEdit} /><Toggle label="Captcha à la connexion" description="Cloudflare Turnstile · activable globalement" value={captcha} onChange={setCaptcha} disabled={!canEdit} /><div className="setting-row"><div><strong>Session d’accès</strong><span>Expiration de l’access token</span></div><select defaultValue="15"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 heure</option></select></div></div></section><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Modules optionnels</h2><p className="card__subtitle">Les modules désactivés restent disponibles dans le schéma.</p></div><Package /></div><div className="card__body setting-list"><Toggle label="Gestion financière" description="Consultations, missions et dépenses" value={finance} onChange={setFinance} /><div className="setting-row"><div><strong>Stockage documentaire</strong><span>Mode utilisé par la GED et les PDF</span></div><select defaultValue="local"><option value="local">Local sécurisé</option><option value="s3">S3 / MinIO</option></select></div><div className="setting-row"><div><strong>Thème par défaut</strong><span>Préférence initiale des nouveaux utilisateurs</span></div><select defaultValue="light"><option value="light">Clair</option><option value="dark">Sombre</option><option value="clinical">Clinical</option></select></div></div></section><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Préférences de données</h2><p className="card__subtitle">Codification et qualité des exports.</p></div><ReceiptText /></div><div className="card__body setting-list"><div className="setting-row"><div><strong>Préfixe des dossiers patient</strong><span>Format : PREFIXE-000001</span></div><input className="setting-short" value={prefix} onChange={(event) => setPrefix(event.target.value.toUpperCase().slice(0, 8))} /></div><div className="setting-row"><div><strong>TVA par défaut</strong><span>Appliquée aux nouvelles lignes financières</span></div><div className="input-suffix"><input className="setting-short" value={vat} onChange={(event) => setVat(event.target.value.replace(/[^0-9]/g, '').slice(0, 2))} /><span>%</span></div></div><Link className="btn btn-secondary self-start" href="/documents"><FileText /> Ouvrir la gestion documentaire</Link></div></section></div><div className="settings-note"><LockKeyhole /> Les changements sont journalisés dans le fil d’audit et nécessitent la permission <strong>settings:update</strong>.</div></div>;
}

function Toggle({ label, description, value, onChange, disabled = false }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) { return <div className="setting-row"><div><strong>{label}</strong><span>{description}</span></div><button type="button" className={`toggle ${value ? 'is-on' : ''}`} aria-pressed={value} disabled={disabled} onClick={() => onChange(!value)}><span /></button></div>; }
