import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ nullable: true })
  attachmentUrl?: string;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ nullable: true })
  editedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Foreign keys - sans relations pour l'instant
  @Column()
  senderId: string;

  @Column()
  conversationId: string;
}
