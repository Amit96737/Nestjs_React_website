
import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(['ADMIN', 'MEMBER'])
  role?: 'ADMIN' | 'MEMBER';
}
