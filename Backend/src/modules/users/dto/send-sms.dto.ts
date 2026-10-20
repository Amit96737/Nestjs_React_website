import { IsNotEmpty, IsString } from 'class-validator';

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  phone_number: string;
}