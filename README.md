# Student-Connect

Réseau de proximité pour connecter les étudiants d’une même résidence.

## Documentation

- [Cahier des charges](./docs/CAHIER_DES_CHARGES.md)
- [Déploiement v1 (Postgres + Vercel)](./docs/DEPLOY_V1.md)

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + **PostgreSQL** (Docker en local, managé en prod)
- Auth session JWT (cookie httpOnly)

## Setup local

Prérequis : Docker (Postgres).

```bash
cp .env.example .env
# Édite AUTH_SECRET
docker compose up -d
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

→ http://localhost:3000

## Compte seed

| Rôle | E-mail | Mot de passe |
|------|--------|--------------|
| Super-admin | `admin@student-connect.local` | `Admin123!` |

Aucune résidence préchargée : crée-les via `/super-admin` (parcours pilote réaliste).
