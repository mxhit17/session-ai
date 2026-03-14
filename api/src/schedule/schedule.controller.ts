import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { AutoScheduleDto } from './dto/auto-schedule.dto';

@Controller('events/:eventId/schedule')
export class ScheduleController {

  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('auto')
  autoSchedule(
    @Param('eventId') eventId: string,
    @Body() dto: AutoScheduleDto
  ) {
    return this.scheduleService.autoSchedule(eventId, dto);
  }

  @Get()
  getFullSchedule(
    @Param('eventId') eventId: string
  ) {
    return this.scheduleService.getSchedule(eventId)
  }

  @Get('day/:date')
  getScheduleByDay(
    @Param('eventId') eventId: string,
    @Param('date') date: string
  ) {
    return this.scheduleService.getScheduleByDay(eventId, date)
  }
}