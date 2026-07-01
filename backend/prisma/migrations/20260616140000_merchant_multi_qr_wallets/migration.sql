-- Drop unique constraint on MerchantQRCode.userId to allow multiple QRs per merchant
DROP INDEX IF EXISTS "MerchantQRCode_userId_key";

-- Add label column to MerchantQRCode
ALTER TABLE "MerchantQRCode" ADD COLUMN IF NOT EXISTS "label" TEXT;

-- Add index on userId for MerchantQRCode
CREATE INDEX IF NOT EXISTS "MerchantQRCode_userId_idx" ON "MerchantQRCode"("userId");

-- Create MerchantWallet table
CREATE TABLE IF NOT EXISTS "MerchantWallet" (
    "id" TEXT NOT NULL,
    "merchantInfoId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "dailyLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantWallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MerchantWallet_merchantInfoId_paymentMethodId_key" ON "MerchantWallet"("merchantInfoId", "paymentMethodId");

ALTER TABLE "MerchantWallet" DROP CONSTRAINT IF EXISTS "MerchantWallet_merchantInfoId_fkey";
ALTER TABLE "MerchantWallet" ADD CONSTRAINT "MerchantWallet_merchantInfoId_fkey" FOREIGN KEY ("merchantInfoId") REFERENCES "MerchantInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MerchantWallet" DROP CONSTRAINT IF EXISTS "MerchantWallet_paymentMethodId_fkey";
ALTER TABLE "MerchantWallet" ADD CONSTRAINT "MerchantWallet_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
