import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateSpeakerProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsEnum(['Beginner', 'Intermediate', 'Advanced'])
  experience_level?: 'Beginner' | 'Intermediate' | 'Advanced';
}
