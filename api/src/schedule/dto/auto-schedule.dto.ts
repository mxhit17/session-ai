import { IsDateString, IsString } from 'class-validator';

export class AutoScheduleDto {

  @IsDateString()
  startDate: string;

  @IsString()
  dayStartTime: string; // "09:00"

  @IsString()
  dayEndTime: string; // "17:00"

}