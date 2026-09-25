'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Fingerprint, Languages, LockKeyhole, ShieldCheck } from 'lucide-react';
import { ApiClientError, apiClient } from '@/lib/api-client';

type LoginResponse = {
  requiresTwoFactor?: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: { sub: string; email: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [captcha, setCaptcha] = useState(false);
  const [email, setEmail] = useState('admin@mediflow.local');
  const [password, setPassword] = useState('ChangeMe!2025');
  const [totpCode, setTotpCode] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const result = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
        totpCode: twoFactor ? totpCode : undefined,
        // The production Turnstile/hCaptcha widget supplies this value through its callback.
        captchaToken: captcha ? 'browser-widget-token' : undefined,
      });
      if (result.requiresTwoFactor) {
        setTwoFactor(true);
        setMessage('Identifiants validés. Vérifiez votre code à six chiffres pour continuer.');
        return;
      }
      if (!result.accessToken || !result.refreshToken) throw new Error('Réponse de connexion incomplète');
      window.localStorage.setItem('mediflow.accessToken', result.accessToken);
      window.localStorage.setItem('mediflow.refreshToken', result.refreshToken);
      router.push('/');
    } catch (error) {
      setMessage(error instanceof ApiClientError ? error.message : 'Impossible de joindre le serveur de connexion.');
    } finally {
      setPending(false);
    }
  }

  return <main className="auth-page"><div className="auth-decoration"><div className="auth-orbit auth-orbit--one" /><div className="auth-orbit auth-orbit--two" /><div className="auth-deco-card auth-deco-card--one"><HeartWave /></div><div className="auth-deco-card auth-deco-card--two"><Fingerprint /></div><div className="auth-brand"><div className="brand-mark"><ShieldCheck /></div><div><strong>MediFlow</strong><span>Clinic operations</span></div></div><div className="auth-quote"><p>« La bonne information, au bon moment, pour prendre soin de chaque patient. »</p><span>— Clinique Saint-Clair</span></div></div><section className="auth-panel"><div className="auth-panel__top"><button className="auth-lang" type="button"><Languages /> FR <span>⌄</span></button><span className="auth-secure"><LockKeyhole /> Connexion chiffrée</span></div><div className="auth-form-wrap"><div className="auth-eyebrow">Espace professionnel</div><h1>Bienvenue sur MediFlow</h1><p className="auth-intro">Connectez-vous pour retrouver votre activité et vos dossiers.</p><form onSubmit={submit}><label>Adresse e-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@clinique.fr" autoComplete="username" /></label><label>Mot de passe<div className="auth-password"><input type={showPassword ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Votre mot de passe" autoComplete="current-password" /><button type="button" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>{twoFactor && <label>Code de vérification TOTP<div className="totp-input"><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ''))} placeholder="000 000" autoComplete="one-time-code" /><Fingerprint /></div></label>}<div className="auth-options"><label className="checkbox-label"><input type="checkbox" defaultChecked /><span>Se souvenir de moi</span></label><button type="button" className="auth-link" onClick={() => setMessage('Un lien de réinitialisation serait envoyé par e-mail.')}>Mot de passe oublié ?</button></div><div className="captcha-box"><button type="button" aria-label="Valider le contrôle anti-abus" className={`fake-checkbox ${captcha ? 'is-checked' : ''}`} onClick={() => setCaptcha(!captcha)}>{captcha && '✓'}</button><div><strong>Je ne suis pas un robot</strong><span>Protection anti-abus · Turnstile</span></div><div className="captcha-mark"><ShieldCheck /><small>Cloudflare</small></div></div><button className="btn btn-primary auth-submit" type="submit" disabled={pending}>{pending ? 'Connexion en cours…' : twoFactor ? 'Vérifier et ouvrir MediFlow' : 'Se connecter'} <ArrowRight /></button>{message && <div className="auth-message" role="status"><ShieldCheck /> {message}</div>}</form><p className="auth-help">Accès réservé aux membres autorisés de la structure.<br /><Link href="mailto:support@mediflow.local">Contacter l’administrateur</Link></p></div></section></main>;
}

function HeartWave() { return <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M3 21h8l3-8 5 16 4-12 3 4h11" /></svg>; }
