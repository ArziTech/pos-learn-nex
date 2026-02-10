import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

/**
 * PUT /api/permissions/[id]
 * Update a permission
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

    await requirePermission(session.user.id, "user");

    const { id } = await params;
    const permissionId = parseInt(id);

    if (isNaN(permissionId)) {
      return NextResponse.json({ error: "Invalid permission ID" }, { status: 400 });
    }

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

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    // Check if code is being changed and if it conflicts
    if (code && code !== existingPermission.code) {
      const codeConflict = await prisma.permission.findUnique({
        where: { code },
      });

      if (codeConflict) {
        return NextResponse.json(
          { error: "Permission dengan code ini sudah ada" },
          { status: 400 }
        );
      }
    }

    // Update permission
    const updatedPermission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        ...(code !== undefined && { code }),
        ...(label !== undefined && { label }),
        ...(description !== undefined && { description }),
        ...(module !== undefined && { module }),
        ...(isSection !== undefined && { isSection }),
        ...(sequence !== undefined && { sequence }),
        ...(showOnSidebar !== undefined && { showOnSidebar }),
        ...(href !== undefined && { href }),
        ...(icon !== undefined && { icon }),
        ...(parentId !== undefined && { parentId }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPermission,
    });
  } catch (error: any) {
    console.error("Error updating permission:", error);

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
 * DELETE /api/permissions/[id]
 * Soft delete a permission (set isActive to false)
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

    await requirePermission(session.user.id, "user");

    const { id } = await params;
    const permissionId = parseInt(id);

    if (isNaN(permissionId)) {
      return NextResponse.json({ error: "Invalid permission ID" }, { status: 400 });
    }

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    // Check if permission has roles assigned
    const rolesWithPermission = await prisma.rolePermission.count({
      where: { permissionId },
    });

    if (rolesWithPermission > 0) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus permission yang masih digunakan oleh role" },
        { status: 400 }
      );
    }

    // Check if permission has child permissions
    const childPermissions = await prisma.permission.count({
      where: { parentId: permissionId },
    });

    if (childPermissions > 0) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus permission yang memiliki child permission" },
        { status: 400 }
      );
    }

    // Soft delete permission
    await prisma.permission.update({
      where: { id: permissionId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Permission berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting permission:", error);

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
