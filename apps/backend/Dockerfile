FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install
RUN pnpm prisma generate
RUN pnpm --filter backend build

RUN test -f apps/backend/dist/main.js || (echo "❌ BUILD FAILED - NO MAIN.JS" && ls -la apps/backend/dist/ && exit 1)

EXPOSE 3000

WORKDIR /app/apps/backend
CMD ["node", "dist/main.js"]
