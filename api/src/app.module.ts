import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { JwtAuthModule } from './auth/jwt.module';
import { EventsModule } from './events/events.module';
import { SessionsModule } from './sessions/sessions.module';


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
  ],
})
export class AppModule {}
