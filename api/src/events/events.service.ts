import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtService } from '@nestjs/jwt';
import { UpdateEventDto } from './dto/update-event.dto';
@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  async createEvent(dto: CreateEventDto, userId: string) {
    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);

    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.$transaction(async (tx) => {
      const organizerRole = await tx.roles.findUniqueOrThrow({
        where: { name: 'ORGANIZER' },
      });

      const existingRole = await tx.user_roles.findUnique({
        where: {
          user_id_role_id: {
            user_id: userId,
            role_id: organizerRole.id,
          },
        },
      });

      let newToken: string | null = null;

      if (!existingRole) {
        await tx.user_roles.create({
          data: {
            user_id: userId,
            role_id: organizerRole.id,
          },
        });

        // ✅ Fetch updated roles
        const updatedRoles = await tx.user_roles.findMany({
          where: { user_id: userId },
          include: { roles: true },
        });

        const roleNames = updatedRoles.map((ur) => ur.roles.name);

        // ✅ Fetch user email
        const user = await tx.users.findUniqueOrThrow({
          where: { id: userId },
          select: { email: true },
        });

        // ✅ Sign new token with email included
        newToken = this.jwtService.sign({
          sub: userId,
          email: user.email,
          roles: roleNames,
        });
      }

      const event = await tx.events.create({
        data: {
          title: dto.title,
          description: dto.description,
          start_date: start,
          end_date: end,
          location: dto.location,
          timezone: dto.timezone,
          created_by: userId,
        },
      });

      return {
        event,
        token: newToken,
      };
    });
  }

  async updateEvent(id: string, dto: UpdateEventDto, userId: string) {
    const event = await this.prisma.events.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // 🔐 Ownership check
    if (event.created_by !== userId) {
      throw new ForbiddenException('You can only edit your own events');
    }

    // 📅 Date validation (if provided)
    const start = dto.start_date ? new Date(dto.start_date) : event.start_date;
    const end = dto.end_date ? new Date(dto.end_date) : event.end_date;

    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.events.update({
      where: { id },
      data: {
        ...dto,
        start_date: start,
        end_date: end,
        updated_at: new Date(),
      },
    });
  }

  async softDeleteEvent(id: string, userId: string) {
    const event = await this.prisma.events.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.created_by !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    await this.prisma.events.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });

    return { message: 'Event deleted successfully (soft delete)' };
  }

  async listPublicEvents() {
    const events = await this.prisma.events.findMany({
        where: {
        is_public: true,
        deleted_at: null,
        },
        orderBy: {
        start_date: 'asc',
        },
        select: {
        id: true,
        title: true,
        description: true,
        start_date: true,
        end_date: true,
        location: true,
        timezone: true,
        created_at: true,
        cfp_open: true,
        cfp_start: true,
        cfp_end: true,
        },
    });

    return events;
    }

  async getEventsByOrganizer(userId: string) {
    const events = await this.prisma.events.findMany({
      where: {
        created_by: userId,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        start_date: true,
        end_date: true,
        location: true,
        timezone: true,
        is_public: true,
        created_at: true,
        cfp_open: true,
        cfp_start: true,
        cfp_end: true,
      },
    });

    return events;
  }

  async getEventById(id: string) {
    const event = await this.prisma.events.findFirst({
        where: {
        id,
        is_public: true,
        deleted_at: null,
        },
    });

    if (!event) {
        throw new NotFoundException('Event not found');
    }

    return {
        id: event.id,
        title: event.title,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location,
        timezone: event.timezone,
        created_at: event.created_at,
        created_by: event.created_by,
    };
  }

  async getReviewedSessions(eventId: string) {
    const sessions = await this.prisma.sessions.findMany({
      where: {
        event_id: eventId,
        reviews: {
          some: {},
        },
      },
      include: {
        reviews: true,
      },
    });

    return sessions.map((session) => {
      const total = session.reviews.reduce(
        (sum, r) => sum + (r.score ?? 0),
        0,
      );

      const avg =
        session.reviews.length > 0
          ? total / session.reviews.length
          : 0;

      return {
        sessionId: session.id,
        title: session.title,
        trackId: session.track_id,   // also snake_case
        status: session.status,
        reviewCount: session.reviews.length,
        averageScore: Number(avg.toFixed(2)),
      };
    });
  }
}
