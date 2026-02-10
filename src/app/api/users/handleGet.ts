import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

/**
 * GET /api/users
 * List users with pagination, search, and role filtering
 */
export async function handleGET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    await requirePermission(session.user.id, "user");

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const roleId = searchParams.get("roleId");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Whitelist allowed sort fields for security
    const allowedSortFields = [
      "username",
      "name",
      "email",
      "createdAt",
      "updatedAt",
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const validSortOrder =
      sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc";

    // Build dynamic orderBy object
    const orderBy: any = { [validSortBy]: validSortOrder };

    // Build where clause
    const where: any = {
      deletedAt: null, // Only show non-deleted users
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleId) {
      where.roleId = parseInt(roleId);
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
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
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderBy,
    });

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);

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
