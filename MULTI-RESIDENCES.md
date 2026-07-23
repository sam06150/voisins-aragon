# Ouverture multi-résidences — état et suite

Document de référence pour l'ouverture de la plateforme au-delà de la
résidence Aragon (campagne TikTok, voir [PUB-TIKTOK.md](PUB-TIKTOK.md)).

---

## Ce qui est fait

### 1. Entrée publique générique

| Route | Rôle |
|---|---|
| `/` | Visiteur non connecté → redirige vers `/rejoindre` (avant : `/connexion`). Connecté : comportement inchangé. |
| `/rejoindre` | Landing publique. Explique les **deux** rôles et porte le formulaire. |
| `/referent` | Page dédiée au recrutement de référents + charte. |
| `/connexion`, `/inscription` | **Inchangées.** Toujours accessibles en direct. |

La racine du domaine est ce qui est imprimé sur l'affiche et mis en bio des
réseaux sociaux : elle devait cesser d'être un mur de connexion.

Les compteurs de `/rejoindre` sont **tolérants aux pannes** : si la base est
indisponible, la section chiffres disparaît mais la page et le formulaire
restent servis. Une landing de campagne ne doit jamais renvoyer une 500.

### 2. Candidatures (référents ET locataires)

- Modèle `JoinRequest` : `kind = REFERENT | LOCATAIRE`, statut
  `NOUVEAU → CONTACTE → ACCEPTE | REFUSE`.
- API publique `POST /api/rejoindre`, limitée par IP (`registerAttempt`),
  déduplication des envois multiples, consentement RGPD horodaté.
- **Une candidature n'est pas un compte** : aucun mot de passe, aucun accès.
  C'est une demande qu'un référent traite à la main.
- Traitement dans `/admin/candidatures` (accessible à tout le staff) :
  compteurs, filtres par type et par statut, note interne.

Le message est volontairement double partout : on cherche un référent par
bâtiment, **et** le maximum de locataires. Un référent seul ne pèse rien face
au bailleur ; c'est le nombre qui fait l'argument.

### 3. Fondations du cloisonnement

- `Residence` enrichie : `slug`, `city`, `postalCode`, `country`, `landlord`,
  `isOpen`.
- `User.residenceId` (nullable) — la clé de cloisonnement.
- `lib/tenancy.ts` : helpers de portée centralisés
  (`scopeFor`, `buildingScopeWhere`, `optionalBuildingScopeWhere`,
  `userScopeWhere`, `buildingsFor`, `assertBuildingInScope`).
- Tests de non-régression : `tests/tenancy.test.ts`.

**Règle de compatibilité :** `residenceId = null` ⇒ portée globale, soit
exactement le comportement mono-résidence actuel. Aucun compte existant n'est
affecté.

### 4. Étape A — Portée en lecture ✅ FAIT

Toutes les pages injectent désormais le filtre de résidence dans leur `where` :

| Section | Helper |
|---|---|
| `/incidents`, `/incidents/[id]`, `/incidents/dossier`, `/incidents/nouveau`, `/courrier`, `/statistiques` | `buildingScopeWhere` |
| `/annonces`, `/reunions`, `/documents`, `/petitions`, `/sondages`, `/entraide`, `/demarches`, `/forum` (+ détails et `/nouveau`) | `optionalBuildingScopeWhere` |
| `/annuaire`, `/messages/*`, `/admin/comptes/*`, `/recherche`, `/accueil` | `userScopeWhere` |
| `/carte`, `/admin/immeubles`, listes déroulantes de bâtiments | `buildingsFor` / filtre inline |
| `/admin` (dashboard), `/admin/moderation` | combinaison selon le modèle |

Les pages de détail (`[id]`) passent de `findUnique` à `findFirst` avec le
filtre de portée → **404 si la ressource appartient à une autre résidence**.

### 5. Étape B — Verrouillage en écriture ✅ FAIT

- Chaque action de **création** qui accepte un `buildingId` du client appelle
  `assertBuildingInScope` avant d'écrire (incidents, annonces, réunions,
  documents, pétitions, sondages, entraide, démarches, forum) → impossible de
  publier dans la résidence d'un autre en forgeant l'identifiant.
- Chaque action de **mutation par id** (signer, voter, clôturer, supprimer,
  modérer…) recharge la cible via `findFirst` scopé avant d'agir.
- `notifyResidents` accepte un `residenceId` : une annonce « générale »
  (buildingId null) ne part plus à toutes les résidences de l'instance.

### 6. Étape C — Rattachement ✅ FAIT (code) — migration à lancer

Le `residenceId` d'un compte est désormais renseigné automatiquement :

- **à l'inscription** (`app/api/auth/signup`) quand un bâtiment existant est
  choisi → la résidence est déduite du bâtiment ;
- **à la validation** (`approveAccount`) → déduite du bâtiment du logement ;
- **à l'édition admin** (`updateUser`) → suit le logement rattaché.

Les inscriptions en attente non encore rattachées (`residenceId` null, bâtiment
tapé en texte libre) restent visibles par tout référent, qui les rattache à la
validation — vérifié pour `/admin`, `/admin/comptes` et les fiches.

**Migration des données existantes** (`prisma/attach-residences.ts`) : rattache
les bâtiments Aragon à une résidence par défaut et remplit le `residenceId` de
tous les comptes. Idempotent.

```bash
npx tsx prisma/attach-residences.ts
```

Après cette migration, **passer `Building.residenceId` en obligatoire** dans
`prisma/schema.prisma` (retirer le `?`) puis `npx prisma db push`. À faire
seulement une fois la migration vérifiée : plus aucun bâtiment ne doit être
orphelin.

### 7. Étape D — Isolation des fichiers ✅ FAIT (disque) — limite Cloudinary

`app/api/uploads/[...path]/route.ts` vérifie désormais que le fichier demandé
appartient à un signalement/document de la résidence du demandeur (403 sinon).
Un compte global n'est pas restreint.

⚠️ **Limite connue :** cela ne couvre que le **stockage disque local**. En
production, les fichiers passent par **Cloudinary**, servis par une URL https
publique (UUID non devinable) hors de cette route. Une isolation stricte entre
résidences y nécessiterait des **URLs signées** Cloudinary — à faire si le
modèle de menace l'exige (aujourd'hui : non devinable mais non contrôlé).

### 8. Étape E — Tests ✅ FAIT

- `tests/tenancy.test.ts` : comportement des helpers (global vs résidence).
- `tests/tenancy.integration.test.ts` : test bout-en-bout sur deux résidences
  (*A ne voit pas les données de B*), **activé si `TEST_DATABASE_URL` est
  fourni**, ignoré sinon pour ne pas casser `npm test`.

```bash
TEST_DATABASE_URL="postgresql://…/test" npx vitest run tenancy.integration
```

---

## Migration base de données

Deux migrations à passer contre la base Neon de production, **dans cet ordre** :

```bash
# 1) Schéma (JoinRequest + colonnes résidence). Strictement additif.
npx prisma db push

# 2) Rattachement des comptes/bâtiments existants (étape C).
npx tsx prisma/attach-residences.ts
```

⚠️ `db push` est requis **avant** de déployer, sinon `/rejoindre` et
`/admin/candidatures` échouent (table `JoinRequest` inexistante). La landing
reste servie grâce à la tolérance aux pannes des compteurs, mais le formulaire
renverra une erreur à l'envoi.

Le rattachement (`attach-residences.ts`) est à lancer **avant d'ouvrir une 2ᵉ
résidence** : sans lui, les comptes Aragon restent en portée globale et
verraient les données de la nouvelle résidence.

---

## Points juridiques à traiter en parallèle

1. **Politique de confidentialité** : ajouter la finalité « candidature à
   rejoindre le collectif » et la durée de conservation des `JoinRequest`
   non traitées (proposition : purge à 12 mois, via la route de purge
   existante `app/api/cron/purge`).
2. **Mentions légales** : elles désignent aujourd'hui un collectif local.
   Une ouverture nationale demande un éditeur identifié — une association
   loi 1901 est la structure la plus simple.
3. **Charte du référent** : publiée sur `/referent`. La faire accepter
   explicitement (case à cocher enregistrée) au moment où on crée l'accès
   de modération, pas seulement à la candidature.
