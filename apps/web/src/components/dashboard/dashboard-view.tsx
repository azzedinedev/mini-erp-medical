'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BarChart3, CalendarDays, CircleAlert, CircleCheck, Files, FolderHeart, FolderPlus,
  LoaderCircle, MapPinned, Package, Plus, Printer, Syringe, TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { hasPermission, readSession, userDisplayName } from '@/lib/auth-store';

type DashboardPatient = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  status: string;
  updatedAt: string;
  actions?: Array<{ summary: string; occurredAt: string }>;
};

type DashboardMission = {
  id: string;
  code: string;
  title: string;
  scheduledAt: string;
  status: string;
  patient?: { code: string; firstName: string; lastName: string } | null;
  assignedTo?: { firstName: string; lastName: string } | null;
};

type DashboardActivity = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: { firstName: string; lastName: string } | null;
  patient?: { code: string; firstName: string; lastName: string } | null;
};

type DashboardSummary = {
  generatedAt: string;
  period: number;
  cards: {
    activePatients: number;
    todayMissions: number;
    pendingPrescriptions: number;
    criticalStock: number;
  };
  recentPatients: DashboardPatient[];
  upcomingMissions: DashboardMission[];
  recentActivities: DashboardActivity[];
  patientStatus: Record<string, number>;
  chart: Array<{ date: string; patients: number; interventions: number }>;
  criticalItems: Array<{ id: string; name: string; code: string; quantity: unknown; minQuantity: unknown; unit: string }>;
};

const quickActions = [
  { label: 'Nouveau dossier', href: '/patients?create=1', icon: FolderPlus, module: 'patients' as const },
  { label: 'Créer une ordonnance', href: '/prescriptions?create=1', icon: Syringe, module: 'prescriptions' as const },
  { label: 'Planifier une mission', href: '/missions?create=1', icon: MapPinned, module: 'missions' as const },
  { label: 'Importer un document', href: '/documents?create=1', icon: Files, module: 'documents' as const },
];

const periodOptions = [
  { label: '7 jours', value: 7 },
  { label: '30 jours', value: 30 },
  { label: '3 mois', value: 90 },
];

const statCards = [
  { key: 'activePatients', label: 'Patients actifs', icon: FolderHeart, tone: 'teal' },
  { key: 'todayMissions', label: 'Interventions aujourd’hui', icon: MapPinned, tone: 'blue' },
  { key: 'pendingPrescriptions', label: 'Ordonnances à valider', icon: Syringe, tone: 'gold' },
  { key: 'criticalStock', label: 'Articles sous le seuil', icon: Package, tone: 'coral' },
] as const;

const statTone: Record<string, string> = {
  teal: 'bg-[var(--brand-soft)] text-brand',
  blue: 'bg-[var(--blue-soft)] text-[var(--blue)]',
  gold: 'bg-[var(--gold-soft)] text-[#b37b17]',
  coral: 'bg-[var(--coral-soft)] text-coral',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Actif',
  ARCHIVED: 'Archivé',
  INACTIVE: 'Inactif',
};

function formatDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
}

function formatDateTime(value: string) {
  return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatAge(value?: string | null) {
  if (!value) return 'Âge non renseigné';
  const birthDate = new Date(value);
  const years = Math.floor((Date.now() - birthDate.getTime()) / 31_557_600_000);
  return Number.isFinite(years) && years >= 0 ? `${years} ans` : 'Âge non renseigné';
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '—';
}

function statusLabel(value: string) {
  return statusLabels[value] ?? value;
}

function activityLabel(activity: DashboardActivity) {
  const actor = [activity.actor?.firstName, activity.actor?.lastName].filter(Boolean).join(' ');
  const subject = activity.patient ? `${activity.patient.firstName} ${activity.patient.lastName}` : `${activity.entityType} ${activity.entityId}`;
  return { actor: actor || 'Utilisateur', subject };
}

function linePath(values: number[], max: number) {
  if (!values.length) return '';
  const width = 662;
  const left = 42;
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  return values.map((value, index) => {
    const x = left + index * step;
    const y = 153 - (value / max) * 128;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

export function DashboardView() {
  const [period, setPeriod] = useState(7);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const session = readSession();
  const displayName = userDisplayName(session);
  const canCreatePatients = hasPermission('patients', 'create', session);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSummary(null);
    setError(null);
    void apiClient.get<DashboardSummary>(`/dashboard/summary?period=${period}`).then((value) => {
      if (active) setSummary(value);
    }).catch((reason: unknown) => {
      if (!active) return;
      setSummary(null);
      setError(reason instanceof ApiClientError ? reason.message : 'Impossible de charger les données du tableau de bord.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [period, reloadToken]);

  const chartMax = useMemo(() => Math.max(1, ...(summary?.chart.flatMap((point) => [point.patients, point.interventions]) ?? [0])), [summary]);
  const chartPatientsPath = summary ? linePath(summary.chart.map((point) => point.patients), chartMax) : '';
  const chartInterventionsPath = summary ? linePath(summary.chart.map((point) => point.interventions), chartMax) : '';
  const hasChartData = Boolean(summary?.chart.some((point) => point.patients > 0 || point.interventions > 0));
  const totalPatientsByStatus = summary ? Object.values(summary.patientStatus).reduce((total, value) => total + value, 0) : 0;

  return <div className="page-container">
    <section className="page-heading">
      <div>
        <div className="eyebrow">{formatDate(new Date().toISOString(), { dateStyle: 'full' })}</div>
        <h1>Bonjour, {displayName} <span aria-hidden="true">👋</span></h1>
        <p>Les indicateurs ci-dessous proviennent des données actuellement enregistrées.</p>
      </div>
      <div className="heading-actions">
        <button className="btn btn-secondary" type="button" onClick={() => window.print()} title="Imprimer ou enregistrer le tableau de bord en PDF"><Printer /> Imprimer / PDF</button>
        {canCreatePatients && <Link className="btn btn-primary" href="/patients?create=1"><Plus /><span>Nouveau dossier</span></Link>}
      </div>
    </section>

    {loading && <div className="state-banner" role="status"><LoaderCircle className="spin" /> Chargement des données depuis PostgreSQL…</div>}
    {error && <div className="state-banner state-banner--error" role="alert"><CircleAlert /><div><strong>Données indisponibles</strong><span>{error}</span></div><button className="btn btn-secondary" type="button" onClick={() => setReloadToken((value) => value + 1)}><CircleCheck /> Réessayer</button></div>}

    {summary && <>
      <section className="stats-grid" aria-label="Indicateurs issus de la base de données">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return <article className="stat-card" key={stat.key}>
            <div className="stat-card__top"><span className="stat-card__label">{stat.label}</span><span className={`stat-card__icon ${statTone[stat.tone]}`}><Icon aria-hidden="true" /></span></div>
            <div className="stat-card__value">{summary.cards[stat.key].toLocaleString('fr-FR')}</div>
            <div className="stat-card__footer"><span className="stat-card__hint">Valeur actuelle · PostgreSQL</span></div>
          </article>;
        })}
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-column">
          <section className="card chart-card">
            <div className="card__header"><div><h2 className="card__title">Activité enregistrée</h2><p className="card__subtitle">Patients créés et interventions planifiées dans la période choisie</p></div><div className="chart-period" role="group" aria-label="Période du graphique">{periodOptions.map((option) => <button type="button" className={period === option.value ? 'is-selected' : ''} key={option.value} onClick={() => setPeriod(option.value)} aria-pressed={period === option.value}>{option.label}</button>)}</div></div>
            <div className="chart-card__body"><div className="chart-meta"><div><div className="chart-total">{summary.chart.reduce((total, point) => total + point.interventions, 0).toLocaleString('fr-FR')} <span className="chart-total__unit">interventions</span></div><div className="chart-caption">{summary.chart.reduce((total, point) => total + point.patients, 0).toLocaleString('fr-FR')} patient(s) créé(s) sur la période</div></div><div className="chart-period-label">Période : <strong>{periodOptions.find((option) => option.value === period)?.label}</strong></div></div>
              <svg className="chart-canvas" viewBox="0 0 720 190" role="img" aria-label="Activité enregistrée dans la période sélectionnée">
                <line className="chart-grid-line" x1="42" y1="25" x2="704" y2="25" /><line className="chart-grid-line" x1="42" y1="67" x2="704" y2="67" /><line className="chart-grid-line" x1="42" y1="109" x2="704" y2="109" /><line className="chart-grid-line" x1="42" y1="153" x2="704" y2="153" />
                <text x="10" y="29">{chartMax}</text><text x="16" y="71">{Math.ceil(chartMax * .66)}</text><text x="16" y="113">{Math.ceil(chartMax * .33)}</text><text x="26" y="170">0</text>
                {hasChartData && <><path className="chart-line chart-line--blue" d={chartPatientsPath} /><path className="chart-line chart-line--brand" d={chartInterventionsPath} /></>}
                {summary.chart.map((point, index) => { const showLabel = summary.chart.length <= 10 || index % Math.ceil(summary.chart.length / 7) === 0 || index === summary.chart.length - 1; if (!showLabel) return null; const x = 42 + index * (662 / Math.max(1, summary.chart.length - 1)); return <text key={point.date} x={x} y="181" textAnchor="middle">{formatDate(point.date, { day: '2-digit', month: 'short' })}</text>; })}
              </svg>
              {!hasChartData && <div className="chart-empty"><BarChart3 /> Aucune activité enregistrée dans cette période.</div>}
              <div className="chart-legend"><span className="legend-item"><span className="legend-dot legend-dot--brand" /> Interventions</span><span className="legend-item"><span className="legend-dot legend-dot--blue" /> Patients créés</span><span className="chart-source">Mis à jour : {formatDateTime(summary.generatedAt)}</span></div>
            </div>
          </section>

          <section className="card table-card"><div className="card__header"><div><h2 className="card__title">Patients récemment suivis</h2><p className="card__subtitle">Les dossiers les plus récemment modifiés en base</p></div><Link className="card__link" href="/patients">Voir les dossiers <ArrowRight /></Link></div>{summary.recentPatients.length === 0 ? <EmptyState icon={FolderHeart} title="Aucun patient enregistré" description="Les patients créés dans PostgreSQL apparaîtront ici." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Patient</th><th>Dernière activité</th><th>Mise à jour</th><th>Statut</th><th aria-label="Actions" /></tr></thead><tbody>{summary.recentPatients.map((patient) => <tr key={patient.id}><td><div className="patient-cell"><span className="patient-cell__avatar">{initials(patient.firstName, patient.lastName)}</span><div><div className="patient-cell__name">{patient.firstName} {patient.lastName}</div><div className="patient-cell__code">{patient.code} · {formatAge(patient.birthDate)}</div></div></div></td><td>{patient.actions?.[0]?.summary ?? 'Aucune activité renseignée'}</td><td>{formatDateTime(patient.actions?.[0]?.occurredAt ?? patient.updatedAt)}</td><td><span className={`status ${patient.status === 'ACTIVE' ? 'status--active' : 'status--pending'}`}>{statusLabel(patient.status)}</span></td><td><Link className="btn btn-ghost" href={`/patients/${patient.code}`} aria-label={`Ouvrir le dossier de ${patient.firstName} ${patient.lastName}`}>Ouvrir</Link></td></tr>)}</tbody></table></div>}<div className="table-footer"><span className="table-footer__count">{summary.recentPatients.length} dossier(s) affiché(s)</span><Link className="card__link" href="/patients">Consulter la base <ArrowRight /></Link></div></section>
        </div>

        <div className="dashboard-column dashboard-column--right">
          <section className="card"><div className="card__header"><div><h2 className="card__title">Prochaines interventions</h2><p className="card__subtitle">Planning enregistré dans la base</p></div><Link className="icon-button" href="/missions" aria-label="Ouvrir les missions" title="Ouvrir les missions"><CalendarDays /></Link></div><div className="card__body">{summary.upcomingMissions.length === 0 ? <EmptyState icon={CalendarDays} title="Aucune intervention planifiée" description="Les missions à venir apparaîtront après leur création." compact /> : <div className="schedule-list">{summary.upcomingMissions.map((mission) => <div className="schedule-item" key={mission.id}><span className="schedule-time">{formatDate(mission.scheduledAt, { hour: '2-digit', minute: '2-digit' })}</span><span className="schedule-dot" /><div><div className="schedule-name">{mission.patient ? `${mission.patient.firstName} ${mission.patient.lastName}` : mission.title}</div><div className="schedule-kind">{mission.title} · {statusLabel(mission.status)}</div></div><span className="schedule-avatar">{mission.patient ? initials(mission.patient.firstName, mission.patient.lastName) : <MapPinned size={15} aria-hidden="true" />}</span></div>)}</div>}<Link className="card__link mt-3" href="/missions">Voir les missions <ArrowRight /></Link></div></section>
          <section className="card"><div className="card__header"><div><h2 className="card__title">Accès rapides</h2><p className="card__subtitle">Créer une entrée via l’API</p></div></div><div className="card__body"><div className="quick-actions">{quickActions.filter((action) => hasPermission(action.module, 'create', session)).map(({ label, href, icon: Icon }) => <Link className="quick-action" href={href} key={label}><Icon aria-hidden="true" /><span>{label}</span></Link>)}</div></div></section>
          <section className="card"><div className="card__header"><div><h2 className="card__title">Statuts patients</h2><p className="card__subtitle">Répartition des dossiers non supprimés</p></div><Link className="icon-button" href="/patients" aria-label="Consulter les patients" title="Consulter les patients"><ArrowRight /></Link></div><div className="card__body">{totalPatientsByStatus === 0 ? <EmptyState icon={FolderHeart} title="Aucun statut à afficher" description="La répartition apparaîtra avec les patients enregistrés." compact /> : <div className="flow-list">{Object.entries(summary.patientStatus).map(([status, count], index) => <div key={status}><div className="flow-row__meta"><span>{statusLabel(status)}</span><strong>{count.toLocaleString('fr-FR')} <span className="font-normal text-[var(--muted)]">({Math.round((count / totalPatientsByStatus) * 100)} %)</span></strong></div><progress className={`progress-native progress-native--${index % 3 === 0 ? 'teal' : index % 3 === 1 ? 'blue' : 'gold'}`} value={count} max={totalPatientsByStatus} aria-label={`${statusLabel(status)} : ${count}`} /></div>)}</div>}</div></section>
          <section className="card"><div className="card__header"><div><h2 className="card__title">Fil d’activité</h2><p className="card__subtitle">Journal d’audit de l’API</p></div><Link className="icon-button" href="/patients" aria-label="Consulter les dossiers" title="Consulter les dossiers"><CircleCheck /></Link></div><div className="card__body">{summary.recentActivities.length === 0 ? <EmptyState icon={TriangleAlert} title="Aucune activité d’audit" description="Le journal apparaîtra lorsque des actions seront enregistrées." compact /> : <div className="activity-list">{summary.recentActivities.map((activity) => { const content = activityLabel(activity); return <div className="activity-item" key={activity.id}><span className="activity-icon activity-icon--teal"><CircleCheck /></span><div><div className="activity-title"><strong>{content.actor}</strong> · {activity.action} · <strong>{content.subject}</strong></div><div className="activity-time">{formatDateTime(activity.createdAt)}</div></div></div>; })}</div>}</div></section>
        </div>
      </div>
    </>}

    {!loading && !error && !summary && <div className="state-banner state-banner--error" role="alert"><CircleAlert /><div><strong>Aucune réponse du serveur</strong><span>Le tableau de bord ne peut pas afficher de données sans l’API.</span></div><button className="btn btn-secondary" type="button" onClick={() => setReloadToken((value) => value + 1)}>Réessayer</button></div>}
  </div>;
}

function EmptyState({ icon: Icon, title, description, compact = false }: { icon: LucideIcon; title: string; description: string; compact?: boolean }) {
  return <div className={`empty-state ${compact ? 'empty-state--compact' : ''}`}><div className="empty-state__icon"><Icon /></div><h3>{title}</h3><p>{description}</p></div>;
}
