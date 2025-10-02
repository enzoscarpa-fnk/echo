import { IsString, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class CreateConversationDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    participantIds?: string[];

    @IsString()
    @IsOptional()
    name?: string;

    @IsBoolean()
    @IsOptional()
    isGroup?: boolean;
}
