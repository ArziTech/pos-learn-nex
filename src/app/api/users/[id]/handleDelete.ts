import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

/**
 * DELETE /api/users/[id]
 * Soft delete a user
 */
export async function handleDELETE(
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
    await requirePermission(session.user.id, "user");

    // Prevent self-delete
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 403 }
      );
    }

    // Check if user exists and get their role
    const userToDelete = await prisma.user.findFirst({
      where: {
        id: id,
        deletedAt: null, // Only find non-deleted users
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: {
          select: {
            byPassAllFeatures: true,
          },
        },
      },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Prevent deleting the last super admin
    if (userToDelete.role.byPassAllFeatures) {
      const superAdminCount = await prisma.user.count({
        where: {
          role: {
            byPassAllFeatures: true,
          },
          deletedAt: null, // Count only active super admins
        },
      });

      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: "Tidak dapat menghapus super admin terakhir" },
          { status: 403 }
        );
      }
    }

    // SOFT DELETE: Update instead of delete
    await prisma.user.update({
      where: { id: id },
      data: {
        deletedAt: new Date(),
        status: false, // Also mark as inactive
      },
    });

    return NextResponse.json(
      { message: "User berhasil dihapus" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting user:", error);

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
