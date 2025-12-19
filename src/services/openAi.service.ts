// src/services/openAi.service.ts
import axios from "axios";
import openAIConfig from "../config/openAi.config";
import { OpenAIMessage, OpenAIResponse } from "../types";
import FileGeneratorService from "../services/fileGenerator.service";
import { WorkspaceHandlers } from "./workspace/workspaceHandlers";
import reportHandler from "../services/report/reportHandlers";
import path from "path";
import fs from "fs";
import prisma from "../config/database";

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
          functions: this.functions, // 🔥 ATIVA FUNCTION CALLING
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
   * Helper: resolveFolderPath
   * - Recebe folderPath: string[] (["A","B","C"])
   * - Procura cada nível por name (case-insensitive) e parentId
   * - Cria nível ausente via WorkspaceHandlers.createFolder (que aceita parentId)
   * - Retorna o folder final (objeto prisma.folder)
   * ----------------------------------------------------
   */
  private async resolveFolderPath(userId: string, folderPath: string[]) {
    if (!Array.isArray(folderPath) || folderPath.length === 0) {
      throw new Error("folderPath inválido");
    }

    let parentId: string | null = null;
    let lastFolder: any = null;

    for (const rawName of folderPath) {
      const name = String(rawName).trim();
      if (!name) continue;

      // procurar pasta com mesmo name e parentId (case-insensitive)
      let folder = await prisma.folder.findFirst({
        where: {
          userId,
          name: { equals: name, mode: "insensitive" },
          parentId: parentId
        }
      });

      if (!folder) {
        // cria pasta com parentId usando WorkspaceHandlers.createFolder
        const createArgs = {
          name,
          parentId
        };

        const result = await WorkspaceHandlers.createFolder(userId, createArgs);
        if (!result || !result.folder) {
          throw new Error(`Falha ao criar pasta "${name}"`);
        }
        folder = result.folder;
      }

      parentId = folder.id;
      lastFolder = folder;
    }

    return lastFolder;
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
    const messages: OpenAIMessage[] = [{ role: "system", content: this.systemPrompt }];

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
      let args: any = {};
      try {
        args = JSON.parse(fn.arguments || "{}");
      } catch (err) {
        console.error("Erro ao parsear argumentos da função:", err);
        return { content: "Erro: argumentos da função inválidos." };
      }

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
          let fileBuf: Buffer;

          if (fileType === "pdf") {
            const result = await FileGeneratorService.generatePDF({ title, fields });
            fileBuf = typeof result === "string" ? Buffer.from(result) : result;
          } else if (fileType === "docx") {
            const result = await FileGeneratorService.generateDOCX({ title, fields });
            fileBuf = typeof result === "string" ? Buffer.from(result) : result;
          } else if (fileType === "csv") {
            const result = FileGeneratorService.generateCSV({ title, fields });
            fileBuf = typeof result === "string" ? Buffer.from(result) : result;
          } else if (fileType === "xlsx") {
            const result = FileGeneratorService.generateXLSX({ title, fields });
            fileBuf = typeof result === "string" ? Buffer.from(result) : result;
          } else {
            return { content: "Tipo de arquivo não suportado." };
          }

          // salvar buffer em disco temporário para servir via rota /files
          const tempDir = path.join(__dirname, "../../temp");
          if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

          const safeTitle = (title || "arquivo").replace(/[^a-z0-9\-_\.]/gi, "-").toLowerCase();
          const fileName = `${safeTitle}-${Date.now()}.${fileType}`;
          const filePath = path.join(tempDir, fileName);
          await fs.promises.writeFile(filePath, fileBuf);

          const finalUrl = "/files/" + fileName; // rota estática existente no seu backend

          return {
            content: `✅ Arquivo ${fileType.toUpperCase()} gerado com sucesso!`,
            file: {
              url: finalUrl,
              type: fileType,
              name: fileName
            }
          };
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📊 GERAR RELATÓRIO (NOVO)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "generate_report": {
          const reportResult = await reportHandler.handleGenerateReport(args, userId);

          if (!reportResult.success) {
            return {
              content: reportResult.message || "❌ Erro ao gerar relatório.",
              error: reportResult.error
            };
          }

          return {
            content: reportResult.message,
            report: {
              html: reportResult.html,
              data: reportResult.data
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
        // 📂 WORKSPACE - CRIAR SUBPASTA (via folderPath + name)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "create_subfolder": {
          const { folderPath, name, icon, color } = args;
          if (!folderPath || !Array.isArray(folderPath) || folderPath.length === 0) {
            return { content: "folderPath inválido para create_subfolder." };
          }

          // resolve parent path (creates parents if missing)
          const parent = await this.resolveFolderPath(userId, folderPath);
          const parentId = parent?.id || null;

          // criar subpasta sob parent
          functionResult = await WorkspaceHandlers.createFolder(userId, {
            name,
            icon,
            color,
            parentId
          });

          return {
            content: functionResult.message,
            workspace: {
              action: "subfolder_created",
              folder: functionResult.folder
            }
          };
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📝 WORKSPACE - ADICIONAR ITEM (SUPORTA folderPath)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "add_item_to_folder": {
          /**
           * Suportamos 2 formatos:
           * - folderPath: ["A","B","C"]
           * - folderName (legacy)
           */
          const { folderPath, folderName, title, content = {}, itemType, tags = [] } = args;

          // garantir content como objeto
          const safeContent = typeof content === "object" && content !== null ? content : { descricao: String(content) };

          let targetFolder: any = null;

          if (folderPath && Array.isArray(folderPath) && folderPath.length > 0) {
            targetFolder = await this.resolveFolderPath(userId, folderPath);
          } else if (folderName) {
            // legacy: procura ou cria por folderName (root)
            let folder = await prisma.folder.findFirst({
              where: {
                userId,
                name: { equals: folderName, mode: "insensitive" },
                parentId: null
              }
            });

            if (!folder) {
              const created = await WorkspaceHandlers.createFolder(userId, { name: folderName });
              folder = created.folder;
            }

            targetFolder = folder;
          } else {
            return { content: "add_item_to_folder requer folderPath ou folderName." };
          }

          // cria item diretamente
          const item = await prisma.folderItem.create({
            data: {
              folderId: targetFolder.id,
              userId,
              title: title || (safeContent?.title || "Sem título"),
              content: safeContent,
              itemType,
              tags
            },
            include: {
              folder: {
                select: { id: true, name: true, icon: true, color: true }
              }
            }
          });

          return {
            content: `✅ Item "${item.title}" adicionado em "${targetFolder.name}"`,
            workspace: {
              action: "item_added",
              item,
              folder: targetFolder
            }
          };
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📂 WORKSPACE - LISTAR PASTAS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "list_folders": {
          functionResult = await WorkspaceHandlers.listFolders(userId);

          const folderList = functionResult.folders
            .map((f: any) => `• ${f.icon} ${f.name} (${f.itemCount} items)`)
            .join("\n");

          return {
            content: `📂 Suas pastas:\n\n${folderList || "Nenhuma pasta criada ainda."}`,
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
            .map((item: any) => `• ${item.title} (${item.folder?.name || "sem pasta"})`)
            .join("\n");

          return {
            content: `🔍 Encontrei ${functionResult.count} item(s):\n\n${itemList || "Nenhum item encontrado."}`,
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
        // 📂 WORKSPACE - CRIAR CAMINHO DE PASTAS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "create_folder_path": {
          functionResult = await WorkspaceHandlers.createFolderPath(userId, args);

          return {
            content: functionResult.message,
            workspace: {
              action: "folder_path_created",
              folder: functionResult.folder
            }
          };
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📝 ADICIONAR ITEM EM SUBPASTA PROFUNDA (add_item_to_path)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        case "add_item_to_path": {
          functionResult = await WorkspaceHandlers.addItemToPath(userId, args);

          return {
            content: functionResult.message,
            workspace: {
              action: "item_added_to_path",
              folder: functionResult.folder,
              item: functionResult.item
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