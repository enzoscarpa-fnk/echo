FROM node:20-alpine as builder

WORKDIR /app
RUN npm install -g pnpm
COPY ../.. .
RUN pnpm install
RUN pnpm --filter frontend build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/apps/frontend/.output ./apps/frontend/.output
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "./apps/frontend/.output/server/index.mjs"]
