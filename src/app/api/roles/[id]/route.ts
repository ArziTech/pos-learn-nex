import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

/**
 * PUT /api/roles/[id]
 * Update a role and its permissions
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
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, byPassAllFeatures, permissionIds = [] } = body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Role dengan nama ini sudah ada" },
          { status: 400 }
        );
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(byPassAllFeatures !== undefined && { byPassAllFeatures }),
      },
    });

    // Update permissions - delete existing and create new ones
    if (permissionIds !== undefined) {
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId: number) => ({
            roleId,
            permissionId,
            createdBy: session.user.username,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedRole,
    });
  } catch (error: any) {
    console.error("Error updating role:", error);

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
 * DELETE /api/roles/[id]
 * Soft delete a role (set isActive to false)
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
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Check if role has users
    const usersWithRole = await prisma.user.count({
      where: { roleId },
    });

    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus role yang masih memiliki user" },
        { status: 400 }
      );
    }

    // Soft delete role
    await prisma.role.update({
      where: { id: roleId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Role berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting role:", error);

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
