import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { embeddings } from '@/lib/db/schema/embeddings';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { openai } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { userQueryEmbedded } = await request.json();

    if (!userQueryEmbedded || !Array.isArray(userQueryEmbedded)) {
      return NextResponse.json({ error: 'Invalid userQueryEmbedded' }, { status: 400 });
    }

    const similarity = sql<number>`1 - (${cosineDistance(
      embeddings.embedding,
      userQueryEmbedded,
    )})`;

    const similarGuides = await db
      .select({ name: embeddings.content, similarity })
      .from(embeddings)
      .where(gt(similarity, 0.5))
      .orderBy(t => desc(t.similarity))
      .limit(4);

    return NextResponse.json(similarGuides);
  } catch (error) {
    console.error('Error in /api/search:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}