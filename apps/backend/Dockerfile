FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/backend ./apps/backend

RUN pnpm install --frozen-lockfile

ENV PATH="/app/node_modules/.bin:$PATH"

WORKDIR /app/apps/backend

RUN prisma generate

RUN nest build

EXPOSE 3000

CMD ["node", "dist/main.js"]
