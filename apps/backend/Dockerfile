FROM node:20-alpine

WORKDIR /app

# ✅ Install pnpm
RUN npm install -g pnpm

# ✅ Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (all workspace)
RUN pnpm install --frozen-lockfile

# Copy backend source
COPY apps/backend ./apps/backend

# Generate Prisma types
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Build backend
RUN pnpm build

# Remove dev dependencies
RUN pnpm prune --production

EXPOSE 3000

CMD ["pnpm", "start:prod"]
