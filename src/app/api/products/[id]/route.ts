import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/products/[id]
 * Update a product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, sku, price, categoryId, stock, isActive } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if SKU already exists (if changing SKU)
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      });

      if (skuExists) {
        return NextResponse.json(
          { error: "SKU already exists", details: `Product with SKU ${sku} already exists` },
          { status: 400 }
        );
      }
    }

    // Update product and stock in a transaction
    await prisma.$transaction(async (tx) => {
      // Update product
      await tx.product.update({
        where: { id: productId },
        data: {
          ...(name !== undefined && { name }),
          ...(sku !== undefined && { sku }),
          ...(price !== undefined && { price }),
          ...(categoryId !== undefined && { categoryId }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      // Update stock if provided
      if (stock !== undefined) {
        await tx.stock.update({
          where: { productId },
          data: { quantity: stock },
        });
      }
    });

    // Fetch the updated product
    const product = await prisma.product.findUnique({
      where: { id: productId },
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
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Delete a product (soft delete by setting isActive to false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const product = await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("Error deleting product:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
