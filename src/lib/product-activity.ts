import { prisma } from "./prisma";
import { ProductActivityType } from "@/generated/prisma/client";

interface LogProductActivityParams {
  productId: number;
  activityType: ProductActivityType;
  description: string;
  changes?: Record<string, any>;
  previousValue?: number;
  newValue?: number;
  userId: string;
  userName?: string;
}

/**
 * Log product activity to track changes
 */
export async function logProductActivity({
  productId,
  activityType,
  description,
  changes,
  previousValue,
  newValue,
  userId,
  userName,
}: LogProductActivityParams) {
  try {
    await prisma.productActivityLog.create({
      data: {
        productId,
        activityType,
        description,
        changes: changes ? JSON.parse(JSON.stringify(changes)) : undefined,
        previousValue,
        newValue,
        userId,
        userName,
      },
    });
  } catch (error) {
    console.error("Error logging product activity:", error);
    // Don't throw - logging should not break the main operation
  }
}

/**
 * Helper function to log stock changes
 */
export async function logStockChange({
  productId,
  productName,
  previousQuantity,
  newQuantity,
  userId,
  userName,
}: {
  productId: number;
  productName: string;
  previousQuantity: number;
  newQuantity: number;
  userId: string;
  userName?: string;
}) {
  const difference = newQuantity - previousQuantity;
  const activityType = difference > 0 ? "STOCK_ADDED" : "STOCK_REMOVED";

  await logProductActivity({
    productId,
    activityType,
    description: `Stock ${difference > 0 ? "added to" : "removed from"} "${productName}": ${difference > 0 ? "+" : ""}${difference} (${previousQuantity} → ${newQuantity})`,
    changes: {
      previousQuantity,
      newQuantity,
      difference,
    },
    previousValue: previousQuantity,
    newValue: newQuantity,
    userId,
    userName,
  });
}

/**
 * Helper function to log price changes
 */
export async function logPriceChange({
  productId,
  productName,
  previousPrice,
  newPrice,
  userId,
  userName,
}: {
  productId: number;
  productName: string;
  previousPrice: number;
  newPrice: number;
  userId: string;
  userName?: string;
}) {
  const difference = newPrice - previousPrice;

  await logProductActivity({
    productId,
    activityType: "PRICE_CHANGED",
    description: `Price changed for "${productName}": ${difference >= 0 ? "+" : ""}${difference} (${previousPrice} → ${newPrice})`,
    changes: {
      previousPrice,
      newPrice,
      difference,
    },
    previousValue: previousPrice,
    newValue: newPrice,
    userId,
    userName,
  });
}

/**
 * Helper function to log product creation
 */
export async function logProductCreation({
  productId,
  productName,
  initialStock,
  initialPrice,
  userId,
  userName,
}: {
  productId: number;
  productName: string;
  initialStock: number;
  initialPrice: number;
  userId: string;
  userName?: string;
}) {
  await logProductActivity({
    productId,
    activityType: "CREATED",
    description: `Product "${productName}" created with initial stock: ${initialStock}, price: ${initialPrice}`,
    changes: {
      initialStock,
      initialPrice,
    },
    newValue: initialStock,
    userId,
    userName,
  });
}

/**
 * Helper function to log product updates
 */
export async function logProductUpdate({
  productId,
  productName,
  changedFields,
  userId,
  userName,
}: {
  productId: number;
  productName: string;
  changedFields: string[];
  userId: string;
  userName?: string;
}) {
  await logProductActivity({
    productId,
    activityType: "UPDATED",
    description: `Product "${productName}" updated: ${changedFields.join(", ")}`,
    changes: {
      changedFields,
    },
    userId,
    userName,
  });
}

/**
 * Helper function to log product activation/deactivation
 */
export async function logProductStatusChange({
  productId,
  productName,
  isActive,
  userId,
  userName,
}: {
  productId: number;
  productName: string;
  isActive: boolean;
  userId: string;
  userName?: string;
}) {
  await logProductActivity({
    productId,
    activityType: isActive ? "ACTIVATED" : "DEACTIVATED",
    description: `Product "${productName}" ${isActive ? "activated" : "deactivated"}`,
    userId,
    userName,
  });
}

/**
 * Helper function to log product deletion
 */
export async function logProductDeletion({
  productId,
  productName,
  userId,
  userName,
}: {
  productId: number;
  productName: string;
  userId: string;
  userName?: string;
}) {
  await logProductActivity({
    productId,
    activityType: "DELETED",
    description: `Product "${productName}" was deleted`,
    userId,
    userName,
  });
}
