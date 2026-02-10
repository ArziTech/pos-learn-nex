-- CreateEnum
CREATE TYPE "ProductActivityType" AS ENUM ('CREATED', 'UPDATED', 'STOCK_ADDED', 'STOCK_REMOVED', 'PRICE_CHANGED', 'DEACTIVATED', 'ACTIVATED', 'DELETED');

-- CreateTable
CREATE TABLE "ProductActivityLog" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "activityType" "ProductActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "changes" JSON,
    "previousValue" INTEGER,
    "newValue" INTEGER,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductActivityLog_productId_idx" ON "ProductActivityLog"("productId");

-- CreateIndex
CREATE INDEX "ProductActivityLog_createdAt_idx" ON "ProductActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ProductActivityLog_activityType_idx" ON "ProductActivityLog"("activityType");

-- AddForeignKey
ALTER TABLE "ProductActivityLog" ADD CONSTRAINT "ProductActivityLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
