'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Bell, ChevronDown, CircleHelp, Files, FolderHeart, Handshake, LayoutDashboard, ListChecks,
  LockKeyhole, LogOut, MapPinned, Menu, Moon, Package, PanelLeftClose, ReceiptText, Search,
  Settings2, ShieldCheck, Stethoscope, Syringe, Sun, Truck, UsersRound, X,
  type LucideIcon,
} from 'lucide-react';
import { navGroups } from '@/lib/mock-data';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locale, setLocale] = useState('FR');
  const current = navGroups.flatMap((group) => group.items).find((item) => item.href === pathname);
  const pageTitle = current?.label ?? (pathname === '/' ? "Vue d’ensemble" : 'MediFlow');

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'clinical' : 'dark');
  }

  function changeLocale() {
    const next = locale === 'FR' ? 'EN' : locale === 'EN' ? 'ES' : locale === 'ES' ? 'AR' : 'FR';
    setLocale(next);
    window.localStorage.setItem('mediflow-locale', next.toLowerCase());
    document.documentElement.lang = next.toLowerCase();
    document.documentElement.dir = next === 'AR' ? 'rtl' : 'ltr';
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-overlay" aria-label="Fermer le menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar__top">
          <div className="brand-lockup">
            <div className="brand-mark"><ShieldCheck aria-hidden="true" /></div>
            <div><div className="brand-title">MediFlow</div><div className="brand-subtitle">Clinic operations</div></div>
          </div>
        </div>
        <div className="sidebar__scroll">
          {navGroups.map((group) => <div className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return <Link href={item.href} className={`nav-item ${isActive ? 'is-active' : ''}`} key={item.href} onClick={() => setSidebarOpen(false)}>
                <span className="nav-item__icon"><NavIcon name={item.icon} /></span><span>{item.label}</span>{item.badge && <span className="nav-item__badge">{item.badge}</span>}
              </Link>;
            })}
          </div>)}
        </div>
        <div className="sidebar__bottom">
          <div className="sidebar-help">
            <div className="sidebar-help__row"><div className="sidebar-help__icon"><CircleHelp size={15} /></div><div><div className="sidebar-help__title">Besoin d’aide ?</div><p className="sidebar-help__text">Notre équipe est disponible pour vous accompagner.</p></div></div>
            <a className="sidebar-help__link" href="mailto:support@mediflow.local">Contacter le support <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <button className="topbar__menu" aria-label="Ouvrir le menu" onClick={() => setSidebarOpen(true)}><Menu /></button>
          <div className="crumbs"><div className="crumbs__root">MediFlow / Clinique Saint-Clair</div><div className="crumbs__current">{pageTitle}</div></div>
          <div className="topbar__search"><Search aria-hidden="true" /><input aria-label="Recherche globale" placeholder="Rechercher dans MediFlow..." /><span className="topbar__shortcut">⌘ K</span></div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Changer de thème" title="Changer de thème" onClick={toggleTheme}>{theme === 'dark' ? <Moon /> : theme === 'clinical' ? <Sun /> : <PanelLeftClose />}</button>
            <button className="icon-button" aria-label="Changer de langue" title="Langue" onClick={changeLocale}><span className="font-bold text-[10px]">{locale}</span></button>
            <button className="icon-button" aria-label="Notifications"><Bell /><span className="notification-dot" /></button>
            <div className="user-chip"><div className="avatar">SM</div><div className="user-chip__details"><div className="user-chip__name">Dr. Sofia Martin</div><div className="user-chip__role">Administratrice</div></div><ChevronDown size={14} className="text-slate-400" /></div>
          </div>
        </header>
        <main className="page-fade">{children}</main>
      </div>
    </div>
  );
}
