FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/backend ./apps/backend

RUN pnpm install --frozen-lockfile --shamefully-hoist

WORKDIR /app/apps/backend

RUN pnpm prisma generate
RUN pnpm build

WORKDIR /app

EXPOSE 3000

CMD ["node", "apps/backend/dist/src/main.js"]
