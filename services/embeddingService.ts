import { EmbeddingRequest, EmbeddingResponse } from '../types';

// Embedding model configurations
const EMBEDDING_MODELS = {
  'text-embedding-3-small': {
    name: 'OpenAI text-embedding-3-small',
    dimension: 1536,
    maxTokens: 8192,
  },
  'text-embedding-3-large': {
    name: 'OpenAI text-embedding-3-large',
    dimension: 3072,
    maxTokens: 8192,
  },
  'text-embedding-ada-002': {
    name: 'OpenAI text-embedding-ada-002',
    dimension: 1536,
    maxTokens: 8191,
  },
};

export type EmbeddingModelType = keyof typeof EMBEDDING_MODELS;

/**
 * Get embedding model configuration
 */
export function getEmbeddingModelConfig(model: EmbeddingModelType) {
  return EMBEDDING_MODELS[model] || EMBEDDING_MODELS['text-embedding-3-small'];
}

/**
 * Get list of available embedding models
 */
export function getAvailableEmbeddingModels() {
  return Object.entries(EMBEDDING_MODELS).map(([key, config]) => ({
    id: key,
    name: config.name,
    dimension: config.dimension,
    maxTokens: config.maxTokens,
  }));
}

/**
 * Generate embeddings for text(s) using OpenAI API
 */
export async function generateEmbeddings(
  request: EmbeddingRequest
): Promise<EmbeddingResponse> {
  const { texts, model = 'text-embedding-3-small' } = request;

  if (!texts || texts.length === 0) {
    throw new Error('No texts provided for embedding');
  }

  // Check if API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: Generate mock embeddings for development
    console.warn('OPENAI_API_KEY not found, using mock embeddings');
    return generateMockEmbeddings(texts, model);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: model,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Embedding API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      embeddings: data.data.map((item: any) => item.embedding),
      model: data.model,
      usage: {
        prompt_tokens: data.usage.prompt_tokens,
        total_tokens: data.usage.total_tokens,
      },
    };
  } catch (error) {
    console.error('Error generating embeddings:', error);
    // Fallback to mock embeddings on error
    return generateMockEmbeddings(texts, model);
  }
}

/**
 * Generate a single embedding for text
 */
export async function generateEmbedding(
  text: string,
  model?: string
): Promise<number[]> {
  const response = await generateEmbeddings({
    texts: [text],
    model,
  });
  return response.embeddings[0];
}

/**
 * Generate mock embeddings for development/testing
 * Creates deterministic pseudo-random vectors based on text content
 */
function generateMockEmbeddings(
  texts: string[],
  model: string
): EmbeddingResponse {
  const config = getEmbeddingModelConfig(model as EmbeddingModelType);
  const dimension = config.dimension;

  const embeddings = texts.map((text) => {
    // Create a deterministic pseudo-random vector based on text
    const vector: number[] = [];
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed += text.charCodeAt(i);
    }

    for (let i = 0; i < dimension; i++) {
      // Simple pseudo-random number generator
      seed = (seed * 9301 + 49297) % 233280;
      const value = (seed / 233280) * 2 - 1; // Normalize to [-1, 1]
      vector.push(value);
    }

    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map((val) => val / magnitude);
  });

  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 4);

  return {
    embeddings,
    model,
    usage: {
      prompt_tokens: estimatedTokens,
      total_tokens: estimatedTokens,
    },
  };
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Preprocess text for embedding
 * - Removes extra whitespace
 * - Truncates if too long
 */
export function preprocessText(text: string, maxLength: number = 8000): string {
  // Remove extra whitespace
  let processed = text.replace(/\s+/g, ' ').trim();

  // Truncate if too long (rough approximation for token limit)
  if (processed.length > maxLength) {
    processed = processed.substring(0, maxLength);
  }

  return processed;
}

// Simple in-memory cache for embeddings
const embeddingCache = new Map<string, number[]>();

/**
 * Generate embedding with caching
 */
export async function generateEmbeddingWithCache(
  text: string,
  model?: string
): Promise<number[]> {
  const cacheKey = `${model || 'default'}:${text}`;

  // Check cache
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  // Generate embedding
  const embedding = await generateEmbedding(text, model);

  // Cache result (limit cache size to prevent memory issues)
  if (embeddingCache.size < 1000) {
    embeddingCache.set(cacheKey, embedding);
  }

  return embedding;
}

/**
 * Clear embedding cache
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

/**
 * Get cache stats
 */
export function getEmbeddingCacheStats(): { size: number; maxSize: number } {
  return {
    size: embeddingCache.size,
    maxSize: 1000,
  };
}
