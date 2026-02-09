import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AiModule } from 'src/ai/ai.module';
import { ReviewsModule } from 'src/review/review.module';

@Module({
  imports: [PrismaModule, AiModule, ReviewsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
