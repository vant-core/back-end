export class EmbeddingUtil {
  static generateFakeEmbedding(text: string, dimension: number): number[] {
    const vector: number[] = [];
    let seed = 0;
    
    for (let i = 0; i < text.length; i++) {
      seed += text.charCodeAt(i);
    }

    for (let i = 0; i < dimension; i++) {
      const x = Math.sin(seed + i) * 10000;
      vector.push(x - Math.floor(x));
    }

    return vector;
  }

  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  static simpleWordOverlap(textA: string, textB: string): number {
    const normalize = (text: string) => 
      text.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 2);

    const wordsA = normalize(textA);
    const wordsB = new Set(normalize(textB));
    
    if (wordsA.length === 0 || wordsB.size === 0) return 0;

    let overlap = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) {
        overlap++;
      }
    }

    const score = overlap / Math.max(wordsA.length, wordsB.size);
    return score;
  }
}