import { IsEnum } from 'class-validator';

export enum SessionStatus {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class UpdateSessionStatusDto {
  @IsEnum(SessionStatus)
  status: SessionStatus;
}