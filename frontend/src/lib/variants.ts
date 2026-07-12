import { db } from "@/lib/db";

/**
 * A Variant has no direct organizationId column — scoped through its
 * generationRun -> brief -> project chain instead of denormalizing, since
 * this lookup only happens on single-variant reads/writes (not list
 * queries where an extra join would matter more). Shared by every
 * /api/variants/[id]/* route so the scoping logic exists exactly once.
 */
export async function findOrgScopedVariant(variantId: string, organizationId: string) {
  return db.variant.findFirst({
    where: { id: variantId, generationRun: { brief: { project: { organizationId } } } },
    include: { generationRun: { include: { brief: { include: { project: true } } } } },
  });
}
