-- Remplace le libellé texte ambigu par une vraie plage horaire.
ALTER TABLE "MicroEvent" ADD COLUMN "startsAt" TIMESTAMP(3);
ALTER TABLE "MicroEvent" ADD COLUMN "endsAt" TIMESTAMP(3);

-- Anciens events : on part de createdAt, durée 2 h (puis filtrés s’ils sont déjà passés).
UPDATE "MicroEvent"
SET
  "startsAt" = "createdAt",
  "endsAt" = "createdAt" + INTERVAL '2 hours'
WHERE "startsAt" IS NULL OR "endsAt" IS NULL;

ALTER TABLE "MicroEvent" ALTER COLUMN "startsAt" SET NOT NULL;
ALTER TABLE "MicroEvent" ALTER COLUMN "endsAt" SET NOT NULL;

ALTER TABLE "MicroEvent" DROP COLUMN "whenLabel";

CREATE INDEX "MicroEvent_endsAt_idx" ON "MicroEvent"("endsAt");
CREATE INDEX "MicroEvent_residenceId_endsAt_idx" ON "MicroEvent"("residenceId", "endsAt");
