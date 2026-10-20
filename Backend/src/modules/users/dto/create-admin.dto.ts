import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    example: 'Test',
    description: 'Admin username',
  })
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @ApiProperty({
    example: 'admin123@yopmail.com',
    description: 'Admin email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Admin password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}