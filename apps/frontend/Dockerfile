# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copy all workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.json ./
COPY turbo.json ./

# Copy all packages
COPY packages/ ./packages/

# Copy frontend
COPY apps/frontend/ ./apps/frontend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build frontend
WORKDIR /app
RUN pnpm --filter frontend build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copy all workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.json ./
COPY turbo.json ./

# Copy all packages
COPY packages/ ./packages/

# Copy frontend
COPY apps/frontend/ ./apps/frontend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --production

# Copy build output from builder
COPY --from=builder /app/apps/frontend/.output ./apps/frontend/.output

EXPOSE 3000

CMD ["node", "./apps/frontend/.output/server/index.mjs"]
