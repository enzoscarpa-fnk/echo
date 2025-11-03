FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install

WORKDIR /app/apps/backend
RUN pnpm prisma generate

WORKDIR /app
RUN pnpm --filter backend build

EXPOSE 3000

# Run from backend directory
WORKDIR /app/apps/backend
CMD ["node", "dist/main.js"]
