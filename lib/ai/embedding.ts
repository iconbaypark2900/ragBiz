import { openai } from '../openai';
import { db } from '../db';
import { embeddings } from '../db/schema/embeddings';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .filter(i => i !== '');
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const embeddings = await Promise.all(chunks.map(chunk => generateEmbedding(chunk)));
  return chunks.map((content, i) => ({ content, embedding: embeddings[i] }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: input,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

export const findRelevantContent = async (userQuery: string) => {
  console.log('Searching for relevant content for query:', userQuery);
  const userQueryEmbedded = await generateEmbedding(userQuery);

  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded,
  )})`;

  const similarGuides = await db
    .select({ content: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, 0.3)) // Lower threshold from 0.5 to 0.3
    .orderBy(t => desc(t.similarity))
    .limit(4);

  console.log('Found similar guides:', JSON.stringify(similarGuides, null, 2));
  return similarGuides;
};