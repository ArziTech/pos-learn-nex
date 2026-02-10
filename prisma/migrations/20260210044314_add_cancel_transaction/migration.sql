-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "canceledBy" TEXT;

-- CreateTable
CREATE TABLE "TransactionCancelLog" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "canceledBy" TEXT NOT NULL,
    "canceledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionCancelLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionCancelLog_transactionId_idx" ON "TransactionCancelLog"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionCancelLog_canceledAt_idx" ON "TransactionCancelLog"("canceledAt");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_canceledBy_fkey" FOREIGN KEY ("canceledBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCancelLog" ADD CONSTRAINT "TransactionCancelLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
