# Voisins Collectif et en Colère — Résidence Aragon

Plateforme web privée pour relier les locataires des **4 bâtiments** de la
Résidence Aragon et s'organiser en collectif : annuaire des voisins,
signalement des problèmes, forum de discussion, annonces, réunions et
documents partagés.

Tout fonctionne **en local**, sans service payant ni compte externe. Les
données sont dans un simple fichier SQLite sur votre ordinateur.

---

## 1. Prérequis

- **Node.js 20.11 ou plus** (vérifiez avec `node -v`). À installer depuis
  <https://nodejs.org> si besoin.
- Windows, macOS ou Linux. Les commandes ci-dessous fonctionnent dans
  **PowerShell** (Windows) ou un terminal classique.

## 2. Installation (à faire une seule fois)

Dans le dossier du projet :

```powershell
npm install
npx prisma migrate dev
npm run db:seed
```

- `npm install` installe les dépendances.
- `npx prisma migrate dev` crée la base de données (`prisma/dev.db`).
- `npm run db:seed` pré-remplit les 4 bâtiments, quelques logements, les
  catégories du forum, une annonce de bienvenue et **le compte
  administrateur**.

> Si le fichier `.env` n'existe pas, copiez `.env.example` en `.env`. Un
> `SESSION_SECRET` est déjà fourni pour un usage local ; pour en générer un
> nouveau :
> `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

## 3. Lancer l'application

```powershell
npm run dev
```

Ouvrez ensuite **<http://localhost:3000>** dans votre navigateur.

Pour arrêter le serveur : `Ctrl + C` dans le terminal.

## 4. Première connexion (compte administrateur)

Deux comptes administrateurs sont créés automatiquement (connexion possible
par **identifiant OU adresse e-mail**) :

| Identifiant / e-mail | Mot de passe    |
| -------------------- | --------------- |
| `mrsds`              | `Aragon.49`     |
| `admin@aragon.local` | `ChangeMoi123!` |

### Les rôles

- **Locataire** : accès standard.
- **Modérateur** : peut modérer le forum et changer le statut des signalements.
- **Sous-admin** : gère les comptes, annonces, réunions, documents, démarches.
- **Administrateur** : tout, y compris **l'attribution des rôles** et la
  sauvegarde de la base.

Depuis **Administration → Comptes**, un administrateur peut attribuer ces rôles
à n'importe quel locataire (sélecteur « Rôle » puis « Appliquer »).

> ⚠️ **Changez ce mot de passe** dès que possible. Pour l'instant il n'y a pas
> d'écran de changement de mot de passe dans l'application : vous pouvez créer
> votre propre compte référent en base, ou modifier le mot de passe de l'admin
> via `npm run db:studio` (interface visuelle de la base).

---

## 5. Comment ça marche

### Inscription des locataires

1. Chaque locataire s'inscrit sur `/inscription` (prénom, nom, e-mail, mot de
   passe, bâtiment, étage/appartement).
2. Son compte est **en attente** : il ne peut rien voir tant qu'un référent ne
   l'a pas validé.
3. Le référent valide (ou refuse) les inscriptions dans
   **Administration → Comptes**, et rattache au passage le logement.

C'est ce qui garde la plateforme **réservée aux vrais locataires** de la
résidence.

### Rôles

- **Locataire** : consulte tout, remplit son annuaire, signale des incidents,
  participe au forum, partage des documents.
- **Référent (admin)** : en plus, valide les comptes, publie les annonces,
  crée les réunions, modère le forum et gère les bâtiments/logements.

### Les fonctionnalités

**Vie du collectif**
- **Annuaire** : chacun choisit ce qu'il partage (nom, e-mail, téléphone).
  Rien n'est visible sans opt-in explicite.
- **Signalements** : pannes, dégradations, litiges avec le bailleur… avec
  photos, bouton « Je soutiens », filtres, suivi par les référents, et
  **export d'un dossier PDF** regroupant les signalements + photos (utile
  pour un courrier au bailleur, un avocat ou le tribunal).
- **Forum** : un espace général + un espace par bâtiment.
- **Annonces / Réunions** : communications officielles, comptes-rendus, et
  **confirmation de présence** (RSVP) aux réunions.
- **Documents** : modèles de lettres, pétitions, preuves, comptes-rendus.

**Mobilisation**
- **Pétitions** en ligne avec signatures et barre de progression.
- **Sondages / votes** (une voix par personne, résultats en direct).
- **Suivi des démarches face au bailleur** : frise chronologique
  (courriers, relances, réponses, rendez-vous).
- **Statistiques** : signalements par bâtiment / catégorie / statut — des
  chiffres pour appuyer les revendications.

**Communication & entraide**
- **Notifications** dans l'app (cloche) : nouvelle annonce, réunion, pétition,
  sondage, message…
- **Messagerie privée** entre voisins.
- **Entraide** : offres et demandes (prêt de matériel, coups de main…).
- **Recherche globale** sur tout le contenu.

**Sécurité & confort**
- Changement de mot de passe, réinitialisation par un référent.
- Limitation des tentatives de connexion (anti-force brute).
- **Sauvegarde de la base en un clic** (espace administration).
- **Mode sombre** (bascule dans la barre du haut).
- Un référent peut **nommer d'autres référents**.

> Deux évolutions ont été laissées de côté volontairement : l'envoi d'e-mails
> (nécessite une mise en ligne + un serveur d'envoi) et le multilingue (tous
> les locataires étant francophones). Elles pourront être ajoutées ensuite.

---

## 6. Commandes utiles

| Commande             | Effet                                                     |
| -------------------- | --------------------------------------------------------- |
| `npm run dev`        | Lance l'application (mode développement).                 |
| `npm run db:studio`  | Ouvre une interface visuelle pour consulter/éditer la base.|
| `npm run db:seed`    | Ré-injecte les données de départ (sans écraser l'existant).|
| `npm run db:reset`   | ⚠️ Réinitialise **entièrement** la base (efface tout).     |
| `npm run build`      | Prépare une version optimisée.                            |

## 6bis. Activer les e-mails (facultatif)

Par défaut, tout fonctionne en local **sans e-mail** : les notifications
restent dans l'app (cloche) et les e-mails sont seulement affichés dans la
console. Pour envoyer de vrais e-mails (validation de compte, annonces,
réunions, messages) une fois la plateforme en ligne :

1. Ouvrez un compte chez un fournisseur SMTP (ex : votre hébergeur, ou un
   service d'envoi transactionnel).
2. Renseignez dans `.env` : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
   `SMTP_PASS`, `SMTP_FROM` et `APP_URL` (voir `.env.example`).
3. Redémarrez l'application.

Chaque locataire peut activer/désactiver ses e-mails dans « Mon compte ».

## 6ter. Langues (multilingue)

La plateforme est disponible en **français** (par défaut), **anglais**,
**arabe** (avec mise en page de droite à gauche), **portugais** et **turc**.
Chacun choisit sa langue via le sélecteur en haut de page (aussi présent sur
l'écran de connexion, pour les personnes qui ne lisent pas le français).

Le système repose sur un principe simple : **si une traduction manque, le
texte s'affiche en français** — l'application reste donc toujours utilisable
dans toutes les langues.

**Pour compléter ou corriger une traduction** : ouvrez
`lib/translations.ts`. Chaque entrée a pour clé le texte français et fournit
les versions `en` / `ar` / `pt` / `tr`. Exemple :

```ts
"Accueil": { en: "Home", ar: "الرئيسية", pt: "Início", tr: "Ana sayfa" },
```

Ajouter une langue supplémentaire se fait dans `lib/i18n-shared.ts` (liste
`LOCALES`).

## 7. Où sont les données ?

- **Base de données** : `prisma/dev.db` (fichier SQLite). Sauvegardez-le pour
  sauvegarder toutes les données.
- **Fichiers téléversés** (photos, documents) : dossier `uploads/`. Ils ne
  sont accessibles qu'aux locataires connectés (jamais en accès public direct).

## 8. Mettre en ligne plus tard

L'application est prête à être déployée sans réécriture. Pour un hébergement
en ligne, il faudra principalement :

- passer SQLite à une base PostgreSQL (une ligne dans `prisma/schema.prisma`) ;
- définir `DATABASE_URL` et `SESSION_SECRET` comme variables d'environnement de
  l'hébergeur ;
- prévoir un stockage persistant pour le dossier `uploads/`.

---

## Stack technique

Next.js 16 (App Router) · TypeScript · Prisma + SQLite · iron-session +
bcryptjs (authentification) · Tailwind CSS · Zod.
