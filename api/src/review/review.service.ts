import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';


@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

//   async createAIReview(sessionId: string, aiData: any) {
//     return this.prisma.reviews.create({
//       data: {
//         session_id: sessionId,
//         reviewer_id: null, // since AI
//         score: aiData.overall_score,
//         comment: aiData.reasoning,
//         ai_analysis: aiData,
//         is_ai_generated: true,
//       },
//     });
//   }
    async createAIReview(sessionId: string, aiData: any) {
    // 1️⃣ Compute weighted score (0–10 scale)
    const rawScore =
        0.3 * aiData.relevance +
        0.2 * aiData.clarity +
        0.2 * aiData.depth +
        0.3 * aiData.novelty;

    // 2️⃣ Convert to 0–5 scale (DB constraint)
    const normalizedScore = Math.max(
        0,
        Math.min(5, Math.round(rawScore / 2))
    );

    // 3️⃣ Save to database
    return this.prisma.reviews.create({
        data: {
        session_id: sessionId,
        reviewer_id: null,
        score: normalizedScore,
        comment: aiData.reasoning,
        ai_analysis: aiData,
        is_ai_generated: true,
        },
    });
    }

}
