export interface MessageWithSender {
  id: string;
  content: string;
  type: string;
  attachmentUrl?: string;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  senderId: string;
  conversationId: string;
  sender: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}
