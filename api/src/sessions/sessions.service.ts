import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { InferenceClient } from '@huggingface/inference';
import 'dotenv/config';
import { AiService } from 'src/ai/ai.service';
import { ReviewsService } from 'src/review/review.service';

const hf = new InferenceClient(process.env.HF_TOKEN!);

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService,
    private aiService: AiService,
    private reviewsService: ReviewsService,) {}

  private async autoAssignReviewers(
    sessionId: string,
    eventId: string,
  ) {
    // 1️⃣ Get event config
    const event = await this.prisma.events.findUnique({
      where: { id: eventId },
      select: { reviewers_per_session: true },
    });

    const required = event?.reviewers_per_session ?? 1;

    // 2️⃣ Get reviewer pool
    const pool = await this.prisma.event_reviewers.findMany({
      where: { event_id: eventId },
      select: { reviewer_id: true },
    });

    if (!pool.length) {
      console.warn('No reviewers configured for this event');
      return;
    }

    if (pool.length < required) {
      throw new BadRequestException(
        'Not enough reviewers configured for this event',
      );
    }

    const reviewerIds = pool.map(r => r.reviewer_id);

    // 3️⃣ Calculate assignment load
    const assignmentCounts =
      await this.prisma.session_review_assignments.groupBy({
        by: ['reviewer_id'],
        where: {
          reviewer_id: { in: reviewerIds },
        },
        _count: {
          reviewer_id: true,
        },
      });

    // 4️⃣ Create load map
    const loadMap = new Map<string, number>();

    reviewerIds.forEach(id => loadMap.set(id, 0));

    assignmentCounts.forEach(item => {
      loadMap.set(item.reviewer_id, item._count.reviewer_id);
    });

    // 5️⃣ Sort by least load
    const sortedReviewers = [...loadMap.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);

    const selected = sortedReviewers.slice(0, required);

    if (!selected.length) {
      console.warn('No reviewers selected');
      return;
    }

    // 6️⃣ Create assignments (prevent duplicates)
    await this.prisma.session_review_assignments.createMany({
      data: selected.map(id => ({
        session_id: sessionId,
        reviewer_id: id,
      })),
      skipDuplicates: true,
    });

    // 7️⃣ Update session status
    await this.prisma.sessions.update({
      where: { id: sessionId },
      data: { status: 'UNDER_REVIEW' },
    });

    console.log(
      `Auto-assigned reviewers to session ${sessionId}`,
    );
  }

  // Mock embedding generator (AI plug point)
  private async generateEmbedding(text: string): Promise<number[]> {
    // Call OpenAI / Gemini here

    console.log("HF_TOKEN:", process.env.HF_TOKEN?.slice(0, 6));
    console.log(process.env.HF_TOKEN);
    const result = await hf.featureExtraction({
      model: "intfloat/e5-small-v2",
      // inputs: "That is a happy person",
      inputs: text,
    });

    const vector = result as number[];

    console.log(result);
    return vector;
  }

  async createSession(dto: CreateSessionDto, user: any) {

    // 1️⃣ Validate event
    const event = await this.prisma.events.findFirst({
      where: {
        id: dto.event_id,
        deleted_at: null,
      },
    });

    
    if (!event) {
      throw new BadRequestException('Event does not exist');
    }

    // Validate CFP window
    if (!event.cfp_open) {
      throw new ForbiddenException('CFP is not open for this event');
    }

    if (!event.cfp_start || !event.cfp_end) {
      throw new BadRequestException('CFP window is not configured properly');
    }

    const now = new Date();

    if (now < event.cfp_start || now > event.cfp_end) {
      throw new ForbiddenException('CFP submission window is closed');
    }

    // 2️⃣ Ensure user is SPEAKER
    if (!user.roles?.includes('SPEAKER')) {
      throw new ForbiddenException('Only speakers can submit sessions');
    }

    let speakerProfile = await this.prisma.speaker_profiles.findUnique({
      where: { user_id: user.sub },
    });

    if (!speakerProfile) {
      speakerProfile = await this.prisma.speaker_profiles.create({
        data: {
          user_id: user.sub,
          bio: '',
          organization: '',
          experience_level: 'Beginner',
        },
      });
    }

    // 4️⃣ Generate embedding
    const embedding = await this.generateEmbedding(
      `${dto.title} ${dto.abstract}`,
    );

    const vectorString = `[${embedding.join(',')}]`;

    // 5️⃣ TRANSACTION
    const session = await this.prisma.$transaction(async (tx) => {

      // Create session
      const createdSession = await tx.sessions.create({
        data: {
          event_id: dto.event_id,
          track_id: dto.track_id,
          title: dto.title,
          abstract: dto.abstract,
          level: dto.level,
          status: 'SUBMITTED',
        },
      });

      // Insert into session_speakers
      await tx.session_speakers.create({
        data: {
          session_id: createdSession.id,
          speaker_id: speakerProfile.id,
        },
      });

      // Update embedding
      await tx.$executeRawUnsafe(`
        UPDATE sessions
        SET embedding = '${vectorString}'::vector
        WHERE id = '${createdSession.id}'
      `);

      return createdSession;
    });

    // 🔹 AI async review (non-blocking)
    const sessionText = `
      Event Title: ${event.title}
      Event Description: ${event.description}
      Session Title: ${session.title}
      Session Abstract: ${session.abstract}
    `;

    setImmediate(async () => {
      const aiReview = await this.aiService.reviewSession(sessionText);
      if (aiReview) {
        await this.reviewsService.createAIReview(session.id, aiReview);
      }
    });

    // Assign Reviewers
    if (session.event_id == null) {
      throw new BadRequestException('Event id is null in session.');
    } else {
      // 🔹 Auto assign reviewers (after session creation)
      await this.autoAssignReviewers(session.id, session.event_id!);
    }
    return session;
  }

  async findSimilarSessions(sessionId: string, limit = 5) {
    const safeLimit = Math.min(Math.max(limit, 1), 20); // clamp 1–20

    const results = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT
        id,
        title,
        abstract,
        level,
        status,
        embedding <-> (
            SELECT embedding FROM sessions WHERE id = '${sessionId}'
        ) AS distance
        FROM sessions
        WHERE id != '${sessionId}'
        AND deleted_at IS NULL
        AND embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT ${safeLimit};
    `);

    if (!results.length) {
        throw new BadRequestException(
        'Session not found or no similar sessions available',
        );
    }

    return results.map((row) => ({
        id: row.id,
        title: row.title,
        abstract: row.abstract,
        level: row.level,
        status: row.status,
        similarity_score: Number(row.distance.toFixed(4)),
    }));
  }

  async updateSessionStatus(id: string, status: string) {
    return this.prisma.sessions.update({
      where: { id },
      data: {
        status,
      },
    });
  }
}
