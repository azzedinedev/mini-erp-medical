# MediFlow Desktop

Le wrapper Electron charge exactement l'application Next.js web (`MEDIFLOW_WEB_URL`, sinon `http://localhost:3000`). Le preload expose uniquement les opérations nécessaires à l'écran de configuration desktop : dossier de données et configuration locale, sans activer Node dans le renderer.

```bash
npm run build:web
MEDIFLOW_WEB_URL=http://localhost:3000 npm run dev --workspace=@mediflow/desktop
npm run package --workspace=@mediflow/desktop
```
