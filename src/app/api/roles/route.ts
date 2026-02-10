import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

/**
 * GET /api/roles
 * Get all roles with their permissions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    await requirePermission(session.user.id, "user");

    const roles = await prisma.role.findMany({
      where: { isActive: true },
      include: {
        RolePermission: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    // Transform the data to include permission arrays
    const transformedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      byPassAllFeatures: role.byPassAllFeatures,
      permissions: role.RolePermission.map((rp) => rp.permission),
      permissionIds: role.RolePermission.map((rp) => rp.permissionId),
    }));

    return NextResponse.json({
      success: true,
      data: transformedRoles,
    });
  } catch (error: any) {
    console.error("Error fetching roles:", error);

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

/**
 * POST /api/roles
 * Create a new role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePermission(session.user.id, "user");

    const body = await request.json();
    const { name, description, byPassAllFeatures = false, permissionIds = [] } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role dengan nama ini sudah ada" },
        { status: 400 }
      );
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        description,
        byPassAllFeatures,
        isActive: true,
        RolePermission: permissionIds.length > 0
          ? {
              create: permissionIds.map((permissionId: number) => ({
                permissionId,
                createdBy: session.user.username,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: role,
    });
  } catch (error: any) {
    console.error("Error creating role:", error);

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
