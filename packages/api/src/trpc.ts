import { initTRPC } from "@trpc/server"
import superjson from "superjson"
import { auth } from "@workspace/auth/server"
import { prisma } from "@workspace/db"

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth.api.getSession({ headers: opts.headers })
  return {
    prisma,
    session,
    headers: opts.headers,
  }
}

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
  })

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED")
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})
export const middleware = t.middleware
export const mergeRouters = t.mergeRouters
