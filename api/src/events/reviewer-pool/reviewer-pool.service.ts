import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ReviewerPoolService {
  constructor(private prisma: PrismaService) {}

  async validateOrganizer(eventId: string, user: any) {
    const event = await this.prisma.events.findFirst({
      where: {
        id: eventId,
        created_by: user.id,
        deleted_at: null,
      },
    });

    if (!event) {
      throw new ForbiddenException('Not allowed to modify this event');
    }

    return event;
  }

  async addReviewer(eventId: string, reviewerId: string, user: any) {
    // 1️⃣ Validate organizer ownership
    await this.validateOrganizer(eventId, user);

    // 2️⃣ Check if user exists
    const reviewer = await this.prisma.users.findUnique({
      where: { id: reviewerId },
    });

    if (!reviewer) {
      throw new BadRequestException('User does not exist');
    }

    // 3️⃣ Get REVIEWER role id
    const reviewerRole = await this.prisma.roles.findFirst({
      where: { name: 'REVIEWER' },
    });

    if (!reviewerRole) {
      throw new BadRequestException('REVIEWER role not configured in system');
    }

    // 4️⃣ Check if user already has REVIEWER role
    const existingUserRole = await this.prisma.user_roles.findFirst({
      where: {
        user_id: reviewerId,
        role_id: reviewerRole.id,
      },
    });

    // 5️⃣ If not, assign REVIEWER role
    if (!existingUserRole) {
      await this.prisma.user_roles.create({
        data: {
          user_id: reviewerId,
          role_id: reviewerRole.id,
        },
      });
    }

    // 6️⃣ Add to event reviewer pool (skip duplicate crash)
    return this.prisma.event_reviewers.create({
      data: {
        event_id: eventId,
        reviewer_id: reviewerId,
      },
    });
  }

  async getReviewers(eventId: string, user: any) {
    await this.validateOrganizer(eventId, user);

    return this.prisma.event_reviewers.findMany({
      where: { event_id: eventId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeReviewer(
    eventId: string,
    reviewerId: string,
    user: any,
  ) {
    await this.validateOrganizer(eventId, user);

    return this.prisma.event_reviewers.delete({
      where: {
        event_id_reviewer_id: {
          event_id: eventId,
          reviewer_id: reviewerId,
        },
      },
    });
  }
}