import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  logProductCreation,
  logStockChange,
  logPriceChange,
  logProductUpdate,
  logProductStatusChange,
} from "@/lib/product-activity";

/**
 * GET /api/products
 * List products with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Whitelist allowed sort fields for security
    const allowedSortFields = ["name", "sku", "price", "createdAt"];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "name";
    const validSortOrder = sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "asc";

    // Build dynamic orderBy object
    const orderBy: any = { [validSortBy]: validSortOrder };

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get paginated products
    const products = await prisma.product.findMany({
      where,
      include: {
        stock: {
          select: {
            quantity: true,
          },
        },
        category: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderBy,
    });

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, sku, price, categoryId, stock, isActive } = body;

    // Validate required fields
    if (!name || !sku || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields", details: "name, sku, and price are required" },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "SKU already exists", details: `Product with SKU ${sku} already exists` },
        { status: 400 }
      );
    }

    // Create product and stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create product
      const product = await tx.product.create({
        data: {
          name,
          sku,
          price,
          categoryId: categoryId || null,
          isActive: isActive ?? true,
        },
      });

      // Create stock
      await tx.stock.create({
        data: {
          productId: product.id,
          number: product.id,
          quantity: stock || 0,
        },
      });

      return { product, stock: stock || 0 };
    });

    // Log product creation
    await logProductCreation({
      productId: result.product.id,
      productName: result.product.name,
      initialStock: result.stock,
      initialPrice: result.product.price,
      userId: session.user.id,
      userName: session.user.name || undefined,
    });

    // Fetch the created product with relations
    const product = await prisma.product.findUnique({
      where: { id: result.product.id },
      include: {
        stock: true,
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
