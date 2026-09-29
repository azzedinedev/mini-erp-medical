'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, CircleCheck, FileCheck2,
  FilePlus2, Files, FolderPlus, FolderHeart, MapPinned, Package, Plus, ScanLine, Syringe,
  Stethoscope, TriangleAlert, Truck, UserRoundPlus,
} from 'lucide-react';
import { activities, recentPatients, schedule, statCards } from '@/lib/mock-data';

const quickActions = [
  { label: 'Nouveau dossier', href: '/patients', icon: FolderPlus },
  { label: 'Créer une ordonnance', href: '/prescriptions', icon: Syringe },
  { label: 'Planifier une mission', href: '/missions', icon: MapPinned },
  { label: 'Importer un document', href: '/documents', icon: Files },
];

const statTone: Record<string, string> = { teal: 'bg-[var(--brand-soft)] text-brand', blue: 'bg-[var(--blue-soft)] text-[var(--blue)]', gold: 'bg-[var(--gold-soft)] text-[#b37b17]', coral: 'bg-[var(--coral-soft)] text-coral' };
const iconMap = { FolderHeart, MapPinned, Syringe, Package };

export function DashboardView() {
  const [period, setPeriod] = useState('7 jours');
  const [toast, setToast] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(4);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  return <div className="page-container">
    <section className="page-heading">
      <div><div className="eyebrow">Jeudi 24 octobre 2024</div><h1>Bonjour, Sofia <span aria-hidden="true">👋</span></h1><p>Voici ce qu’il se passe dans votre clinique aujourd’hui.</p></div>
      <div className="heading-actions"><button className="btn btn-secondary" onClick={() => notify('Rapport exporté en PDF')}><BarChart3 /> Exporter le rapport</button><Link className="btn btn-primary" href="/patients"><Plus /><span>Nouveau dossier</span></Link></div>
    </section>

    <section className="stats-grid" aria-label="Indicateurs clés">
      {statCards.map((stat) => { const Icon = iconMap[stat.icon as keyof typeof iconMap]; const Trend = stat.trendTone === 'up' ? ArrowUpRight : stat.trendTone === 'down' ? ArrowDownRight : CircleCheck; return <article className="stat-card" key={stat.label}><div className="stat-card__top"><span className="stat-card__label">{stat.label}</span><span className={`stat-card__icon ${statTone[stat.tone]}`}><Icon /></span></div><div className="stat-card__value">{stat.value}</div><div className="stat-card__footer"><span className={`trend trend--${stat.trendTone}`}><Trend />{stat.trend}</span><span className="stat-card__hint">{stat.hint}</span></div></article>; })}
    </section>

    <div className="dashboard-grid">
      <div className="dashboard-column">
        <section className="card chart-card">
          <div className="card__header"><div><h2 className="card__title">Activité de la clinique</h2><p className="card__subtitle">Patients pris en charge et interventions réalisées</p></div><div className="chart-period">{['7 jours', '30 jours', '3 mois'].map((option) => <button className={period === option ? 'is-selected' : ''} key={option} onClick={() => setPeriod(option)}>{option}</button>)}</div></div>
          <div className="chart-card__body"><div className="chart-meta"><div><div className="chart-total">426 <span className="text-[10px] font-medium text-[var(--muted)]">interventions</span></div><div className="trend trend--up mt-1"><ArrowUpRight /> 8,2 % <span className="font-normal text-[var(--muted)]">vs. période précédente</span></div></div><div className="text-right text-[10px] text-[var(--muted)]">Période : <strong className="text-[var(--ink-soft)]">{period}</strong></div></div>
            <svg className="chart-canvas" viewBox="0 0 720 190" role="img" aria-label="Évolution des interventions sur sept jours" onClick={() => notify('Détail du graphique disponible dans les rapports')}>
              <line className="chart-grid-line" x1="42" y1="22" x2="704" y2="22" /><line className="chart-grid-line" x1="42" y1="62" x2="704" y2="62" /><line className="chart-grid-line" x1="42" y1="102" x2="704" y2="102" /><line className="chart-grid-line" x1="42" y1="142" x2="704" y2="142" />
              <text x="8" y="25">100</text><text x="14" y="65">75</text><text x="14" y="105">50</text><text x="14" y="145">25</text><text x="26" y="179">0</text>
              <path className="chart-area--blue" d="M42 121 C85 116 109 130 151 105 S214 93 258 112 S319 125 362 90 S424 80 466 91 S527 71 570 80 S636 70 704 54 L704 162 L42 162 Z" />
              <path className="chart-area--brand" d="M42 137 C84 128 112 142 151 119 S214 116 258 126 S319 142 362 105 S424 97 466 108 S527 89 570 97 S638 91 704 72 L704 162 L42 162 Z" />
              <path className="chart-line chart-line--blue" d="M42 121 C85 116 109 130 151 105 S214 93 258 112 S319 125 362 90 S424 80 466 91 S527 71 570 80 S636 70 704 54" />
              <path className="chart-line chart-line--brand" d="M42 137 C84 128 112 142 151 119 S214 116 258 126 S319 142 362 105 S424 97 466 108 S527 89 570 97 S638 91 704 72" />
              {[['Lun',42],['Mar',151],['Mer',258],['Jeu',362],['Ven',466],['Sam',570],['Dim',704]].map(([label, x]) => <text key={String(label)} x={Number(x)} y="181" textAnchor="middle">{label}</text>)}
              <circle className="chart-point--brand" cx="362" cy="105" r="4" onClick={() => setActiveDay(4)} /><circle className="chart-point--brand" cx="570" cy="97" r="4" />
            </svg><div className="chart-legend"><span className="legend-item"><span className="legend-dot legend-dot--brand" /> Interventions</span><span className="legend-item"><span className="legend-dot legend-dot--blue" /> Patients suivis</span><span className="ml-auto text-[9px]">Point sélectionné : <strong className="text-[var(--ink-soft)]">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][activeDay - 1] ?? 'Jeu'}</strong></span></div>
          </div>
        </section>

        <section className="card table-card"><div className="card__header"><div><h2 className="card__title">Patients récemment suivis</h2><p className="card__subtitle">Les dernières activités enregistrées dans les dossiers</p></div><Link className="card__link" href="/patients">Voir tous les dossiers <ArrowRight /></Link></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Patient</th><th>Dernière activité</th><th>Date</th><th>Statut</th><th aria-label="Actions" /></tr></thead><tbody>{recentPatients.map((patient) => <tr key={patient.code}><td><div className="patient-cell"><span className="patient-cell__avatar">{patient.initials}</span><div><div className="patient-cell__name">{patient.firstName} {patient.lastName}</div><div className="patient-cell__code">{patient.code} · {patient.age}</div></div></div></td><td>{patient.action}</td><td>{patient.date}</td><td><span className={`status ${patient.status === 'Suivi' ? 'status--progress' : 'status--active'}`}>{patient.status}</span></td><td><button className="btn btn-ghost" aria-label={`Ouvrir le dossier de ${patient.firstName}`} onClick={() => notify(`Dossier ${patient.code} ouvert`)}>Ouvrir</button></td></tr>)}</tbody></table></div><div className="table-footer"><span className="table-footer__count">Affichage de 4 patients sur 1 284</span><div className="pagination"><button aria-label="Page précédente">‹</button><button className="is-current">1</button><button>2</button><button>3</button><button aria-label="Page suivante">›</button></div></div></section>
      </div>

      <div className="dashboard-column dashboard-column--right">
        <section className="card"><div className="card__header"><div><h2 className="card__title">Prochaines interventions</h2><p className="card__subtitle">Votre agenda du jeudi 24 octobre</p></div><Link className="icon-button" href="/missions" aria-label="Ouvrir le calendrier"><CalendarDays /></Link></div><div className="card__body"><div className="schedule-list">{schedule.map((item) => <div className="schedule-item" key={`${item.time}-${item.name}`}><span className={`schedule-time ${item.next ? 'is-next' : ''}`}>{item.time}</span><span className={`schedule-dot ${item.next ? 'is-next' : ''}`} /><div><div className="schedule-name">{item.name}</div><div className="schedule-kind">{item.kind}</div></div><span className="schedule-avatar">{item.initials}</span></div>)}</div><Link className="card__link mt-3" href="/missions">Voir le planning complet <ArrowRight /></Link></div></section>
        <section className="card"><div className="card__header"><div><h2 className="card__title">Accès rapides</h2><p className="card__subtitle">Les actions les plus utilisées</p></div></div><div className="card__body"><div className="quick-actions">{quickActions.map(({ label, href, icon: Icon }) => <Link className="quick-action" href={href} key={label}><Icon /><span>{label}</span></Link>)}</div></div></section>
        <section className="card"><div className="card__header"><div><h2 className="card__title">Répartition des parcours</h2><p className="card__subtitle">Patients actifs par parcours de soins</p></div><button className="icon-button" aria-label="Voir les statistiques" onClick={() => notify('Statistiques détaillées ouvertes')}><ArrowRight /></button></div><div className="card__body"><div className="flow-list"><div><div className="flow-row__meta"><span>Soins à domicile</span><strong>684 <span className="font-normal text-[var(--muted)]">(53 %)</span></strong></div><div className="progress-track"><div className="progress-value progress-value--teal" /></div></div><div><div className="flow-row__meta"><span>Suivi spécialisé</span><strong>386 <span className="font-normal text-[var(--muted)]">(30 %)</span></strong></div><div className="progress-track"><div className="progress-value progress-value--blue" /></div></div><div><div className="flow-row__meta"><span>Parcours ponctuel</span><strong>214 <span className="font-normal text-[var(--muted)]">(17 %)</span></strong></div><div className="progress-track"><div className="progress-value progress-value--gold" /></div></div></div></div></section>
        <section className="card"><div className="card__header"><div><h2 className="card__title">Fil d’activité</h2><p className="card__subtitle">Les dernières actions de l’équipe</p></div><button className="icon-button" aria-label="Marquer les notifications comme lues" onClick={() => notify('Activités marquées comme lues')}><CircleCheck /></button></div><div className="card__body"><div className="activity-list">{activities.map((activity) => { const Icon = activity.icon === 'FileCheck2' ? FileCheck2 : activity.icon === 'CircleCheck' ? CircleCheck : activity.icon === 'FilePlus2' ? FilePlus2 : TriangleAlert; return <div className="activity-item" key={activity.time}><span className={`activity-icon activity-icon--${activity.tone}`}><Icon /></span><div><div className="activity-title"><strong>{activity.actor}</strong> {activity.action} <strong>{activity.target}</strong></div><div className="activity-time">{activity.time}</div></div></div>; })}</div></div></section>
      </div>
    </div>
    {toast && <div className="toast" role="status"><CircleCheck />{toast}</div>}
  </div>;
}
