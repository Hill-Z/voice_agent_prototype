import {
  RAGConfig,
  RAGSearchRequest,
  RAGSearchResponse,
  QAPair,
  QAPairVectorStatus,
  BotConfiguration,
} from '../types';
import { vectorDBService } from './vectorDBService';
import { generateEmbeddingWithCache } from './embeddingService';

// Default RAG configuration
export const DEFAULT_RAG_CONFIG: RAGConfig = {
  enabled: false,
  embeddingModel: 'text-embedding-3-small',
  vectorDimension: 1536,
  topK: 3,
  similarityThreshold: 0.7,
  searchMode: 'vector',
  contextTemplate: `根据以下检索到的知识回答问题：

{{knowledge}}

如果知识中没有相关信息，请使用你的通用知识回答。`,
  vectorDB: {
    provider: 'qdrant',
    host: 'localhost',
    port: 6333,
    collectionName: 'qa_pairs',
  },
};

// RAG search cache
interface RAGCacheEntry {
  query: string;
  results: RAGSearchResponse;
  timestamp: number;
}

const ragCache = new Map<string, RAGCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

/**
 * Initialize RAG service with configuration
 */
export async function initializeRAG(config: RAGConfig): Promise<boolean> {
  if (!config.enabled) {
    console.log('RAG is disabled');
    return false;
  }

  try {
    const success = await vectorDBService.initialize(config.vectorDB);
    if (success) {
      console.log('RAG service initialized successfully');
    }
    return success;
  } catch (error) {
    console.error('Failed to initialize RAG service:', error);
    return false;
  }
}

/**
 * Search for relevant QA pairs using RAG
 */
export async function searchRAG(
  request: RAGSearchRequest,
  config: RAGConfig
): Promise<RAGSearchResponse> {
  const startTime = Date.now();

  if (!config.enabled) {
    return {
      results: [],
      total: 0,
      latency: 0,
    };
  }

  // Check cache
  const cacheKey = `${request.query}:${request.topK}:${request.threshold}:${request.category}`;
  const cached = ragCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      ...cached.results,
      latency: Date.now() - startTime,
    };
  }

  try {
    // Ensure vector DB is initialized
    if (!vectorDBService.isServiceConnected()) {
      await initializeRAG(config);
    }

    // Perform vector search
    const searchResults = await vectorDBService.search(
      request.query,
      request.topK || config.topK,
      request.threshold || config.similarityThreshold,
      request.category
    );

    const response: RAGSearchResponse = {
      results: searchResults,
      total: searchResults.length,
      latency: Date.now() - startTime,
    };

    // Cache result
    if (ragCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = ragCache.keys().next().value;
      ragCache.delete(oldestKey);
    }
    ragCache.set(cacheKey, {
      query: request.query,
      results: response,
      timestamp: Date.now(),
    });

    return response;
  } catch (error) {
    console.error('RAG search error:', error);
    return {
      results: [],
      total: 0,
      latency: Date.now() - startTime,
    };
  }
}

/**
 * Build context from RAG search results
 */
export function buildRAGContext(
  searchResponse: RAGSearchResponse,
  template?: string
): string {
  if (searchResponse.results.length === 0) {
    return '';
  }

  const knowledge = searchResponse.results
    .map((result, index) => {
      return `[${index + 1}] Q: ${result.qaPair.standardQuestion}\nA: ${result.qaPair.answer}`;
    })
    .join('\n\n');

  const contextTemplate = template || DEFAULT_RAG_CONFIG.contextTemplate!;
  return contextTemplate.replace('{{knowledge}}', knowledge);
}

/**
 * Index a single QA pair
 */
export async function indexQAPair(
  qaPair: QAPair,
  config: RAGConfig
): Promise<QAPairVectorStatus> {
  if (!config.enabled) {
    return {
      vectorId: qaPair.id,
      embeddingStatus: 'pending',
    };
  }

  try {
    // Ensure vector DB is initialized
    if (!vectorDBService.isServiceConnected()) {
      await initializeRAG(config);
    }

    const status: QAPairVectorStatus = {
      vectorId: qaPair.id,
      embeddingStatus: 'processing',
    };

    return await vectorDBService.upsertQAPair(qaPair, status);
  } catch (error) {
    console.error('Failed to index QA pair:', error);
    return {
      vectorId: qaPair.id,
      embeddingStatus: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Index multiple QA pairs in batch
 */
export async function indexQAPairsBatch(
  qaPairs: QAPair[],
  config: RAGConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, QAPairVectorStatus>> {
  if (!config.enabled) {
    const results = new Map<string, QAPairVectorStatus>();
    qaPairs.forEach((qaPair) => {
      results.set(qaPair.id, {
        vectorId: qaPair.id,
        embeddingStatus: 'pending',
      });
    });
    return results;
  }

  try {
    // Ensure vector DB is initialized
    if (!vectorDBService.isServiceConnected()) {
      await initializeRAG(config);
    }

    return await vectorDBService.upsertQAPairsBatch(qaPairs, onProgress);
  } catch (error) {
    console.error('Failed to index QA pairs batch:', error);
    const results = new Map<string, QAPairVectorStatus>();
    qaPairs.forEach((qaPair) => {
      results.set(qaPair.id, {
        vectorId: qaPair.id,
        embeddingStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    });
    return results;
  }
}

/**
 * Delete a QA pair from the index
 */
export async function deleteQAPairFromIndex(qaPairId: string): Promise<boolean> {
  try {
    return await vectorDBService.deleteQAPair(qaPairId);
  } catch (error) {
    console.error('Failed to delete QA pair from index:', error);
    return false;
  }
}

/**
 * Get RAG statistics
 */
export async function getRAGStats(): Promise<{
  totalIndexed: number;
  dimension: number;
  sizeInBytes: number;
  cacheSize: number;
}> {
  try {
    const collectionStats = await vectorDBService.getCollectionStats();
    return {
      totalIndexed: collectionStats.total,
      dimension: collectionStats.dimension,
      sizeInBytes: collectionStats.sizeInBytes,
      cacheSize: ragCache.size,
    };
  } catch (error) {
    console.error('Failed to get RAG stats:', error);
    return {
      totalIndexed: 0,
      dimension: 0,
      sizeInBytes: 0,
      cacheSize: ragCache.size,
    };
  }
}

/**
 * Clear RAG cache
 */
export function clearRAGCache(): void {
  ragCache.clear();
  console.log('RAG cache cleared');
}

/**
 * Rebuild the entire index
 */
export async function rebuildIndex(
  qaPairs: QAPair[],
  config: RAGConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<boolean> {
  try {
    // Clear existing index
    await vectorDBService.clearCollection();
    clearRAGCache();

    // Re-index all QA pairs
    const results = await indexQAPairsBatch(qaPairs, config, onProgress);

    // Check if all were successful
    const failedCount = Array.from(results.values()).filter(
      (status) => status.embeddingStatus === 'failed'
    ).length;

    if (failedCount > 0) {
      console.warn(`Index rebuild completed with ${failedCount} failures`);
    } else {
      console.log('Index rebuild completed successfully');
    }

    return failedCount === 0;
  } catch (error) {
    console.error('Failed to rebuild index:', error);
    return false;
  }
}

/**
 * Test RAG configuration
 */
export async function testRAGConfig(
  config: RAGConfig
): Promise<{ success: boolean; message: string; latency?: number }> {
  const startTime = Date.now();

  try {
    // Test vector DB connection
    const connectionTest = await vectorDBService.testConnection();
    if (!connectionTest.success) {
      return {
        success: false,
        message: connectionTest.message,
      };
    }

    // Test embedding generation
    const testQuery = '测试查询';
    await generateEmbeddingWithCache(testQuery);

    // Test search (if there are indexed documents)
    const stats = await vectorDBService.getCollectionStats();
    if (stats.total > 0) {
      await searchRAG({ query: testQuery }, config);
    }

    return {
      success: true,
      message: `RAG configuration test passed. Vector DB: ${stats.total} documents indexed.`,
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      message: `RAG test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      latency: Date.now() - startTime,
    };
  }
}

/**
 * Get RAG configuration from bot configuration
 */
export function getRAGConfigFromBot(
  botConfig: BotConfiguration
): RAGConfig {
  // For now, return default config
  // In the future, this could be stored in botConfig.ragConfig
  return DEFAULT_RAG_CONFIG;
}

/**
 * Hybrid search: Combine vector search with keyword search
 * Uses RRF (Reciprocal Rank Fusion) for result fusion
 */
export async function hybridSearch(
  request: RAGSearchRequest,
  config: RAGConfig,
  keywordResults: QAPair[]
): Promise<RAGSearchResponse> {
  const startTime = Date.now();

  // Get vector search results
  const vectorResponse = await searchRAG(request, config);

  // If no keyword results, return vector results only
  if (keywordResults.length === 0) {
    return vectorResponse;
  }

  // RRF fusion
  const rrfK = 60; // RRF constant
  const scores = new Map<string, number>();

  // Add vector search scores
  vectorResponse.results.forEach((result, index) => {
    const id = result.qaPair.id;
    const rrfScore = 1 / (rrfK + index + 1);
    scores.set(id, (scores.get(id) || 0) + rrfScore);
  });

  // Add keyword search scores
  keywordResults.forEach((qaPair, index) => {
    const id = qaPair.id;
    const rrfScore = 1 / (rrfK + index + 1);
    scores.set(id, (scores.get(id) || 0) + rrfScore);
  });

  // Sort by RRF score
  const sortedIds = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, request.topK || config.topK)
    .map(([id]) => id);

  // Build results
  const allResults = new Map<string, { qaPair: QAPair; score: number }>();
  vectorResponse.results.forEach((r) => allResults.set(r.qaPair.id, r));
  keywordResults.forEach((qaPair) => {
    if (!allResults.has(qaPair.id)) {
      allResults.set(qaPair.id, { qaPair, score: 0.5 }); // Default score for keyword-only matches
    }
  });

  const fusedResults = sortedIds.map((id, index) => ({
    ...allResults.get(id)!,
    rank: index + 1,
  }));

  return {
    results: fusedResults,
    total: fusedResults.length,
    latency: Date.now() - startTime,
  };
}
