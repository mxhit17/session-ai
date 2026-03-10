import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewerService } from './reviewer.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { SubmitReviewDto } from './dto/reviewer.dto';

@Controller('reviewer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.REVIEWER)
export class ReviewerController {
  constructor(private readonly reviewerService: ReviewerService) {}

  // 1️⃣ Get assigned sessions
  @Get('sessions')
  getAssignedSessions(
    @Req() req,
    @Query('eventId') eventId?: string,
    @Query('status') status?: string,
  ) {
    return this.reviewerService.getAssignedSessions(
      req.user.sub,
      eventId,
      status,
    );
  }

  @Get('sessions/reviewed')
  getReviewedSessions(
    @Req() req,
    @Query('eventId') eventId?: string,
  ) {
    return this.reviewerService.getReviewedSessions(
      req.user.id,
      eventId,
    );
  }

  // 2️⃣ Get session detail
  @Get('sessions/:sessionId')
  getSessionDetail(@Req() req, @Param('sessionId') sessionId: string) {
    return this.reviewerService.getSessionDetail(req.user.id, sessionId);
  }

  // 3️⃣ Submit review
  @Post('sessions/:sessionId/review')
  submitReview(
    @Req() req,
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitReviewDto,
  ) {
    return this.reviewerService.submitReview(
      req.user.sub,
      sessionId,
      dto,
    );
  }

  // 4️⃣ Get my review
  @Get('sessions/:sessionId/my-review')
  getMyReview(@Req() req, @Param('sessionId') sessionId: string) {
    return this.reviewerService.getMyReview(req.user.sub, sessionId);
  }

  // 5️⃣ Dashboard stats
  @Get('dashboard/stats')
  getDashboardStats(@Req() req) {
    return this.reviewerService.getDashboardStats(req.user.sub);
  }

  // 6️⃣ Final score (organizer usage ideally protected separately)
  @Get('sessions/:sessionId/final-score')
  getFinalScore(@Param('sessionId') sessionId: string) {
    return this.reviewerService.getFinalScore(sessionId);
  }
}