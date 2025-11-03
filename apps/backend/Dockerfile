FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install

WORKDIR /app/apps/backend
RUN pnpm prisma generate

RUN pnpm build

WORKDIR /app
COPY node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
