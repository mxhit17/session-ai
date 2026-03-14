export class ScheduledSessionDto {
  sessionId: string
  title: string
  roomId: string
  roomName: string
  startTime: Date
  endTime: Date
}

export class ScheduleResponseDto {
  eventId: string
  schedule: ScheduledSessionDto[]
}