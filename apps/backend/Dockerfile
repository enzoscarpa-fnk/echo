FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/backend ./apps/backend

RUN pnpm install --frozen-lockfile

RUN pnpm exec prisma generate --schema=./apps/backend/prisma/schema.prisma

WORKDIR /app/apps/backend
RUN ../../node_modules/.bin/nest build

EXPOSE 3000

CMD ["node", "dist/main.js"]
