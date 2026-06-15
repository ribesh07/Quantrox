-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('MERCHANT', 'USER');

-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN "type" "PayoutType" NOT NULL DEFAULT 'MERCHANT';

-- CreateIndex
CREATE INDEX "PayoutRequest_type_idx" ON "PayoutRequest"("type");
