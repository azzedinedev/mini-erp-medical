import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return <main className="min-h-screen bg-[var(--page)] grid place-items-center p-6"><div className="card max-w-md p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-soft)] text-brand"><FileQuestion /></div><h1 className="mt-5 text-xl font-bold text-[var(--ink)]">Page introuvable</h1><p className="mt-2 text-sm text-[var(--muted)]">Cette ressource n’existe pas ou a été déplacée.</p><Link href="/" className="btn btn-primary mt-6"><ArrowLeft /> Retour au tableau de bord</Link></div></main>;
}
