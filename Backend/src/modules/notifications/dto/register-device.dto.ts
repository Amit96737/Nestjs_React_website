import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  token: string;
}