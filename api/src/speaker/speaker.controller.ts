import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { SpeakerService } from './speaker.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateSpeakerProfileDto } from './dto/update-speaker-profile.dto';

@Controller('speaker')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Get('profile')
  getMyProfile(@CurrentUser() user: any) {
    return this.speakerService.getOrCreateProfile(user.sub);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateSpeakerProfileDto,
  ) {
    return this.speakerService.updateProfile(user.sub, updateDto);
  }

}
