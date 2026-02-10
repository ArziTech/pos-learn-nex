import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

/**
 * GET /api/permissions
 * Get all permissions (for role management)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePermission(session.user.id, "user");

    const permissions = await prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [
        { sequence: "asc" },
        { label: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    console.error("Error fetching permissions:", error);

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
 * POST /api/permissions
 * Create a new permission
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePermission(session.user.id, "user");

    const body = await request.json();
    const {
      code,
      label,
      description,
      module,
      isSection,
      sequence,
      showOnSidebar,
      href,
      icon,
      parentId
    } = body;

    if (!code || !label) {
      return NextResponse.json(
        { error: "Code and label are required" },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { code },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: "Permission dengan code ini sudah ada" },
        { status: 400 }
      );
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        code,
        label,
        description,
        module,
        isSection: isSection || false,
        sequence: sequence || 0,
        showOnSidebar: showOnSidebar || false,
        href,
        icon,
        parentId: parentId || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: permission,
    });
  } catch (error: any) {
    console.error("Error creating permission:", error);

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
