# Student-Connect — comportement produit (notes pour le pilote)

Document vivant : règles validées en tests / discussions.  
À la fin du projet → base du PDF commercial + doc A→Z.

Dernière MAJ : 2026-09-24

---

## Accueil étudiant — sections

| Section | Affiché | Chargé / limite | Disparition |
|---|---|---|---|
| Tableau d’affichage | Toutes les chargées | **20** plus récentes publiées | Pas d’auto-delete ; hors top 20 = plus visibles étudiants |
| Petit mur | **6** puis Voir plus (+6) | **30** plus récentes (< 7 j) | **7 jours** après publication |
| Événements récents | **4** | Jusqu’à 50 (page Events) | Après **heure de fin** |
| SOS en cours | **4** | Jusqu’à 50 (page SOS) | Manuel / résolution |
| Recyclerie | **4** | Jusqu’à 50 (page Recyclerie) | Manuel (« parti ») |

Titres de section : sticky + barre colorée (repère au scroll).

---

## Annonces officielles (gestionnaire)

- Les étudiants voient au max **20** annonces publiées **les plus récentes**.
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
