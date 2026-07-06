# 📱 Mettre l'app en ligne + APK/TWA sur GitHub

Ce guide reprend la même méthode que « Planning Familial » :
**PWA installable → hébergement Render (gratuit) → APK/TWA → GitHub**.

L'app est déjà une **PWA** (icône, manifest, service worker, « Ajouter à
l'écran d'accueil »). Il reste à l'héberger, puis à générer l'APK.

---

## 1. Mettre le code sur GitHub

1. Créez un dépôt sur https://github.com (par ex. `voisins-aragon`).
2. Depuis le dossier du projet :
   ```bash
   git init
   git add .
   git commit -m "Voisins Collectif et en Colère"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/voisins-aragon.git
   git push -u origin main
   ```
   (Le `.gitignore` exclut déjà `node_modules`, `.env`, la base et les
   fichiers téléversés.)

## 2. Héberger sur Render (gratuit)

1. Créez un compte sur https://render.com (connexion avec GitHub).
2. **New + → Blueprint** → choisissez le dépôt. Render lit `render.yaml` et
   configure tout (build, start, secret de session).
3. Après ~3–5 min, vous obtenez une URL du type
   `https://voisins-aragon.onrender.com`.
4. Dans le dashboard Render → **Environment**, renseignez `APP_URL` avec cette
   URL (et les variables `SMTP_*` si vous voulez les e-mails).

### ⚠️ Persistance des données (important)

Le plan **gratuit** de Render a un disque **temporaire** : la base SQLite et
les **pièces jointes** peuvent être **réinitialisées** à chaque redéploiement.
Deux façons de rendre les données durables :

- **Option A — Base en ligne gratuite (recommandé).** Créez une base Postgres
  gratuite sur https://neon.tech, copiez son `DATABASE_URL`, collez-le dans
  Render (Environment), et dans `prisma/schema.prisma` changez :
  ```prisma
  datasource db {
    provider = "postgresql"   // au lieu de "sqlite"
    url      = env("DATABASE_URL")
  }
  ```
  (Les pièces jointes nécessitent en plus un stockage cloud — ex. Cloudinary
  gratuit — ou l'option B.)
- **Option B — Disque persistant Render (~7 $/mois).** Ajoutez un disque monté
  sur `/opt/render/project/src/prisma` et `/opt/render/project/src/uploads` :
  SQLite **et** les fichiers restent conservés, sans rien changer au code.

Pour un simple test, le gratuit suffit (les données repartent de zéro au
redéploiement).

## 3. Installer l'app (PWA) sur les téléphones

Sur chaque téléphone :
1. Ouvrez `https://…onrender.com` (Chrome sur Android, Safari sur iPhone).
2. Menu du navigateur → **« Ajouter à l'écran d'accueil »**.
3. Ouvrez l'app depuis l'icône : elle s'affiche en plein écran, comme une appli.

C'est déjà utilisable ainsi, sans passer par une APK.

## 4. Générer l'APK / TWA (Android) et la mettre sur GitHub

Comme pour Planning Familial, on emballe la PWA dans une appli Android (TWA).

1. Allez sur **https://www.pwabuilder.com** et entrez votre URL Render.
2. PWABuilder analyse la PWA (manifest + service worker déjà présents) →
   **Package for stores → Android**.
3. Il génère :
   - un fichier **`.apk`** (et un `.aab` pour le Play Store),
   - le contenu du fichier **`assetlinks.json`** (Digital Asset Links).
4. **Digital Asset Links** : remplacez le contenu de
   `public/.well-known/assetlinks.json` par celui fourni par PWABuilder
   (empreinte SHA-256 de votre clé + nom du package), puis redéployez. Cela
   supprime la barre d'adresse dans l'appli.
5. Déposez le `.apk` dans votre dépôt GitHub, idéalement via
   **Releases → Draft a new release → joindre le .apk**. Vous obtenez un lien
   de téléchargement direct.
6. (Optionnel) Générez un **QR code** vers ce lien pour que les voisins
   installent l'appli en le scannant.

> Note : une APK/TWA **ouvre l'URL hébergée** — elle ne fonctionne que si l'app
> est en ligne (étape 2). Sans hébergement, l'APK afficherait une page vide.

---

## Résumé

| Étape | Où | Gratuit ? |
| ----- | -- | --------- |
| Code source | GitHub | ✅ |
| Hébergement | Render (`render.yaml`) | ✅ (données non durables) |
| Base durable | Neon Postgres | ✅ |
| Pièces jointes durables | Cloudinary / disque Render | ✅ / ~7 $/mois |
| APK / TWA | PWABuilder → GitHub Releases | ✅ |
