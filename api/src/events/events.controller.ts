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
  Patch,
  Delete
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard) // Remove RolesGuard
  async createEvent(@Body() dto: CreateEventDto, @Req() req) {
    return this.eventsService.createEvent(dto, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Req() req,
  ) {
    return this.eventsService.updateEvent(id, dto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  async softDeleteEvent(@Param('id') id: string, @Req() req) {
    return this.eventsService.softDeleteEvent(id, req.user.sub);
  }

  @Get()
  async listPublicEvents() {
    return this.eventsService.listPublicEvents();
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  async getMyEvents(@Req() req) {
    return this.eventsService.getEventsByOrganizer(req.user.sub);
  }

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    return this.eventsService.getEventById(id);
  }
}
