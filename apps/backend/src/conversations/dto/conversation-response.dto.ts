export class ConversationResponseDto {
    id: string;
    name?: string;
    isGroup: boolean;
    createdAt: Date;
    updatedAt: Date;
    participants: ParticipantDto[];
    lastMessage?: any; // This will be added later with messages
}

export class ParticipantDto {
    id: string;
    userId: string;
    user: {
        id: string;
        clerkId: string;
        email: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        imageUrl?: string;
    };
    joinedAt: Date;
}
