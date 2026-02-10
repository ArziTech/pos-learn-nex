import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

/**
 * GET /api/roles
 * List all active roles (for dropdowns)
 */
export async function handleGET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    await requirePermission(session.user.id, "user");

    // Fetch all active roles
    const roles = await prisma.role.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ data: roles });
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
