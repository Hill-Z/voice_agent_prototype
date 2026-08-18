import { VectorDBConfig, QAPair, QAPairVectorStatus } from '../types';
import { generateEmbedding, cosineSimilarity } from './embeddingService';

// In-memory vector storage for development/mock purposes
// In production, this would connect to Qdrant, Milvus, or Pinecone
interface VectorRecord {
  id: string;
  vector: number[];
  qaPair: QAPair;
  metadata: {
    category?: string;
    isActive: boolean;
    createdAt: number;
  };
}

class VectorDBService {
  private config: VectorDBConfig | null = null;
  private collections: Map<string, VectorRecord[]> = new Map();
  private isConnected: boolean = false;

  /**
   * Initialize the vector database service with configuration
   */
  async initialize(config: VectorDBConfig): Promise<boolean> {
    try {
      this.config = config;
      
      // Create collection if it doesn't exist
      if (!this.collections.has(config.collectionName)) {
        this.collections.set(config.collectionName, []);
      }
      
      this.isConnected = true;
      console.log(`VectorDB initialized: ${config.provider}://${config.host}:${config.port}/${config.collectionName}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize VectorDB:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Test connection to vector database
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      return { success: false, message: 'Configuration not set' };
    }

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { 
        success: true, 
        message: `Successfully connected to ${this.config.provider} at ${this.config.host}:${this.config.port}` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Create a new collection
   */
  async createCollection(
    collectionName: string, 
    dimension: number
  ): Promise<boolean> {
    try {
      if (this.collections.has(collectionName)) {
        console.log(`Collection ${collectionName} already exists`);
        return true;
      }

      this.collections.set(collectionName, []);
      console.log(`Created collection: ${collectionName} with dimension: ${dimension}`);
      return true;
    } catch (error) {
      console.error('Failed to create collection:', error);
      return false;
    }
  }

  /**
   * Delete a collection
   */
  async deleteCollection(collectionName: string): Promise<boolean> {
    try {
      this.collections.delete(collectionName);
      console.log(`Deleted collection: ${collectionName}`);
      return true;
    } catch (error) {
      console.error('Failed to delete collection:', error);
      return false;
    }
  }

  /**
   * Upsert a single QA pair with its vector
   */
  async upsertQAPair(
    qaPair: QAPair,
    vectorStatus: QAPairVectorStatus
  ): Promise<QAPairVectorStatus> {
    if (!this.isConnected || !this.config) {
      throw new Error('VectorDB not initialized');
    }

    try {
      const collection = this.collections.get(this.config.collectionName);
      if (!collection) {
        throw new Error('Collection not found');
      }

      // Generate embedding for the question
      const questionText = qaPair.standardQuestion;
      const vector = await generateEmbedding(questionText);

      // Remove existing record if present
      const existingIndex = collection.findIndex(r => r.id === qaPair.id);
      if (existingIndex >= 0) {
        collection.splice(existingIndex, 1);
      }

      // Add new record
      collection.push({
        id: qaPair.id,
        vector,
        qaPair,
        metadata: {
          category: qaPair.category,
          isActive: qaPair.isActive,
          createdAt: Date.now(),
        },
      });

      return {
        ...vectorStatus,
        vectorId: qaPair.id,
        embeddingStatus: 'completed',
        lastEmbeddedAt: Date.now(),
      };
    } catch (error) {
      console.error('Failed to upsert QA pair:', error);
      return {
        ...vectorStatus,
        embeddingStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upsert multiple QA pairs in batch
   */
  async upsertQAPairsBatch(
    qaPairs: QAPair[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, QAPairVectorStatus>> {
    const results = new Map<string, QAPairVectorStatus>();
    
    for (let i = 0; i < qaPairs.length; i++) {
      const qaPair = qaPairs[i];
      const status: QAPairVectorStatus = {
        vectorId: qaPair.id,
        embeddingStatus: 'processing',
      };

      try {
        const result = await this.upsertQAPair(qaPair, status);
        results.set(qaPair.id, result);
      } catch (error) {
        results.set(qaPair.id, {
          ...status,
          embeddingStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      if (onProgress) {
        onProgress(i + 1, qaPairs.length);
      }
    }

    return results;
  }

  /**
   * Search for similar QA pairs
   */
  async search(
    query: string,
    topK: number = 3,
    threshold: number = 0.7,
    category?: string
  ): Promise<Array<{ qaPair: QAPair; score: number; rank: number }>> {
    if (!this.isConnected || !this.config) {
      throw new Error('VectorDB not initialized');
    }

    const collection = this.collections.get(this.config.collectionName);
    if (!collection) {
      return [];
    }

    // Generate query embedding
    const queryVector = await generateEmbedding(query);

    // Calculate similarities
    const results = collection
      .filter(record => {
        // Filter by category if specified
        if (category && record.metadata.category !== category) {
          return false;
        }
        // Filter by active status
        if (!record.metadata.isActive) {
          return false;
        }
        return true;
      })
      .map(record => ({
        qaPair: record.qaPair,
        score: cosineSimilarity(queryVector, record.vector),
      }))
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((result, index) => ({
        ...result,
        rank: index + 1,
      }));

    return results;
  }

  /**
   * Delete a QA pair from the vector database
   */
  async deleteQAPair(qaPairId: string): Promise<boolean> {
    if (!this.isConnected || !this.config) {
      throw new Error('VectorDB not initialized');
    }

    const collection = this.collections.get(this.config.collectionName);
    if (!collection) {
      return false;
    }

    const index = collection.findIndex(r => r.id === qaPairId);
    if (index >= 0) {
      collection.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(): Promise<{
    total: number;
    dimension: number;
    sizeInBytes: number;
  }> {
    if (!this.isConnected || !this.config) {
      throw new Error('VectorDB not initialized');
    }

    const collection = this.collections.get(this.config.collectionName);
    if (!collection) {
      return { total: 0, dimension: 0, sizeInBytes: 0 };
    }

    const dimension = collection.length > 0 ? collection[0].vector.length : 0;
    const total = collection.length;
    // Rough estimation: each float is 4 bytes, plus metadata
    const sizeInBytes = total * (dimension * 4 + 200);

    return { total, dimension, sizeInBytes };
  }

  /**
   * Clear all vectors in the collection
   */
  async clearCollection(): Promise<boolean> {
    if (!this.isConnected || !this.config) {
      throw new Error('VectorDB not initialized');
    }

    const collection = this.collections.get(this.config.collectionName);
    if (collection) {
      collection.length = 0;
      return true;
    }

    return false;
  }

  /**
   * Check if service is connected
   */
  isServiceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current configuration
   */
  getConfig(): VectorDBConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const vectorDBService = new VectorDBService();

// Export class for testing
export { VectorDBService };
