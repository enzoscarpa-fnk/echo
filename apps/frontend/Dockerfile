FROM node:20-alpine as builder

WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install

RUN pnpm --filter frontend build

RUN test -d apps/frontend/.output || (echo "❌ BUILD FAILED - NO OUTPUT" && exit 1)

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/apps/frontend/.output ./apps/frontend/.output

EXPOSE 3000
CMD ["node", "./apps/frontend/.output/server/index.mjs"]
