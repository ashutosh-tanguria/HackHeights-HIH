# Gateway + control plane. Build context = repository root.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app

FROM base AS builder
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @oosc/api...
COPY apps/api ./apps/api
RUN pnpm --filter @oosc/api build

FROM node:22-alpine AS runner
# docker-cli is needed because the control plane runs the isolation probes with `docker exec`.
RUN apk add --no-cache docker-cli && mkdir -p /app /data && chown 10003:10003 /data
WORKDIR /app
ENV NODE_ENV=production BAYORA_DATA_DIR=/data HOME=/tmp
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY data/benchmarks ./data/benchmarks
USER 10003:10003
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
