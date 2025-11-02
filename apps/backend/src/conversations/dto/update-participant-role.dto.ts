import { IsEnum } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class UpdateParticipantRoleDto {
    @IsEnum(MemberRole)
    role: MemberRole;
}
