# ================================
# Multi-stage Dockerfile for Next.js Frontend
# ================================

# --------------------------------
# Stage 1: Dependencies
# --------------------------------
FROM node:20-alpine AS deps
LABEL stage=deps

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) for build stage
RUN if [ -f package-lock.json ]; then \
    npm ci; \
    else \
    npm install; \
    fi && \
    npm cache clean --force

# --------------------------------
# Stage 2: Builder
# --------------------------------
FROM node:20-alpine AS builder
LABEL stage=builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Accept build args for Next.js public environment variables (with defaults)
ARG NEXT_PUBLIC_API_URL=https://phc.dyndns.biz/medical-supplies-api/v1/
ARG NEXT_PUBLIC_BASE_PATH=/medical-supplies
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

# Build Next.js application
RUN npm run build

# --------------------------------
# Stage 3: Production Runner
# --------------------------------
FROM node:20-alpine AS production
LABEL stage=production

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100

# Accept build args for Next.js public environment variables (for runtime reference, with defaults)
ARG NEXT_PUBLIC_API_URL=https://phc.dyndns.biz/medical-supplies-api/v1/
ARG NEXT_PUBLIC_BASE_PATH=/medical-supplies
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}



# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3100

# Health check - Check basePath root (without trailing slash)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3100/medical-supplies', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]

