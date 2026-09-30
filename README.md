# MediFlow — Mini-ERP clinique

MediFlow est un socle ERP modulaire pour clinique et prestataire de soins à domicile. Le dépôt contient une API NestJS, une application Next.js responsive installable en PWA, un wrapper Electron et un package de contrats partagés.

> Le tableau de bord et les modules protégés n’affichent que les données renvoyées par l’API et PostgreSQL. Si la base ou l’API est indisponible, l’interface affiche un chargement, une erreur ou un état vide : aucune donnée métier de démonstration n’est injectée côté navigateur.

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

`auth`, `users`, `roles`, `patients`, `medical-staff`, `partners`, `reference-data`, `prescriptions`, `inventory`, `deliveries`, `missions`, `documents`, `finance`, `settings`, `dashboard`.

Le résumé réel du tableau de bord est exposé par `GET /api/dashboard/summary?period=7` et agrège directement les patients, missions, ordonnances, stocks, actions et événements d’audit présents dans PostgreSQL.

Chaque domaine suit `Controller → Service → PrismaRepository` (Prisma est encapsulé par `PrismaService`), DTOs validés avec `class-validator`, permissions déclaratives et soft-delete. En environnement local, Prisma utilise l’adaptateur PostgreSQL et son moteur WASM afin de fonctionner sans téléchargement de moteur natif. Le schéma fournit `AuditEvent` pour le fil d’activité immuable des dossiers; les écrans n’affichent que les événements effectivement renvoyés par l’API.

## Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 14+ (ou Docker)
- npm 10+

Le chemin Docker recommandé est le plus court :

```bash
cp .env.example .env
# DATABASE_URL de .env doit rester sur le port 5432 exposé par Compose.
docker compose up -d postgres minio
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

Sur Windows avec PostgreSQL installé via l'installeur et pgAdmin, créez d'abord une base vide `mediflow` et un rôle `mediflow`, puis configurez le fichier `.env` à la racine. Le port doit correspondre au serveur PostgreSQL choisi : par exemple `5433` pour PostgreSQL 14 ou `5432` pour PostgreSQL 18.

```powershell
Copy-Item .env.example .env
# Exemple PostgreSQL 18 sur 5432 :
# DATABASE_URL="postgresql://mediflow:mediflow@127.0.0.1:5432/mediflow?schema=public"
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

Les scripts `db:*` sont exécutés depuis la racine afin de charger `.env`. Si vous lancez directement un script depuis `apps/api`, copiez également `.env` dans `apps/api/.env`. `db:generate` génère le client Prisma WASM localement et `db:migrate` applique les fichiers SQL versionnés dans PostgreSQL de façon idempotente, sans base shadow ni privilège `CREATEDB`. En production, exécutez cette migration avec un compte PostgreSQL dédié avant de démarrer l’API.

Démarrez ensuite deux terminaux :

```powershell
npm run dev:api
npm run dev
```

- Web : http://localhost:3000
- API : http://localhost:4000/api
- Documentation OpenAPI : http://localhost:4000/api/docs

La route `/login` est publique ; toutes les routes de l’application et les appels métier sont protégés par session JWT et permissions RBAC. Sans session, `/` redirige vers `/login`. Le frontend utilise `NEXT_PUBLIC_API_URL` (par défaut `/api`, proxy Next vers l’API) et ne fournit aucun mode de démonstration local. Après le seed, le compte de test est `admin@mediflow.local` / `ChangeMe!2025` : changez immédiatement ce mot de passe hors environnement de test.

## Commandes

```bash
npm run dev:api       # NestJS en watch
npm run dev           # Next.js
npm run build         # build de tous les workspaces
npm test              # tests unitaires
npm run db:migrate    # migration SQL versionnée et idempotente
npm run db:seed       # rôles, permissions et référentiels de départ
npm run test:crud     # smoke test CRUD PostgreSQL avec nettoyage automatique
npm run dev:desktop   # Electron après un build web
```

## Utilisation CRUD, permissions et corbeille

Une fois l’API et PostgreSQL démarrés, les écrans de modules chargent les données depuis l’API et les mutations restent visibles après rechargement :

- création : bouton principal, validation du formulaire puis `POST` vers le module concerné ;
- consultation : clic sur une ligne ou sur **Consulter** ouvre une fiche détaillée ;
- édition : **Modifier** envoie un `PATCH` validé et conserve les données métier ;
- suppression : **Supprimer** effectue une suppression logique (`deletedAt` ou `archivedAt`) et place l’enregistrement dans la corbeille ;
- restauration : **Restaurer** appelle la route `POST /:id/restore` ;
- suppression définitive : **Vider la corbeille** demande une confirmation et la permission `module:delete_permanent`, puis appelle `DELETE /:id/permanent`.

Les routes de corbeille sont disponibles par exemple sur `GET /api/patients/trash`, `GET /api/prescriptions/trash`, `GET /api/inventory/trash`, `GET /api/documents/trash` et leurs équivalents métier. Les référentiels utilisent `GET /api/reference-data/types/trash` et `GET /api/reference-data/medications/trash`. Le seed crée la permission `delete_permanent` pour le rôle administrateur ; relancez `npm run db:seed` après une évolution des permissions.

Le frontend ne conserve pas de copie métier locale : une création, une édition, une suppression logique, une restauration ou une suppression définitive n’est considérée comme réussie qu’après confirmation de l’API. En cas d’indisponibilité, l’action reste visible comme erreur et les données ne sont pas inventées. En production, ne désactivez pas les permissions RBAC et ne donnez `delete_permanent` qu’aux rôles de supervision.

### Diagnostic d’exécution

- `npm run db:migrate` identifie une erreur d’infrastructure PostgreSQL (URL absente, connexion refusée ou schéma impossible à appliquer) avant le démarrage métier ; `npm run db:seed` doit ensuite terminer avec succès.
- `npm run test:crud` se connecte avec un bearer JWT, crée puis relit les enregistrements dans chaque domaine, teste les mutations et restaure/supprime définitivement ses données de test automatiquement. Un échec d’authentification, d’endpoint ou de contrainte PostgreSQL est rapporté séparément du build.
- Dans l’interface, `Données indisponibles` signifie une erreur API/session ; `Aucune donnée enregistrée` signifie que l’API a répondu avec une liste vide. Ces deux états ne sont pas remplacés par des données de démonstration.

Après cette initialisation, déconnectez-vous puis reconnectez-vous afin de recharger les permissions depuis `GET /api/auth/me`. Si la base existait déjà, relancez `npm run db:seed` : le seed rattache aussi le compte administrateur existant au rôle Administrateur et réinstalle ses permissions CRUD.

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
