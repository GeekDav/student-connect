# Cahier des charges — Student-Connect

**Version :** 1.1  
**Date :** 15 septembre 2026  
**Statut :** v0 fonctionnelle (local) validée — **v1 pilotes** en cours de figage  
**Objectif v1 :** 2 résidences pilotes hors laptop (prod réelle)

---

## 1. Contexte et problème

Les étudiants en résidence (privée, CROUS, internat) vivent au même endroit mais restent souvent isolés : difficile de savoir qui partage sa filière, sa nationalité ou ses centres d’intérêt ; l’entraide sur les devoirs est informelle ; les activités (FIFA, sorties, verres) se diffusent au bouche-à-oreille ; les infos officielles restent sur un tableau d’affichage papier.

**Student-Connect** est un réseau de proximité **cloisonné par résidence** qui connecte les résidents entre eux et centralise la vie de la résidence.

---

## 2. Vision produit

| Élément | Décision |
|--------|----------|
| Nom | Student-Connect |
| Promesse | « Tout ce qui se passe dans ta résidence, et les gens qui peuvent t’aider, au même endroit. » |
| Unité | Une résidence = un espace fermé |
| Règle | **1 étudiant ↔ 1 résidence** |
| Langue MVP | Français uniquement |
| Utilisateur principal | Étudiant résident |
| Utilisateur secondaire | Gestionnaire / admin de la résidence |
| Super-admin | Fondateur (création résidences partenaires) |

### Direction UX

- Très soigné visuellement, rapide, simple
- Mobile first
- Peu d’onglets, un objectif clair par écran
- Pas de jargon, pas de surcharge

---

## 3. Marché et modèle économique

### Phase 1 (MVP / Alpha) — actée

- Cible : **résidences étudiantes privées** en France
- CROUS / public : **plus tard** (après preuves d’usage)

### Modèle

- **B2B SaaS** : abonnement mensuel payé par le gestionnaire
- Étudiants : **100 % gratuit**
- Argument de vente gestionnaire : animation de communauté + argument marketing « ici on n’est pas seul »

### Go-to-market Alpha (figé — 15 sept. 2026)

1. Démarcher **exactement 2 résidences** pilotes
2. Créer résidence + compte gestionnaire **à la main** (super-admin)
3. Offrir l’outil **gratuitement pendant 3–6 mois** (durée limitée, pas gratuit à vie)
4. Contrepartie : usage réel + feedback régulier (+ témoignage si OK)
5. **Aucun paiement dans le produit en v0/v1** — facturation / Stripe = après preuve d’usage
6. Ensuite seulement : abonnement payant pour les résidences suivantes (devis + virement OK au début)

---

## 3bis. Jalons produit (figés)

| Jalon | Statut | Contenu |
|-------|--------|---------|
| **v0 — Alpha local** | **Fait** | Scope fonctionnel (était SQLite) |
| **v1 — Pilotes prod** | **En cours** | Postgres local OK · deploy Vercel + DB managée UE à brancher |
| **v1.x / Croissance** | Plus tard | Self-serve « proposer une résidence », Places, preuves bail, paiement in-app, CROUS |

### Lots ordonnés v1 (ne pas mélanger)

1. **Prod & données** — PostgreSQL, migrations, backups, variables d’env, déploiement (ex. Vercel + DB UE)
2. **Fichiers** — stockage objet pour avatars / images d’annonces (plus de `public/uploads` seul en prod)
3. **Mails** — inscription reçue, compte validé / refusé, (optionnel) envoi mdp temporaire gestionnaire
4. **Durcissement** — rate limit auth basique, secrets, HTTPS, smoke tests parcours critiques
5. **Design démo** — polish landing + inscription + accueil + espace gestionnaire (ce qu’on montre en 10 min)
6. **Légal & commercial léger** — mentions / confidentialité finalisées ; page « pour les résidences » + discours pricing (hors code paiement)
7. **Ouverture pilotes** — 2 résidences créées, onboarding gestionnaire, suivi usage / feedback

**Hors v1 (interdit de glisser dedans) :** Google Places, file d’attente self-serve, upload bail, Stripe, notifs push, refonte totale.

---

## 4. Confiance et sécurité (MVP = Phase Alpha)

### Résidences

- Uniquement des **résidences partenaires** (créées par le super-admin)
- Pas d’ajout libre par les étudiants au lancement
- Pas de Google Places / scrap massif au jour 1

### Inscription étudiant

1. Création de compte
2. Sélection de sa résidence dans la **liste partenaires**
3. Complétion du profil (dont n° de chambre pour l’admin)
4. Statut **en attente** jusqu’à validation du gestionnaire
5. Accès au réseau de **sa** résidence uniquement

### Données sensibles

| Donnée | Règle MVP |
|--------|-----------|
| Numéro de chambre | Renseigné à l’inscription ; **visible uniquement par l’admin résidence** |
| Nationalité / origine | **Optionnelle (opt-in)** ; filtrable dans l’annuaire si renseignée ; pas obligatoire |
| Visiteur non connecté | Landing marketing uniquement — **aucun** accès aux résidents / feed |

### Évolutions post-MVP (hors scope immédiat)

- Autocomplete adresse (Google Places / OSM)
- Proposition de nouvelle résidence → file d’attente super-admin
- Justificatif (bail / carte) ou invitation email gestionnaire
- Ouverture CROUS

---

## 5. Fonctionnalités MVP

### Étudiant (après validation)

1. **Profil** — filière / domaine, école-université, centres d’intérêt, nationalité opt-in, photo ; chambre côté admin only
2. **Annuaire Résidents** — liste des voisins de *sa* résidence + filtres (filière, passions, nationalité si renseignée)
3. **Accueil / Feed** — annonces officielles mises en avant + activité récente (événements, SOS, activité locale)
4. **Micro-événements** — créer / rejoindre (ex. tournoi FIFA, verre, sortie)
5. **SOS / entraide flash** — besoin urgent court (ex. tire-bouchon, aide machine à laver)
6. **Recyclerie** — dons / ventes entre résidents de la même résidence
7. **Messagerie privée** — discuter sans échanger tel / Instagram tout de suite

### Admin résidence

- Tableau de bord (demandes, signalements, activité)
- Valider / refuser les inscriptions
- Publier les annonces officielles (tableau d’affichage numérique)
- Modération légère (masquer / retirer)

### Super-admin plateforme

- Créer une résidence
- Créer le compte gestionnaire associé

### Hors MVP (noté pour plus tard)

- App mobile native
- Paiement SaaS automatisé (facture manuelle / alpha gratuite d’abord)
- Scraping / import massif de toutes les résidences FR
- Marchés publics CROUS
- Multilingue

---

## 6. Carte de navigation (écrans)

### Public

| # | Écran | Rôle |
|---|--------|------|
| 1 | Landing | Promesse, bénéfices, CTA rejoindre / espace gestionnaire |
| 2 | Connexion / Inscription | Auth |
| 3 | Mentions légales / confidentialité | Conformité minimale |

### Étudiant

| # | Écran | Rôle |
|---|--------|------|
| 4 | Accueil | Feed mixte résidence |
| 5 | Résidents | Annuaire + filtres |
| 6 | Événements | Liste + création micro-événements |
| 7 | SOS | Liste + création |
| 8 | Recyclerie | Annonces dons / ventes |
| 9 | Messages | Conversations privées |
| 10 | Mon profil | Édition |
| — | En attente de validation | Écran limbo si pas encore validé |

### Admin résidence

| # | Écran | Rôle |
|---|--------|------|
| 11 | Dashboard | Vue d’ensemble |
| 12 | Inscriptions | Valider / refuser |
| 13 | Annonces | Publier / gérer le tableau officiel |
| 14 | Modération | Signalements |

### Super-admin

| # | Écran | Rôle |
|---|--------|------|
| 15 | Gestion résidences | Créer résidence + admin |

---

## 7. Stack technique

| Couche | Choix |
|--------|--------|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS |
| Auth | Session JWT cookie (`jose` + bcrypt) |
| Base de données | **PostgreSQL** (Docker local · managé UE en prod) |
| ORM | Prisma 6 |
| Hébergement cible v1 | Vercel (ou équivalent) + DB managée **UE / RGPD** |
| Fichiers (photos) | **v1 :** stockage objet S3-compatible (avatars + annonces) |
| E-mails v1 | Provider transactionnel (Resend / Postmark / équivalent) |

Principes : un repo maintenable, perf web, itération page par page.

---

## 8. Critères de succès

### v0 (local) — atteint
- Parcours Alpha complet utilisable en local (auth, validation, modules résidence, modération, super-admin)

### v1 (pilotes) — cible
- App déployée, stable, accessible hors laptop
- **2** résidences pilotes actives (gratuit 3–6 mois)
- Gestionnaire capable de valider les inscriptions **sans** aide technique permanente
- Au moins **40 %** des résidents inscrits actifs sur 30 jours (cible indicative)
- Feedback qualitatif positif (simplicité + utilité)
- Zéro paiement automatisé requis pour déclarer la v1 OK

---

## 9. Organisation du travail

- Construction par l’agent Cursor ; **validation David lot par lot**
- **v0 terminée** (front + back local Alpha)
- **Prochaine séquence = lots v1** (§3bis), dans l’ordre : Postgres/deploy → fichiers → mails → durcissement → design démo → légal/commercial → ouverture pilotes
- Pas de précipitation : **fiabilité pilotes > nouvelles features**
- Toute tentation Phase Croissance (Places, bail, Stripe…) = après retours des 2 pilotes

---

## 10. Glossaire

| Terme | Sens |
|-------|------|
| Résidence partenaire | Résidence créée et activée par le super-admin |
| Admin résidence | Gestionnaire qui valide et anime |
| Super-admin | Compte plateforme (fondateur) |
| Micro-événement | Activité courte proposée par un résident |
| SOS | Demande d’entraide urgente et courte |
| Recyclerie | Marketplace interne dons / ventes |

---

*Document vivant : toute évolution produit majeure doit mettre à jour ce fichier.*
