import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AutoScheduleDto } from './dto/auto-schedule.dto';

@Injectable()
export class ScheduleService {

  constructor(private prisma: PrismaService) {}

  async autoSchedule(eventId: string, dto: AutoScheduleDto) {

    const acceptedSessions = await this.prisma.sessions.findMany({
        where: {
            event_id: eventId,
            status: 'ACCEPTED',
        },
        orderBy: {
            created_at: 'asc',
        },
    });

    if (acceptedSessions.length === 0) {
      return { message: 'No accepted sessions to schedule' };
    }

    const rooms = await this.prisma.rooms.findMany({
      where: { event_id : eventId,},
    });

    if (rooms.length === 0) {
      throw new Error('No rooms found for this event');
    }

    const startDate = new Date(dto.startDate);

    const [startHour, startMinute] = dto.dayStartTime.split(':').map(Number);
    const [endHour, endMinute] = dto.dayEndTime.split(':').map(Number);

    const slotsPerDay =
      (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60;

    const schedule: {
        sessionId: string;
        room: string;
        start: Date;
        end: Date;
        }[] = [];

    let sessionIndex = 0;
    let currentDate = new Date(startDate);

    while (sessionIndex < acceptedSessions.length) {

      for (let slot = 0; slot < slotsPerDay; slot++) {

        for (const room of rooms) {

          if (sessionIndex >= acceptedSessions.length) break;

          const slotStart = new Date(currentDate);
          slotStart.setHours(startHour + slot, startMinute, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setHours(slotStart.getHours() + 1);

          const timeSlot = await this.prisma.time_slots.create({
            data: {
                event_id: eventId,
                start_time: slotStart,
                end_time: slotEnd,
            },
          }); 

          await this.prisma.scheduled_sessions.create({
            data: {
                session_id: acceptedSessions[sessionIndex].id,
                room_id: room.id,
                time_slot_id: timeSlot.id,
            },
            });

          schedule.push({
            sessionId: acceptedSessions[sessionIndex].id,
            room: room.name,
            start: slotStart,
            end: slotEnd,
          });

          sessionIndex++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      message: 'Schedule generated successfully',
      totalSessions: acceptedSessions.length,
      scheduled: schedule,
    };
  }

  async getSchedule(eventId: string) {

    const schedule = await this.prisma.scheduled_sessions.findMany({
      where: {
        sessions: {
          event_id : eventId
        }
      },
      include: {
        sessions: {
          select: {
            id: true,
            title: true
          }
        },
        rooms: {
          select: {
            id: true,
            name: true
          }
        },
        time_slots: true
      },
      orderBy: {
        time_slots: {
          start_time: 'asc'
        }
      }
    })

    return schedule.map(s => ({
      sessionId: s.sessions.id,
      title: s.sessions.title,
      roomId: s.room_id,
      roomName: s.rooms?.name,
      startTime: s.time_slots?.start_time,
      endTime: s.time_slots?.end_time
    }))
  }

  async getScheduleByDay(eventId: string, date: string) {

    const start = new Date(date)
    start.setHours(0,0,0,0)

    const end = new Date(date)
    end.setHours(23,59,59,999)

    const schedule = await this.prisma.scheduled_sessions.findMany({
      where: {
        sessions: {
          event_id : eventId
        },
        time_slots: {
          start_time: {
            gte: start,
            lte: end
          }
        }
      },
      include: {
        sessions: {
          select: {
            id: true,
            title: true
          }
        },
        rooms: {
          select: {
            id: true,
            name: true
          }
        },
        time_slots: true
      },
      orderBy: {
        time_slots: {
          start_time: 'asc'
        }
      }
    })

    return schedule.map(s => ({
      sessionId: s.sessions.id,
      title: s.sessions.title,
      roomId: s.room_id,
      roomName: s.rooms?.name,
      startTime: s.time_slots?.start_time,
      endTime: s.time_slots?.end_time
    }))
  }
}