import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @IsUUID()
  @IsNotEmpty()
  senderId: string;
}
