export interface RagQuery {
  question: string;
}

export interface RagResult {
  question: string;
  answer: string;
  contextChunkId: string;
  contextPreview: string;
  fullChunkText: string;
}