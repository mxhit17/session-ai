import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoomDto) {
    try {
      return await this.prisma.rooms.create({
        data: {
          event_id: dto.eventId,
          name: dto.name,
          capacity: dto.capacity,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Room with this name already exists for this event',
        );
      }
      throw error;
    }
  }

  async findAllByEvent(eventId: string) {
    return this.prisma.rooms.findMany({
      where: { event_id: eventId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.rooms.findUnique({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async update(id: string, dto: UpdateRoomDto) {
    await this.findOne(id);

    return this.prisma.rooms.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.rooms.delete({
      where: { id },
    });
  }
}