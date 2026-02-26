import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/roles.decorator";
import { TrackService } from "./track.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { CreateTrackDto } from "./dto/create-track.dto";

@Controller('events/:eventId/tracks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZER')
export class TrackController {
  constructor(private trackService: TrackService) {}

  @Post()
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateTrackDto,
    @Req() req,
  ) {
    return this.trackService.create(eventId, dto, req.user.sub);
  }

  @Get()
  findAll(@Param('eventId') eventId: string) {
    return this.trackService.findByEvent(eventId);
  }
}

@Controller('tracks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZER')
export class TrackManagementController {
  constructor(private trackService: TrackService) {}

  @Put(':trackId')
  update(
    @Param('trackId') trackId: string,
    @Body() dto: CreateTrackDto,
    @Req() req,
  ) {
    return this.trackService.update(trackId, dto, req.user.sub);
  }

  @Delete(':trackId')
  delete(@Param('trackId') trackId: string, @Req() req) {
    return this.trackService.delete(trackId, req.user.sub);
  }
}