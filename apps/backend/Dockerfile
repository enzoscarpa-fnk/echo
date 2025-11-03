FROM node:20-alpine as builder

WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/backend
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app/pnpm-lock.yaml /app/package.json ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

EXPOSE 3000

CMD ["node", "apps/backend/dist/src/main.js"]
