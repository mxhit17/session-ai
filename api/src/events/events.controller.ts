import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ORGANIZER')
  // async createEvent(@Body() dto: CreateEventDto, @Req() req) {
  //   return this.eventsService.createEvent(dto, req.user.sub);
  // }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard) // Remove RolesGuard
  async createEvent(@Body() dto: CreateEventDto, @Req() req) {
    return this.eventsService.createEvent(dto, req.user.sub);
  }

  @Get()
  async listPublicEvents() {
    return this.eventsService.listPublicEvents();
  }

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    return this.eventsService.getEventById(id);
  }
}
