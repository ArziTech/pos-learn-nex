import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get start and end of day in UTC for a given local date
 */
function getDayRangeInUTC(localDate: Date): { start: Date; end: Date } {
  const startLocal = new Date(localDate);
  startLocal.setHours(0, 0, 0, 0);
  const endLocal = new Date(localDate);
  endLocal.setHours(23, 59, 59, 999);

  // Create ISO strings and parse to get proper UTC dates
  const startUTC = new Date(startLocal.toISOString());
  const endUTC = new Date(endLocal.toISOString());

  return { start: startUTC, end: endUTC };
}

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayRange = getDayRangeInUTC(now);

    // Get today's transactions
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: todayRange.start,
          lte: todayRange.end,
        },
        status: "COMPLETED",
      },
    });

    const todaySales = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

    // Get total products count
    const totalProducts = await prisma.product.count({
      where: { isActive: true },
    });

    // Get total transactions count
    const totalTransactions = await prisma.transaction.count({
      where: { status: "COMPLETED" },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        totalTransactions,
        todaySales,
        todayTransactionCount: todayTransactions.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
