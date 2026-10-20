import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Test',
    description: 'User first name',
  })
  @IsOptional()
  @IsString()
  first_name?: string;


  @ApiProperty({
    example: 'Test',
    description: 'User last name',
  })
  @IsOptional()
  @IsString()
  last_name?: string;
}