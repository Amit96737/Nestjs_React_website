import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: '123232#',
    description: 'User old password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  old_password: string;

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