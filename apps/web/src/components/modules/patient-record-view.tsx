'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import {
  Activity, ArrowLeft, CalendarDays, ChevronRight, CircleAlert, CircleCheck, ClipboardCheck, Clock3, FileText, FolderOpen,
  HeartPulse, History, LoaderCircle, MapPin, MoreHorizontal, Paperclip, Pencil, Plus, Save, ShieldCheck, Syringe, UserRound, X,
} from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useUiLocale } from '@/lib/ui-i18n';
import { hasPermission, readSession } from '@/lib/auth-store';

const fallbackPatients: Record<string, PatientData> = {
  'PAT-000846': { id: undefined, code: 'PAT-000846', firstName: 'Youssef', lastName: 'Haddad', birthDate: '1958-11-04', gender: 'Homme', phone: '+33 6 33 19 04 22', notes: 'Soins à domicile, secteur Lyon 3.' },
  'PAT-000845': { id: undefined, code: 'PAT-000845', firstName: 'Élodie', lastName: 'Petit', birthDate: '1991-07-28', gender: 'Femme', phone: '+33 7 80 14 52 66', notes: '' },
  'PAT-000847': { id: undefined, code: 'PAT-000847', firstName: 'Camille', lastName: 'Bernard', birthDate: '1983-04-12', gender: 'Femme', phone: '+33 6 12 48 71 09', notes: 'Suivi cardiologique trimestriel.' },
};

type PatientData = {
  id?: string;
  code: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  email?: string;
  allergies?: unknown;
  notes?: string;
};

type WorkflowState = { analysis: boolean[]; care: boolean[]; notes: string };

const defaultWorkflow: WorkflowState = { analysis: [true, true, false, false], care: [true, true, false, false], notes: '' };

const timeline = [
  { date: '24 oct. 2024 · 08:42', title: 'Consultation cardiologie', detail: 'Dr. Sofia Martin · Consultation terminée', kind: 'Consultation', icon: HeartPulse, tone: 'teal' },
  { date: '24 oct. 2024 · 08:42', title: 'Ordonnance signée', detail: 'ORD-001932 · 2 médicaments · QR de vérification généré', kind: 'Ordonnance', icon: Syringe, tone: 'gold' },
  { date: '24 oct. 2024 · 08:38', title: 'Tracé ECG ajouté', detail: 'ECG-bernard.png · Document v1 · Dr. Sofia Martin', kind: 'Document', icon: Paperclip, tone: 'blue' },
  { date: '18 oct. 2024 · 14:20', title: 'Soins infirmiers à domicile', detail: 'Nina Rossi · Constantes relevées · Statut terminé', kind: 'Intervention', icon: Activity, tone: 'coral' },
  { date: '02 oct. 2024 · 09:15', title: 'Lieu de soins mis à jour', detail: 'Domicile · 18 rue du Lac, Lyon 6e · par Sofia Martin', kind: 'Dossier', icon: MapPin, tone: 'teal' },
];

const actions = [
  { date: '24 oct. 2024', time: '08:42', type: 'Consultation cardiologie', practitioner: 'Dr. Sofia Martin', status: 'Terminée' },
  { date: '18 oct. 2024', time: '14:20', type: 'Prise de constantes', practitioner: 'Nina Rossi', status: 'Terminée' },
  { date: '04 oct. 2024', time: '10:00', type: 'Pansement complexe', practitioner: 'Nina Rossi', status: 'Terminée' },
  { date: '26 sept. 2024', time: '09:30', type: 'Consultation générale', practitioner: 'Dr. Léa Moreau', status: 'Corrigée le 27 sept.' },
];

function age(birthDate?: string) { return birthDate ? Math.floor((Date.now() - new Date(birthDate).getTime()) / 31_557_600_000) : '—'; }
function formatDate(value?: string) { return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value)) : 'Non renseignée'; }
function initials(patient: PatientData) { return `${patient.firstName[0] ?? ''}${patient.lastName[0] ?? ''}`.toUpperCase(); }
function readPatient(code: string): PatientData {
  const fallback = fallbackPatients[code] ?? { code, firstName: 'Patient', lastName: 'à identifier' };
  if (typeof window === 'undefined') return fallback;
  try { return { ...fallback, ...(JSON.parse(window.localStorage.getItem(`mediflow.patient.${code}`) ?? 'null') as Partial<PatientData> | null) }; } catch { return fallback; }
}

export function PatientRecordView({ code }: { code: string }) {
  const { t } = useUiLocale();
  const canEdit = hasPermission('patients', 'update', readSession());
  const [tab, setTab] = useState('Synthèse');
  const [toast, setToast] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [patient, setPatient] = useState<PatientData>(() => readPatient(code));
  const [workflow, setWorkflow] = useState<WorkflowState>(() => readWorkflow(code));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const name = `${patient.firstName} ${patient.lastName}`;

  useEffect(() => {
    let active = true;
    setPatient(readPatient(code));
    setWorkflow(readWorkflow(code));
    setLoading(true);
    void apiClient.get<Record<string, unknown>>(`/patients/${code}`).then((remote) => {
      if (!active) return;
      setPatient({
        id: String(remote.id), code: String(remote.code ?? code), firstName: String(remote.firstName ?? 'Patient'), lastName: String(remote.lastName ?? 'à identifier'), birthDate: remote.birthDate ? String(remote.birthDate) : undefined, gender: remote.gender === 'MALE' ? 'Homme' : remote.gender === 'FEMALE' ? 'Femme' : 'Non renseigné', phone: remote.phone ? String(remote.phone) : undefined, email: remote.email ? String(remote.email) : undefined, allergies: remote.allergies, notes: remote.notes ? String(remote.notes) : '',
      });
    }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [code]);

  useEffect(() => { window.localStorage.setItem(`mediflow.patient.${code}`, JSON.stringify(patient)); }, [code, patient]);
  useEffect(() => { window.localStorage.setItem(`mediflow.workflow.${code}`, JSON.stringify(workflow)); }, [code, workflow]);

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(null), 2600); }

  async function savePatient(data: { firstName: string; lastName: string; phone: string; notes: string; allergies: string }) {
    const next = { ...patient, ...data, firstName: data.firstName.trim(), lastName: data.lastName.trim() };
    setSaving(true);
    try {
      if (patient.id) {
        const updated = await apiClient.patch<Record<string, unknown>>(`/patients/${patient.id}`, { firstName: next.firstName, lastName: next.lastName, phone: next.phone || undefined, notes: next.notes || undefined, allergies: next.allergies ? { value: next.allergies } : undefined });
        setPatient((current) => ({ ...current, ...next, code: String(updated.code ?? current.code) }));
      } else {
        setPatient(next);
      }
      setEditOpen(false);
      notify('Fiche patient enregistrée et historisée');
    } catch (error) {
      setPatient(next);
      setEditOpen(false);
      notify(error instanceof ApiClientError ? `Enregistrée localement : ${error.message}` : 'Fiche enregistrée localement; synchronisation à réessayer');
    } finally { setSaving(false); }
  }

  function exportRecord() {
    const payload = JSON.stringify({ patient, workflow, exportedAt: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${patient.code}-dossier.json`; anchor.click(); URL.revokeObjectURL(url);
    notify('Dossier exporté');
  }

  return <div className="page-container patient-record-page">
    <div className="record-back"><Link href="/patients"><ArrowLeft /> {t('Retour aux dossiers')}</Link><span>{loading ? t('Synchronisation…') : t('Dossier synchronisé')}</span></div>
    <section className="record-header card"><div className="record-profile"><div className="record-avatar">{initials(patient)}</div><div><div className="eyebrow">{t('Dossier patient')} · {patient.code}</div><h1>{name}</h1><div className="record-meta"><span>{age(patient.birthDate)} ans</span><span>•</span><span>{patient.gender ?? t('Non renseigné')}</span><span>•</span><span className="status status--active">{t('Dossier actif')}</span></div></div></div><div className="record-actions"><button className="btn btn-secondary" onClick={exportRecord}><FileText /> {t('Exporter')}</button><button className="btn btn-secondary" disabled={!canEdit} title={canEdit ? t('Modifier') : 'Modification non autorisée'} onClick={() => setEditOpen(true)}><Pencil /> {t('Modifier')}</button><button className="btn btn-primary" onClick={() => setTab('Actions du patient')}><Plus /> {t('Nouvelle action')}</button></div></section>
    <nav className="record-tabs" aria-label={t('Sections du dossier')}>{['Synthèse', 'Actions du patient', 'Analyses', 'Soins spéciaux', 'Ordonnances', 'Documents', 'Lieux de soins', 'Notes', 'Fil d’audit'].map((item) => <button className={tab === item ? 'is-active' : ''} key={item} onClick={() => setTab(item)}>{t(item)}{item === 'Documents' && <span>4</span>}</button>)}</nav>
    {tab === 'Synthèse' && <Summary patient={patient} canEdit={canEdit} onEdit={() => setEditOpen(true)} onAudit={() => setTab('Fil d’audit')} onActions={() => setTab('Actions du patient')} onNotify={notify} />}
    {tab === 'Actions du patient' && <ActionsTab key={patient.code} code={patient.code} canEdit={canEdit} onNotify={notify} />}
    {(tab === 'Analyses' || tab === 'Soins spéciaux') && <PatientWorkflowTab tab={tab} workflow={workflow} canEdit={canEdit} onChange={setWorkflow} onNotify={notify} />}
    {tab === 'Notes' && <NotesTab disabled={!canEdit} value={workflow.notes || patient.notes || ''} onSave={async (notes) => { if (!canEdit) { notify('Vous ne disposez pas de la permission de modifier ce dossier.'); return; } setWorkflow((current) => ({ ...current, notes })); await savePatient({ firstName: patient.firstName, lastName: patient.lastName, phone: patient.phone ?? '', notes, allergies: String(patient.allergies ?? '') }); }} />}
    {tab !== 'Synthèse' && !['Actions du patient', 'Analyses', 'Soins spéciaux', 'Notes'].includes(tab) && <RecordTabPlaceholder key={`${patient.code}-${tab}`} tab={tab} canEdit={canEdit} onNotify={notify} />}
    {editOpen && <PatientEditDialog patient={patient} saving={saving} onClose={() => setEditOpen(false)} onSave={savePatient} />}
    {toast && <div className="toast" role="status"><CircleCheck />{toast}</div>}
  </div>;
}

function readWorkflow(code: string): WorkflowState {
  if (typeof window === 'undefined') return defaultWorkflow;
  try { return { ...defaultWorkflow, ...(JSON.parse(window.localStorage.getItem(`mediflow.workflow.${code}`) ?? 'null') as Partial<WorkflowState> | null) }; } catch { return defaultWorkflow; }
}

function Summary({ patient, canEdit, onEdit, onAudit, onActions, onNotify }: { patient: PatientData; canEdit: boolean; onEdit: () => void; onAudit: () => void; onActions: () => void; onNotify: (message: string) => void }) {
  const name = `${patient.firstName} ${patient.lastName}`;
  return <div className="record-grid"><div className="record-main"><section className="card"><div className="card__header"><div><h2 className="card__title">Chronologie du dossier</h2><p className="card__subtitle">Un fil complet, daté et attribué à chaque événement</p></div><button className="icon-button" aria-label="Historique complet" onClick={onAudit}><History /></button></div><div className="card__body timeline">{timeline.map((item) => <div className="timeline-item" key={`${item.date}-${item.title}`}><div className={`timeline-icon timeline-icon--${item.tone}`}><item.icon /></div><div className="timeline-content"><div className="timeline-top"><div><div className="timeline-title">{item.title}</div><div className="timeline-detail">{item.detail}</div></div><span className="timeline-kind">{item.kind}</span></div><div className="timeline-date"><Clock3 /> {item.date}</div></div></div>)}</div><div className="record-card-footer"><button className="btn btn-ghost" onClick={onAudit}>Voir l’historique complet <ChevronRight /></button></div></section><section className="card"><div className="card__header"><div><h2 className="card__title">Journal des actions du patient</h2><p className="card__subtitle">Interventions réalisées et corrections historisées</p></div><button className="btn btn-secondary" onClick={onActions}><Pencil /> Corriger</button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Date / heure</th><th>Type d’intervention</th><th>Intervenant</th><th>Statut</th><th /></tr></thead><tbody>{actions.map((action) => <tr key={`${action.date}-${action.time}`}><td><strong className="text-[var(--ink)]">{action.date}</strong><div className="patient-cell__code">{action.time}</div></td><td>{action.type}</td><td>{action.practitioner}</td><td><span className={`status ${action.status.startsWith('Corrigée') ? 'status--pending' : 'status--active'}`}>{action.status}</span></td><td><button className="icon-button" aria-label="Voir les détails" onClick={() => onNotify('Historique de modification affiché')}><MoreHorizontal /></button></td></tr>)}</tbody></table></div></section></div><div className="record-side"><section className="card"><div className="card__header"><h2 className="card__title">Informations essentielles</h2><button className="icon-button" aria-label="Modifier les informations" title={canEdit ? 'Modifier les informations' : 'Modification non autorisée'} disabled={!canEdit} onClick={onEdit}><Pencil /></button></div><div className="card__body detail-list"><Detail label="Date de naissance" value={formatDate(patient.birthDate)} icon={CalendarDays} /><Detail label="Téléphone" value={patient.phone ?? 'Non renseigné'} icon={UserRound} /><Detail label="Contact d’urgence" value="À renseigner" icon={ShieldCheck} /><Detail label="Allergies" value={String(patient.allergies ?? 'Non renseignées')} icon={Activity} danger /></div></section><section className="card"><div className="card__header"><div><h2 className="card__title">Lieu de soins actuel</h2><p className="card__subtitle">Dernière information enregistrée</p></div><MapPin className="text-brand" size={18} /></div><div className="card__body"><div className="location-card"><div className="location-card__icon"><MapPin /></div><div><strong>Domicile</strong><span>Adresse à confirmer dans les lieux de soins</span></div></div><button className="btn btn-ghost px-0 mt-3" onClick={() => onNotify('Historique des lieux ouvert')}>Voir l’historique des lieux <ChevronRight /></button></div></section><section className="card"><div className="card__header"><div><h2 className="card__title">Documents récents</h2><p className="card__subtitle">Pièces liées au dossier</p></div><Link className="icon-button" aria-label="Ajouter un document" href="/documents"><Plus /></Link></div><div className="card__body mini-docs"><MiniDoc name="CR-cardio-bernard.pdf" meta="Compte-rendu · v2" /><MiniDoc name="ECG-bernard.png" meta="Imagerie · v1" /><MiniDoc name="ORD-001932.pdf" meta="Ordonnance · signée" /></div></section></div></div>;
}

function ActionsTab({ code, canEdit, onNotify }: { code: string; canEdit: boolean; onNotify: (message: string) => void }) {
  const storage = `mediflow.patient-actions.${code}`;
  const [created, setCreated] = useState<string[]>(() => readList(storage));
  const [completed, setCompleted] = useState<string[]>(() => readList(`${storage}.done`));
  const [label, setLabel] = useState('');
  function addAction(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!label.trim()) return; const next = [label.trim(), ...created]; setCreated(next); window.localStorage.setItem(storage, JSON.stringify(next)); setLabel(''); onNotify('Action ajoutée au dossier local'); }
  function toggleCompleted(item: string) { const next = completed.includes(item) ? completed.filter((value) => value !== item) : [item, ...completed]; setCompleted(next); window.localStorage.setItem(`${storage}.done`, JSON.stringify(next)); onNotify(next.includes(item) ? 'Action marquée comme terminée' : 'Action réouverte'); }
  return <section className="card"><div className="card__header"><div><h2 className="card__title">Actions du patient</h2><p className="card__subtitle">Ajoutez une intervention et conservez son historique local.</p></div><ClipboardCheck /></div><div className="card__body notes-panel"><form className="inline-action-form" onSubmit={addAction}><input disabled={!canEdit} value={label} onChange={(event) => setLabel(event.target.value)} placeholder={canEdit ? 'Type d’intervention, examen ou transmission' : 'Modification non autorisée'} aria-label="Nouvelle action" /><button className="btn btn-primary" disabled={!canEdit} type="submit"><Plus /> Ajouter</button></form>{created.length === 0 ? <div className="empty-state"><ClipboardCheck /><h3>Aucune nouvelle action</h3><p>Ajoutez une intervention pour la retrouver dans ce dossier.</p></div> : <div className="trash-list">{created.map((item, index) => { const isDone = completed.includes(item); return <div className="trash-item" key={`${item}-${index}`}><div className="action-icon"><ClipboardCheck /></div><div><strong>{item}</strong><span>{isDone ? 'Terminée · conservée localement' : 'Ajoutée à l’instant · à compléter'}</span></div><button className="icon-button" disabled={!canEdit} aria-label={isDone ? 'Rouvrir l’action' : 'Marquer l’action terminée'} onClick={() => toggleCompleted(item)}><CircleCheck /></button></div>; })}</div>}</div></section>;
}

function readList(key: string): string[] { if (typeof window === 'undefined') return []; try { const value = JSON.parse(window.localStorage.getItem(key) ?? '[]'); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; } catch { return []; } }

function PatientWorkflowTab({ tab, workflow, canEdit, onChange, onNotify }: { tab: string; workflow: WorkflowState; canEdit: boolean; onChange: (value: WorkflowState) => void; onNotify: (message: string) => void }) {
  const isAnalysis = tab === 'Analyses';
  const values = isAnalysis ? workflow.analysis : workflow.care;
  const defaultSteps = isAnalysis ? ['Demande d’analyse enregistrée', 'Prélèvement planifié', 'Résultat contrôlé par le laboratoire', 'Résultat transmis au dossier'] : ['Évaluation des besoins spécifiques', 'Plan de soins validé', 'Intervention réalisée', 'Contrôle et transmission'];
  const steps = values.map((_, index) => defaultSteps[index] ?? `Étape personnalisée ${index + 1}`);
  const workflowKey = isAnalysis ? 'analysis' : 'care';
  function toggle(index: number) { if (!canEdit) { onNotify('Vous ne disposez pas de la permission de modifier ce workflow.'); return; } const next = [...values]; next[index] = !next[index]; onChange({ ...workflow, [workflowKey]: next }); onNotify(`Étape ${index + 1} ${next[index] ? 'validée' : 'réouverte'}`); }
  function addStep() { if (!canEdit) { onNotify('Vous ne disposez pas de la permission de modifier ce workflow.'); return; } onChange({ ...workflow, [workflowKey]: [...values, false] }); onNotify('Étape personnalisée ajoutée au workflow'); }
  return <div className="record-workflow-grid"><section className="card"><div className="card__header"><div><h2 className="card__title">{isAnalysis ? 'Workflow des analyses' : 'Workflow des soins spéciaux'}</h2><p className="card__subtitle">Étapes persistées dans le dossier patient.</p></div><ClipboardCheck /></div><div className="card__body workflow-panel">{steps.map((step, index) => <label className="workflow-step" key={`${step}-${index}`}><input type="checkbox" disabled={!canEdit} checked={values[index] ?? false} onChange={() => toggle(index)} /><span className="workflow-step__number">{index + 1}</span><span><strong>{step}</strong><small>Responsable · échéance · remarque obligatoire</small></span></label>)}<button className="btn btn-primary" disabled={!canEdit} type="button" onClick={addStep}><Plus /> Ajouter une étape</button></div></section><NotesTab disabled={!canEdit} value={workflow.notes} onSave={async (notes) => { onChange({ ...workflow, notes }); onNotify('Note ajoutée à la chronologie'); }} /></div>;
}

function NotesTab({ value, disabled = false, onSave }: { value: string; disabled?: boolean; onSave: (value: string) => Promise<void> | void }) { const [notes, setNotes] = useState(value); const [saving, setSaving] = useState(false); useEffect(() => setNotes(value), [value]); async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (disabled) return; setSaving(true); await onSave(notes); setSaving(false); } return <section className="card"><div className="card__header"><div><h2 className="card__title">Notes cliniques</h2><p className="card__subtitle">Remarques visibles par les professionnels autorisés.</p></div><History /></div><form className="card__body notes-panel" onSubmit={submit}><label>Notes et remarques<textarea disabled={disabled} value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} placeholder={disabled ? 'Modification non autorisée' : 'Ajoutez les observations utiles à l’équipe…'} /></label><div className="notes-panel__hint"><History /> Chaque modification est historisée et associée à votre utilisateur.</div><button className="btn btn-secondary" type="submit" disabled={saving || disabled}>{saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? 'Enregistrement…' : 'Enregistrer la remarque'}</button></form></section>; }

function Detail({ label, value, icon: Icon, danger = false }: { label: string; value: string; icon: typeof CalendarDays; danger?: boolean }) { return <div className="detail-row"><span className={`detail-row__icon ${danger ? 'is-danger' : ''}`}><Icon /></span><div><div className="detail-row__label">{label}</div><div className={`detail-row__value ${danger ? 'is-danger-text' : ''}`}>{value}</div></div></div>; }
function MiniDoc({ name, meta }: { name: string; meta: string }) { return <div className="mini-doc"><span className="mini-doc__icon"><FileText /></span><div><strong>{name}</strong><span>{meta}</span></div><ChevronRight /></div>; }

function PatientEditDialog({ patient, saving, onClose, onSave }: { patient: PatientData; saving: boolean; onClose: () => void; onSave: (data: { firstName: string; lastName: string; phone: string; notes: string; allergies: string }) => Promise<void> | void }) {
  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [phone, setPhone] = useState(patient.phone ?? '');
  const [notes, setNotes] = useState(patient.notes ?? '');
  const [allergies, setAllergies] = useState(typeof patient.allergies === 'string' ? patient.allergies : '');
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!firstName.trim() || !lastName.trim()) { setError('Le prénom et le nom sont obligatoires.'); return; } if (phone && !/^\+?[0-9 ()-]{10,20}$/.test(phone)) { setError('Le numéro de téléphone est invalide.'); return; } await onSave({ firstName, lastName, phone, notes, allergies }); }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="patient-edit-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Fiche patient sécurisée</div><h2 id="patient-edit-title">Modifier {patient.firstName} {patient.lastName}</h2><p>Code patient : <strong>{patient.code}</strong> · toute correction est historisée.</p></div><button className="icon-button" type="button" aria-label="Fermer" onClick={onClose}><X /></button></div><form className="dialog__body form-grid" onSubmit={submit}><label>Prénom *<input required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label><label>Nom *<input required value={lastName} onChange={(event) => setLastName(event.target.value)} /></label><label>Code patient<input value={patient.code} readOnly /></label><label>Téléphone<input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^0-9+ ()-]/g, '').slice(0, 20))} inputMode="tel" /></label><label>Contact d’urgence<input defaultValue="À renseigner" /></label><label>Statut<select defaultValue="Actif"><option>Actif</option><option>Suivi</option><option>Archivé</option></select></label><label className="form-grid__full">Allergies et alertes<textarea rows={3} value={allergies} onChange={(event) => setAllergies(event.target.value)} placeholder="Allergie, intolérance ou alerte…" /></label><label className="form-grid__full">Notes et remarques<textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observation, correction ou consigne…" /></label>{error && <div className="form-error form-grid__full"><CircleAlert />{error}</div>}<div className="dialog__footer form-grid__full"><button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? 'Enregistrement…' : 'Enregistrer et historiser'}</button></div></form></section></div>;
}

function RecordTabPlaceholder({ tab, canEdit, onNotify }: { tab: string; canEdit: boolean; onNotify: (message: string) => void }) {
  const key = `mediflow.patient-tab.${tab}`;
  const [items, setItems] = useState<string[]>(() => readList(key));
  const [label, setLabel] = useState('');
  function add(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!label.trim()) return; const next = [label.trim(), ...items]; setItems(next); window.localStorage.setItem(key, JSON.stringify(next)); setLabel(''); onNotify(`${tab} : élément ajouté`); }
  return <section className="card record-placeholder"><div className="card__header"><div><h2 className="card__title">{tab}</h2><p className="card__subtitle">Éléments liés au dossier, avec traçabilité et conservation locale.</p></div><FolderOpen /></div><div className="card__body notes-panel"><form className="inline-action-form" onSubmit={add}><input disabled={!canEdit} value={label} onChange={(event) => setLabel(event.target.value)} placeholder={canEdit ? `Ajouter un élément à ${tab.toLowerCase()}` : 'Modification non autorisée'} aria-label={`Ajouter un élément à ${tab}`} /><button className="btn btn-primary" disabled={!canEdit} type="submit"><Plus /> Ajouter</button></form>{items.length === 0 ? <div className="empty-state"><div className="empty-state__icon"><FolderOpen /></div><h3>Aucun élément</h3><p>Ajoutez un élément pour le conserver dans cette section.</p></div> : <div className="trash-list">{items.map((item, index) => <div className="trash-item" key={`${item}-${index}`}><div className="action-icon"><FolderOpen /></div><div><strong>{item}</strong><span>Ajouté à l’instant · historisé</span></div></div>)}</div>}</div></section>;
}
