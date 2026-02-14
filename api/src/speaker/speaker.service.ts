import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SpeakerService {
  constructor(private prisma: PrismaService) {}

  async getMySessions(userId: string) {
    const speakerProfile = await this.prisma.speaker_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!speakerProfile) {
      throw new ForbiddenException('Speaker profile not found');
    }

    return this.prisma.sessions.findMany({
      where: {
        session_speakers: {
          some: {
            speaker_id: speakerProfile.id,
          },
        },
      },
      include: {
        events: true,   // FIXED
        reviews: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async getSessionDetail(userId: string, sessionId: string) {
    const speakerProfile = await this.prisma.speaker_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!speakerProfile) {
      throw new ForbiddenException('Speaker profile not found');
    }

    const session = await this.prisma.sessions.findUnique({
      where: { id: sessionId },
      include: {
        reviews: true,
        events: true,   // FIXED
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const isSpeaker = await this.prisma.session_speakers.findFirst({
      where: {
        session_id: sessionId,
        speaker_id: speakerProfile.id,
      },
    });

    if (!isSpeaker) {
      throw new ForbiddenException(
        'You do not have access to this session',
      );
    }

    return session;
  }
}
