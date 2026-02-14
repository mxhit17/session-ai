import { Module } from '@nestjs/common';
import { SpeakerController } from './speaker.controller';
import { SpeakerService } from './speaker.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Module({
  controllers: [SpeakerController],
  providers: [SpeakerService, PrismaService],
})
export class SpeakerModule {}
