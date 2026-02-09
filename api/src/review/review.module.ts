import { Module } from "@nestjs/common";
import { ReviewsService } from "./review.service";

@Module({
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
