import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { hash } from "bcryptjs";
import { z } from "zod";

// Validation schema for user creation
const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(/^[a-z0-9_-]+$/, "Username hanya boleh huruf kecil, angka, - dan _")
    .transform((val) => val.toLowerCase()),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  name: z.string().min(1, "Nama harus diisi"),
  roleId: z.number().int().positive("Role ID tidak valid"),
  status: z.boolean().default(true),
});

// Select fields for user response
const userSelectFields = {
  id: true,
  username: true,
  email: true,
  name: true,
  image: true,
  emailVerified: true,
  status: true,
  roleId: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      name: true,
      description: true,
      byPassAllFeatures: true,
      isActive: true,
    },
  },
};

/**
 * POST /api/users
 * Create a new user or restore a soft-deleted user
 */
export async function handlePOST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    await requirePermission(session.user.id, "user.create");

    // Check if this is a restore request
    const { searchParams } = new URL(request.url);
    const isRestore = searchParams.get("restore") === "true";

    // Parse and validate request body
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, email, password, name, roleId, status } = validation.data;

    // 1. Check if username/email already exists in ACTIVE users
    const activeUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
        deletedAt: null,
      },
    });

    if (activeUser) {
      const field = activeUser.username === username ? "Username" : "Email";
      return NextResponse.json(
        { error: `${field} sudah digunakan` },
        { status: 409 }
      );
    }

    // 2. Check if username/email exists in DELETED users
    const deletedUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
        deletedAt: { not: null },
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        deletedAt: true,
      },
    });

    // 3. If deleted user found and NOT a restore request, return canRestore response
    if (deletedUser && !isRestore) {
      return NextResponse.json(
        {
          error: "User dengan username/email ini pernah dihapus. Apakah ingin merestore?",
          canRestore: true,
          deletedUser,
        },
        { status: 409 }
      );
    }

    // Validate role exists and is active
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (!role.isActive) {
      return NextResponse.json(
        { error: "Cannot assign inactive role" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // 4. If restore request and deleted user found, restore the user
    if (deletedUser && isRestore) {
      const restoredUser = await prisma.user.update({
        where: { id: deletedUser.id },
        data: {
          username,
          email,
          password: hashedPassword,
          name,
          roleId,
          status,
          deletedAt: null, // Clear soft delete
        },
        select: userSelectFields,
      });

      return NextResponse.json(
        { data: restoredUser, message: "User restored successfully", restored: true },
        { status: 200 }
      );
    }

    // 5. Create new user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        roleId,
        status,
      },
      select: userSelectFields,
    });

    return NextResponse.json(
      { data: user, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.message?.startsWith("Permission denied")) {
      return NextResponse.json(
        { error: "Forbidden", details: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
