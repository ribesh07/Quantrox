-- Drop unique constraint on MerchantQRCode.userId to allow multiple QRs per merchant
DROP INDEX IF EXISTS "MerchantQRCode_userId_key";

-- Add new columns to MerchantQRCode
ALTER TABLE "MerchantQRCode" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "MerchantQRCode" ADD COLUMN IF NOT EXISTS "paymentMethodId" TEXT;
ALTER TABLE "MerchantQRCode" ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MerchantQRCode" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);

-- Add indexes for MerchantQRCode
CREATE INDEX IF NOT EXISTS "MerchantQRCode_userId_idx" ON "MerchantQRCode"("userId");
CREATE INDEX IF NOT EXISTS "MerchantQRCode_active_idx" ON "MerchantQRCode"("active");

-- Add foreign key for payment method on MerchantQRCode
DO $$ BEGIN
  ALTER TABLE "MerchantQRCode" ADD CONSTRAINT "MerchantQRCode_paymentMethodId_fkey"
    FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create MerchantWallet table
CREATE TABLE IF NOT EXISTS "MerchantWallet" (
    "id" TEXT NOT NULL,
    "merchantInfoId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "minLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxLimit" DOUBLE PRECISION NOT NULL DEFAULT 1000000,
    "dailyLimit" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantWallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MerchantWallet_merchantInfoId_walletId_key" ON "MerchantWallet"("merchantInfoId", "walletId");
CREATE INDEX IF NOT EXISTS "MerchantWallet_merchantInfoId_idx" ON "MerchantWallet"("merchantInfoId");

DO $$ BEGIN
  ALTER TABLE "MerchantWallet" ADD CONSTRAINT "MerchantWallet_merchantInfoId_fkey"
    FOREIGN KEY ("merchantInfoId") REFERENCES "MerchantInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "MerchantWallet" ADD CONSTRAINT "MerchantWallet_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
