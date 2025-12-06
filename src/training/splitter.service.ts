import { v4 as uuidv4 } from 'uuid';
import { Chunk } from '../types/training';
import { ChunkUtil } from '../utils/chunk.util';
import ragConfig from '../config/rag.config';

class SplitterService {
  splitDocument(text: string, sourceFile: string): Chunk[] {
    const textChunks = ChunkUtil.splitText(text, ragConfig.chunkSize);
    
    return textChunks.map(chunkText => ({
      id: uuidv4(),
      text: chunkText,
      sourceFile
    }));
  }
}

export default new SplitterService();