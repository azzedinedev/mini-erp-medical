'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import {
  Activity, ArrowLeft, CalendarDays, ChevronRight, CircleAlert, CircleCheck, ClipboardCheck, Clock3, FileText,
  FolderOpen, HeartPulse, History, LoaderCircle, MapPin, Paperclip, Pencil, Plus, Save, ShieldCheck, Syringe,
  UserRound, X, type LucideIcon,
} from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useUiLocale } from '@/lib/ui-i18n';
import { hasPermission, readSession } from '@/lib/auth-store';

type WorkflowStep = { label: string; done: boolean };
type WorkflowState = { analysis: WorkflowStep[]; care: WorkflowStep[]; notes: string };
type RelatedAction = { id: string; summary: string; status: string; occurredAt: string; details?: unknown };
type RelatedPrescription = { id: string; code: string; status: string; createdAt: string; instructions?: string | null };
type RelatedDocument = { id: string; code: string; title: string; fileName: string; category: string; createdAt: string };
type RelatedLocation = { id: string; startedAt: string; endedAt?: string | null; isCurrent: boolean; location?: { name?: string; kind?: string; address?: unknown } | null };
type AuditEvent = { id: string; action: string; entityType: string; entityId: string; createdAt: string; actor?: { firstName: string; lastName: string } | null };

type PatientData = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: string;
  status: string;
  phone?: string;
  email?: string;
  allergies?: unknown;
  emergencyContact?: unknown;
  medicalHistory: Record<string, unknown>;
  notes?: string;
  actions: RelatedAction[];
  prescriptions: RelatedPrescription[];
  documents: RelatedDocument[];
  locations: RelatedLocation[];
  auditEvents: AuditEvent[];
};

const genderLabels: Record<string, string> = { MALE: 'Homme', FEMALE: 'Femme', NON_BINARY: 'Non binaire', UNKNOWN: 'Non renseigné' };
const statusLabels: Record<string, string> = { ACTIVE: 'Actif', INACTIVE: 'Inactif', ARCHIVED: 'Archivé' };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item))) : [];
}

function mapPatient(remote: Record<string, unknown>, fallbackCode: string): PatientData {
  const toAction = (item: Record<string, unknown>): RelatedAction => ({ id: String(item.id), summary: String(item.summary ?? 'Action'), status: String(item.status ?? '—'), occurredAt: String(item.occurredAt), details: item.details });
  const toPrescription = (item: Record<string, unknown>): RelatedPrescription => ({ id: String(item.id), code: String(item.code ?? '—'), status: String(item.status ?? '—'), createdAt: String(item.createdAt), instructions: item.instructions ? String(item.instructions) : undefined });
  const toDocument = (item: Record<string, unknown>): RelatedDocument => ({ id: String(item.id), code: String(item.code ?? '—'), title: String(item.title ?? 'Document'), fileName: String(item.fileName ?? '—'), category: String(item.category ?? '—'), createdAt: String(item.createdAt) });
  const toLocation = (item: Record<string, unknown>): RelatedLocation => ({ id: String(item.id), startedAt: String(item.startedAt), endedAt: item.endedAt ? String(item.endedAt) : null, isCurrent: item.isCurrent === true, location: item.location ? asRecord(item.location) : null });
  const toAudit = (item: Record<string, unknown>): AuditEvent => ({ id: String(item.id), action: String(item.action ?? '—'), entityType: String(item.entityType ?? '—'), entityId: String(item.entityId ?? '—'), createdAt: String(item.createdAt), actor: item.actor ? { firstName: String(asRecord(item.actor).firstName ?? ''), lastName: String(asRecord(item.actor).lastName ?? '') } : null });
  return {
    id: String(remote.id),
    code: String(remote.code ?? fallbackCode),
    firstName: String(remote.firstName ?? ''),
    lastName: String(remote.lastName ?? ''),
    birthDate: remote.birthDate ? String(remote.birthDate) : undefined,
    gender: remote.gender ? String(remote.gender) : undefined,
    status: String(remote.status ?? 'UNKNOWN'),
    phone: remote.phone ? String(remote.phone) : undefined,
    email: remote.email ? String(remote.email) : undefined,
    allergies: remote.allergies,
    emergencyContact: remote.emergencyContact,
    medicalHistory: asRecord(remote.medicalHistory),
    notes: remote.notes ? String(remote.notes) : '',
    actions: asArray(remote.actions).map(toAction),
    prescriptions: asArray(remote.prescriptions).map(toPrescription),
    documents: asArray(remote.documents).map(toDocument),
    locations: asArray(remote.locations).map(toLocation),
    auditEvents: asArray(remote.auditEvents).map(toAudit),
  };
}

function age(birthDate?: string) {
  if (!birthDate) return null;
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / 31_557_600_000);
  return Number.isFinite(years) && years >= 0 ? years : null;
}

function formatDate(value?: string, withTime = false) {
  if (!value) return 'Non renseignée';
  const date = new Date(value);
  return new Intl.DateTimeFormat('fr-FR', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'long' }).format(date);
}

function formatJson(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Non renseigné';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return 'Donnée non lisible'; }
}

function initials(patient: PatientData) {
  return `${patient.firstName[0] ?? ''}${patient.lastName[0] ?? ''}`.toUpperCase() || '—';
}

function statusLabel(value: string) { return statusLabels[value] ?? value; }

function readWorkflow(history: Record<string, unknown>, notes: string): WorkflowState {
  const workflows = asRecord(history.workflows);
  const readSteps = (value: unknown): WorkflowStep[] => asArray(value).flatMap((step) => {
    const item = asRecord(step);
    return typeof item.label === 'string' ? [{ label: item.label, done: item.done === true }] : [];
  });
  return { analysis: readSteps(workflows.analysis), care: readSteps(workflows.care), notes: typeof history.workflowNotes === 'string' ? history.workflowNotes : notes };
}

export function PatientRecordView({ code }: { code: string }) {
  const { t } = useUiLocale();
  const session = readSession();
  const canEdit = hasPermission('patients', 'update', session);
  const canExport = hasPermission('patients', 'export', session);
  const canCreateMission = hasPermission('missions', 'create', session);
  const [tab, setTab] = useState('Synthèse');
  const [toast, setToast] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowState>({ analysis: [], care: [], notes: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setPatient(null);
    void apiClient.get<Record<string, unknown>>(`/patients/${code}`).then((remote) => {
      if (!active) return;
      const mapped = mapPatient(remote, code);
      setPatient(mapped);
      setWorkflow(readWorkflow(mapped.medicalHistory, mapped.notes ?? ''));
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof ApiClientError ? reason.message : 'Impossible de charger ce dossier depuis PostgreSQL.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [code, reloadToken]);

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(null), 2600); }

  async function savePatient(data: { firstName: string; lastName: string; phone: string; notes: string; allergies: string }) {
    if (!patient) return;
    setSaving(true);
    try {
      await apiClient.patch(`/patients/${patient.id}`, {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim() || undefined,
        notes: data.notes.trim() || undefined,
        allergies: data.allergies.trim() ? { value: data.allergies.trim() } : undefined,
      });
      setEditOpen(false);
      notify('Fiche patient enregistrée dans PostgreSQL');
      setReloadToken((value) => value + 1);
    } catch (reason: unknown) {
      notify(reason instanceof ApiClientError ? reason.message : 'Impossible d’enregistrer la fiche patient dans l’API.');
    } finally { setSaving(false); }
  }

  async function saveWorkflow(next: WorkflowState) {
    if (!patient || !canEdit) { notify('Vous ne disposez pas de la permission de modifier ce dossier.'); return; }
    const medicalHistory = { ...patient.medicalHistory, workflows: { analysis: next.analysis, care: next.care }, workflowNotes: next.notes };
    try {
      await apiClient.patch(`/patients/${patient.id}`, { medicalHistory });
      setWorkflow(next);
      setPatient((current) => current ? { ...current, medicalHistory } : current);
      notify('Workflow enregistré dans PostgreSQL');
      setReloadToken((value) => value + 1);
    } catch (reason: unknown) {
      notify(reason instanceof ApiClientError ? reason.message : 'Impossible d’enregistrer le workflow dans l’API.');
    }
  }

  async function saveNotes(notes: string) {
    if (!patient || !canEdit) { notify('Vous ne disposez pas de la permission de modifier ce dossier.'); return; }
    try {
      await apiClient.patch(`/patients/${patient.id}`, { notes });
      setPatient((current) => current ? { ...current, notes } : current);
      setWorkflow((current) => ({ ...current, notes }));
      notify('Remarque enregistrée dans PostgreSQL');
      setReloadToken((value) => value + 1);
    } catch (reason: unknown) {
      notify(reason instanceof ApiClientError ? reason.message : 'Impossible d’enregistrer la remarque dans l’API.');
    }
  }

  function exportRecord() {
    if (!patient || !canExport) { notify('Vous ne disposez pas de la permission d’export.'); return; }
    const payload = JSON.stringify({ patient, workflow, exportedAt: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${patient.code}-dossier.json`; anchor.click(); URL.revokeObjectURL(url);
    notify('Dossier exporté');
  }

  if (loading) return <RecordState icon={LoaderCircle} title="Chargement du dossier" description="Lecture des données depuis PostgreSQL…" loading />;
  if (error) return <RecordState icon={CircleAlert} title="Dossier indisponible" description={error} onRetry={() => setReloadToken((value) => value + 1)} />;
  if (!patient) return <RecordState icon={FolderOpen} title="Dossier introuvable" description="Aucun patient correspondant à ce code n’a été renvoyé par l’API." />;

  const name = `${patient.firstName} ${patient.lastName}`.trim();
  const ageValue = age(patient.birthDate);
  return <div className="page-container patient-record-page">
    <div className="record-back"><Link href="/patients"><ArrowLeft /> {t('Retour aux dossiers')}</Link><span>{t('Dossier synchronisé')}</span></div>
    <section className="record-header card"><div className="record-profile"><div className="record-avatar patient-cell__avatar">{initials(patient)}</div><div><div className="eyebrow">{t('Dossier patient')} · {patient.code}</div><h1>{name || 'Patient sans identité'}</h1><div className="record-meta"><span>{ageValue === null ? t('Âge non renseigné') : `${ageValue} ans`}</span><span>•</span><span>{genderLabels[patient.gender ?? 'UNKNOWN'] ?? t('Non renseigné')}</span><span>•</span><span className={`status ${patient.status === 'ACTIVE' ? 'status--active' : 'status--pending'}`}>{statusLabel(patient.status)}</span></div></div></div><div className="record-actions"><button type="button" className="btn btn-secondary" disabled={!canExport} onClick={exportRecord}><FileText /> {t('Exporter')}</button><button type="button" className="btn btn-secondary" disabled={!canEdit} title={canEdit ? t('Modifier') : 'Modification non autorisée'} onClick={() => setEditOpen(true)}><Pencil /> {t('Modifier')}</button>{canCreateMission && <Link className="btn btn-primary" href="/missions?create=1"><Plus /> {t('Nouvelle action')}</Link>}</div></section>
    <nav className="record-tabs" aria-label={t('Sections du dossier')}>{['Synthèse', 'Actions du patient', 'Analyses', 'Soins spéciaux', 'Ordonnances', 'Documents', 'Lieux de soins', 'Notes', 'Fil d’audit'].map((item) => <button type="button" className={tab === item ? 'is-active' : ''} key={item} onClick={() => setTab(item)}>{t(item)}</button>)}</nav>
    {tab === 'Synthèse' && <Summary patient={patient} canEdit={canEdit} onEdit={() => setEditOpen(true)} onAudit={() => setTab('Fil d’audit')} onActions={() => setTab('Actions du patient')} />}
    {tab === 'Actions du patient' && <ActionsTab actions={patient.actions} />}
    {(tab === 'Analyses' || tab === 'Soins spéciaux') && <PatientWorkflowTab tab={tab} workflow={workflow} canEdit={canEdit} onSave={saveWorkflow} />}
    {tab === 'Notes' && <NotesTab disabled={!canEdit} value={workflow.notes || patient.notes || ''} onSave={saveNotes} />}
    {tab === 'Ordonnances' && <PrescriptionsTab prescriptions={patient.prescriptions} />}
    {tab === 'Documents' && <DocumentsTab documents={patient.documents} />}
    {tab === 'Lieux de soins' && <LocationsTab locations={patient.locations} />}
    {tab === 'Fil d’audit' && <AuditTab events={patient.auditEvents} />}
    {editOpen && <PatientEditDialog patient={patient} saving={saving} onClose={() => setEditOpen(false)} onSave={savePatient} />}
    {toast && <div className="toast" role="status"><CircleCheck />{toast}</div>}
  </div>;
}

function RecordState({ icon: Icon, title, description, loading = false, onRetry }: { icon: LucideIcon; title: string; description: string; loading?: boolean; onRetry?: () => void }) {
  return <div className="page-container patient-record-page"><section className="card empty-state"><div className="empty-state__icon"><Icon className={loading ? 'spin' : ''} /></div><h3>{title}</h3><p>{description}</p>{onRetry && <button type="button" className="btn btn-secondary" onClick={onRetry}>Réessayer</button>}</section></div>;
}

function Summary({ patient, canEdit, onEdit, onAudit, onActions }: { patient: PatientData; canEdit: boolean; onEdit: () => void; onAudit: () => void; onActions: () => void }) {
  const latestLocation = patient.locations.find((location) => location.isCurrent) ?? patient.locations[0];
  return <div className="record-grid"><div className="record-main"><section className="card"><div className="card__header"><div><h2 className="card__title">Chronologie du dossier</h2><p className="card__subtitle">Actions réellement enregistrées pour ce patient</p></div><button type="button" className="icon-button" aria-label="Historique complet" onClick={onAudit}><History /></button></div><div className="card__body timeline">{patient.actions.length === 0 ? <EmptyRecord title="Aucune action clinique" description="Les actions enregistrées dans PostgreSQL apparaîtront ici." icon={Activity} /> : patient.actions.slice(0, 8).map((item) => <div className="timeline-item" key={item.id}><div className="timeline-icon"><Activity /></div><div className="timeline-content"><div className="timeline-top"><div><div className="timeline-title">{item.summary}</div><div className="timeline-detail">Statut : {item.status}</div></div><span className="timeline-kind">Action</span></div><div className="timeline-date"><Clock3 /> {formatDate(item.occurredAt, true)}</div></div></div>)}</div><div className="record-card-footer"><button type="button" className="btn btn-ghost" onClick={onAudit}>Voir l’historique complet <ChevronRight /></button></div></section><section className="card"><div className="card__header"><div><h2 className="card__title">Journal des actions du patient</h2><p className="card__subtitle">Données renvoyées par l’API</p></div><button type="button" className="btn btn-secondary" onClick={onActions}><ClipboardCheck /> Consulter</button></div>{patient.actions.length === 0 ? <EmptyRecord title="Aucune action enregistrée" description="Aucune intervention n’est associée à ce dossier." icon={ClipboardCheck} /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Date / heure</th><th>Type d’intervention</th><th>Statut</th></tr></thead><tbody>{patient.actions.map((action) => <tr key={action.id}><td>{formatDate(action.occurredAt, true)}</td><td>{action.summary}</td><td><span className="status status--active">{action.status}</span></td></tr>)}</tbody></table></div>}</section></div><div className="record-side"><section className="card"><div className="card__header"><h2 className="card__title">Informations essentielles</h2><button type="button" className="icon-button" aria-label="Modifier les informations" title={canEdit ? 'Modifier les informations' : 'Modification non autorisée'} disabled={!canEdit} onClick={onEdit}><Pencil /></button></div><div className="card__body detail-list"><Detail label="Date de naissance" value={formatDate(patient.birthDate)} icon={CalendarDays} /><Detail label="Téléphone" value={patient.phone ?? 'Non renseigné'} icon={UserRound} /><Detail label="Contact d’urgence" value={formatJson(patient.emergencyContact)} icon={ShieldCheck} /><Detail label="Allergies" value={formatJson(patient.allergies)} icon={Activity} danger /></div></section><section className="card"><div className="card__header"><div><h2 className="card__title">Lieu de soins actuel</h2><p className="card__subtitle">Dernier lieu renvoyé par l’API</p></div><MapPin size={18} /></div><div className="card__body">{latestLocation ? <div className="location-card"><div className="location-card__icon"><MapPin /></div><div><strong>{latestLocation.location?.name ?? 'Lieu sans nom'}</strong><span>{latestLocation.location?.kind ?? 'Type non renseigné'} · depuis {formatDate(latestLocation.startedAt)}</span></div></div> : <EmptyRecord title="Aucun lieu de soins" description="Aucun rattachement n’est enregistré pour ce dossier." icon={MapPin} />}</div></section><section className="card"><div className="card__header"><div><h2 className="card__title">Documents récents</h2><p className="card__subtitle">Pièces réellement liées au dossier</p></div><Link className="icon-button" aria-label="Ouvrir la gestion documentaire" href="/documents"><FolderOpen /></Link></div><div className="card__body mini-docs">{patient.documents.length === 0 ? <EmptyRecord title="Aucun document" description="Aucune pièce n’est liée à ce patient." icon={FileText} /> : patient.documents.slice(0, 5).map((document) => <MiniDoc key={document.id} name={document.fileName} meta={`${document.category} · ${formatDate(document.createdAt)}`} />)}</div></section></div></div>;
}

function ActionsTab({ actions }: { actions: RelatedAction[] }) {
  return <section className="card"><div className="card__header"><div><h2 className="card__title">Actions du patient</h2><p className="card__subtitle">Interventions et examens réellement enregistrés.</p></div><ClipboardCheck /></div><div className="card__body">{actions.length === 0 ? <EmptyRecord title="Aucune action clinique" description="Créez une mission ou enregistrez une action depuis l’API pour la voir ici." icon={ClipboardCheck} /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Date / heure</th><th>Résumé</th><th>Statut</th></tr></thead><tbody>{actions.map((action) => <tr key={action.id}><td>{formatDate(action.occurredAt, true)}</td><td>{action.summary}</td><td><span className="status status--active">{action.status}</span></td></tr>)}</tbody></table></div>}</div></section>;
}

function PatientWorkflowTab({ tab, workflow, canEdit, onSave }: { tab: string; workflow: WorkflowState; canEdit: boolean; onSave: (value: WorkflowState) => Promise<void> }) {
  const isAnalysis = tab === 'Analyses';
  const key = isAnalysis ? 'analysis' : 'care';
  const values = workflow[key];
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  async function update(next: WorkflowState) { setSaving(true); await onSave(next); setSaving(false); }
  function toggle(index: number) { const next = values.map((step, stepIndex) => stepIndex === index ? { ...step, done: !step.done } : step); void update({ ...workflow, [key]: next }); }
  function addStep(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const value = label.trim(); if (!value) return; setLabel(''); void update({ ...workflow, [key]: [...values, { label: value, done: false }] }); }
  return <div className="record-workflow-grid"><section className="card"><div className="card__header"><div><h2 className="card__title">{isAnalysis ? 'Workflow des analyses' : 'Workflow des soins spéciaux'}</h2><p className="card__subtitle">Étapes persistées dans le dossier patient.</p></div><ClipboardCheck /></div><div className="card__body workflow-panel">{values.length === 0 ? <EmptyRecord title="Aucune étape configurée" description="Ajoutez la première étape puis enregistrez-la dans le dossier." icon={ClipboardCheck} /> : values.map((step, index) => <label className="workflow-step" key={`${step.label}-${index}`}><input type="checkbox" disabled={!canEdit || saving} checked={step.done} onChange={() => toggle(index)} /><span className="workflow-step__number">{index + 1}</span><span><strong>{step.label}</strong><small>{step.done ? 'Étape validée' : 'Étape à réaliser'}</small></span></label>)}<form className="inline-action-form" onSubmit={addStep}><input disabled={!canEdit || saving} value={label} onChange={(event) => setLabel(event.target.value)} placeholder={canEdit ? 'Nom de la nouvelle étape' : 'Modification non autorisée'} /><button className="btn btn-primary" disabled={!canEdit || saving} type="submit"><Plus /> Ajouter</button></form></div></section><NotesTab disabled={!canEdit || saving} value={workflow.notes} onSave={async (notes) => update({ ...workflow, notes })} /></div>;
}

function NotesTab({ value, disabled = false, onSave }: { value: string; disabled?: boolean; onSave: (value: string) => Promise<void> | void }) {
  const [notes, setNotes] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setNotes(value), [value]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (disabled) return; setSaving(true); await onSave(notes); setSaving(false); }
  return <section className="card"><div className="card__header"><div><h2 className="card__title">Notes cliniques</h2><p className="card__subtitle">Remarques visibles par les professionnels autorisés.</p></div><History /></div><form className="card__body notes-panel" onSubmit={submit}><label>Notes et remarques<textarea disabled={disabled} value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} placeholder={disabled ? 'Modification non autorisée' : 'Ajoutez les observations utiles à l’équipe…'} /></label><div className="notes-panel__hint"><History /> La remarque est enregistrée dans le dossier via l’API.</div><button className="btn btn-secondary" type="submit" disabled={saving || disabled}>{saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? 'Enregistrement…' : 'Enregistrer la remarque'}</button></form></section>;
}

function PrescriptionsTab({ prescriptions }: { prescriptions: RelatedPrescription[] }) {
  return <section className="card"><div className="card__header"><div><h2 className="card__title">Ordonnances</h2><p className="card__subtitle">Prescriptions liées et présentes en base.</p></div><Syringe /></div>{prescriptions.length === 0 ? <EmptyRecord title="Aucune ordonnance" description="Aucune prescription n’est liée à ce dossier." icon={Syringe} /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Code</th><th>Créée le</th><th>Statut</th><th>Instructions</th></tr></thead><tbody>{prescriptions.map((item) => <tr key={item.id}><td>{item.code}</td><td>{formatDate(item.createdAt, true)}</td><td><span className="status status--active">{item.status}</span></td><td>{item.instructions ?? 'Non renseignées'}</td></tr>)}</tbody></table></div>}</section>;
}

function DocumentsTab({ documents }: { documents: RelatedDocument[] }) {
  return <section className="card"><div className="card__header"><div><h2 className="card__title">Documents</h2><p className="card__subtitle">Documents liés au dossier depuis la GED.</p></div><FileText /></div>{documents.length === 0 ? <EmptyRecord title="Aucun document" description="Aucune pièce n’est liée à ce patient." icon={FileText} /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Fichier</th><th>Titre</th><th>Catégorie</th><th>Ajouté le</th></tr></thead><tbody>{documents.map((item) => <tr key={item.id}><td>{item.fileName}</td><td>{item.title}</td><td>{item.category}</td><td>{formatDate(item.createdAt, true)}</td></tr>)}</tbody></table></div>}</section>;
}

function LocationsTab({ locations }: { locations: RelatedLocation[] }) {
  return <section className="card"><div className="card__header"><div><h2 className="card__title">Lieux de soins</h2><p className="card__subtitle">Rattachements renvoyés par la base de données.</p></div><MapPin /></div>{locations.length === 0 ? <EmptyRecord title="Aucun lieu de soins" description="Aucun rattachement n’est enregistré pour ce dossier." icon={MapPin} /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Lieu</th><th>Type</th><th>Début</th><th>Statut</th></tr></thead><tbody>{locations.map((item) => <tr key={item.id}><td>{item.location?.name ?? 'Lieu sans nom'}</td><td>{item.location?.kind ?? 'Non renseigné'}</td><td>{formatDate(item.startedAt)}</td><td><span className={`status ${item.isCurrent ? 'status--active' : 'status--pending'}`}>{item.isCurrent ? 'Actuel' : 'Terminé'}</span></td></tr>)}</tbody></table></div>}</section>;
}

function AuditTab({ events }: { events: AuditEvent[] }) {
  return <section className="card"><div className="card__header"><div><h2 className="card__title">Fil d’audit</h2><p className="card__subtitle">Événements renvoyés par la journalisation API.</p></div><History /></div>{events.length === 0 ? <EmptyRecord title="Aucun événement d’audit" description="Aucun événement n’est enregistré pour ce dossier." icon={History} /> : <div className="card__body timeline">{events.map((event) => <div className="timeline-item" key={event.id}><div className="timeline-icon"><History /></div><div className="timeline-content"><div className="timeline-title">{event.action} · {event.entityType}</div><div className="timeline-detail">{event.entityId} · {[event.actor?.firstName, event.actor?.lastName].filter(Boolean).join(' ') || 'Acteur non renseigné'}</div><div className="timeline-date"><Clock3 /> {formatDate(event.createdAt, true)}</div></div></div>)}</div>}</section>;
}

function EmptyRecord({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <div className="empty-state empty-state--compact"><div className="empty-state__icon"><Icon /></div><h3>{title}</h3><p>{description}</p></div>;
}

function Detail({ label, value, icon: Icon, danger = false }: { label: string; value: string; icon: LucideIcon; danger?: boolean }) {
  return <div className="detail-row"><span className={`detail-row__icon ${danger ? 'is-danger' : ''}`}><Icon /></span><div><div className="detail-row__label">{label}</div><div className={`detail-row__value ${danger ? 'is-danger-text' : ''}`}>{value}</div></div></div>;
}

function MiniDoc({ name, meta }: { name: string; meta: string }) {
  return <div className="mini-doc"><span className="mini-doc__icon"><FileText /></span><div><strong>{name}</strong><span>{meta}</span></div><ChevronRight /></div>;
}

function PatientEditDialog({ patient, saving, onClose, onSave }: { patient: PatientData; saving: boolean; onClose: () => void; onSave: (data: { firstName: string; lastName: string; phone: string; notes: string; allergies: string }) => Promise<void> | void }) {
  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [phone, setPhone] = useState(patient.phone ?? '');
  const [notes, setNotes] = useState(patient.notes ?? '');
  const [allergies, setAllergies] = useState(typeof patient.allergies === 'string' ? patient.allergies : formatJson(patient.allergies) === 'Non renseigné' ? '' : formatJson(patient.allergies));
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { setError('Le prénom et le nom sont obligatoires.'); return; }
    if (phone && !/^\+?[0-9 ()-]{10,20}$/.test(phone)) { setError('Le numéro de téléphone est invalide.'); return; }
    await onSave({ firstName, lastName, phone, notes, allergies });
  }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="patient-edit-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Fiche patient sécurisée</div><h2 id="patient-edit-title">Modifier {patient.firstName} {patient.lastName}</h2><p>Code patient : <strong>{patient.code}</strong></p></div><button className="icon-button" type="button" aria-label="Fermer" onClick={onClose}><X /></button></div><form className="dialog__body form-grid" onSubmit={submit}><label>Prénom *<input required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label><label>Nom *<input required value={lastName} onChange={(event) => setLastName(event.target.value)} /></label><label>Code patient<input value={patient.code} readOnly /></label><label>Téléphone<input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^0-9+ ()-]/g, '').slice(0, 20))} inputMode="tel" /></label><label>Statut actuel<input value={statusLabel(patient.status)} readOnly /></label><label>Genre<input value={genderLabels[patient.gender ?? 'UNKNOWN'] ?? 'Non renseigné'} readOnly /></label><label className="form-grid__full">Allergies et alertes<textarea rows={3} value={allergies} onChange={(event) => setAllergies(event.target.value)} placeholder="Allergie, intolérance ou alerte…" /></label><label className="form-grid__full">Notes et remarques<textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observation, correction ou consigne…" /></label>{error && <div className="form-error form-grid__full"><CircleAlert />{error}</div>}<div className="dialog__footer form-grid__full"><button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? 'Enregistrement…' : 'Enregistrer et historiser'}</button></div></form></section></div>;
}
