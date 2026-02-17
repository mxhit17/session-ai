import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SpeakerService } from './speaker.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('speaker')
@UseGuards(JwtAuthGuard, RolesGuard)  // 👈 IMPORTANT
@Roles('SPEAKER')
export class SpeakerController {
  constructor(private readonly speakerService: SpeakerService) {}

  @Get('sessions')
  getMySessions(@CurrentUser() user: any) {
    return this.speakerService.getMySessions(user.sub);
  }

  @Get('sessions/:id')
  getSessionDetail(
    @Param('id') sessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.speakerService.getSessionDetail(user.id, sessionId);
  }
}
