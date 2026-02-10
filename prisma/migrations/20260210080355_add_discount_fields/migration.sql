-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TransactionItem" ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountPrice" INTEGER NOT NULL DEFAULT 0;
