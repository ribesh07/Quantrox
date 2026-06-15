-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN "paymentMethodId" TEXT;
ALTER TABLE "PayoutRequest" ADD COLUMN "uid" TEXT;
ALTER TABLE "PayoutRequest" ADD COLUMN "paymentProofImage" TEXT;

-- Make wallet fields optional for payment-method-based payouts
ALTER TABLE "PayoutRequest" ALTER COLUMN "walletAddress" DROP NOT NULL;
ALTER TABLE "PayoutRequest" ALTER COLUMN "walletNetwork" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PayoutRequest_paymentMethodId_idx" ON "PayoutRequest"("paymentMethodId");

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
