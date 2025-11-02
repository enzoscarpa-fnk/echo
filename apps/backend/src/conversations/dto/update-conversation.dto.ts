import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class UpdateConversationDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    name: string;
}
