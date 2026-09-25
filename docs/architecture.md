# Architecture MediFlow

## Frontend

`apps/web` est l'unique renderer partagé par le navigateur, la PWA et Electron. Le layout expose un shell de navigation responsive, les modules sont chargés via les routes App Router et leurs données de démonstration sont isolées dans `src/lib/mock-data.ts`. Lors du branchement API, les composants appellent `src/lib/api-client.ts` et ne portent pas de logique métier.

- `components/layout` : shell, thème, PWA
- `components/dashboard` : agrégats, graphes et agenda
- `components/modules` : vues de liste, dossier patient et paramétrage
- `components/prescriptions` : signature tactile
- `components/ui` : QR, code-barres et scanner
- `messages` : catalogues `fr`, `ar`, `en`, `es`

Le design utilise Tailwind pour les utilitaires et `globals.css` pour les tokens, états et composants partagés. Aucun style inline n'est requis. Les icônes fonctionnelles viennent de lucide-react.

## API

Tous les contrôleurs sont préfixés par `/api`. `JwtAuthGuard` vérifie l'access token; `PermissionsGuard` lit les permissions placées sur une route par `@RequirePermission(module, action)`. Les permissions sont stockées par rôle et les utilisateurs peuvent cumuler plusieurs rôles. Le service d'authentification ne conserve que des hash de mots de passe et de refresh tokens.

Les listes ont un `PaginationPipe` commun. Les services utilisent Prisma directement derrière leur frontière de module; un repository dédié peut être introduit module par module sans modifier les contrôleurs. Les erreurs sont normalisées par `HttpExceptionFilter` et les appels structurés par `LoggingInterceptor`.

## Persistance

Le schéma PostgreSQL est unique dans `prisma/schema.prisma`. Les champs JSONB servent aux adresses, historiques cliniques, disponibilités, données structurées et metadata. Les indexes B-tree couvrent statut/date/nom; les indexes GIN full-text couvrent patient et documents. `AuditEvent` possède un trigger append-only dans la migration initiale.

Les entités documentaires ont une relation explicite vers les domaines principaux et un `DocumentVersion`. Les codes sont réservés par `CodeSequence` dans une transaction métier. Les montants financiers sont conservés en décimal, ligne par ligne, avec assiette TVA, remise et total TTC.

## Flux signature et pièces

1. Le frontend capture un PNG via `react-signature-canvas`.
2. L'API vérifie que la prescription est en brouillon puis génère un token de vérification et une `PrescriptionSignature`.
3. Un adaptateur de stockage local/S3 écrit l'image et les pièces; le moteur PDF réutilisable peut ensuite générer le PDF officiel et l'enregistrer comme `Document` lié.
4. Le QR encode le code métier et le token de traçabilité; aucun secret JWT n'est placé dans un document.

## Évolution / charge

Les endpoints restent stateless et sont prêts à être placés derrière un load balancer. `PrismaService` est global mais les modules n'échangent que leurs services publics. Redis peut être ajouté devant `api-client`/les services de lecture sans modifier le contrat HTTP. Les listes limitent taille/page et les requêtes Prisma regroupent le comptage et les données dans une transaction.
