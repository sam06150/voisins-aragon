# Volet juridique — ce qui est fait, ce qu'il reste

> Je ne suis pas juriste. Ce document est un **guide pratique** pour cadrer le
> lancement, pas un avis juridique. Faites valider les points sensibles par une
> personne compétente (juriste, Maison des associations, ADIL, une association
> de locataires agréée comme la CNL, la CLCV ou l'AFOC).

---

## Pourquoi c'est nécessaire avant la pub

Tant que la plateforme sert **une seule résidence** entre voisins, le risque est
faible. Dès qu'on fait de la **publicité nationale** « contre les bailleurs » et
qu'on collecte des données de milliers de personnes, deux expositions
apparaissent :

1. **Responsabilité de l'éditeur.** Un site public a un éditeur identifiable
   (mentions légales). Sans structure, c'est **toi, personne physique**, qui es
   responsable — y compris si un bailleur nommé s'estime diffamé.
2. **Responsable de traitement RGPD.** Collecter nom/e-mail/ville de candidats
   via TikTok fait de toi un responsable de traitement, avec des obligations
   (information, durée de conservation, droits des personnes).

Une **association loi 1901** répond aux deux : elle devient l'éditeur et le
responsable de traitement, elle limite ta responsabilité personnelle, et elle
peut recevoir des dons/subventions.

---

## Ce qui est déjà fait dans le code

- **Politique de confidentialité** ([/confidentialite](app/(auth)/confidentialite/page.tsx))
  mise à jour : finalité « candidatures », données collectées, durée de
  conservation (12 mois), responsable « en cours de constitution en association ».
- **Purge RGPD** ([cron/purge](app/api/cron/purge/route.ts)) : les candidatures
  (`JoinRequest`) de plus de 12 mois sont supprimées automatiquement — la
  politique ne promet donc rien de faux.
- **Mentions légales** ([/mentions-legales](app/(auth)/mentions-legales/page.tsx))
  préparées pour une association (placeholders + commentaire listant les champs
  à compléter après déclaration).
- **Consentement** horodaté à chaque candidature (`consentAt` sur `JoinRequest`)
  et à chaque inscription (`consentAt` sur `User`).
- **Charte du référent** rédigée ([CHARTE-MODERATEUR.md](CHARTE-MODERATEUR.md))
  et déjà affichée sur `/referent`.

## Ce qu'il reste à faire (hors code)

### 1. Créer l'association — ~1 à 3 semaines, gratuit ou presque
1. Adapter et faire relire les **statuts** ([statuts-association.md](statuts-association.md)).
2. Réunir au moins **2 personnes** (bureau : président·e + secrétaire ; trésorier·ère recommandé·e).
3. Tenir une **assemblée générale constitutive** (procès-verbal).
4. **Déclarer** sur service-public.fr → « Créer une association », ou en
   préfecture. Publication au *Journal officiel des associations* (gratuit).
5. Récupérer le **numéro RNA (W…)**. Demander un **SIRET** si vous voulez
   recevoir des subventions ou salarier (facultatif au départ).
6. Ouvrir un **compte bancaire associatif**.

### 2. Compléter les pages du site
Une fois l'association déclarée, renseigner dans
[mentions-legales](app/(auth)/mentions-legales/page.tsx) :
- dénomination exacte, numéro RNA, adresse du siège, directeur/directrice de
  la publication.
Et dans [confidentialite](app/(auth)/confidentialite/page.tsx) §1 : remplacer
« en cours de constitution » par le nom de l'association.

### 3. Consentement explicite du référent — ✅ FAIT
Tout membre du staff (MODERATOR / SUBADMIN / ADMIN) qui n'a pas encore accepté
la charte est redirigé vers `/charte-referent` **avant** de pouvoir accéder à
l'espace d'administration. C'est la personne elle-même qui coche la case (pas
l'admin à sa place), et la date est enregistrée (`User.moderatorCharterAt`) —
consentement horodaté, RGPD-conforme. Nécessite `npx prisma db push` pour créer
la colonne.

### 4. Règles de publicité TikTok
- **Organique** (vidéos non sponsorisées) : aucune structure requise, tu peux
  commencer tout de suite.
- **Ads payantes** : TikTok exige un annonceur identifié → attends que
  l'association existe.

### 5. Ligne rouge éditoriale (à rappeler aux référents)
Rester **factuel**. « Signaler », « demander », « faire valoir ses droits » :
oui. Accusations nominatives non prouvées, appels à des actions illégales,
injures visant un bailleur nommé : **non** — c'est ce qui transforme une
mobilisation légitime en risque de diffamation. La [charte](CHARTE-MODERATEUR.md)
le formalise.

---

## Ordre recommandé

1. Statuts relus → AG constitutive → déclaration (parallélisable avec le pilote).
2. Compléter les pages légales dès le numéro RNA obtenu.
3. Pub **organique** possible dès maintenant ; **payante** après l'association.
