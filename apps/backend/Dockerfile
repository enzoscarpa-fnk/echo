FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy all workspace files (root level)
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.json ./
COPY turbo.json ./

# Copy all packages
COPY packages/ ./packages/

# Copy backend
COPY apps/backend/ ./apps/backend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma types
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Build backend
WORKDIR /app
RUN pnpm --filter backend build

# Production dependencies
RUN pnpm prune --production

EXPOSE 3000

CMD ["pnpm", "--filter", "backend", "start:prod"]
