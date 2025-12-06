import { RagQuery, RagResult } from '../types/rag';
import indexerService from './indexer.service';
import retrieverService from './retriever.service';
import perplexityService from '../services/perplexity.service';

class RagOrchestratorService {
  async query(query: RagQuery): Promise<RagResult> {
    const chunks = await indexerService.loadAllChunks();
    const embeddings = await indexerService.loadAllEmbeddings();

    const relevantChunk = retrieverService.findMostRelevant(query.question, chunks, embeddings);

    if (!relevantChunk) {
      return {
        question: query.question,
        answer: 'Nenhum contexto relevante encontrado.',
        contextChunkId: 'none',
        contextPreview: '',
        fullChunkText: ''
      };
    }

    const context = `Contexto: ${relevantChunk.text}\n\nPergunta: ${query.question}`;
    
    let answer: string;
    try {
      const response = await perplexityService.chat(context, []);
      answer = response.content;
    } catch (error) {
      answer = `Resposta baseada no contexto: ${relevantChunk.text.substring(0, 200)}...`;
    }

    return {
      question: query.question,
      answer,
      contextChunkId: relevantChunk.id,
      contextPreview: relevantChunk.text.substring(0, 200),
      fullChunkText: relevantChunk.text
    };
  }
}

export default new RagOrchestratorService();