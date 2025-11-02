import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty({ message: 'Message content is required' })
    content: string;

    @IsOptional()
    @IsString()
    attachmentUrl?: string; // For future file attachments
}
