# MediFlow — Mini-ERP clinique

MediFlow est un socle ERP modulaire pour clinique et prestataire de soins à domicile. Le dépôt contient une API NestJS, une application Next.js responsive installable en PWA, un wrapper Electron et un package de contrats partagés.

> Le projet est fourni comme une base évolutive : le tableau de bord web est utilisable immédiatement avec ses données de démonstration, tandis que l'API et le schéma Prisma structurent les flux de production (authentification, patients, prescriptions, stock, missions, GED et finance).

## Architecture

```text
apps/
  api/       NestJS + Prisma + PostgreSQL, modules métier indépendants
  web/       Next.js App Router + TypeScript + Tailwind + next-intl ready
  desktop/   Electron, encapsule le même build web
packages/
  shared/    types, permissions, statuts et contrats partagés
config/
  app.config.json — paramètres par défaut (copié/complété par SystemSetting)
prisma/
  schema.prisma — schéma de référence et migration versionnée
```

### Domaines API

`auth`, `users`, `roles`, `patients`, `medical-staff`, `partners`, `reference-data`, `prescriptions`, `inventory`, `deliveries`, `missions`, `documents`, `finance`, `settings`.

Chaque domaine suit `Controller → Service → PrismaRepository` (Prisma est encapsulé par `PrismaService`), DTOs validés avec `class-validator`, permissions déclaratives et soft-delete. Les actions sensibles produisent un `AuditEvent`; les événements patient forment le fil d'activité immuable.

## Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 15+ (ou Docker)
- npm 10+

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

- Web : http://localhost:3000
- API : http://localhost:4000/api
- Documentation OpenAPI : http://localhost:4000/api/docs

Le mode démonstration du frontend fonctionne sans API afin de permettre une première visite de l'interface. Pour connecter les données réelles, définir `NEXT_PUBLIC_API_URL` (par défaut `/api`) et activer l'API. Après le seed, le compte de démonstration est `admin@mediflow.local` / `ChangeMe!2025` : changez immédiatement ce mot de passe hors environnement de test.

## Commandes

```bash
npm run dev:api       # NestJS en watch
npm run dev           # Next.js
npm run build         # build de tous les workspaces
npm test              # tests unitaires
npm run db:migrate    # migration Prisma
npm run db:seed       # rôles, permissions et jeu de démo
npm run dev:desktop   # Electron après un build web
```

## Variables et sécurité

Toutes les valeurs sensibles sont dans `.env` (voir `.env.example`). Les mots de passe sont hashés en bcrypt (coût 12), les access tokens JWT sont courts et les refresh tokens sont hachés en base et révocables. Turnstile est désactivé par défaut et activable via `CAPTCHA_PROVIDER` ou `SystemSetting`. La politique TOTP globale (`disabled`, `optional`, `required`) est configurable.

En production : remplacer les secrets JWT, forcer HTTPS, servir les documents derrière une URL signée, restreindre CORS, configurer un stockage S3/MinIO, un SMTP et un navigateur headless pour les PDF.

## Données et documents

Le schéma prévoit JSONB pour les métadonnées semi-structurées et `tsvector`/index trigramme pour la recherche des notes et métadonnées. Le driver local et S3/MinIO sont sélectionnables via configuration. Les PDF officiels sont des `Document` liés à leur entité d'origine et disposent d'un code de traçabilité.

La codification est centralisée par `CodeSequence` et produit par exemple `PAT-000001`, `ORD-000001`, `MIS-000001`. Aucun compteur métier n'est dupliqué dans les modules.

## Internationalisation et plateformes

Les catalogues `fr`, `ar`, `en` et `es` résident sous `apps/web/messages`. Le layout pose `dir="rtl"` pour l'arabe et la préférence est persistée côté profil puis dans localStorage. `next-themes` fournit clair/sombre; le thème `clinical` est une extension CSS.

Le manifeste et le service worker sont dans `apps/web/src/app/manifest.ts` et `apps/web/public/sw.js`. Electron charge l'URL du build Next en production ou l'URL de développement en mode dev. Le web reste la source partagée pour PWA et desktop; l'API ne dépend d'aucun client.

## Tests

Les tests de base couvrent le hash/validation de session, le guard RBAC et le calcul/transition d'une ordonnance. Ils sont dans `apps/api/test` et peuvent être étendus domaine par domaine.

## Déploiement

1. Provisionner PostgreSQL et, si nécessaire, MinIO.
2. Renseigner `.env` et les secrets JWT.
3. `npm ci && npm run db:generate && npm run db:migrate && npm run build`.
4. Démarrer `node apps/api/dist/main.js` et `npm run start --workspace=@mediflow/web` (ou déployer `.next` sur la plateforme Next).
5. Pour Electron, lancer `npm run package --workspace=@mediflow/desktop` après `npm run build:web`.

Les migrations Prisma sont versionnées dans `prisma/migrations` et le schéma canonique est dans `prisma/schema.prisma` (le package API pointe vers ce schéma pour garder une source unique).
