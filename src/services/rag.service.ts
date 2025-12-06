import fs from "fs";
import path from "path";

class RagService {
  private chunksPath = path.join(__dirname, "../../rag-data/chunks.json");

  private loadChunks() {
    if (!fs.existsSync(this.chunksPath)) return [];
    const raw = fs.readFileSync(this.chunksPath, "utf-8");
    return JSON.parse(raw);
  }

  // Busca local simples (keyword search)
  search(query: string, limit = 5) {
    const chunks = this.loadChunks();
    const q = query.toLowerCase();

    const results = chunks
      .filter((c: any) => c.text.toLowerCase().includes(q))
      .slice(0, limit);

    return results;
  }

  // Monta contexto concatenado para o prompt
  getContextText(query: string): string {
    const results = this.search(query, 5);

    if (!results.length) return "";

    return results
      .map((r: any) => `• [${r.id}] ${r.text}`)
      .join("\n\n");
  }
}

export default new RagService();
