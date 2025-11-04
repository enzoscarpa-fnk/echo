FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile

COPY apps/backend ./apps/backend

RUN pnpm --filter backend prisma generate

RUN pnpm --filter backend build

EXPOSE 3000

CMD ["node", "dist/main.js"]
