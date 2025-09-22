import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { ConversationType } from '../entities/conversation.entity';

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ConversationType)
  @IsOptional()
  type?: ConversationType = ConversationType.DIRECT;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  participantIds: string[];
}
