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

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "apps/backend/dist/src/main.js"]
