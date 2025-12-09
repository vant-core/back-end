import axios from "axios";
import openAIConfig from "../config/openAi.config";
import { OpenAIMessage, OpenAIResponse } from "../types/user";
import FileGeneratorService from "../services/fileGenerator.service";
import path from "path";

class OpenAIService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private systemPrompt: string;
  private functions: any[];

  constructor() {
    this.apiKey = openAIConfig.apiKey;
    this.apiUrl = openAIConfig.apiUrl;
    this.model = openAIConfig.model;
    this.systemPrompt = openAIConfig.systemPrompt;
    this.functions = openAIConfig.functions;
  }

  /**
   * ----------------------------------------------------
   * Envia mensagem normal para o modelo
   * ----------------------------------------------------
   */
  async sendMessage(messages: OpenAIMessage[]): Promise<any> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages,
          temperature: 0.6,
          max_tokens: 2000,
          functions: this.functions,               // 🔥 ATIVA FUNCTION CALLING
          function_call: "auto"
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("🔥 STATUS:", error.response?.status);
      console.error("🔥 ERROR DATA:", JSON.stringify(error.response?.data, null, 2));
      console.error("🔥 ERROR HEADERS:", JSON.stringify(error.response?.headers, null, 2));
      throw error;
    }
  }

  /**
   * ----------------------------------------------------
   * Função principal chamada pelo controller
   * ----------------------------------------------------
   */

  async chat(
    userMessage: string,
    conversationHistory: OpenAIMessage[] = [],
    ragContext: string | null = null
  ): Promise<OpenAIResponse | any> {
    const messages: OpenAIMessage[] = [
      { role: "system", content: this.systemPrompt }
    ];

    if (ragContext) {
      messages.push({
        role: "system",
        content: `Contexto dos documentos:\n\n${ragContext}`
      });
    }

    messages.push(...conversationHistory);
    messages.push({ role: "user", content: userMessage });

    // 🔥 Envia tudo para o modelo
    const result = await this.sendMessage(messages);

    const choice = result.choices[0];

    /**
     * -----------------------------------------------
     * 🔥 Caso 1 — Function Calling detectado
     * -----------------------------------------------
     */
    if (choice.finish_reason === "function_call") {
      const fn = choice.message.function_call;

      if (!fn) {
        return { content: "Erro: função chamada mas não definida." };
      }

      const functionName = fn.name;
      const args = JSON.parse(fn.arguments || "{}");

      console.log("📡 IA chamou função:", functionName, args);

      // 🔥 EXECUTAR A FUNÇÃO generate_file
      if (functionName === "generate_file") {
        const { fileType, title, fields } = args;

        let filePath: string | Buffer;

        if (fileType === "pdf") {
          filePath = await FileGeneratorService.generatePDF({ title, fields });
        } else if (fileType === "docx") {
          filePath = await FileGeneratorService.generateDOCX({ title, fields });
        } else if (fileType === "csv") {
          filePath = FileGeneratorService.generateCSV({ title, fields });
        } else {
          return { content: "Tipo de arquivo não suportado." };
        }

        const fileName = typeof filePath === "string" ? path.basename(filePath) : `${title}.${fileType}`;
        const finalUrl = "/files/" + fileName;

        return {
          content: null,
          file: {
            url: finalUrl,
            type: fileType,
            name: title || "arquivo"
          }
        };
      }
    }

    /**
     * -----------------------------------------------
     * Caso 2 — Resposta normal da IA
     * -----------------------------------------------
     */
    return {
      content: choice.message.content,
      usage: result.usage
    };
  }
}

export default new OpenAIService();
