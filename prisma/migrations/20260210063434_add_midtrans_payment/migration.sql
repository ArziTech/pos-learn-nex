-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "paymentType" TEXT,
ADD COLUMN     "snapRedirectUrl" TEXT,
ADD COLUMN     "snapToken" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentType" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL,
    "fraudStatus" TEXT,
    "transactionTime" TIMESTAMP(3),
    "midtransTransactionId" TEXT,
    "statusCode" TEXT,
    "statusMessage" TEXT,
    "rawResponse" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_paymentStatus_idx" ON "Payment"("paymentStatus");

-- CreateIndex
CREATE INDEX "Transaction_paymentStatus_idx" ON "Transaction"("paymentStatus");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
