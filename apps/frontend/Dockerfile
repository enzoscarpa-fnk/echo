FROM node:20-alpine as builder

WORKDIR /app
RUN npm install -g pnpm
COPY ../.. .
RUN pnpm install
WORKDIR /app
RUN pnpm --filter frontend build

FROM node:20-alpine

WORKDIR /app/apps/frontend
RUN npm install -g pnpm
COPY --from=builder /app/apps/frontend/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
