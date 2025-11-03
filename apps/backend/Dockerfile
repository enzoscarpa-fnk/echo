FROM node:20-alpine as builder

WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install

WORKDIR /app/apps/backend
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

EXPOSE 3000

WORKDIR /app/apps/backend
CMD ["node", "dist/src/main.js"]
