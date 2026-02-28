// update-cfp.dto.ts
import { IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class UpdateCfpDto {
  @IsOptional()
  @IsBoolean()
  cfp_open?: boolean;

  @IsOptional()
  @IsDateString()
  cfp_start?: string;

  @IsOptional()
  @IsDateString()
  cfp_end?: string;
}