export interface Chunk {
  id: string;
  text: string;
  sourceFile: string;
}

export interface EmbeddingRecord {
  id: string;
  chunkId: string;
  vector: number[];
}

export interface TrainingResult {
  success: boolean;
  message: string;
  chunksCreated: number;
  embeddingsCreated: number;
}