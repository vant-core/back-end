import axios from "axios";
import openAIConfig from "../config/openAi.config";
import { OpenAIMessage, OpenAIResponse } from "../types/user";
import FileGeneratorService from "../services/fileGenerator.service";
import { WorkspaceHandlers } from "./ai/workspaceHandlers";
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
    userId: string, // 🔥 NOVO: precisa do userId para workspace
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

      console.log("📡 IA chamou função:", functionName);
      console.log("📦 Argumentos recebidos:", JSON.stringify(args, null, 2));

      // 🔥 EXECUTAR FUNÇÕES
      let functionResult: any;

      switch (functionName) {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📄 GERAR ARQUIVOS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "generate_file": {
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
            content: `✅ Arquivo ${fileType.toUpperCase()} gerado com sucesso!`,
            file: {
              url: finalUrl,
              type: fileType,
              name: title || "arquivo"
            }
          };
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📁 WORKSPACE - CRIAR PASTA
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "create_folder": {
          functionResult = await WorkspaceHandlers.createFolder(userId, args);
          
          return {
            content: functionResult.message,
            workspace: {
              action: "folder_created",
              folder: functionResult.folder
            }
          };
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📝 WORKSPACE - ADICIONAR ITEM
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "add_item_to_folder": {
          functionResult = await WorkspaceHandlers.addItemToFolder(userId, args);
          
          return {
            content: functionResult.message,
            workspace: {
              action: "item_added",
              item: functionResult.item,
              folder: functionResult.folder
            }
          };
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📂 WORKSPACE - LISTAR PASTAS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "list_folders": {
          functionResult = await WorkspaceHandlers.listFolders(userId);
          
          const folderList = functionResult.folders
            .map((f: any) => `• ${f.icon} **${f.name}** (${f.itemCount} items)`)
            .join('\n');

          return {
            content: `📂 Suas pastas:\n\n${folderList || 'Nenhuma pasta criada ainda.'}`,
            workspace: {
              action: "folders_listed",
              folders: functionResult.folders
            }
          };
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔍 WORKSPACE - BUSCAR ITEMS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "search_items": {
          functionResult = await WorkspaceHandlers.searchItems(userId, args);
          
          const itemList = functionResult.items
            .map((item: any) => `• **${item.title}** (${item.folder.name})`)
            .join('\n');

          return {
            content: `🔍 Encontrei ${functionResult.count} item(s):\n\n${itemList || 'Nenhum item encontrado.'}`,
            workspace: {
              action: "items_searched",
              items: functionResult.items,
              count: functionResult.count
            }
          };
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🗑️ WORKSPACE - DELETAR PASTA
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "delete_folder": {
          functionResult = await WorkspaceHandlers.deleteFolder(userId, args);
          
          return {
            content: functionResult.message,
            workspace: {
              action: "folder_deleted"
            }
          };
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ❌ FUNÇÃO DESCONHECIDA
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        default: {
          console.warn("⚠️ Função desconhecida:", functionName);
          return { content: "Função não implementada." };
        }
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