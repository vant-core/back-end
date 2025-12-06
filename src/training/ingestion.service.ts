import path from 'path';
import { FileUtil } from '../utils/file.util';
import splitterService from './splitter.service';
import embedderService from './embedder.service';
import indexerService from './indexer.service';
import { TrainingResult } from '../types/training';

class IngestionService {
  async ingestFile(filePath: string): Promise<TrainingResult> {
    const content = await FileUtil.readFile(filePath);
    const filename = path.basename(filePath, path.extname(filePath));

    const chunks = splitterService.splitDocument(content, filename);
    await indexerService.saveChunks(chunks, filename);

    const embeddings = embedderService.generateEmbeddings(chunks);
    await indexerService.saveEmbeddings(embeddings, filename);

    return {
      success: true,
      message: 'Arquivo processado com sucesso',
      chunksCreated: chunks.length,
      embeddingsCreated: embeddings.length
    };
  }
}

export default new IngestionService();