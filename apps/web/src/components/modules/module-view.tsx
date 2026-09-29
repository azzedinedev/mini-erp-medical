'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import {
  Archive, ArrowDownToLine, ArrowRight, Bandage, BarChart3, Check, ChevronDown, CircleAlert, CircleCheck, ClipboardCheck, ClipboardList,
  Download, FileCheck2, FilePenLine, FilePlus2, FileText, Files, FolderHeart, Handshake, HeartPulse, History, ListChecks, LoaderCircle,
  LockKeyhole, MapPinned, MoreHorizontal, Package, Pencil, Plus, ReceiptText, RotateCcw, Save, ScanLine, Search, Settings2, ShieldCheck,
  Stethoscope, Syringe, Trash2, Truck, UserPlus, UserRound, UsersRound, X, type LucideIcon,
} from 'lucide-react';
import { moduleConfigs, type NavItem } from '@/lib/mock-data';
import { useUiLocale } from '@/lib/ui-i18n';

const icons: Record<string, LucideIcon> = { FolderHeart, Syringe, Package, MapPinned, Truck, Files, Stethoscope, Handshake, UsersRound, ListChecks, ReceiptText, Settings2 };
const moduleRows: Record<string, Array<string[]>> = {
  patients: [
    ['Camille Bernard|PAT-000847|42 ans|CB', 'Consultation cardiologie', 'Domicile · Lyon 6e', 'Actif', 'Aujourd’hui, 08:42'],
    ['Youssef Haddad|PAT-000846|65 ans|YH', 'Soins infirmiers', 'Domicile · Lyon 3e', 'Actif', 'Aujourd’hui, 08:17'],
    ['Élodie Petit|PAT-000845|33 ans|EP', 'Ordonnance créée', 'Centre Saint-Clair', 'Suivi', 'Hier, 17:36'],
    ['Marc Dubois|PAT-000844|57 ans|MD', 'Résultat biologique', 'Domicile · Villeurbanne', 'Actif', 'Hier, 15:22'],
    ['Aïcha Benali|PAT-000843|71 ans|AB', 'Pansement complexe', 'Domicile · Caluire', 'Actif', 'Hier, 11:04'],
    ['Louis Morel|PAT-000842|48 ans|LM', 'Consultation générale', 'Centre Saint-Clair', 'À compléter', '23 oct. 2024'],
  ],
  prescriptions: [['ORD-001932|Camille Bernard|PAT-000847', 'Camille Bernard|PAT-000847', 'Dr. Sofia Martin', '24 oct. 2024 · 08:40', 'Signée'], ['ORD-001931|Youssef Haddad|PAT-000846', 'Youssef Haddad|PAT-000846', 'Dr. Sofia Martin', '23 oct. 2024 · 16:10', 'À signer'], ['ORD-001930|Élodie Petit|PAT-000845', 'Élodie Petit|PAT-000845', 'Dr. Sofia Martin', '23 oct. 2024 · 14:28', 'Délivrée'], ['ORD-001929|Marc Dubois|PAT-000844', 'Marc Dubois|PAT-000844', 'Dr. Léa Moreau', '22 oct. 2024 · 11:50', 'Brouillon'], ['ORD-001928|Aïcha Benali|PAT-000843', 'Aïcha Benali|PAT-000843', 'Dr. Sofia Martin', '22 oct. 2024 · 10:24', 'Délivrée']],
  inventory: [['INV-000001|Gants nitrile — taille M|Protection', 'Protection', '42 boîtes / min. 20', 'Réserve A · Étagère 02', 'Disponible'], ['INV-000002|Pansements stériles 10 × 10|Soins', 'Soins', '8 boîtes / min. 12', 'Réserve A · Étagère 04', 'Stock critique'], ['INV-000003|Seringues 5 ml|Injection', 'Injection', '31 boîtes / min. 15', 'Réserve B · Étagère 01', 'Disponible'], ['INV-000004|Compresses stériles|Soins', 'Soins', '16 boîtes / min. 10', 'Réserve A · Étagère 03', 'Disponible'], ['INV-000005|Désinfectant cutané|Hygiène', 'Hygiène', '4 flacons / min. 8', 'Réserve B · Étagère 05', 'Stock critique']],
  missions: [['MIS-000248|Soins à domicile', 'Youssef Haddad|PAT-000846', 'Nina Rossi · Infirmière', 'Aujourd’hui · 10:30', 'En cours'], ['MIS-000249|Livraison matériel', 'Centre Médical Croix-Rousse', 'Thomas Nguyen · Technicien', 'Aujourd’hui · 11:45', 'Planifiée'], ['MIS-000250|Pansement complexe', 'Aïcha Benali|PAT-000843', 'Nina Rossi · Infirmière', 'Aujourd’hui · 14:00', 'Planifiée'], ['MIS-000247|Prélèvement biologique', 'Marc Dubois|PAT-000844', 'Thomas Nguyen · Technicien', 'Terminée · 09:10', 'Terminée'], ['MIS-000246|Suivi cardiologie', 'Camille Bernard|PAT-000847', 'Dr. Sofia Martin', '23 oct. · 15:00', 'Terminée']],
  deliveries: [['LIV-000381|Colis pharmacie secteur Est', 'Pharmacie des Terreaux', 'MIS-000249', 'Aujourd’hui · 11:45', 'En cours'], ['LIV-000380|Dispositifs de soins', 'Centre Médical Croix-Rousse', 'MIS-000244', 'Aujourd’hui · 09:30', 'Livrée'], ['LIV-000379|Traitement Camille B.', 'Camille Bernard', '—', '23 oct. · 16:00', 'Livrée'], ['LIV-000378|Consommables infirmiers', 'Cabinet du Parc', 'MIS-000241', '23 oct. · 13:15', 'Annulée']],
  documents: [['CR-cardio-bernard.pdf|Compte-rendu cardiologie', 'Compte-rendu', 'PAT-000847 · Camille Bernard', 'v2', 'Aujourd’hui, 08:45'], ['resultats-labo-dubois.pdf|Résultats laboratoire', 'Résultat', 'PAT-000844 · Marc Dubois', 'v1', 'Hier, 15:22'], ['ORD-001932.pdf|Ordonnance signée', 'Ordonnance', 'ORD-001932 · Camille Bernard', 'v1', 'Aujourd’hui, 08:42'], ['ECG-bernard.png|Tracé ECG — octobre', 'Imagerie', 'PAT-000847 · Camille Bernard', 'v1', 'Aujourd’hui, 08:38'], ['fiche-mission-248.pdf|Fiche de mission', 'Mission', 'MIS-000248 · Youssef Haddad', 'v3', 'Aujourd’hui, 08:17']],
  team: [['Sofia Martin|Cardiologie|SM', 'Médecin', 'Cardiologie', '24 / 28 créneaux', 'Actif'], ['Nina Rossi|Soins à domicile|NR', 'Infirmière', 'Soins à domicile', '18 / 20 créneaux', 'Actif'], ['Thomas Nguyen|Biologie|TN', 'Technicien', 'Biologie médicale', '12 / 16 créneaux', 'Actif'], ['Léa Moreau|Médecine interne|LM', 'Médecin', 'Médecine interne', '20 / 24 créneaux', 'Actif'], ['Inès Garcia|Soins infirmiers|IG', 'Infirmière', 'Pansements', 'Congé jusqu’au 28 oct.', 'Absent']],
  partners: [['Centre Médical Croix-Rousse|Établissement|CM', 'Établissement de santé', 'Claire Fontaine · Directrice', 'Aujourd’hui, 09:20', 'Actif'], ['Pharmacie des Terreaux|Fournisseur|PT', 'Fournisseur', 'Julien Armand · Pharmacien', 'Hier, 16:10', 'Actif'], ['Cabinet du Parc|Client|CP', 'Client', 'Sophie Rey · Secrétariat', '22 oct. 2024', 'Actif'], ['Laboratoire Biolyon|Laboratoire|LB', 'Partenaire laboratoire', 'Omar Haddad · Responsable', '18 oct. 2024', 'Actif']],
  users: [['Sofia Martin|sofia.martin@mediflow.local|SM', 'Administratrice · Médecin', 'Aujourd’hui, 08:42', 'Activée', 'Actif'], ['Nina Rossi|nina.rossi@mediflow.local|NR', 'Infirmière · Terrain', 'Aujourd’hui, 07:58', 'Activée', 'Actif'], ['Thomas Nguyen|thomas.nguyen@mediflow.local|TN', 'Technicien', 'Hier, 18:12', 'Activée', 'Actif'], ['Léa Moreau|lea.moreau@mediflow.local|LM', 'Médecin prescripteur', '23 oct. 2024', 'Non activée', 'Invitation en attente']],
  references: [['Consultation générale|CONSULT-GEN|Stéthoscope', 'Type d’acte', 'CONSULT-GEN', 'Aujourd’hui, 08:15', 'Actif'], ['Cardiologie|CARDIO|HeartPulse', 'Type d’acte', 'CARDIO', '22 oct. 2024', 'Actif'], ['Pansement|PANSEMENT|Bandage', 'Soin infirmier', 'PANSEMENT', '20 oct. 2024', 'Actif'], ['Paracétamol 1 g|MED-001|Comprimé', 'Médicament', 'MED-001', '18 oct. 2024', 'Actif'], ['Amoxicilline 500 mg|MED-002|Gélule', 'Médicament', 'MED-002', '18 oct. 2024', 'Actif']],
  finance: [['FAC-000128|Consultations octobre', 'Centre Médical Croix-Rousse', '24 oct. 2024', '4 820,00 €', 'Émise'], ['FAC-000127|Livraisons secteur Est', 'Pharmacie des Terreaux', '23 oct. 2024', '1 240,00 €', 'Payée'], ['FAC-000126|Suivi à domicile', 'Cabinet du Parc', '22 oct. 2024', '2 680,00 €', 'Partiellement payée'], ['FAC-000125|Interventions septembre', 'Centre Médical Croix-Rousse', '30 sept. 2024', '5 140,00 €', 'Payée']],
};

function Status({ value, label = value }: { value: string; label?: string }) {
  const tone = value.includes('critique') || value === 'Annulée' || value === 'Absent' ? 'status--critical' : value.includes('attente') || value === 'À signer' || value === 'Planifiée' || value === 'Brouillon' || value === 'Partiellement payée' ? 'status--pending' : value === 'En cours' ? 'status--progress' : 'status--active';
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

export function ModuleView({ module }: { module: keyof typeof moduleConfigs }) {
  const config = moduleConfigs[module];
  const Icon = icons[config.icon] ?? ClipboardList;
  const { t } = useUiLocale();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>(config.tabs[0]);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; row?: string[] } | null>(null);
  const [actionRow, setActionRow] = useState<string[] | null>(null);
  const [trashItems, setTrashItems] = useState<string[][]>([]);
  const [trashOpen, setTrashOpen] = useState(false);
  const rows = moduleRows[module] ?? [];
  const [records, setRecords] = useState<string[][]>(rows);
  const filtered = useMemo(() => {
    const tab = String(activeTab);
    return records.filter((row) => {
      const content = row.join(' ').toLowerCase();
      const normalizedTab = tab.replace('Tous les ', '').replace('Toutes les ', '').toLowerCase().slice(0, -1);
      return content.includes(query.toLowerCase()) && (tab === String(config.tabs[0]) || tab === 'Tous' || tab === 'Toutes' || (tab === 'Stock critique' && content.includes('critique')) || content.includes(normalizedTab));
    });
  }, [activeTab, config.tabs, query, records]);

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(null), 2500); }
  function openCreate() { setEditor({ mode: 'create' }); }
  function openEdit(row: string[]) { setEditor({ mode: 'edit', row }); setActionRow(null); }
  function moveToTrash(row: string[]) {
    setRecords((current) => current.filter((item) => item !== row));
    setTrashItems((current) => [...current, row]);
    setActionRow(null);
    notify(`${row[0]?.split('|')[0] ?? 'Élément'} placé dans la corbeille`);
  }
  function archiveRow(row: string[]) { moveToTrash(row); }
  function restoreRow(row: string[]) {
    setTrashItems((current) => current.filter((item) => item !== row));
    setRecords((current) => [...current, row]);
    notify('Élément restauré');
  }
  function saveRecord(record: string[], mode: 'create' | 'edit') {
    if (mode === 'create') setRecords((current) => [record, ...current]);
    else setRecords((current) => current.map((item) => item[0] === record[0] ? record : item));
    setEditor(null);
    notify(mode === 'create' ? 'Entrée créée avec succès' : 'Modifications enregistrées');
  }

  if (module === 'settings') return <SettingsPanel onNotify={notify} />;

  return <div className="page-container">
    <section className="page-heading"><div><div className="eyebrow">{t(config.eyebrow)}</div><h1>{t(config.title)}</h1><p>{t(config.description)}</p></div><div className="heading-actions"><button className="icon-button action-icon action-icon--trash" aria-label={t('Corbeille')} title={t('Corbeille')} onClick={() => setTrashOpen(true)}><Trash2 />{trashItems.length > 0 && <span className="action-count">{trashItems.length}</span>}</button><button className="btn btn-secondary" onClick={() => notify('Export en préparation')}><Download /> {t('Exporter')}</button><button className="btn btn-primary" onClick={openCreate}><Plus /><span>{t(config.primary)}</span></button></div></section>
    {config.stats.length > 0 && <section className="module-stats">{config.stats.map(([label, value, hint]) => <div className="module-stat" key={label}><div className="module-stat__label">{t(label)}</div><div className="module-stat__value">{value}</div><div className="module-stat__hint">{t(hint)}</div></div>)}</section>}
    <section className="card module-list-card"><div className="module-toolbar"><div className="filter-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${t('Rechercher')} dans ${t(config.title).toLowerCase()}...`} aria-label={`${t('Rechercher')} dans ${t(config.title)}`} /></div><div className="filter-tabs">{config.tabs.map((tab) => <button className={`filter-tab ${activeTab === tab ? 'is-active' : ''}`} key={tab} onClick={() => setActiveTab(tab)}>{t(tab)}</button>)}</div><button className="btn btn-secondary" onClick={() => notify('Filtres avancés ouverts')}><ListChecks /> {t('Filtres')}</button></div>
      {filtered.length === 0 ? <div className="empty-state"><div className="empty-state__icon"><Search /></div><h3>Aucun résultat</h3><p>Modifiez votre recherche ou vos filtres pour retrouver une entrée.</p></div> : <div className="table-wrap"><table className="data-table"><thead><tr>{config.columns.map((column) => <th key={column}>{t(column)}</th>)}<th aria-label={t('Actions')}>{t('Actions')}</th></tr></thead><tbody>{filtered.map((row, index) => <tr key={`${row[0] ?? ''}-${index}`} onClick={() => module === 'patients' ? setSelected(row[0] ?? '') : undefined} className={module === 'patients' ? 'cursor-pointer' : ''}><td><PrimaryCell value={row[0] ?? ''} module={module} /></td>{row.slice(1).map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cellIndex === row.length - 2 ? <Status value={cell} label={t(cell)} /> : (cell.includes('|') && ['prescriptions', 'missions', 'deliveries'].includes(module) && cellIndex === 0 ? <PrimaryCell value={cell} module="patients" /> : cell)}</td>)}<td><button className="icon-button action-icon action-icon--more" aria-label={`${t('Actions')} ${(row[0] ?? '').split('|')[0]}`} title={t('Actions')} onClick={(event) => { event.stopPropagation(); setActionRow(row); }}><MoreHorizontal /></button></td></tr>)}</tbody></table></div>}
      <div className="table-footer"><span className="table-footer__count">{filtered.length} résultat{filtered.length > 1 ? 's' : ''} · mise à jour à l’instant</span><div className="pagination"><button aria-label="Page précédente">‹</button><button className="is-current">1</button><button>2</button><button>3</button><button aria-label="Page suivante">›</button></div></div>
    </section>
    {selected && <PatientDrawer patient={selected} onClose={() => setSelected(null)} onNotify={notify} onEdit={() => { const row = records.find((item) => item[0] === selected); if (row) setEditor({ mode: 'edit', row }); setSelected(null); }} />}
    {actionRow && <ActionSheet row={actionRow} t={t} onClose={() => setActionRow(null)} onView={() => { setSelected(actionRow[0] ?? ''); setActionRow(null); }} onEdit={() => openEdit(actionRow)} onArchive={() => archiveRow(actionRow)} onDelete={() => moveToTrash(actionRow)} />}
    {editor && <CrudDialog module={module} config={config} mode={editor.mode} initialRow={editor.row} t={t} onClose={() => setEditor(null)} onSave={saveRecord} />}
    {trashOpen && <TrashDialog items={trashItems} t={t} onClose={() => setTrashOpen(false)} onRestore={restoreRow} onEmpty={() => { setTrashItems([]); setTrashOpen(false); notify('Corbeille vidée'); }} />}
    {toast && <div className="toast" role="status"><CircleCheck />{toast}</div>}
  </div>;
}
function ActionSheet({ row, t, onClose, onView, onEdit, onArchive, onDelete }: { row: string[]; t: (value: string) => string; onClose: () => void; onView: () => void; onEdit: () => void; onArchive: () => void; onDelete: () => void }) {
  const title = row[0]?.split('|')[0] ?? 'Élément';
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="action-sheet glass-panel" role="dialog" aria-modal="true" aria-labelledby="action-sheet-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">{t('Actions')}</div><h2 id="action-sheet-title">{title}</h2><p>Choisissez une action sécurisée pour cet élément.</p></div><button className="icon-button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div><div className="action-grid"><button className="action-tile action-tile--view" onClick={onView}><ClipboardCheck /><span>{t('Consulter')}</span><small>Ouvrir la fiche détaillée</small></button><button className="action-tile action-tile--edit" onClick={onEdit}><FilePenLine /><span>{t('Modifier')}</span><small>Éditer avec validation</small></button><button className="action-tile action-tile--archive" onClick={onArchive}><Archive /><span>{t('Archiver')}</span><small>Retirer des listes actives</small></button><button className="action-tile action-tile--delete" onClick={onDelete}><Trash2 /><span>{t('Supprimer')}</span><small>Déplacer vers la corbeille</small></button></div></section></div>;
}

function CrudDialog({ module, config, mode, initialRow, t, onClose, onSave }: { module: keyof typeof moduleConfigs; config: (typeof moduleConfigs)[keyof typeof moduleConfigs]; mode: 'create' | 'edit'; initialRow?: string[]; t: (value: string) => string; onClose: () => void; onSave: (row: string[], mode: 'create' | 'edit') => void }) {
  const parts = initialRow?.[0]?.split('|') ?? [];
  const [label, setLabel] = useState(parts[0] ?? '');
  const [code, setCode] = useState(parts[1] ?? (module === 'patients' ? 'PAT-000000' : '')); 
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<'identity' | 'analysis' | 'care' | 'notes'>('identity');
  const [error, setError] = useState<string | null>(null);
  const title = mode === 'create' ? t(config.primary) : `${t('Modifier')} · ${t(config.title)}`;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim()) { setError('Le libellé ou le nom est obligatoire.'); setTab('identity'); return; }
    if (module === 'patients' && !/^PAT-\d{6}$/i.test(code.trim())) { setError('Le code patient doit respecter le format PAT-000000.'); setTab('identity'); return; }
    const identity = `${label.trim()}|${code.trim().toUpperCase()}|${parts[2] ?? label.trim().split(' ').map((item) => item[0]).join('').slice(0, 2).toUpperCase()}`;
    const next = initialRow ? [...initialRow] : Array.from({ length: config.columns.length }, (_, index) => index === 0 ? identity : index === config.columns.length - 1 ? 'Actif' : index === 1 ? (notes || 'À compléter') : 'À renseigner');
    next[0] = identity;
    if (next.length > 1 && notes) next[1] = notes;
    onSave(next, mode);
  }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel crud-dialog" role="dialog" aria-modal="true" aria-labelledby="crud-dialog-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">{mode === 'create' ? 'Nouveau workflow' : 'Fiche sécurisée'}</div><h2 id="crud-dialog-title">{title}</h2><p>Les champs marqués d’un astérisque sont obligatoires.</p></div><button className="icon-button" type="button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div><div className="dialog-tabs"><button className={tab === 'identity' ? 'is-active' : ''} type="button" onClick={() => setTab('identity')}><UserRound /> {t('Identité')}</button><button className={tab === 'analysis' ? 'is-active' : ''} type="button" onClick={() => setTab('analysis')}><ClipboardCheck /> {t('Analyses')}</button><button className={tab === 'care' ? 'is-active' : ''} type="button" onClick={() => setTab('care')}><HeartPulse /> {t('Soins spéciaux')}</button><button className={tab === 'notes' ? 'is-active' : ''} type="button" onClick={() => setTab('notes')}><FileText /> {t('Notes et remarques')}</button></div><form className="dialog__body" onSubmit={submit}>{tab === 'identity' && <div className="form-grid"><label>Nom ou libellé *<input autoFocus required value={label} onChange={(event) => setLabel(event.target.value)} aria-invalid={Boolean(error)} placeholder="Nom complet ou désignation" /></label><label>Code de référence *<input required value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder={module === 'patients' ? 'PAT-000000' : 'CODE-000001'} /></label><label>Téléphone<input value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} inputMode="tel" placeholder="+33 6 00 00 00 00" /></label><label>Statut<select defaultValue="Actif"><option>Actif</option><option>À compléter</option><option>Archivé</option></select></label><label className="form-grid__full">Étiquette / catégorie<input placeholder="Ajouter une étiquette métier" /></label></div>}{tab === 'analysis' && <div className="workflow-panel"><div className="workflow-panel__intro"><ClipboardCheck /><div><strong>Workflow des analyses</strong><span>Suivez les étapes de prescription, prélèvement, validation et archivage.</span></div></div>{['Demande enregistrée', 'Prélèvement planifié', 'Résultat contrôlé', 'Résultat transmis au patient'].map((step, index) => <label className="workflow-step" key={step}><input type="checkbox" defaultChecked={index === 0} /><span className="workflow-step__number">{index + 1}</span><span><strong>{step}</strong><small>Responsable, date et pièce jointe obligatoires</small></span></label>)}<button type="button" className="btn btn-secondary" onClick={() => setError('Le fichier d’analyse sera ajouté depuis la GED.')}><FilePlus2 /> Ajouter un résultat</button></div>}{tab === 'care' && <div className="workflow-panel"><div className="workflow-panel__intro workflow-panel__intro--coral"><HeartPulse /><div><strong>Soins spéciaux</strong><span>Définissez les précautions et consignes visibles par l’équipe.</span></div></div><div className="care-checks"><label><input type="checkbox" /> Allergie ou intolérance</label><label><input type="checkbox" /> Mobilité réduite</label><label><input type="checkbox" /> Isolement requis</label><label><input type="checkbox" /> Matériel spécifique</label></div><label className="form-grid__full">Consignes de soins<textarea rows={4} placeholder="Précautions, fréquence, matériel, personne à prévenir…" /></label></div>}{tab === 'notes' && <div className="notes-panel"><label>Notes et remarques<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} placeholder="Ajoutez les observations utiles à l’équipe…" /></label><div className="notes-panel__hint"><History /> Chaque modification est historisée et associée à votre utilisateur.</div></div>}{error && <div className="form-error" role="alert"><CircleAlert />{error}</div>}<div className="dialog__footer"><button type="button" className="btn btn-secondary" onClick={onClose}>{t('Annuler')}</button><button type="submit" className="btn btn-primary"><Save /> {t('Enregistrer')}</button></div></form></section></div>;
}

function TrashDialog({ items, t, onClose, onRestore, onEmpty }: { items: string[][]; t: (value: string) => string; onClose: () => void; onRestore: (row: string[]) => void; onEmpty: () => void }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel trash-dialog" role="dialog" aria-modal="true" aria-labelledby="trash-dialog-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Récupération</div><h2 id="trash-dialog-title">{t('Corbeille')}</h2><p>Les éléments peuvent être restaurés avant suppression définitive.</p></div><button className="icon-button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div>{items.length === 0 ? <div className="trash-empty"><Trash2 /><h3>{t('Aucune entrée dans la corbeille.')}</h3><p>Les suppressions et archivages apparaîtront ici.</p></div> : <div className="trash-list">{items.map((row, index) => <div className="trash-item" key={`${row[0]}-${index}`}><div className="action-icon action-icon--delete"><Trash2 /></div><div><strong>{row[0]?.split('|')[0]}</strong><span>{row[0]?.split('|')[1] ?? 'Élément archivé'}</span></div><button className="btn btn-secondary" onClick={() => onRestore(row)}><RotateCcw /> {t('Restaurer')}</button></div>)}</div>}<div className="dialog__footer"><button className="btn btn-secondary" onClick={onClose}>{t('Fermer')}</button>{items.length > 0 && <button className="btn btn-danger" onClick={onEmpty}><Trash2 /> Vider la corbeille</button>}</div></section></div>;
}

function formatPhone(value: string) {
  const digits = value.replace(/[^\d+]/g, '').slice(0, 16);
  return digits.replace(/(\+\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');
}

function PatientDrawer({ patient, onClose, onNotify, onEdit }: { patient: string; onClose: () => void; onNotify: (message: string) => void; onEdit: () => void }) {
  const [name, code, age, initials] = patient.split('|');
  return <div className="drawer-backdrop" onClick={onClose}><aside className="patient-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div className="patient-cell"><span className="patient-cell__avatar drawer-avatar">{initials}</span><div><div className="patient-cell__name">{name}</div><div className="patient-cell__code">{code} · {age}</div></div></div><div className="drawer-head__actions"><button className="icon-button action-icon action-icon--edit" aria-label="Modifier" title="Modifier" onClick={onEdit}><FilePenLine /></button><button className="icon-button" aria-label="Fermer" onClick={onClose}><X /></button></div></div><div className="drawer-body"><div className="status status--active">Dossier actif</div><div className="drawer-section"><div className="drawer-label">Prochaine intervention</div><div className="drawer-highlight"><CalendarIcon /><div><strong>Consultation cardiologie</strong><span>24 octobre · 09:00 · Dr. Sofia Martin</span></div></div></div><div className="drawer-section"><div className="drawer-label">Résumé clinique</div><p className="drawer-copy">Suivi régulier. Les éléments importants du dossier et les allergies connues sont visibles ici.</p></div><div className="drawer-section"><div className="drawer-label">Accès rapides</div><div className="drawer-actions"><button onClick={() => onNotify('Nouvelle ordonnance')}><Syringe /> Ordonnance</button><button onClick={() => onNotify('Document ajouté')}><FilePlus2 /> Document</button><button onClick={() => onNotify('Historique ouvert')}><ClipboardList /> Historique</button></div></div><Link className="btn btn-primary w-full" href={`/patients/${code}`} onClick={onClose}>Ouvrir le dossier complet <ArrowRight /></Link></div></aside></div>;
}

function CalendarIcon() { return <div className="drawer-icon"><ScanLine /></div>; }

function SettingsPanel({ onNotify }: { onNotify: (message: string) => void }) {
  const [finance, setFinance] = useState(true);
  const [captcha, setCaptcha] = useState(false);
  const [twoFa, setTwoFa] = useState(true);
  return <div className="page-container"><section className="page-heading"><div><div className="eyebrow">Administration</div><h1>Paramètres</h1><p>Configurez l’identité, les modules, la sécurité et les préférences de MediFlow.</p></div><button className="btn btn-primary" onClick={() => onNotify('Paramètres enregistrés')}><Check /> Enregistrer</button></section><div className="settings-grid"><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Identité de l’application</h2><p className="card__subtitle">Ces informations apparaissent sur les documents officiels.</p></div><Settings2 /></div><div className="card__body form-grid"><label>Nom de l’application<input defaultValue="MediFlow" /></label><label>Nom de la structure<input defaultValue="Clinique Saint-Clair" /></label><label className="form-grid__full">Logo<input type="file" accept="image/png,image/svg+xml" /></label><label>Langue par défaut<select defaultValue="fr"><option value="fr">Français</option><option value="ar">العربية — Arabe</option><option value="en">English</option><option value="es">Español</option></select></label><label>Devise par défaut<select defaultValue="EUR"><option>EUR — Euro</option><option>USD — Dollar américain</option><option>GBP — Livre sterling</option></select></label></div></section><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Sécurité & authentification</h2><p className="card__subtitle">Renforcez la protection des données de santé.</p></div><ShieldCheck /></div><div className="card__body setting-list"><Toggle label="Authentification à deux facteurs (TOTP)" description="Recommandée pour tous les comptes" value={twoFa} onChange={setTwoFa} /><Toggle label="Captcha à la connexion" description="Cloudflare Turnstile · activable globalement" value={captcha} onChange={setCaptcha} /><div className="setting-row"><div><strong>Session d’accès</strong><span>Expiration de l’access token</span></div><select defaultValue="15"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 heure</option></select></div></div></section><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Modules optionnels</h2><p className="card__subtitle">Les modules désactivés restent disponibles dans le schéma.</p></div><Package /></div><div className="card__body setting-list"><Toggle label="Gestion financière" description="Consultations, missions et dépenses" value={finance} onChange={setFinance} /><div className="setting-row"><div><strong>Stockage documentaire</strong><span>Mode utilisé par la GED et les PDF</span></div><select defaultValue="local"><option value="local">Local sécurisé</option><option value="s3">S3 / MinIO</option></select></div><div className="setting-row"><div><strong>Thème par défaut</strong><span>Préférence initiale des nouveaux utilisateurs</span></div><select defaultValue="light"><option value="light">Clair</option><option value="dark">Sombre</option><option value="clinical">Clinical</option></select></div></div></section><section className="card settings-card"><div className="card__header"><div><h2 className="card__title">Préférences de données</h2><p className="card__subtitle">Codification et qualité des exports.</p></div><ReceiptText /></div><div className="card__body setting-list"><div className="setting-row"><div><strong>Préfixe des dossiers patient</strong><span>Format : PREFIXE-000001</span></div><input className="setting-short" defaultValue="PAT" /></div><div className="setting-row"><div><strong>TVA par défaut</strong><span>Appliquée aux nouvelles lignes financières</span></div><div className="input-suffix"><input className="setting-short" defaultValue="20" /><span>%</span></div></div><button className="btn btn-secondary self-start" onClick={() => onNotify('Prévisualisation du document ouverte')}><FileText /> Prévisualiser un document officiel</button></div></section></div><div className="settings-note"><LockKeyhole /> Les changements sont journalisés dans le fil d’audit et nécessitent la permission <strong>settings:update</strong>.</div></div>;
}

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) { return <div className="setting-row"><div><strong>{label}</strong><span>{description}</span></div><button className={`toggle ${value ? 'is-on' : ''}`} aria-pressed={value} onClick={() => onChange(!value)}><span /></button></div>; }
