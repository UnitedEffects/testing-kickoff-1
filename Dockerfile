# Multi-stage Dockerfile for Next.js standalone deployment

# Stage 1: Dependencies
FROM node:24.4.1-alpine AS deps
WORKDIR /app

# Install dependencies required for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN corepack enable && \
    corepack prepare yarn@4.9.4 --activate && \
    yarn install --immutable

# Stage 2: Builder
FROM node:24.4.1-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/.yarnrc.yml ./.yarnrc.yml

# Copy source files
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build application (standalone output)
RUN corepack enable && \
    corepack prepare yarn@4.9.4 --activate && \
    yarn build

# Stage 3: Runner
FROM node:24.4.1-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start application
CMD ["node", "server.js"]
