FROM node:20-alpine as builder

WORKDIR /app

RUN npm install -g pnpm

COPY ../.. .

RUN pnpm install --frozen-lockfile

WORKDIR /app
RUN pnpm --filter frontend build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY ../.. .

RUN pnpm install --frozen-lockfile --production

COPY --from=builder /app/apps/frontend/.output ./apps/frontend/.output

EXPOSE 3000

CMD ["node", "./apps/frontend/.output/server/index.mjs"]
