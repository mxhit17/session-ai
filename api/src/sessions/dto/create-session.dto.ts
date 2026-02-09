import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  event_id: string;

  @IsOptional()
  @IsUUID()
  track_id?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  abstract: string;

  @IsIn(['Beginner', 'Intermediate', 'Advanced'])
  level: string;
}
