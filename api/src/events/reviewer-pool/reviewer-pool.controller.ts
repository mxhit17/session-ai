import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AddReviewerDto } from './dto/add-reviewer.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ReviewerPoolService } from './reviewer-pool.service';


@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/reviewers')
export class ReviewerPoolController {
  constructor(private readonly reviewerPoolService: ReviewerPoolService) {}

  @Post()
  addReviewer(
    @Param('eventId') eventId: string,
    @Body() dto: AddReviewerDto,
    @Req() req,
  ) {
    return this.reviewerPoolService.addReviewer(
      eventId,
      dto.reviewer_id,
      req.user,
    );
  }

  @Get()
  getReviewers(@Param('eventId') eventId: string, @Req() req) {
    return this.reviewerPoolService.getReviewers(eventId, req.user);
  }

  @Delete(':reviewerId')
  removeReviewer(
    @Param('eventId') eventId: string,
    @Param('reviewerId') reviewerId: string,
    @Req() req,
  ) {
    return this.reviewerPoolService.removeReviewer(
      eventId,
      reviewerId,
      req.user,
    );
  }
}