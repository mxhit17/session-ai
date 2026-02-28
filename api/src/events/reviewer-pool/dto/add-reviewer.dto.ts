import { IsUUID } from 'class-validator';

export class AddReviewerDto {
  @IsUUID()
  reviewer_id: string;
}