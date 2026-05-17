import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CfpController } from './cfp.controller';
import { CfpService } from './cfp.service';
import { ReviewerPoolController } from './reviewer-pool/reviewer-pool.controller';
import { ReviewerPoolService } from './reviewer-pool/reviewer-pool.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [PrismaModule,MailModule],
  controllers: [EventsController, CfpController, ReviewerPoolController],
  providers: [EventsService, CfpService, ReviewerPoolService],
})
export class EventsModule {}
