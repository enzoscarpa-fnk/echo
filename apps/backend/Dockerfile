FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copy from root level (one dir up, twice)
COPY ../.. .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Build
WORKDIR /app
RUN pnpm --filter backend build

EXPOSE 3000

CMD ["pnpm", "--filter", "backend", "start:prod"]
