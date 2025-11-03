FROM node:20-alpine as builder

WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml package.json ./
COPY . .
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/backend
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app/pnpm-lock.yaml /app/package.json ./
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

WORKDIR /app/apps/backend
CMD ["node", "dist/src/main.js"]
