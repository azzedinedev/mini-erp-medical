# Déploiement

## Local avec Docker

```bash
docker compose up -d postgres minio
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev
```

Le bucket MinIO `mediflow-documents` doit être créé une fois dans la console `http://localhost:9001`, ou provisionné par un job de démarrage.

## Production

- PostgreSQL managé avec sauvegardes et chiffrement au repos.
- `STORAGE_DRIVER=s3` et URL MinIO/S3 privée; l'API délivre des URLs signées à durée courte.
- Reverse proxy HTTPS devant Next et Nest; `WEB_URL`, CORS et cookies de refresh doivent pointer vers les domaines réels.
- Secrets JWT, SMTP, Turnstile et stockage injectés par le gestionnaire de secrets, jamais par Git.
- Exécuter les migrations avant de démarrer les instances API; le seed de démonstration ne doit jamais être lancé en production.
- Activer les logs structurés et exporter les erreurs avec l'identifiant de requête.

## Desktop

Electron ne réimplémente pas le frontend : il charge l'URL Next configurée par `MEDIFLOW_WEB_URL`. Le preload expose uniquement `getConfig`, `chooseDataPath` et `setDataPath`; le renderer ne reçoit jamais `nodeIntegration`. Le dossier choisi est enregistré dans le répertoire `userData` d'Electron et permet de pointer vers un service API local ou distant.
