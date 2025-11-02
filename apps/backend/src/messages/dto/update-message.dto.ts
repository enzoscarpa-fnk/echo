import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateMessageDto {
    @IsString()
    @IsNotEmpty({ message: 'Message content is required' })
    content?: string;
}
