'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Bell, ChevronDown, CircleHelp, Files, FolderHeart, Handshake, LayoutDashboard, ListChecks, MapPinned,
  Menu, Moon, Package, PanelLeftClose, PanelLeftOpen, ReceiptText, Search, Settings2, ShieldCheck,
  Stethoscope, Syringe, Sun, Truck, UsersRound, X, UserRound, Save, type LucideIcon,
} from 'lucide-react';
import { navGroups } from '@/lib/mock-data';
import { useUiLocale, type UiLocale } from '@/lib/ui-i18n';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, FolderHeart, MapPinned, Truck, Syringe, Package, Files, Stethoscope,
  Handshake, UsersRound, ListChecks, ReceiptText, Settings2,
};

function NavIcon({ name }: { name: string }) {
  const Icon = iconMap[name] ?? LayoutDashboard;
  return <Icon aria-hidden="true" />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useUiLocale();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const current = navGroups.flatMap((group) => group.items).find((item) => item.href === pathname);
  const pageTitle = current?.label ? t(current.label) : (pathname === '/' ? t("Vue d'ensemble") : 'MediFlow');

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'clinical' : 'dark');
  }

  function changeLocale() {
    const locales: UiLocale[] = ['fr', 'en', 'es', 'ar'];
    setLocale(locales[(locales.indexOf(locale) + 1) % locales.length] ?? 'fr');
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {sidebarOpen && <button className="mobile-overlay" aria-label={t('Fermer')} onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''} ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
        <div className="sidebar__top">
          <div className="brand-lockup">
            <div className="brand-mark"><ShieldCheck aria-hidden="true" /></div>
            <div className="brand-copy"><div className="brand-title">MediFlow</div><div className="brand-subtitle">Clinic operations</div></div>
          </div>
          <button className="sidebar-collapse-toggle" aria-label={sidebarCollapsed ? 'Déplier le menu' : 'Réduire le menu'} title={sidebarCollapsed ? 'Déplier le menu' : 'Réduire le menu'} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
        </div>
        <div className="sidebar__scroll">
          {navGroups.map((group) => <div className="nav-group" key={group.label}>
            <div className="nav-label">{t(group.label)}</div>
            {group.items.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return <Link href={item.href} className={`nav-item ${isActive ? 'is-active' : ''}`} key={item.href} onClick={() => setSidebarOpen(false)}>
                <span className="nav-item__icon"><NavIcon name={item.icon} /></span><span className="nav-item__text">{t(item.label)}</span>{item.badge && <span className="nav-item__badge">{item.badge}</span>}
              </Link>;
            })}
          </div>)}
        </div>
        <div className="sidebar__bottom">
          <div className="sidebar-help">
            <div className="sidebar-help__row"><div className="sidebar-help__icon"><CircleHelp size={15} /></div><div className="sidebar-help__copy"><div className="sidebar-help__title">Besoin d’aide ?</div><p className="sidebar-help__text">Notre équipe est disponible pour vous accompagner.</p></div></div>
            <a className="sidebar-help__link" href="mailto:support@mediflow.local">Contacter le support <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <button className="topbar__menu" aria-label="Ouvrir le menu" onClick={() => setSidebarOpen(true)}><Menu /></button>
          <button className="topbar__collapse" aria-label={sidebarCollapsed ? 'Déplier le menu' : 'Réduire le menu'} title={sidebarCollapsed ? 'Déplier le menu' : 'Réduire le menu'} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>{sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button>
          <div className="crumbs"><div className="crumbs__root">MediFlow / Clinique Saint-Clair</div><div className="crumbs__current">{pageTitle}</div></div>
          <div className="topbar__search"><Search aria-hidden="true" /><input aria-label="Recherche globale" placeholder={`${t('Rechercher')} dans MediFlow...`} /><span className="topbar__shortcut">⌘ K</span></div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Changer de thème" title="Changer de thème" onClick={toggleTheme}>{theme === 'dark' ? <Moon /> : theme === 'clinical' ? <Sun /> : <PanelLeftClose />}</button>
            <button className="icon-button language-button" aria-label="Changer de langue" title="Langue" onClick={changeLocale}>{locale.toUpperCase()}</button>
            <button className="icon-button" aria-label="Notifications"><Bell /><span className="notification-dot" /></button>
            <button className="user-chip" type="button" onClick={() => setProfileOpen(true)} aria-label="Modifier mon profil"><div className="avatar">SM</div><div className="user-chip__details"><div className="user-chip__name">Dr. Sofia Martin</div><div className="user-chip__role">Administratrice</div></div><ChevronDown size={14} className="text-slate-400" /></button>
          </div>
        </header>
        <main className="page-fade">{children}</main>
      </div>
      {profileOpen && <ProfileDialog onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

function ProfileDialog({ onClose }: { onClose: () => void }) {
  const { locale, setLocale, t } = useUiLocale();
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.localStorage.setItem('mediflow-profile', JSON.stringify({ updatedAt: new Date().toISOString() }));
  }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Compte connecté</div><h2 id="profile-dialog-title">Mon profil</h2><p>Modifiez vos coordonnées et vos préférences personnelles.</p></div><button className="icon-button" type="button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div><form className="dialog__body form-grid" onSubmit={submit}><label>Prénom<input required defaultValue="Sofia" /></label><label>Nom<input required defaultValue="Martin" /></label><label className="form-grid__full">Adresse e-mail<input required type="email" defaultValue="sofia.martin@mediflow.local" /></label><label>Téléphone<input inputMode="tel" placeholder="+33 6 00 00 00 00" /></label><label>Fonction<input defaultValue="Administratrice · Médecin" /></label><label>Langue<select value={locale} onChange={(event) => setLocale(event.target.value as UiLocale)}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option><option value="es">Español</option></select></label><label>Thème<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="light">Clair</option><option value="dark">Sombre</option><option value="clinical">Clinical</option></select></label><div className="profile-security form-grid__full"><UserRound /><div><strong>Authentification renforcée activée</strong><span>TOTP configuré pour ce compte. La prochaine connexion demandera un code de sécurité.</span></div></div>{saved && <div className="dialog-success form-grid__full"><ShieldCheck /> Profil enregistré avec succès.</div>}<div className="dialog__footer form-grid__full"><button type="button" className="btn btn-secondary" onClick={onClose}>{t('Annuler')}</button><button type="submit" className="btn btn-primary"><Save /> {t('Enregistrer')}</button></div></form></section></div>;
}
