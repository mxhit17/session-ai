// src/events/cfp.controller.ts
import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CfpService } from './cfp.service';
import { UpdateCfpDto } from './dto/update-cfp.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles
    
 } from 'src/auth/roles.decorator';
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CfpController {
  constructor(private readonly cfpService: CfpService) {}

  @Patch(':id/cfp')
  @Roles('ORGANIZER')
  async updateCfp(
    @Param('id') id: string,
    @Body() dto: UpdateCfpDto,
    @CurrentUser() user: any,
  ) {
    return this.cfpService.updateCfp(id, dto, user.sub);
  }
}