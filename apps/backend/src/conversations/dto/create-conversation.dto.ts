import { IsArray, IsBoolean, IsOptional, IsString, ArrayMinSize } from 'class-validator';

export class CreateConversationDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one participant is required' })
    @IsString({ each: true })
    participantIds?: string[]; // Array of user IDs to add to the conversation

    @IsOptional()
    @IsString()
    name?: string; // Optional name for group chats

    @IsOptional()
    @IsBoolean()
    isGroup?: boolean; // If true, create a group chat
}
