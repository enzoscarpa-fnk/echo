// DTO for user response (what we send to the client)
export class UserResponseDto {
    id: string;
    clerkId: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    createdAt: Date;
    isOnline?: boolean;
    lastSeenAt?: Date;

    // Helper method to get full name
    get fullName(): string {
        if (this.firstName && this.lastName) {
            return `${this.firstName} ${this.lastName}`;
        }
        if (this.firstName) return this.firstName;
        if (this.lastName) return this.lastName;
        if (this.username) return this.username;
        return this.email.split('@')[0];
    }
}
