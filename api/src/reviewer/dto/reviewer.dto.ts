import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class SubmitReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsString()
  @IsOptional()
  comment?: string;
}