-- Statuts d’expiration (distincts de résolu / parti).
-- Utilisation du nouveau libellé : au prochain list (expireDue), pas dans cette txn.
ALTER TYPE "SosStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "MarketplaceStatus" ADD VALUE 'EXPIRED';

-- SOS : TTL 7 jours
ALTER TABLE "SosRequest" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "SosRequest" ADD COLUMN "prolongedOnce" BOOLEAN NOT NULL DEFAULT false;

UPDATE "SosRequest"
SET "expiresAt" = "createdAt" + INTERVAL '7 days'
WHERE "expiresAt" IS NULL;

ALTER TABLE "SosRequest" ALTER COLUMN "expiresAt" SET NOT NULL;
CREATE INDEX "SosRequest_expiresAt_idx" ON "SosRequest"("expiresAt");

-- Recyclerie : TTL 30 jours
ALTER TABLE "MarketplaceItem" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "MarketplaceItem" ADD COLUMN "prolongedOnce" BOOLEAN NOT NULL DEFAULT false;

UPDATE "MarketplaceItem"
SET "expiresAt" = "createdAt" + INTERVAL '30 days'
WHERE "expiresAt" IS NULL;

ALTER TABLE "MarketplaceItem" ALTER COLUMN "expiresAt" SET NOT NULL;
CREATE INDEX "MarketplaceItem_expiresAt_idx" ON "MarketplaceItem"("expiresAt");
