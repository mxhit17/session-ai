import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubmitReviewDto } from './dto/reviewer.dto';

@Injectable()
export class ReviewerService {
  constructor(private prisma: PrismaService) {}

  // 1️⃣ Get Assigned Sessions
  // 1️⃣ Get Assigned Sessions (PENDING REVIEWS ONLY)
  async getAssignedSessions(userId: string, eventId?: string, status?: string) {
    return this.prisma.session_review_assignments.findMany({
      where: {
        reviewer_id: userId,

        // ❗ Exclude sessions already reviewed by this reviewer
        sessions: {
          deleted_at: null,

          ...(eventId && { event_id: eventId }),
          ...(status && { status }),

          reviews: {
            none: {
              reviewer_id: userId,
              is_ai_generated: false,
            },
          },
        },
      },

      include: {
        sessions: {
          include: {
            events: true,
            tracks: true,
            reviews: {
              where: { is_ai_generated: true },
            },
          },
        },
      },

      orderBy: { assigned_at: 'desc' },
    });
  }

  // 7️⃣ Get Reviewed Sessions
  async getReviewedSessions(userId: string, eventId?: string) {
    return this.prisma.session_review_assignments.findMany({
      where: {
        reviewer_id: userId,

        sessions: {
          deleted_at: null,
          ...(eventId && { event_id: eventId }),

          // ✅ Only sessions already reviewed by this reviewer
          reviews: {
            some: {
              reviewer_id: userId,
              is_ai_generated: false,
            },
          },
        },
      },

      include: {
        sessions: {
          include: {
            events: true,
            tracks: true,
            reviews: {
              where: {
                reviewer_id: userId,
                is_ai_generated: false,
              },
            },
          },
        },
      },

      orderBy: { assigned_at: 'desc' },
    });
  }

  // 2️⃣ Get Session Detail
  async getSessionDetail(userId: string, sessionId: string) {
    const assignment =
        await this.prisma.session_review_assignments.findFirst({
    where: {
        session_id: sessionId,
        reviewer_id: userId,
    },
    });

    if (!assignment) {
      throw new ForbiddenException('Not assigned to this session');
    }

    const session = await this.prisma.sessions.findUnique({
      where: { id: sessionId },
      include: {
        tracks: true,
        events: true,
        reviews: true,
        session_speakers: {
          include: {
            speaker_profiles: {
              include: {
                users: true,
              },
            },
          },
        },
      },
    });

    if (!session) throw new NotFoundException('Session not found');

    return session;
  }

  // 3️⃣ Submit Review
  async submitReview(
    userId: string,
    sessionId: string,
    dto: SubmitReviewDto,
  ) {
    const session = await this.prisma.sessions.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');

    if (session.status !== 'UNDER_REVIEW') {
      throw new BadRequestException(
        'Reviews can only be submitted for sessions under review',
      );
    }

    const assignment =
      await this.prisma.session_review_assignments.findUnique({
        where: {
          session_id_reviewer_id: {
            session_id: sessionId,
            reviewer_id: userId,
          },
        },
      });

    if (!assignment)
      throw new ForbiddenException('Not assigned to this session');

    const existing = await this.prisma.reviews.findFirst({
      where: {
        session_id: sessionId,
        reviewer_id: userId,
        is_ai_generated: false,
      },
    });

    if (existing) {
      throw new BadRequestException('You have already reviewed this session');
    }

    return this.prisma.reviews.create({
      data: {
        session_id: sessionId,
        reviewer_id: userId,
        score: dto.score,
        comment: dto.comment,
        is_ai_generated: false,
      },
    });
  }

  // 4️⃣ Get My Review
  async getMyReview(userId: string, sessionId: string) {
    return this.prisma.reviews.findFirst({
      where: {
        session_id: sessionId,
        reviewer_id: userId,
        is_ai_generated: false,
      },
    });
  }

  // 5️⃣ Dashboard Stats
  async getDashboardStats(userId: string) {
    const totalAssigned =
      await this.prisma.session_review_assignments.count({
        where: { reviewer_id: userId },
      });

    const completed = await this.prisma.reviews.count({
      where: {
        reviewer_id: userId,
        is_ai_generated: false,
      },
    });

    return {
      totalAssigned,
      completed,
      pending: totalAssigned - completed,
    };
  }

  // 6️⃣ Final Score (Organizer Use)
  async getFinalScore(sessionId: string) {
    const reviews = await this.prisma.reviews.findMany({
        where: {
        session_id: sessionId,
        score: { not: null },
        is_ai_generated: false,
        },
    });

    if (!reviews.length) {
        return { finalScore: null };
    }

    const total = reviews.reduce(
        (sum, r) => sum + (r.score ?? 0),
        0,
    );

    return {
        finalScore: total / reviews.length,
    };
    }
}

// once a session is reviewed by the reviewer it was assigned to. So when the reviewer hits the get asigned sessions api do not include the reviewed session in it but create a seprate api which returns the assigned and reviewed Sessions.