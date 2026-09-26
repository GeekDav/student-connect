# Student-Connect — comportement produit (notes pour le pilote)

Document vivant : règles validées en tests / discussions.  
À la fin du projet → base du PDF commercial + doc A→Z.

Principe : **pas un réseau social**. Contenu de résidence, éphémère ; quand un étudiant quitte, le besoin d’historique long disparaît. On retire plutôt que d’accumuler.

Dernière MAJ : 2026-09-25

---

## Accueil étudiant — sections

| Section | Affiché | Chargé / limite | Disparition |
|---|---|---|---|
| Tableau d’affichage | **5** puis Voir plus (+5) jusqu’à 20 | **20** plus récentes publiées | Pas d’auto-delete ; hors top 20 = plus visibles étudiants |
| Petit mur | **6** puis Voir plus (+6) | **30** plus récentes (< 7 j) | **7 jours** après publication |
| Événements récents | **4** | Jusqu’à 50 (page Events) | Après **heure de fin** |
| SOS en cours | **4** | Jusqu’à 50 (page SOS) | **7 j.** → **expiré** ; prolonger 1× ; max 2 ouverts ; purge résolu/expiré à **30 j.** |
| Recyclerie | **4** | Jusqu’à 50 (page Recyclerie) | **30 j.** → **expiré** ; prolonger 1× ; max 3 actives ; purge parti/expiré à **60 j.** |

Titres de section : sticky + barre colorée (repère au scroll).

---

## Annonces officielles (gestionnaire)

- Les étudiants voient au max **20** annonces publiées **les plus récentes**, affichées par lots de **5** (Voir plus).
- Publier au-delà de 20 reste possible.
- À **20+** live : alerte dashboard + page Annonces → demander de **dépublier** les anciennes.
- Lecture unique trackée (compteur côté gestionnaire).

---

## Petit mur

- **1 post / personne / jour**.
- Max **280** caractères / note ; **160** / réponse.
- Max **40** réponses par note.
- TTL **7 jours** (note + réponses supprimées).
- Feed = top **30** récentes encore valides ; UI progressive 6 → Voir plus.
- Pas de “remontée” volontaire demandée pour le pitch : on explique le top 30 comme plafond d’affichage.

---

## Événements

- **Une seule date** (pas de plage multi-jours).
- Heure de début **obligatoire** ; heure de fin **optionnelle** (même jour).
- Affichage : `sam. 12 oct. · 13h25` ou `sam. 12 oct. · 13h25 – 18h`.
- Date ≥ aujourd’hui ; si aujourd’hui, heure début ≥ maintenant.
- Fin vide → disparaît juste après l’heure de début (~1 min).
- Fin renseignée → disparaît **après l’heure de fin**.
- Retrait manuel toujours possible avant.
- Max places 2–30 ; auteur continue de pouvoir ajuster / retirer.

---

## SOS

- Visible **7 jours** puis statut **expiré** (pas « résolu » — résolu = action auteur).
- Auteur peut **marquer résolu** à tout moment (y compris depuis expiré).
- **Prolonger 1×** (+7 j.) ; depuis expiré, ça le remet en ouvert.
- Max **2 SOS** ouverts / étudiant.
- À la création : encadré d’info (durée, prolonger, expiré, cap).
- Carte active : libellé « Jusqu’au … ».
- Purge DB : résolus / expirés **supprimés 30 j.** après passage hors cours.

---

## Recyclerie

- Visible **30 jours** puis statut **expiré** (pas « parti » — parti = action auteur).
- Auteur peut **marquer parti** à tout moment (y compris depuis expiré).
- **Prolonger 1×** (+14 j.) ; depuis expiré, ça le remet en disponible.
- Max **3** annonces actives / étudiant.
- À la création : encadré d’info.
- Carte active : libellé « Jusqu’au … ».
- Purge DB : partis / expirés **supprimés 60 j.** après passage hors cours.

---

## Messages

- Badge non-lus (pastille accent) sur **Messages** dans la nav — polling ~2,5 s, sans reload.
- Conversation ouverte : nouveaux messages apparaissent tout seuls ; lecture → badge diminue.
- Compteur par conversation dans la liste (déjà en place).
- Clic **Messages** pendant un chat → retour à l’inbox.

## Temps quasi-réel (étudiant)

Polling léger (~4 s, onglet visible) sur :
- Mur (+ réponses)
- SOS / Recyclerie / Events (pages + aperçus Accueil)
- Annonces officielles (tableau d’affichage)

Les créations propres restent optimistes (affichage immédiat) ; le poll fait apparaître celles des autres / du gestionnaire sans F5.

---

## Super-admin — cockpit

- **Vue d’ensemble** : KPI plateforme, activité 30 j. (stacked), donuts statut/plan, top activité, alertes, table pulse filtrable.
- **Résidences** : CRUD opérationnel (pause, e-mail gestionnaire, nom) + lien Pulse.
- **Fiche résidence** : breakdown étudiant + gestionnaire + série 30 j.
- Principe : mesurer la **vie étudiante** et la **charge gestionnaire** pour piloter l’officialisation — pas un réseau social, un cockpit résidence.

---

## Images (profil + annonces)

- Formats : JPG / PNG / WebP (pas HEIC).
- Compression auto côté client (photos téléphone).
- Stockage Vercel Blob (store **Public** + `BLOB_READ_WRITE_TOKEN`).
- Endroits image : avatar profil étudiant, image optionnelle annonce gestionnaire.

---

## Formulaires

- `noValidate` + erreurs FR sous chaque champ (pas de bulles navigateur).
- Contact : label **E-mail professionnel**.
- Inscription : « Déjà un compte ? **Connexion** » (espace + gras).

---

## Rôles / navigation

- Gestionnaire peut **consulter** boards étudiants (SOS, events, etc.) en **lecture seule** ; Messages privés & profil étudiant → redirigés vers espace gestionnaire.
- Liens dashboard Events / SOS ne doivent pas “déconnecter” (plus de redirect `/`).

---

## Site public

- Hash `#partenaires` : scroll fiable (pas Next Link `/#…` cassé).
- Back-to-top sur landing.
- Phase pilote : contact / SA, billing Stripe derrière flag.

---

## À documenter plus tard (PDF pilote)

- Parcours A→Z : inscription, invitation, validation, feed, SOS, events, mur, recyclerie, messages, annonces, modération.
- Valeur gestionnaire : pulse, inbox, CSV résidents, lectures annonces.
- Contraintes légales / pilote gratuit SA-only (contexte David).
- Limites produit ci-dessus + Pourquoi (éphémère, mobile-first, anti-spam).
