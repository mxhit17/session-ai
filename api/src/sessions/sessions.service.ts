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

  // Mock embedding generator (AI plug point)
  private async generateEmbedding(text: string): Promise<number[]> {
    // Call OpenAI / Gemini here
    // Later: call OpenAI / Gemini / local model here
    // For now: return dummy 1536-dim vector
    // const response = await this.openai.embeddings.create({
    //   model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    //   input: text,
    // });
    // return response.data[0].embedding;
    // const model = this.genAI.getGenerativeModel({
    //   model: process.env.EMBEDDING_MODEL || 'models/text-embedding-004',
    // });
    // const result = await model.embedContent(text);
    // return result.embedding.values;

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
    // return Array(1536).fill(0.001);
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

    // 2️⃣ Ensure user is SPEAKER
    if (!user.roles?.includes('SPEAKER')) {
      throw new ForbiddenException('Only speakers can submit sessions');
    }

    // 3️⃣ Get speaker profile
    // const speakerProfile = await this.prisma.speaker_profiles.findUnique({
    //   where: { user_id: user.sub },
    // });

    // if (!speakerProfile) {
    //   throw new BadRequestException('Speaker profile not found');
    // }

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

    return session;
  }

  // async createSession(dto: CreateSessionDto, user: any) {
  //   // 1. Validate event exists
  //   const event = await this.prisma.events.findFirst({
  //     where: {
  //       id: dto.event_id,
  //       deleted_at: null,
  //     },
  //   });

  //   if (!event) {
  //     throw new BadRequestException('Event does not exist');
  //   }

  //   // 2. Only SPEAKER can submit
  //   if (!user.roles?.includes('SPEAKER')) {
  //           console.log('REQ.USER:', user);
  //     throw new ForbiddenException('Only speakers can submit sessions');
  //   }

  //   // 3. Generate embedding
  //   const embedding = await this.generateEmbedding(
  //     `${dto.title} ${dto.abstract}`,
  //   );

  //   // 4. Create session
  //   const session = await this.prisma.sessions.create({
  //       data: {
  //           event_id: dto.event_id,
  //           track_id: dto.track_id,
  //           title: dto.title,
  //           abstract: dto.abstract,
  //           level: dto.level,
  //           status: 'SUBMITTED',
  //       },
  //   });

  //   // Convert embedding to pgvector format: '[0.1,0.2,0.3]'
  //   const vectorString = `[${embedding.join(',')}]`;

  //   await this.prisma.$executeRawUnsafe(`
  //   UPDATE sessions
  //   SET embedding = '${vectorString}'::vector
  //   WHERE id = '${session.id}'
  //   `);

  //   // 2️⃣ Prepare session text for AI
  //   const sessionText = `
  //   Event Title: ${event.title}
  //   Event Description: ${event.description}

  //   Session Title: ${session.title}
  //   Session Abstract: ${session.abstract}
  //   `;


  //   // 3️⃣ Call AI reviewer
  //   setImmediate(async () => {
  //     const aiReview = await this.aiService.reviewSession(sessionText);
  //     if (aiReview) {
  //       await this.reviewsService.createAIReview(session.id, aiReview);
  //     }
  //   });


  //   return {
  //     id: session.id,
  //     event_id: session.event_id,
  //     track_id: session.track_id,
  //     title: session.title,
  //     abstract: session.abstract,
  //     level: session.level,
  //     status: session.status,
  //     created_at: session.created_at,
  //   };
  // }

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
}
