FROM node:20-alpine

WORKDIR /app
RUN npm install -g pnpm
COPY ../.. .
RUN pnpm install
RUN pnpm prisma generate
RUN pnpm --filter backend build

EXPOSE 3000
CMD ["pnpm", "--filter", "backend", "start:prod"]
