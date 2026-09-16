# Déploiement v1 — Student-Connect (pilotes)

Objectif : faire tourner l’Alpha **hors laptop** pour 2 résidences pilotes.

## Stack cible

| Couche | Choix |
|--------|--------|
| App | Next.js sur **Vercel** |
| DB | **PostgreSQL** managé, région **UE** (Neon / Prisma Postgres / Supabase) |
| Fichiers | encore `public/uploads` en local ; **lot 2** = stockage objet |
| Mails | **lot 3** |

## 1. Postgres local (dev)

```bash
# Si Docker Hub demande login : docker login
docker compose up -d
cp .env.example .env   # si besoin
# AUTH_SECRET : génère une vraie valeur
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Compte seed : `admin@student-connect.local` / `Admin123!`  
(Pas de résidence préchargée — tu les crées via `/super-admin`.)

## 2. Postgres prod

1. Crée une base Postgres **UE** (ex. Neon → region `eu-central-1` / Frankfurt).
2. Copie l’URL `postgresql://…?sslmode=require`.
3. En local pour tester la prod DB (optionnel) :
   ```bash
   DATABASE_URL="postgresql://…" npx prisma migrate deploy
   DATABASE_URL="postgresql://…" npm run db:seed
   ```

## 3. Deploy Vercel

1. Pousse le repo sur GitHub (si pas déjà).
2. [vercel.com](https://vercel.com) → Import project.
3. Variables d’environnement :
   - `DATABASE_URL` = URL Postgres prod
   - `AUTH_SECRET` = secret fort (différent du local)
4. Build command (défaut OK) : `prisma generate && next build` (déjà dans `npm run build`).
5. Après le 1er deploy réussi, lance les migrations une fois :
   ```bash
   DATABASE_URL="…" npx prisma migrate deploy
   DATABASE_URL="…" npm run db:seed
   ```
   (ou Vercel CLI / job one-shot)

6. Ouvre l’URL Vercel → `/super-admin` → crée la 1ʳᵉ résidence pilote.

## 4. Checklist avant d’ouvrir un pilote

- [ ] Site en HTTPS (Vercel)
- [ ] Connexion super-admin OK
- [ ] Création résidence + gestionnaire OK
- [ ] Inscription étudiant → validation → app OK
- [ ] Uploads images OK **ou** reportés au lot 2 (Vercel FS éphémère : les uploads locaux **ne tiennent pas** en prod — lot 2 prioritaire juste après)

## Note uploads

Sur Vercel, le disque n’est pas persistant. Les photos d’avatar / annonces via `public/uploads` marchent en local Docker, **pas durablement en prod**. Enchaîner rapidement le **lot 2 (stockage objet)** après le premier deploy.
