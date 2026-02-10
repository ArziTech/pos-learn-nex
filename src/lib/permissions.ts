import { prisma } from "@/lib/prisma";

/**
 * Check if a user has a specific permission
 * @param userId - The user's ID
 * @param permissionCode - The permission code to check (e.g., "user.view")
 * @returns Promise<boolean> - True if user has permission or bypass flag is set
 */
export async function hasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            byPassAllFeatures: true,
            RolePermission: {
              select: {
                permission: {
                  select: {
                    code: true,
                  },
                },
              },
              where: {
                permission: {
                  code: permissionCode,
                  isActive: true,
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Check if role has bypass flag
    if (user.role.byPassAllFeatures) {
      return true;
    }

    // Check if user has the specific permission
    return user.role.RolePermission.length > 0;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Check if a user has a specific permission and throw error if not
 * @param userId - The user's ID
 * @param permissionCode - The permission code to check (e.g., "user.view")
 * @throws Error if user doesn't have permission
 */
export async function requirePermission(
  userId: string,
  permissionCode: string
): Promise<void> {
  const allowed = await hasPermission(userId, permissionCode);

  if (!allowed) {
    throw new Error(`Permission denied: ${permissionCode}`);
  }
}
