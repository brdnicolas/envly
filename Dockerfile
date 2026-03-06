FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema + migrations for DB init
COPY --from=builder /app/prisma ./prisma

# Copy node_modules needed at runtime (native modules + prisma CLI)
COPY --from=builder /app/node_modules ./node_modules

# Copy generated Prisma client
COPY --from=builder /app/src/generated ./src/generated

# Create data directory for SQLite volume
RUN mkdir -p /data && chown nextjs:nodejs /data
COPY <<'EOF' /app/start.sh
#!/bin/sh
set -e

# Run migrations on the persistent volume DB
DATABASE_URL="file:${DATABASE_PATH:-/data/envly.db}" npx prisma migrate deploy

# Start the app
exec node server.js
EOF
RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

CMD ["/app/start.sh"]
