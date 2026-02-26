import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CreateTrackDto } from "./dto/create-track.dto";

@Injectable()
export class TrackService {
  constructor(private prisma: PrismaService) {}

  async create(eventId: string, dto: CreateTrackDto, userId: string) {
    // 1️⃣ Check event exists
    const event = await this.prisma.events.findUnique({
      where: { id: eventId },
    });

    

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // 2️⃣ Check organizer ownership
    if (event.created_by !== userId) {
      console.log('Event created_by:', event.created_by);
      console.log('Request userId:', userId);
      throw new ForbiddenException('You are not the organizer of this event');
    }

    // 3️⃣ Create track
    try {
      return await this.prisma.tracks.create({
        data: {
          event_id: eventId,
          name: dto.name,
          description: dto.description,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Track with this name already exists for this event',
        );
      }
      throw error;
    }
  }

  async findByEvent(eventId: string) {
    return this.prisma.tracks.findMany({
      where: { event_id: eventId },
      orderBy: { name: 'asc' },
    });
  }

  async update(trackId: string, dto: CreateTrackDto, userId: string) {
    const track = await this.prisma.tracks.findUnique({
      where: { id: trackId },
      include: {
        events: {
          select: {
            created_by: true,
          },
        },
      },
    });

    if (!track || !track.events) {
      throw new NotFoundException('Track not found');
    }

    if (track.events.created_by !== userId) {
      throw new ForbiddenException('Not allowed');
    }

    return this.prisma.tracks.update({
      where: { id: trackId },
      data: dto,
    });
  }

  async delete(trackId: string, userId: string) {
    const track = await this.prisma.tracks.findFirst({
      where: {
        id: trackId,
        events: {
          created_by: userId,
        },
      },
    });

    if (!track) {
      throw new ForbiddenException('Not allowed or track not found');
    }

    return this.prisma.tracks.delete({
      where: { id: trackId },
    });
  }
}