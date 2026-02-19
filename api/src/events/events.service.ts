import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

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

      if (!existingRole) {
        await tx.user_roles.create({
          data: {
            user_id: userId,
            role_id: organizerRole.id,
          },
        });
      }

      return tx.events.create({
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
    });
  }





  // async createEvent(dto: CreateEventDto, userId: string) {
  //   const start = new Date(dto.start_date);
  //   const end = new Date(dto.end_date);

  //   if (end < start) {
  //     throw new BadRequestException('End date must be after start date');
  //   }

  //   const event = await this.prisma.events.create({
  //     data: {
  //       title: dto.title,
  //       description: dto.description,
  //       start_date: start,
  //       end_date: end,
  //       location: dto.location,
  //       timezone: dto.timezone,
  //       created_by: userId,
  //     },
  //   });

  //   return {
  //     id: event.id,
  //     title: event.title,
  //     description: event.description,
  //     start_date: event.start_date,
  //     end_date: event.end_date,
  //     location: event.location,
  //     timezone: event.timezone,
  //     created_by: event.created_by,
  //     created_at: event.created_at,
  //   };
  // }

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

}
