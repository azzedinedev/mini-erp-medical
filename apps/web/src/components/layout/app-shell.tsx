'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Bell, ChevronDown, CircleHelp, Files, FolderHeart, Handshake, LayoutDashboard, ListChecks, MapPinned,
  LoaderCircle, Menu, Moon, Package, PanelLeftClose, PanelLeftOpen, ReceiptText, Search, Settings2, ShieldCheck,
  Stethoscope, Syringe, Sun, Truck, UsersRound, X, UserRound, Save, LogOut, type LucideIcon,
} from 'lucide-react';
import { navGroups } from '@/lib/module-config';
import { useUiLocale, type UiLocale } from '@/lib/ui-i18n';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { clearSession, readSession, SESSION_EVENT, storeSession, userDisplayName, type StoredSession } from '@/lib/auth-store';

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
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useUiLocale();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('Utilisateur');
  const [authenticated, setAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  useEffect(() => {
    let active = true;
    const applySession = (session: StoredSession | null) => {
      if (!active) return;
      setAuthenticated(Boolean(session));
      setDisplayName(userDisplayName(session));
    };
    const onSessionChanged = () => {
      const session = readSession();
      applySession(session);
      if (!session) router.replace('/login');
    };

    async function validateSession() {
      const session = readSession();
      if (!session) {
        if (active) {
          setAuthenticated(false);
          setAuthReady(true);
          router.replace('/login');
        }
        return;
      }

      try {
        const principal = await apiClient.get<NonNullable<StoredSession['user']>>('/auth/me');
        const current = readSession();
        if (current) storeSession({ ...current, user: principal });
        applySession(current ? { ...current, user: principal } : null);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
          clearSession();
          if (active) router.replace('/login');
        } else {
          // Keep the shell visible during a temporary API outage; every business
          // request will still fail closed instead of using local demo data.
          applySession(readSession());
        }
      } finally {
        if (active) setAuthReady(true);
      }
    }

    void validateSession();
    window.addEventListener(SESSION_EVENT, onSessionChanged);
    return () => {
      active = false;
      window.removeEventListener(SESSION_EVENT, onSessionChanged);
    };
  }, [router]);
  const session = readSession();
  const roleLabel = session?.user?.roles?.map((role) => role.name).filter(Boolean).join(' · ') || 'Rôle non renseigné';
  const current = navGroups.flatMap((group) => group.items).find((item) => item.href === pathname);
  const pageTitle = current?.label ? t(current.label) : (pathname === '/' ? t("Vue d'ensemble") : 'MediFlow');

  if (!authReady || !authenticated) {
    return <main className="auth-loading" role="status"><LoaderCircle className="spin" /><span>Vérification de la session…</span></main>;
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'clinical' : 'dark');
  }

  function changeLocale() {
    const locales: UiLocale[] = ['fr', 'en', 'es', 'ar'];
    setLocale(locales[(locales.indexOf(locale) + 1) % locales.length] ?? 'fr');
  }

  function logout() {
    clearSession();
    router.replace('/login');
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
                <span className="nav-item__icon"><NavIcon name={item.icon} /></span><span className="nav-item__text">{t(item.label)}</span>
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
          <div className="crumbs"><div className="crumbs__root">MediFlow / Structure connectée</div><div className="crumbs__current">{pageTitle}</div></div>
          <form className="topbar__search" onSubmit={(event) => { event.preventDefault(); const value = globalSearch.trim(); if (value) router.push(`/patients?search=${encodeURIComponent(value)}`); }}><Search aria-hidden="true" /><input aria-label="Recherche globale" value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder={`${t('Rechercher')} dans MediFlow...`} /><span className="topbar__shortcut">⌘ K</span></form>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Changer de thème" title="Changer de thème" onClick={toggleTheme}>{theme === 'dark' ? <Moon /> : theme === 'clinical' ? <Sun /> : <PanelLeftClose />}</button>
            <button className="icon-button language-button" aria-label="Changer de langue" title="Langue" onClick={changeLocale}>{locale.toUpperCase()}</button>
            <button className="icon-button" aria-label="Notifications"><Bell /><span className="notification-dot" /></button>
            <button className="user-chip" type="button" onClick={() => setProfileOpen(true)} aria-label="Modifier mon profil"><div className="avatar">{displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div className="user-chip__details"><div className="user-chip__name">{displayName}</div><div className="user-chip__role">{roleLabel}</div></div><ChevronDown size={14} className="text-slate-400" /></button>
          </div>
        </header>
        <main className="page-fade">{children}</main>
      </div>
      {profileOpen && <ProfileDialog onClose={() => setProfileOpen(false)} onLogout={() => { void logout(); }} />}
    </div>
  );
}

function ProfileDialog({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const { locale, setLocale, t } = useUiLocale();
  const { theme, setTheme } = useTheme();
  const session = readSession();
  const [firstName, setFirstName] = useState(session?.user?.firstName ?? '');
  const [lastName, setLastName] = useState(session?.user?.lastName ?? '');
  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const profile = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() || undefined, locale, theme };
    try {
      const updated = await apiClient.patch<{ id?: string; email?: string; firstName?: string; lastName?: string; phone?: string; locale?: string; theme?: string }>('/users/me', profile);
      const current = readSession();
      if (current) storeSession({ ...current, user: { ...current.user, ...updated } });
      setSaved(true);
    } catch {
      setError('Impossible de synchroniser le profil avec l’API. Aucun changement local n’a été enregistré.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog glass-panel profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog__header"><div><div className="eyebrow">Compte connecté</div><h2 id="profile-dialog-title">Mon profil</h2><p>Modifiez vos coordonnées et vos préférences personnelles.</p></div><button className="icon-button" type="button" aria-label={t('Fermer')} onClick={onClose}><X /></button></div><form className="dialog__body form-grid" onSubmit={submit}><label>Prénom<input required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label><label>Nom<input required value={lastName} onChange={(event) => setLastName(event.target.value)} /></label><label className="form-grid__full">Adresse e-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Téléphone<input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^0-9+ ()-]/g, '').slice(0, 20))} inputMode="tel" placeholder="+33 6 00 00 00 00" /></label><label>Fonction<input placeholder="Rôle attribué par l’API" /></label><label>Langue<select value={locale} onChange={(event) => setLocale(event.target.value as UiLocale)}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option><option value="es">Español</option></select></label><label>Thème<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="light">Clair</option><option value="dark">Sombre</option><option value="clinical">Clinical</option></select></label><div className="profile-security form-grid__full"><UserRound /><div><strong>Sécurité du compte</strong><span>Les paramètres d’authentification sont gérés par l’API de la structure.</span></div></div>{saved && <div className="dialog-success form-grid__full"><ShieldCheck /> Profil enregistré avec succès.</div>}{error && <div className="form-error form-grid__full"><ShieldCheck /> {error}</div>}<div className="dialog__footer form-grid__full"><button type="button" className="btn btn-danger" onClick={onLogout}><LogOut /> Se déconnecter</button><span className="dialog__footer-spacer" /><button type="button" className="btn btn-secondary" onClick={onClose}>{t('Annuler')}</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : <><Save /> {t('Enregistrer')}</>}</button></div></form></section></div>;
}
