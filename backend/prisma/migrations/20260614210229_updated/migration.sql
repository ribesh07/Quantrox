-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DepositType" AS ENUM ('INITIAL', 'ADDITIONAL', 'ADJUSTMENT', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'APPROVED', 'FROZEN', 'RELEASED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'PAID', 'REJECTED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "fromWalletId" TEXT,
ADD COLUMN     "receiveEmail" TEXT,
ADD COLUMN     "receivePhone" TEXT,
ADD COLUMN     "receiveQrCode" TEXT,
ADD COLUMN     "receiveUsername" TEXT,
ADD COLUMN     "receiveWalletNumber" TEXT,
ADD COLUMN     "toWalletId" TEXT,
ADD COLUMN     "transactionReference" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'VERIFICATION_PENDING';

-- CreateTable
CREATE TABLE "MerchantInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessDescription" TEXT,
    "preferredWalletId" TEXT NOT NULL,
    "expectedDailyVolume" DOUBLE PRECISION NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "proofImage" TEXT,
    "notes" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantQRCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "disabledAt" TIMESTAMP(3),
    "history" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantQRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "DepositType" NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "requiredDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "adjustedBy" TEXT,
    "adjustedAt" TIMESTAMP(3),
    "frozenAt" TIMESTAMP(3),
    "frozenBy" TEXT,
    "releasedAt" TIMESTAMP(3),
    "releasedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "walletNetwork" TEXT NOT NULL,
    "qrCodeImage" TEXT,
    "remarks" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "transactionHash" TEXT,
    "paidBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantInfo_userId_key" ON "MerchantInfo"("userId");

-- CreateIndex
CREATE INDEX "TransactionReport_userId_idx" ON "TransactionReport"("userId");

-- CreateIndex
CREATE INDEX "TransactionReport_status_idx" ON "TransactionReport"("status");

-- CreateIndex
CREATE INDEX "TransactionReport_createdAt_idx" ON "TransactionReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantQRCode_userId_key" ON "MerchantQRCode"("userId");

-- CreateIndex
CREATE INDEX "Deposit_userId_idx" ON "Deposit"("userId");

-- CreateIndex
CREATE INDEX "Deposit_status_idx" ON "Deposit"("status");

-- CreateIndex
CREATE INDEX "Deposit_createdAt_idx" ON "Deposit"("createdAt");

-- CreateIndex
CREATE INDEX "PayoutRequest_userId_idx" ON "PayoutRequest"("userId");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_idx" ON "PayoutRequest"("status");

-- CreateIndex
CREATE INDEX "PayoutRequest_createdAt_idx" ON "PayoutRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "MerchantInfo" ADD CONSTRAINT "MerchantInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantInfo" ADD CONSTRAINT "MerchantInfo_preferredWalletId_fkey" FOREIGN KEY ("preferredWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionReport" ADD CONSTRAINT "TransactionReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantQRCode" ADD CONSTRAINT "MerchantQRCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
