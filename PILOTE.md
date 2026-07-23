# Runbook — lancer la résidence pilote

Objectif : **prouver que ça marche sur UNE résidence réelle** avant de dépenser
un euro (ou une heure) en publicité. La sortie attendue du pilote n'est pas
« des inscrits », c'est **une réponse écrite du bailleur obtenue grâce au
collectif** — le contenu de la vidéo 8 du kit ([PUB-TIKTOK.md](PUB-TIKTOK.md)).

Pourquoi d'abord : une campagne lancée sur du vide s'effondre au premier
commentaire « ça marche vraiment ? ». Avec une preuve, chaque vidéo appuie un
succès réel au lieu de promettre un succès hypothétique.

---

## Phase 0 — Pré-lancement technique (½ journée)

Checklist à cocher avant d'ouvrir aux voisins.

- [ ] **Base à jour :** `npx prisma db push` sur la base Neon de prod
      (crée `JoinRequest` + colonnes résidence). Voir
      [MULTI-RESIDENCES.md](MULTI-RESIDENCES.md).
- [ ] **Rattachement :** `npx tsx prisma/attach-residences.ts` (rattache les
      bâtiments et comptes existants à la résidence). Indispensable même à une
      seule résidence.
- [ ] **Variables d'environnement présentes sur Render :**
      `DATABASE_URL`, `SESSION_SECRET`, `CRON_SECRET`, VAPID
      (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`), Cloudinary
      (`CLOUDINARY_*`), Brevo (`BREVO_API_KEY`, `APP_URL`). Voir
      [DEPLOIEMENT.md](DEPLOIEMENT.md).
- [ ] **Compte admin** créé et mot de passe changé (le seed crée
      `admin@aragon.local` / `ChangeMoi123!` → **à changer immédiatement**).
- [ ] **Bâtiments & logements** saisis dans `/admin/immeubles` (au moins les
      bâtiments ; les logements peuvent se créer à la validation).
- [ ] **Test bout-en-bout** en conditions réelles :
      inscription → compte en attente → validation par l'admin →
      connexion → dépôt d'un signalement avec photo → export du dossier PDF.
- [ ] **Affiche imprimée** (l'affiche A4 est générée depuis le site, page
      `/affiche`) avec le bon QR code pointant vers la résidence.
- [ ] **E-mails** : envoyer une inscription test et vérifier la réception
      (Brevo, pas le SMTP — voir la mémoire projet).

## Phase 1 — Amorçage (semaine 1)

Le but : atteindre une **masse critique** dans une seule résidence (viser
30–50 % des logements). Pas de TikTok ici : du terrain.

- [ ] Recruter **2–3 référents** parmi les voisins déjà remontés / motivés.
      Leur faire accepter la [charte](CHARTE-MODERATEUR.md).
- [ ] **Coller l'affiche** dans chaque hall + porte de chaque bâtiment.
- [ ] **Boîtes aux lettres** : un flyer court avec le QR code.
- [ ] Faire le tour des voisins qu'on connaît déjà (bouche-à-oreille > tout).
- [ ] Ouvrir **un premier signalement réel** documenté (photo datée) sur un
      problème que tout le monde vit (chauffage, ascenseur, propreté, charges).

**Cible fin S1 :** ≥ 25 inscrits validés, ≥ 1 signalement soutenu par
plusieurs voisins.

## Phase 2 — Première action collective (semaines 2–3)

- [ ] Lancer **une pétition** sur le problème n°1 (objectif chiffré).
- [ ] Ajouter les **preuves** (photos horodatées) et, si utile, un **sondage**
      pour prioriser les revendications.
- [ ] À ~20–30 signatures / signalements : **exporter le dossier PDF** et
      l'envoyer au bailleur en **recommandé** (garder l'AR).
- [ ] Consigner l'envoi dans **Suivi des démarches** (`/demarches`) : date,
      type « courrier », relances.

**Cible :** un dossier parti en recommandé, avec un nombre de signataires qui
« fait le poids ».

## Phase 3 — La preuve (semaines 3–6)

- [ ] Relancer si pas de réponse sous 15 jours (la relance aussi dans
      `/demarches`).
- [ ] **Obtenir une réponse écrite du bailleur** (même partielle : « nous
      allons faire intervenir… »). C'est LE livrable du pilote.
- [ ] Archiver la réponse (document + frise des démarches).

Si le bailleur ne répond pas : le dossier documenté (envois recommandés + AR +
absence de réponse) est **lui-même** une preuve exploitable (« voilà ce que le
bailleur ignore ») et une base pour la commission départementale de
conciliation. Le pilote reste concluant.

---

## Feu vert pour la publicité

Ne lance la campagne TikTok que quand **tout** est vrai :

1. ✅ Une résidence a une **vraie mobilisation** (dossier envoyé, plusieurs
   dizaines de voisins).
2. ✅ Une **réponse du bailleur** (ou un dossier « sans réponse » solide) à
   montrer — matière de la vidéo 8.
3. ✅ L'**association est déclarée** (numéro RNA), pages légales complétées —
   voir [LEGAL.md](LEGAL.md). Obligatoire pour la pub payante ; recommandé
   avant toute pub à grande échelle.
4. ✅ Le **cloisonnement multi-résidences** est actif (migration lancée) — pour
   que les inscrits d'autres villes n'atterrissent pas sur les données du
   pilote. Voir [MULTI-RESIDENCES.md](MULTI-RESIDENCES.md).

Tant qu'un de ces points manque, reste en organique / terrain.

---

## Ce qu'on mesure (tableau de bord `/admin` et `/statistiques`)

| Indicateur | Où | Cible pilote |
|---|---|---|
| Inscrits validés | `/admin` | ≥ 25 (≥ 30 % des logements) |
| Signalements actifs | `/statistiques` | ≥ 3, dont 1 très soutenu |
| Signatures de la pétition phare | page pétition | assez pour « peser » |
| Démarches envoyées | `/demarches` | ≥ 1 recommandé + relances |
| Réponse du bailleur | `/documents` + `/demarches` | **1 = pilote réussi** |

Le pilote est un **succès** dès qu'on a la ligne du bas. À partir de là, la pub
raconte une histoire vraie.
