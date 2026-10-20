
import { IsUUID } from 'class-validator';

export class AssignTaskDto {
  @IsUUID()
  assigned_to_id: string;
}
