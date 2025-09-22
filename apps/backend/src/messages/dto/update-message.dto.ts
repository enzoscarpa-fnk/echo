import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional } from 'class-validator';
import { CreateMessageDto } from './create-message.dto';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
  @IsString()
  @IsOptional()
  content?: string;
}
