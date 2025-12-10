"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const openAi_config_1 = __importDefault(require("../config/openAi.config"));
const fileGenerator_service_1 = __importDefault(require("../services/fileGenerator.service"));
const workspaceHandlers_1 = require("./ai/workspaceHandlers");
const path_1 = __importDefault(require("path"));
class OpenAIService {
    constructor() {
        this.apiKey = openAi_config_1.default.apiKey;
        this.apiUrl = openAi_config_1.default.apiUrl;
        this.model = openAi_config_1.default.model;
        this.systemPrompt = openAi_config_1.default.systemPrompt;
        this.functions = openAi_config_1.default.functions;
    }
    /**
     * ----------------------------------------------------
     * Envia mensagem normal para o modelo
     * ----------------------------------------------------
     */
    async sendMessage(messages) {
        try {
            const response = await axios_1.default.post(this.apiUrl, {
                model: this.model,
                messages,
                temperature: 0.6,
                max_tokens: 2000,
                functions: this.functions, // 🔥 ATIVA FUNCTION CALLING
                function_call: "auto"
            }, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000
            });
            return response.data;
        }
        catch (error) {
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
    async chat(userMessage, userId, // 🔥 NOVO: precisa do userId para workspace
    conversationHistory = [], ragContext = null) {
        const messages = [
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
            let functionResult;
            switch (functionName) {
                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                // 📄 GERAR ARQUIVOS
                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                case "generate_file": {
                    const { fileType, title, fields } = args;
                    let filePath;
                    if (fileType === "pdf") {
                        filePath = await fileGenerator_service_1.default.generatePDF({ title, fields });
                    }
                    else if (fileType === "docx") {
                        filePath = await fileGenerator_service_1.default.generateDOCX({ title, fields });
                    }
                    else if (fileType === "csv") {
                        filePath = fileGenerator_service_1.default.generateCSV({ title, fields });
                    }
                    else {
                        return { content: "Tipo de arquivo não suportado." };
                    }
                    const fileName = typeof filePath === "string" ? path_1.default.basename(filePath) : `${title}.${fileType}`;
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
                    functionResult = await workspaceHandlers_1.WorkspaceHandlers.createFolder(userId, args);
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
                    functionResult = await workspaceHandlers_1.WorkspaceHandlers.addItemToFolder(userId, args);
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
                    functionResult = await workspaceHandlers_1.WorkspaceHandlers.listFolders(userId);
                    const folderList = functionResult.folders
                        .map((f) => `• ${f.icon} **${f.name}** (${f.itemCount} items)`)
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
                    functionResult = await workspaceHandlers_1.WorkspaceHandlers.searchItems(userId, args);
                    const itemList = functionResult.items
                        .map((item) => `• **${item.title}** (${item.folder.name})`)
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
                    functionResult = await workspaceHandlers_1.WorkspaceHandlers.deleteFolder(userId, args);
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
exports.default = new OpenAIService();
