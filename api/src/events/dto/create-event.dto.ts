import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  @IsNotEmpty()
  timezone: string;
}
