-- Add nextBillingDate with a temporary default (copy from nextRenewalDate)
ALTER TABLE "Subscription" ADD COLUMN "nextBillingDate" TIMESTAMP(3);
UPDATE "Subscription" SET "nextBillingDate" = "nextRenewalDate";
ALTER TABLE "Subscription" ALTER COLUMN "nextBillingDate" SET NOT NULL;

-- Drop old columns
ALTER TABLE "Subscription" DROP COLUMN "billingCycle";
ALTER TABLE "Subscription" DROP COLUMN "isActive";
ALTER TABLE "Subscription" DROP COLUMN "nextRenewalDate";

-- Drop enum
DROP TYPE IF EXISTS "BillingCycle";
