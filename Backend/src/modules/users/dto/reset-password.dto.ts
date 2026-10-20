import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
    example: 'user123@yopmail.com',
    description: 'User email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456#',
    description: 'User new password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  new_password: string;

  @ApiProperty({
    example: '123456#',
    description: 'User confirm password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  confirm_password: string;
}