# =========================================================================
# CleanLoop Frontend Dockerfile
# Production-ready multi-stage build for Next.js 16 App Router
# =========================================================================

# -------------------------------------------------------------------------
# Stage 1: Dependency Installation
# -------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# -------------------------------------------------------------------------
# Stage 2: Development (Optional target for live hot-reload development)
# -------------------------------------------------------------------------
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY package.json package-lock.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]

# -------------------------------------------------------------------------
# Stage 3: Builder (Production bundle compilation)
# -------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public environment variables (inlined into client bundle)
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_USER_POOL_ID=""
ARG NEXT_PUBLIC_USER_POOL_CLIENT_ID=""
ARG NEXT_PUBLIC_AWS_REGION="us-east-1"
ARG NEXT_PUBLIC_S3_BUCKET=""

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_USER_POOL_ID=$NEXT_PUBLIC_USER_POOL_ID
ENV NEXT_PUBLIC_USER_POOL_CLIENT_ID=$NEXT_PUBLIC_USER_POOL_CLIENT_ID
ENV NEXT_PUBLIC_AWS_REGION=$NEXT_PUBLIC_AWS_REGION
ENV NEXT_PUBLIC_S3_BUCKET=$NEXT_PUBLIC_S3_BUCKET
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# -------------------------------------------------------------------------
# Stage 4: Production Runner (Lean, secure unprivileged execution)
# -------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create secure system user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy runtime assets and compiled output
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

USER nextjs

EXPOSE 3000

# Health check to ensure Next.js is serving requests
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node_modules/.bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
