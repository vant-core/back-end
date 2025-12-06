import { Chunk, EmbeddingRecord } from '../types/training';
import { EmbeddingUtil } from '../utils/embedding.util';
import logger from '../config/security/logger.config';

class RetrieverService {
  findMostRelevant(query: string, chunks: Chunk[], embeddings: EmbeddingRecord[]): Chunk | null {
    if (chunks.length === 0) return null;

    let bestChunk: Chunk | null = null;
    let bestScore = -1;

    logger.info(`🔍 RETRIEVER: Buscando em ${chunks.length} chunks para: "${query}"`);

    for (const chunk of chunks) {
      const score = EmbeddingUtil.simpleWordOverlap(query, chunk.text);
      
      logger.info(`   Chunk ${chunk.id.substring(0, 8)}: score=${score.toFixed(3)}`);
      
      if (score > bestScore) {
        bestScore = score;
        bestChunk = chunk;
      }
    }

    if (bestChunk) {
      logger.info(`✅ RETRIEVER: Melhor chunk encontrado com score=${bestScore.toFixed(3)}`);
      logger.info(`   Preview: ${bestChunk.text.substring(0, 100)}...`);
    } else {
      logger.warn('⚠️ RETRIEVER: Nenhum chunk com score > 0');
    }

    return bestChunk;
  }
}

export default new RetrieverService();