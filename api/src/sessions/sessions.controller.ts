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
  Query,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SPEAKER')
  async createSession(@Body() dto: CreateSessionDto, @Req() req) {
    console.log('REQ.USER:', req.user);
    return this.sessionsService.createSession(dto, req.user);
  }


  @Get('similar/:id')
  async getSimilarSessions(
  @Param('id') id: string,
  @Query('limit') limit?: string,
  ) {
    return this.sessionsService.findSimilarSessions(
      id,
      limit ? parseInt(limit, 10) : 5,
    );
  }
}
