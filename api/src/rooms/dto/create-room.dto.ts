import { IsUUID, IsString, IsInt, Min } from 'class-validator';

export class CreateRoomDto {
  @IsUUID()
  eventId: string;

  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  capacity: number;
}