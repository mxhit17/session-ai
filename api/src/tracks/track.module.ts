import { Module } from '@nestjs/common';
import { TrackController, TrackManagementController } from './track.controller';
import { TrackService } from './track.service';

@Module({
  controllers: [TrackController, TrackManagementController],
  providers: [TrackService],
  exports: [TrackService],
})
export class TrackModule {}