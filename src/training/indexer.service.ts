import path from 'path';
import { FileUtil } from '../utils/file.util';
import { Chunk, EmbeddingRecord } from '../types/training';
import ragConfig from '../config/rag.config';

class IndexerService {
  async saveChunks(chunks: Chunk[], filename: string): Promise<void> {
    await FileUtil.ensureDir(ragConfig.paths.chunks);
    const filePath = path.join(ragConfig.paths.chunks, `${filename}.json`);
    await FileUtil.writeJSON(filePath, chunks);
  }

  async saveEmbeddings(embeddings: EmbeddingRecord[], filename: string): Promise<void> {
    await FileUtil.ensureDir(ragConfig.paths.embeddings);
    const filePath = path.join(ragConfig.paths.embeddings, `${filename}.json`);
    await FileUtil.writeJSON(filePath, embeddings);
  }

  async loadAllChunks(): Promise<Chunk[]> {
    const files = await FileUtil.listFiles(ragConfig.paths.chunks, '.json');
    const allChunks: Chunk[] = [];

    for (const file of files) {
      const filePath = path.join(ragConfig.paths.chunks, file);
      const chunks = await FileUtil.readJSON<Chunk[]>(filePath);
      allChunks.push(...chunks);
    }

    return allChunks;
  }

  async loadAllEmbeddings(): Promise<EmbeddingRecord[]> {
    const files = await FileUtil.listFiles(ragConfig.paths.embeddings, '.json');
    const allEmbeddings: EmbeddingRecord[] = [];

    for (const file of files) {
      const filePath = path.join(ragConfig.paths.embeddings, file);
      const embeddings = await FileUtil.readJSON<EmbeddingRecord[]>(filePath);
      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  }
}

export default new IndexerService();