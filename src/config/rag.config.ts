import path from 'path';

export default {
  chunkSize: 500,
  embeddingDimension: 128,
  overlapSize: 50,
  paths: {
    uploaded: path.join(process.cwd(), 'src/training-data/uploaded'),
    chunks: path.join(process.cwd(), 'src/training-data/chunks'),
    embeddings: path.join(process.cwd(), 'src/training-data/embeddings'),
  }
};
