# Configuration MediFlow

`app.config.json` contient uniquement des valeurs par défaut non sensibles : identité de l'application, modules optionnels, politique captcha/2FA, devise et préfixes de codification. En production, les secrets et les connexions restent dans les variables d'environnement. Les valeurs modifiables par un administrateur sont recopiées dans `SystemSetting` par l'API, avec audit.
