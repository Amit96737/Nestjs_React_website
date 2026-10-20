import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'user123@yopmail.com',
    description: 'Email used during registration',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6 digit OTP sent to email',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}