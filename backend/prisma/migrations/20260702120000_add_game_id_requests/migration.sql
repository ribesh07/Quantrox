-- CreateEnum
CREATE TYPE "GameIdRequestType" AS ENUM ('GAME_ID', 'EMAIL_PASSWORD');

-- CreateEnum
CREATE TYPE "GameIdRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "GameIdRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "requestType" "GameIdRequestType" NOT NULL DEFAULT 'EMAIL_PASSWORD',
    "gameUsername" TEXT,
    "email" TEXT,
    "password" TEXT,
    "status" "GameIdRequestStatus" NOT NULL DEFAULT 'PENDING',
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameIdRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameIdRequest_userId_idx" ON "GameIdRequest"("userId");

-- CreateIndex
CREATE INDEX "GameIdRequest_status_idx" ON "GameIdRequest"("status");

-- CreateIndex
CREATE INDEX "GameIdRequest_createdAt_idx" ON "GameIdRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "GameIdRequest" ADD CONSTRAINT "GameIdRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameIdRequest" ADD CONSTRAINT "GameIdRequest_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
