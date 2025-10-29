-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    CONSTRAINT "contacts_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contacts_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_conversation_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" DATETIME,
    CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_conversation_participants" ("conversationId", "id", "joinedAt", "lastReadAt", "userId") SELECT "conversationId", "id", "joinedAt", "lastReadAt", "userId" FROM "conversation_participants";
DROP TABLE "conversation_participants";
ALTER TABLE "new_conversation_participants" RENAME TO "conversation_participants";
CREATE INDEX "conversation_participants_conversationId_idx" ON "conversation_participants"("conversationId");
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("clerkId", "createdAt", "email", "firstName", "id", "imageUrl", "lastName", "updatedAt", "username") SELECT "clerkId", "createdAt", "email", "firstName", "id", "imageUrl", "lastName", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_isOnline_idx" ON "users"("isOnline");
CREATE INDEX "users_lastSeenAt_idx" ON "users"("lastSeenAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "contacts_initiatorId_idx" ON "contacts"("initiatorId");

-- CreateIndex
CREATE INDEX "contacts_receiverId_idx" ON "contacts"("receiverId");

-- CreateIndex
CREATE INDEX "contacts_status_idx" ON "contacts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_initiatorId_receiverId_key" ON "contacts"("initiatorId", "receiverId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");
