FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --frozen-lockfile

RUN cd apps/backend && pnpm prisma generate && pnpm build

EXPOSE 3000

CMD ["node", "/app/apps/backend/dist/src/main.js"]
