
***

# 📱 echo - Real-time Messaging Application

> A modern, secure instant messaging platform built with NestJS, Nuxt.js, and real-time capabilities.
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)


## 🌐 Live Demo

**Production URL:** To come 


***

## 📖 About

**echo** is a full-stack instant messaging application offering:
- 💬 Real-time 1:1 and group conversations
- 👥 Contact management with opt-in system
- 🔐 Secure authentication via Clerk
- ⚡ WebSocket-powered instant message delivery (Pusher)
- 🎨 Modern, responsive UI with NuxtUI + TailwindCSS v4

This project was developed as part of a bachelor's degree integration project at IFOSUP.

***

## 🛠️ Tech Stack

### Backend
- **NestJS v11** (TypeScript) - Modular REST API
- **Prisma ORM** - Type-safe database access
- **SQLite** - Development database (PostgreSQL recommended for production)
- **Clerk** - Authentication & user management
- **Pusher** - Real-time WebSocket events

### Frontend
- **Nuxt.js v4** - Vue.js framework (SPA mode)
- **NuxtUI** - UI component library
- **TailwindCSS v4** - Utility-first CSS

### DevOps
- **Docker Compose** - Container orchestration
- **GitHub Actions** - CI/CD pipeline
- **pnpm** - Fast, efficient package manager

***

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **pnpm** ≥ 8.x
- **Docker** & Docker Compose (for production deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/echo.git
   cd echo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create `.env` files in both `apps/backend` and `apps/frontend`:

   **Backend** (`apps/backend/.env`):
   ```env
   DATABASE_URL="file:./dev.db"
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   PUSHER_APP_ID=your_pusher_app_id
   PUSHER_KEY=your_pusher_key
   PUSHER_SECRET=your_pusher_secret
   PUSHER_CLUSTER=eu
   ```

   **Frontend** (`apps/frontend/.env`):
   ```env
   NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   NUXT_PUBLIC_API_BASE=http://localhost:3001/api
   NUXT_PUBLIC_PUSHER_KEY=your_pusher_key
   NUXT_PUBLIC_PUSHER_CLUSTER=eu
   ```

4. **Run database migrations**
   ```bash
   cd apps/backend
   pnpm prisma migrate dev
   ```

5. **Start development servers**

   **Backend** (port 3001):
   ```bash
   cd apps/backend
   pnpm run dev
   ```

   **Frontend** (port 3000):
   ```bash
   cd apps/frontend
   pnpm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

***

## 🐳 Docker Deployment

### Build and run with Docker Compose

```bash
docker compose up -d --build
```

Services will be available at:
- Backend: `http://localhost:8082`
- Frontend: `http://localhost:8083`

### Stop containers

```bash
docker compose down
```

***

## 📂 Project Structure

```
echo/
├── apps/
│   ├── backend/           # NestJS API
│   │   ├── src/
│   │   │   ├── auth/      # Clerk authentication
│   │   │   ├── users/     # User management
│   │   │   ├── contacts/  # Contact system
│   │   │   ├── conversations/  # Conversation logic
│   │   │   ├── messages/  # Message handling
│   │   │   ├── webhooks/  # Clerk webhooks
│   │   │   └── pusher/    # Real-time events
│   │   ├── prisma/        # Database schema & migrations
│   │   └── Dockerfile
│   │
│   └── frontend/          # Nuxt.js SPA
│       ├── app/
│       │   ├── pages/     # Route pages
│       │   ├── components/  # Vue components
│       │   └── composables/ # Reusable logic
│       └── Dockerfile
│
├── docker-compose.yml     # Container orchestration
├── pnpm-workspace.yaml    # Monorepo config
└── README.md
```

***

## 🔑 Key Features

### Authentication & Security
- OAuth login (Google, GitHub, Apple) via Clerk
- Secure JWT-based API authentication
- Password-less authentication support

### Contact Management
- Send/receive contact requests
- Accept/reject pending invitations
- Contact-only messaging (opt-in model)

### Messaging
- Real-time 1:1 conversations
- Group chats with role-based permissions (ADMIN/MEMBER)
- Edit and delete messages
- Message history with timestamps
- Online/offline presence indicators

### User Experience
- Auto-complete search for contacts
- Responsive mobile & desktop design
- Real-time typing indicators (planned)
- Message read receipts (planned)

***

## 🧪 Testing

```bash
# Backend tests
cd apps/backend
pnpm run test

# Frontend tests
cd apps/frontend
pnpm run test
```

***

## 🚢 CI/CD Pipeline

GitHub Actions automatically:
1. Runs tests on pull requests
2. Builds Docker images on `master` branch merges
3. Deploys to VPS Hostinger via SSH
4. Verifies container health post-deployment

**Workflow file:** `.github/workflows/deploy.yml`

***

## 👥 Authors

- **[Scarpa Vincenzo]** - *Initial work* - [@enzoscarpa-fnk](https://github.com/enzoscarpa-fnk))
- **[Chang Anthony]** - *Initial work* - [@changzhiho](https://github.com/changzhiho))

***

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

***

## 🙏 Acknowledgments

- [Clerk](https://clerk.com) - Authentication solution
- [Pusher](https://pusher.com) - Real-time infrastructure
- [NestJS](https://nestjs.com) - Backend framework
- [Nuxt.js](https://nuxt.com) - Frontend framework
- IFOSUP - Academic supervision

***

**Built with ❤️ by junior developers as a learning project**
