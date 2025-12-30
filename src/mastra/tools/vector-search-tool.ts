import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { embed } from 'ai';
import { fastembed } from '@mastra/fastembed';
import { LibSQLVector } from '@mastra/libsql';
import { join } from 'path';

// Database configuration - use process.cwd() for reliable path resolution in Next.js
const dbPath = join(process.cwd(), 'data', 'rag_vectors.db');
const INDEX_NAME = 'documents';

// Initialize vector store
export const vectorStore = new LibSQLVector({
  id: 'rag-vector-store',
  connectionUrl: `file:${dbPath}`,
});

interface SearchResult {
  score: number;
  text: string;
  filename: string;
  title: string;
  section: string;
  chunkIndex: number;
}

async function queryDocuments(query: string, topK: number = 5): Promise<SearchResult[]> {
  const { embedding } = await embed({
    model: fastembed.smallV2,
    value: query,
  });

  const results = await vectorStore.query({
    indexName: INDEX_NAME,
    queryVector: embedding,
    topK,
    includeVector: false,
  });

  return results.map((result) => ({
    score: result.score,
    text: String(result.metadata?.text || ''),
    filename: String(result.metadata?.filename || ''),
    title: String(result.metadata?.title || ''),
    section: String(result.metadata?.section || ''),
    chunkIndex: Number(result.metadata?.chunkIndex ?? 0),
  }));
}

function buildRagContext(results: SearchResult[], maxLength: number = 4000): string {
  let context = '';
  let count = 0;

  for (const result of results) {
    const source = result.title
      ? `[${result.filename}: ${result.title}]`
      : `[${result.filename}]`;
    const section = result.section ? ` (${result.section})` : '';
    const entry = `---\nSource: ${source}${section}\nScore: ${result.score.toFixed(4)}\n\n${result.text}\n`;

    if (context.length + entry.length > maxLength) {
      break;
    }

    context += entry;
    count++;
  }

  return count > 0 ? context : 'No relevant documents found.';
}

export const vectorSearchTool = createTool({
  id: 'vector-search',
  description: 'Search the knowledge base to find relevant information for answering user questions. Use this tool when you need to retrieve context from stored documents.',
  inputSchema: z.object({
    query: z.string().describe('The search query to find relevant documents'),
    topK: z.number().min(1).max(10).default(5).describe('Number of top results to return (1-10)'),
  }),
  outputSchema: z.object({
    context: z.string().describe('Formatted context from search results with source attribution'),
    resultCount: z.number().describe('Number of results found'),
    sources: z.array(z.object({
      filename: z.string(),
      title: z.string(),
      section: z.string(),
      score: z.number(),
    })).describe('List of sources found'),
  }),
  execute: async ({ query, topK = 5 }) => {
    const results = await queryDocuments(query, topK);
    const context = buildRagContext(results);

    const sources = results.map((r) => ({
      filename: r.filename,
      title: r.title,
      section: r.section,
      score: r.score,
    }));

    return {
      context,
      resultCount: results.length,
      sources,
    };
  },
});
