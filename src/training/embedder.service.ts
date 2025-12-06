import { EmbeddingRecord, Chunk } from '../types/training';
import { EmbeddingUtil } from '../utils/embedding.util';
import { v4 as uuidv4 } from 'uuid';
import ragConfig from '../config/rag.config';

class EmbedderService {
  generateEmbeddings(chunks: Chunk[]): EmbeddingRecord[] {
    return chunks.map(chunk => ({
      id: uuidv4(),
      chunkId: chunk.id,
      vector: EmbeddingUtil.generateFakeEmbedding(chunk.text, ragConfig.embeddingDimension)
    }));
  }
}

export default new EmbedderService();