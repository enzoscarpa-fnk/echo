// Types basés sur le schéma Prisma
export interface User {
    id: string
    clerkId: string
    email: string
    username: string | null
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
    createdAt: string
    updatedAt: string
}

export interface ConversationParticipant {
    id: string
    conversationId: string
    userId: string
    joinedAt: string
    lastReadAt: string | null
    user: User
}

export interface Conversation {
    id: string
    name: string | null
    isGroup: boolean
    createdAt: string
    updatedAt: string
    participants: ConversationParticipant[]
}

export interface Message {
    id: string
    content: string
    conversationId: string
    senderId: string
    createdAt: string
    updatedAt: string
    sender: User
}
