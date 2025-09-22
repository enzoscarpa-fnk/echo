import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('conversation_participants')
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  joinedAt: Date;
}
