import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { hash } from "bcryptjs";
import { z } from "zod";

// Validation schema for user update
const updateUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username minimal 3 karakter")
      .max(50, "Username maksimal 50 karakter")
      .regex(
        /^[a-z0-9_-]+$/,
        "Username hanya boleh huruf kecil, angka, - dan _"
      )
      .transform((val) => val.toLowerCase()),
    email: z.string().email("Email tidak valid"),
    name: z.string().min(2, "Nama minimal 2 karakter"),
    password: z.string().optional(),
    roleId: z.number().int().positive("Role ID tidak valid"),
    status: z.boolean(),
    image: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // If password is provided and not empty, validate it
      if (data.password && data.password.trim() !== "") {
        return data.password.length >= 6;
      }
      return true;
    },
    {
      message: "Password minimal 6 karakter",
      path: ["password"],
    }
  );

/**
 * PUT /api/users/[id]
 * Update a user
 */
export async function handlePUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    await requirePermission(session.user.id, "user.edit");

    // Parse and validate request body
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, email, password, name, roleId, status, image } =
      validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: id,
        deletedAt: null,
      },
      select: {
        id: true,
        roleId: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent changing own role
    if (roleId !== undefined && id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 403 }
      );
    }

    // Check if username is already taken by another user
    if (username) {
      const usernameTaken = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: id },
          deletedAt: null,
        },
      });

      if (usernameTaken) {
        return NextResponse.json(
          { error: "Username sudah digunakan" },
          { status: 409 }
        );
      }
    }

    // Check if email is already taken by another user
    if (email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: id },
          deletedAt: null,
        },
      });

      if (emailTaken) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
    }

    // Validate role if being updated
    if (roleId !== undefined) {
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
    }

    // Build update data
    const updateData: any = {
      username,
      email,
      name,
      roleId,
      status,
    };

    // Add image if provided
    if (image !== undefined) {
      updateData.image = image;
    }

    // Hash password if provided and not empty
    if (password && password.trim() !== "") {
      updateData.password = await hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
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
      },
    });

    return NextResponse.json(
      { data: user, message: "User updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating user:", error);

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
