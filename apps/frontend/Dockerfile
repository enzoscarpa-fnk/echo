# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy frontend package.json
COPY apps/frontend/package.json ./apps/frontend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Build frontend
WORKDIR /app/apps/frontend
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy frontend package.json
COPY apps/frontend/package.json ./apps/frontend/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --production

# Copy build output from builder
COPY --from=builder /app/apps/frontend/.output ./apps/frontend/.output

WORKDIR /app/apps/frontend

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
