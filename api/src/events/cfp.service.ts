// src/events/cfp.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateCfpDto } from './dto/update-cfp.dto';

@Injectable()
export class CfpService {
  constructor(private readonly prisma: PrismaService) {}

  async updateCfp(eventId: string, dto: UpdateCfpDto, userId: string) {
    const event = await this.prisma.events.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Ensure only creator can update CFP
    if (event.created_by !== userId) {
      throw new ForbiddenException(
        'You are not allowed to modify this event CFP',
      );
    }

    // Validate CFP window
    if (dto.cfp_start && dto.cfp_end) {
      const start = new Date(dto.cfp_start);
      const end = new Date(dto.cfp_end);

      if (end <= start) {
        throw new BadRequestException(
          'CFP end date must be after start date',
        );
      }
    }

    return this.prisma.events.update({
      where: { id: eventId },
      data: {
        cfp_open: dto.cfp_open,
        cfp_start: dto.cfp_start
          ? new Date(dto.cfp_start)
          : undefined,
        cfp_end: dto.cfp_end
          ? new Date(dto.cfp_end)
          : undefined,
      },
    });
  }
}