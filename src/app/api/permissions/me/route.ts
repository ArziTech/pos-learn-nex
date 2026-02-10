import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: {
          select: {
            id: true,
            name: true,
            byPassAllFeatures: true,
            RolePermission: {
              select: {
                permission: {
                  select: {
                    id: true,
                    code: true,
                    label: true,
                    href: true,
                    description: true,
                    icon: true,
                    module: true,
                    isSection: true,
                    sequence: true,
                    parentId: true,
                    showOnSidebar: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
              where: {
                permission: {
                  isActive: true,
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract permissions from role
    // If user has byPassAllFeatures, return all active permissions
    let permissions;
    if (user.role.byPassAllFeatures) {
      permissions = await prisma.permission.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          label: true,
          href: true,
          description: true,
          icon: true,
          module: true,
          isSection: true,
          sequence: true,
          parentId: true,
          showOnSidebar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { sequence: 'asc' },
      });
    } else {
      permissions = user.role.RolePermission.map((rp) => rp.permission);
    }

    return NextResponse.json({
      permissions,
      byPassAllFeatures: user.role.byPassAllFeatures,
      roleName: user.role.name,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
