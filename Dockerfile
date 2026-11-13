# syntax=docker/dockerfile:1

# ---- base ----
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/env/package.json packages/env/
COPY packages/ui/package.json packages/ui/
COPY tooling/eslint/package.json tooling/eslint/
COPY tooling/prettier/package.json tooling/prettier/
COPY tooling/typescript/package.json tooling/typescript/
RUN pnpm install --frozen-lockfile

# ---- builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/tooling ./tooling
COPY . .
ENV SKIP_ENV_VALIDATION=1
RUN pnpm --filter @workspace/db generate
RUN pnpm --filter web build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN npm install -g prisma@7.10.1

# node_modules + workspace packages (so @workspace/env resolves for prisma config)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# standalone server
COPY --from=builder /app/apps/web/.next/standalone ./
# static assets
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# public assets
# COPY --from=builder /app/apps/web/public ./apps/web/public
# entrypoint
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]