import { getPrisma } from "@/lib/db-client";

export { createPrismaClient, getPrisma, isDatabaseConfigured } from "@/lib/db-client";

/** @deprecated Prefer getPrisma() for lazy init on serverless. */
export const prisma = new Proxy({} as ReturnType<typeof getPrisma>, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma(), prop, receiver);
  },
});
