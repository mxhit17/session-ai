import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { JwtAuthModule } from './auth/jwt.module';
import { EventsModule } from './events/events.module';
import { SessionsModule } from './sessions/sessions.module';
import { SpeakerModule } from './speaker/speaker.module';
import { TrackModule } from './tracks/track.module';
import { RoomsModule } from './rooms/rooms.module';
import { ReviewerModule } from './reviewer/reviewer.module';
import { ScheduleModule } from './schedule/schedule.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    JwtAuthModule,
    EventsModule,
    SessionsModule,
    SpeakerModule,
    TrackModule,
    RoomsModule,
    ReviewerModule,
    ScheduleModule
  ],
})
export class AppModule {}
