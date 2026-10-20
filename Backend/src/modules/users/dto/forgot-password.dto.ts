import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {

  @ApiProperty({
    example: 'user123@yopmail.com',
    description: 'User email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}