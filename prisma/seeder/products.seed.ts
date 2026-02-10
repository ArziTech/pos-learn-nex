import { PrismaClient } from "../../src/generated/prisma/client.js";

export async function seedProducts(prisma: PrismaClient) {
  console.log("\nCreating categories and products...");

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, title: "Makanan", isActive: true },
    }),
    prisma.category.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, title: "Minuman", isActive: true },
    }),
    prisma.category.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, title: "Snack", isActive: true },
    }),
  ]);

  console.log(`✓ Created/Updated ${categories.length} categories`);

  // Products data
  const productsData = [
    // Makanan
    { name: "Nasi Goreng", sku: "MG001", price: 25000, categoryId: 1, stock: 50 },
    { name: "Mie Goreng", sku: "MG002", price: 20000, categoryId: 1, stock: 40 },
    { name: "Ayam Bakar", sku: "AB001", price: 30000, categoryId: 1, stock: 30 },
    { name: "Sate Ayam", sku: "SA001", price: 35000, categoryId: 1, stock: 25 },
    { name: "Rendang", sku: "RD001", price: 40000, categoryId: 1, stock: 20 },
    { name: "Nasi Putih", sku: "NP001", price: 5000, categoryId: 1, stock: 100 },
    { name: "Telur Dadar", sku: "TD001", price: 8000, categoryId: 1, stock: 60 },
    { name: "Tempe Goreng", sku: "TG001", price: 5000, categoryId: 1, stock: 70 },

    // Minuman
    { name: "Es Teh Manis", sku: "ETM001", price: 5000, categoryId: 2, stock: 100 },
    { name: "Es Jeruk", sku: "EJ001", price: 8000, categoryId: 2, stock: 80 },
    { name: "Jus Alpukat", sku: "JA001", price: 15000, categoryId: 2, stock: 40 },
    { name: "Jus Mangga", sku: "JM001", price: 12000, categoryId: 2, stock: 50 },
    { name: "Kopi Susu", sku: "KS001", price: 18000, categoryId: 2, stock: 60 },
    { name: "Air Mineral", sku: "AM001", price: 4000, categoryId: 2, stock: 120 },
    { name: "Teh Botol", sku: "TB001", price: 6000, categoryId: 2, stock: 90 },

    // Snack
    { name: "Keripik Pisang", sku: "KP001", price: 10000, categoryId: 3, stock: 50 },
    { name: "Roti Bakar", sku: "RB001", price: 15000, categoryId: 3, stock: 40 },
    { name: "Pisang Goreng", sku: "PG001", price: 12000, categoryId: 3, stock: 45 },
    { name: "Kentang Goreng", sku: "KG001", price: 15000, categoryId: 3, stock: 35 },
    { name: "Risoles", sku: "RS001", price: 8000, categoryId: 3, stock: 55 },
  ];

  // Create products with stock
  for (const productData of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {
        name: productData.name,
        price: productData.price,
        categoryId: productData.categoryId,
        isActive: true,
      },
      create: {
        name: productData.name,
        sku: productData.sku,
        price: productData.price,
        categoryId: productData.categoryId,
        isActive: true,
      },
    });

    // Create or update stock
    await prisma.stock.upsert({
      where: { productId: product.id },
      update: {
        quantity: productData.stock,
        number: product.id,
      },
      create: {
        productId: product.id,
        number: product.id,
        quantity: productData.stock,
      },
    });

    console.log(`✓ Created/Updated product: ${product.name} (${product.sku})`);
  }

  console.log(`\n✓ Total products seeded: ${productsData.length}`);
}
