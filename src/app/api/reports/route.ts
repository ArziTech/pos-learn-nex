import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Convert local date to UTC date range
 * Uses ISO string conversion to handle timezone properly
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
 * Get local date (YYYY-MM-DD) from a Date object
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert UTC date to local date string (YYYY-MM-DD)
 */
function utcToLocalDateString(utcDate: Date): string {
  // Get the local date components directly from the UTC date
  // This handles the conversion correctly
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * GET /api/reports
 * Get analytics data for reports
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today"; // today, week, month, year, all
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range in UTC
    const now = new Date();
    let dateStart: Date;
    let dateEnd: Date;
    let localDateStart: Date;
    let localDateEnd: Date;

    if (startDate && endDate) {
      // Custom date range
      localDateStart = new Date(startDate);
      localDateEnd = new Date(endDate);
      const startRange = getDayRangeInUTC(localDateStart);
      const endRange = getDayRangeInUTC(localDateEnd);
      dateStart = startRange.start;
      dateEnd = endRange.end;
    } else {
      switch (period) {
        case "today": {
          localDateStart = new Date(now);
          localDateEnd = new Date(now);
          const range = getDayRangeInUTC(now);
          dateStart = range.start;
          dateEnd = range.end;
          break;
        }
        case "week": {
          localDateStart = new Date(now);
          localDateStart.setDate(localDateStart.getDate() - 6);
          localDateEnd = new Date(now);
          const range = getDayRangeInUTC(localDateStart);
          dateStart = range.start;
          dateEnd = getDayRangeInUTC(localDateEnd).end;
          break;
        }
        case "month": {
          localDateStart = new Date(now);
          localDateStart.setDate(localDateStart.getDate() - 29);
          localDateEnd = new Date(now);
          const range = getDayRangeInUTC(localDateStart);
          dateStart = range.start;
          dateEnd = getDayRangeInUTC(localDateEnd).end;
          break;
        }
        case "year": {
          localDateStart = new Date(now.getFullYear(), 0, 1);
          localDateEnd = new Date(now);
          const range = getDayRangeInUTC(localDateStart);
          dateStart = range.start;
          dateEnd = getDayRangeInUTC(localDateEnd).end;
          break;
        }
        case "all":
        default: {
          // All time - find the earliest transaction date
          const earliestTransaction = await prisma.transaction.findFirst({
            where: { status: "COMPLETED" },
            orderBy: { createdAt: "asc" },
            select: { createdAt: true },
          });

          if (earliestTransaction) {
            localDateStart = new Date(earliestTransaction.createdAt);
          } else {
            localDateStart = new Date(now);
          }
          localDateEnd = new Date(now);
          const startRange = getDayRangeInUTC(localDateStart);
          dateStart = startRange.start;
          dateEnd = getDayRangeInUTC(localDateEnd).end;
          break;
        }
      }
    }

    console.log("Query range (UTC):", {
      start: dateStart.toISOString(),
      end: dateEnd.toISOString(),
      period,
    });

    // Fetch transactions with items in the date range
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: dateStart,
          lte: dateEnd,
        },
        status: "COMPLETED",
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Found transactions:", transactions.length);

    // Calculate total revenue
    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTransactions = transactions.length;
    const totalItemsSold = transactions.reduce((sum, t) => sum + t.items.length, 0);

    // Calculate product sales
    const productSales = new Map<number, {
      productId: number;
      productName: string;
      totalQuantity: number;
      totalRevenue: number;
      transactionCount: number;
    }>();

    transactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        const existing = productSales.get(item.productId);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += item.subtotal;
          existing.transactionCount += 1;
        } else {
          productSales.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            totalQuantity: item.quantity,
            totalRevenue: item.subtotal,
            transactionCount: 1,
          });
        }
      });
    });

    // Convert to array and sort
    const productsArray = Array.from(productSales.values());

    // Most sold products (by quantity)
    const mostSoldProducts = productsArray
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Popular products (by transaction count - appears in most transactions)
    const popularProducts = productsArray
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 10);

    // Top revenue products
    const topRevenueProducts = productsArray
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Daily revenue for chart (last 7 days or based on period)
    const dailyRevenue = await getDailyRevenue(dateStart, dateEnd, localDateStart, localDateEnd, period === "all", period);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalTransactions,
          totalItemsSold,
          averageTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        },
        mostSoldProducts,
        popularProducts,
        topRevenueProducts,
        dailyRevenue,
        period: {
          type: period,
          start: dateStart.toISOString(),
          end: dateEnd.toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get revenue data for charts
 * @param onlyWithData - If true, only return dates that have transactions (for "all time" view)
 * @param period - The period type (today, week, month, year, all)
 */
async function getDailyRevenue(
  utcStartDate: Date,
  utcEndDate: Date,
  localStartDate: Date,
  localEndDate: Date,
  onlyWithData: boolean = false,
  period: string = "today"
) {
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: utcStartDate,
        lte: utcEndDate,
      },
      status: "COMPLETED",
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // For "today", group by hour (0-23)
  if (period === "today") {
    const revenueByHour = new Map<number, number>();

    transactions.forEach((t) => {
      const hour = t.createdAt.getHours();
      revenueByHour.set(hour, (revenueByHour.get(hour) || 0) + t.totalAmount);
    });

    // Generate all hours from opening time (8AM) to current time
    const data: { date: string; revenue: number }[] = [];
    const currentHour = new Date().getHours();
    const openingHour = 8; // Business hours start at 8 AM

    for (let h = openingHour; h <= Math.min(currentHour, 22); h++) {
      data.push({
        date: `${h}:00`,
        revenue: revenueByHour.get(h) || 0,
      });
    }

    return data;
  }

  // Group by date (in local timezone) for other periods
  const revenueByDate = new Map<string, number>();

  transactions.forEach((t) => {
    const dateKey = utcToLocalDateString(t.createdAt);
    revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + t.totalAmount);
  });

  console.log("Revenue by date:", Object.fromEntries(revenueByDate));

  // For "all time" view, only return dates with actual data
  if (onlyWithData) {
    return Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }

  // Generate all dates in range using local dates (for other periods)
  const dates: string[] = [];

  // Reset to start of day
  const iterDate = new Date(localStartDate);
  iterDate.setHours(0, 0, 0, 0);

  // End date at end of day
  const lastDate = new Date(localEndDate);
  lastDate.setHours(23, 59, 59, 999);

  while (iterDate <= lastDate) {
    dates.push(toLocalDateString(iterDate));
    iterDate.setDate(iterDate.getDate() + 1);
  }

  console.log("Generated dates:", dates);

  return dates.map((date) => ({
    date,
    revenue: revenueByDate.get(date) || 0,
  }));
}
