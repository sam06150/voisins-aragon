# Les 3 vidéos TikTok — mode d'emploi

Trois animations texte, aux couleurs de l'affiche, prêtes à enregistrer.
Aucune caméra nécessaire. Tout est en HTML/CSS : **rien à installer**, ça
s'ouvre par un double-clic dans n'importe quel navigateur.

| Fichier | Script | Durée | Rôle dans la campagne |
|---|---|---|---|
| [video-1-pov.html](video-1-pov.html) | Vidéo 2 du kit — « POV » | 31,2 s | Hook viral, fait réagir en commentaires |
| [video-2-cinq-phrases.html](video-2-cinq-phrases.html) | Vidéo 3 du kit — « Les 5 phrases » | 25,8 s | Le plus commentable : « laquelle t'as entendue ? » |
| [video-3-deux-roles.html](video-3-deux-roles.html) | Vidéo 9 du kit — « Les deux rôles » | 30 s | **Le plus important** : recrute référents ET locataires |

Les scripts complets (voix off, hooks alternatifs, hashtags) sont dans
[../PUB-TIKTOK.md](../PUB-TIKTOK.md).

---

## Enregistrer une vidéo

1. **Ouvrir le fichier** dans Chrome ou Edge (double-clic).
2. Cliquer sur **« Taille réelle 1080×1920 »** — c'est le format exact TikTok.
3. Cliquer sur **« Masquer les contrôles »** — la barre du bas devient
   invisible et ne sera pas dans l'enregistrement.
4. Lancer l'enregistreur d'écran :
   - **Windows 11** : `Win + Alt + R` (Xbox Game Bar), ou l'outil Capture
     d'écran (`Win + Maj + S` → mode vidéo).
   - Cadrer **uniquement** le rectangle 1080×1920, pas la fenêtre entière.
5. Cliquer sur **« ▶ Lancer (3 s) »**. Un compte à rebours de 3 secondes vous
   laisse le temps de sortir la souris du cadre.
6. Arrêter l'enregistrement quand le chrono affiche « Terminé ».

> **Astuce :** si votre écran fait moins de 1920 px de haut, le mode « taille
> réelle » ajoute une barre de défilement. Enregistrez alors en mode ajusté
> (par défaut) : la vidéo sera plus petite mais parfaitement nette, et TikTok
> l'agrandira sans problème. La qualité vient du texte vectoriel, pas des
> pixels.

## Ajouter le son

Les vidéos sont **muettes** — c'est volontaire : le son se choisit le jour de
la publication, dans TikTok directement.

1. Importer la vidéo dans TikTok.
2. Onglet **Sons** → chercher dans les tendances du jour.
   - Vidéos 1 et 2 : son tendu, montée dramatique.
   - Vidéo 3 : quelque chose de plus posé, ou votre voix en off.
3. **Fortement recommandé pour la vidéo 3** : enregistrer votre propre voix
   par-dessus, avec le texte de la colonne « Voix » du script. Une vraie voix
   convertit nettement mieux qu'une musique seule sur ce type de sujet.

## Avant de publier

- [ ] Le lien en bio pointe bien vers le site (les vidéos disent « Lien en bio »).
- [ ] Sous-titres TikTok activés si vous ajoutez une voix off.
- [ ] 4 à 6 hashtags max, dont **un géo** (`#toulouse`, `#lille`…) et
      éventuellement **un bailleur** (`#cdchabitat`, `#vilogia`…).
- [ ] Un commentaire épinglé dès la publication — c'est là que se fait le
      recrutement. Modèles dans [../PUB-TIKTOK.md](../PUB-TIKTOK.md) § 7 bis.

---

## Modifier une vidéo

Tout est dans le fichier HTML, sans dépendance externe.

- **Changer un texte** : éditer directement dans le `<div class="scene">`.
- **Changer un timing** : chaque scène porte `style="--t:3.4s;--d:2.8s"`
  — `--t` = moment d'apparition, `--d` = durée à l'écran. Les scènes
  s'enchaînent quand `--t` de la suivante = `--t + --d` de la précédente.
- **Changer la durée totale** : la constante `TOTAL` en bas du fichier, dans
  le `<script>` (elle ne sert qu'au chrono affiché).
- **Les couleurs** sont dans `:root` en haut : `--crimson`, `--amber`, `--ink`
  — identiques à celles de l'affiche.

⚠️ La **zone sûre** (`.safe`) réserve 150 px en haut et 380 px en bas : c'est
l'espace couvert par l'interface TikTok (pseudo, légende, boutons). Ne mettez
jamais de texte important en dehors.

---

## Pourquoi ces trois-là

Ce sont les trois scripts du kit qui ne demandent **aucune image réelle** :
uniquement du texte animé. Les autres (le radiateur froid, le couloir dégradé,
l'affiche collée dans le hall) ont besoin de vraies images de votre résidence
— et c'est justement ce qui les rendra crédibles. Tournez-les au téléphone dès
que vous pouvez : sur ce sujet, l'authenticité est l'argument principal.
