import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  logStockChange,
  logPriceChange,
  logProductUpdate,
  logProductStatusChange,
  logProductDeletion,
} from "@/lib/product-activity";

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

    // Check if product exists and get current values
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { stock: true },
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

    // Track what changed
    const changedFields: string[] = [];
    if (name && name !== existingProduct.name) changedFields.push("name");
    if (sku && sku !== existingProduct.sku) changedFields.push("sku");
    if (categoryId !== undefined && categoryId !== existingProduct.categoryId) changedFields.push("category");
    if (stock !== undefined && stock !== existingProduct.stock?.quantity) changedFields.push("stock");
    if (price !== undefined && price !== existingProduct.price) changedFields.push("price");
    if (isActive !== undefined && isActive !== existingProduct.isActive) changedFields.push("status");

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

    // Log changes
    if (changedFields.length > 0) {
      // Log specific changes with details
      if (stock !== undefined && stock !== existingProduct.stock?.quantity) {
        await logStockChange({
          productId,
          productName: existingProduct.name,
          previousQuantity: existingProduct.stock?.quantity || 0,
          newQuantity: stock,
          userId: session.user.id,
          userName: session.user.name || undefined,
        });
      }

      if (price !== undefined && price !== existingProduct.price) {
        await logPriceChange({
          productId,
          productName: existingProduct.name,
          previousPrice: existingProduct.price,
          newPrice: price,
          userId: session.user.id,
          userName: session.user.name || undefined,
        });
      }

      if (isActive !== undefined && isActive !== existingProduct.isActive) {
        await logProductStatusChange({
          productId,
          productName: existingProduct.name,
          isActive,
          userId: session.user.id,
          userName: session.user.name || undefined,
        });
      }

      // Log general update if there are other changes
      const otherChanges = changedFields.filter(
        f => !["stock", "price", "status"].includes(f)
      );
      if (otherChanges.length > 0) {
        await logProductUpdate({
          productId,
          productName: existingProduct.name,
          changedFields: otherChanges,
          userId: session.user.id,
          userName: session.user.name || undefined,
        });
      }
    }

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

    // Get product before deletion for logging
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    const product = await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    // Log deletion
    await logProductStatusChange({
      productId,
      productName: existingProduct.name,
      isActive: false,
      userId: session.user.id,
      userName: session.user.name || undefined,
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
