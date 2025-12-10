"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openAIConfig = {
    apiKey: process.env.OPENAI_API_KEY || "",
    apiUrl: process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions",
    model: "gpt-4.1",
    /* -----------------------------------------------------
       SYSTEM PROMPT + INSTRUÇÕES PARA FUNCTION CALLING
    ----------------------------------------------------- */
    systemPrompt: `
Você é um assistente especializado no mercado de eventos, simpático, claro e direto.
Tom: profissional, leve e carismático — nunca robótico.

🔥 NOVA FUNCIONALIDADE: ÁREA DE TRABALHO INTELIGENTE
Você agora pode organizar informações automaticamente em PASTAS e ITEMS.

---------------------------------------------------------
📂 SISTEMA DE ORGANIZAÇÃO AUTOMÁTICA
---------------------------------------------------------

Quando o usuário mencionar informações que devem ser salvas/organizadas:
- Compras, fornecedores, contratos → Pasta "Compras"
- Eventos, datas, locais → Pasta "Eventos"  
- Tarefas, pendências → Pasta "Tarefas"
- Pagamentos, valores → Pasta "Financeiro"
- Notas gerais → Pasta "Notas"

VOCÊ DEVE:
1. Identificar a categoria/pasta adequada
2. Extrair os dados estruturados
3. Chamar a função add_item_to_folder automaticamente

Exemplo:
Usuário: "Compramos 200 cadeiras da empresa XYZ por R$ 5.000"
→ Você chama: add_item_to_folder com:
{
  "folderName": "Compras",
  "title": "Compra de Cadeiras",
  "content": {
    "quantidade": 200,
    "item": "cadeiras",
    "fornecedor": "XYZ",
    "valor": 5000
  },
  "itemType": "compra"
}

IMPORTANTE: O campo "content" é OBRIGATÓRIO e deve ser um objeto JSON com os dados extraídos.
Mesmo que não haja dados específicos, envie pelo menos: { "descricao": "texto do usuário" }

---------------------------------------------------------
📄 MODELO OFICIAL DE REGISTRO DO EVENTO
---------------------------------------------------------
Etapa 1 — Registro Inicial do Evento:
- Nome do Responsável Interno
- Nome da Equipe Interna Envolvida
- Nome do Evento
- Nome do Cliente
- Tipo de Evento (Congresso, Ação de Relacionamento, Summit, Feira, Lançamento ou Outro)
- Data de Realização
- Necessário montagem prévia (No dia / 1 dia antes / 2 dias antes)
- Horário de Realização
- Número de Participantes
- Cidade ou Região
- Local (se já possuir)
- Disposição do Espaço (Plateia / Formato U / Escola / Espaço vazio / Coquetel / Mesa única / Personalizado / Outro)
- Necessidade de Salas Adicionais (Quantidade + Disposição)
- Terá Catering? (Welcome Coffee / Coffee Break / Café e Petit Four / Almoço / Canapés / Jantar / Bar de drinks / Outro)
- Objetivo central do evento (1 a 3 frases)
- KPIs de cada objetivo (1 a 3 por objetivo)
- Nível de Experiência (Essencial / Conforto / Premium)
- Necessidades Pontuais Extras

---------------------------------------------------------
🧠 SUAS FUNÇÕES DISPONÍVEIS
---------------------------------------------------------

1. **GERAR ARQUIVOS (PDF, DOCX, CSV, XLSX)**
Quando usuário pedir "gere um PDF", "baixar planilha", etc → CHAME generate_file

2. **CRIAR PASTAS**
Para organizar categorias personalizadas → CHAME create_folder

3. **ADICIONAR ITEMS**
Para salvar informações organizadas → CHAME add_item_to_folder
(Esta função cria a pasta automaticamente se não existir)

4. **LISTAR PASTAS**
Para mostrar todas as pastas → CHAME list_folders

5. **BUSCAR ITEMS**
Para encontrar informações salvas → CHAME search_items

---------------------------------------------------------
🟢 SEJA PROATIVO
---------------------------------------------------------
Sempre que o usuário mencionar dados importantes:
- SALVE automaticamente usando add_item_to_folder
- ORGANIZE logicamente em pastas apropriadas
- CONFIRME a ação com mensagem amigável

Nunca pergunte "quer que eu salve isso?" — apenas salve e confirme!
`,
    /* -----------------------------------------------------
       OPENAI FUNCTIONS (para o modelo chamar)
    ----------------------------------------------------- */
    functions: [
        // 📄 Função existente de gerar arquivos
        {
            name: "generate_file",
            description: "Gera um arquivo PDF, DOCX, CSV ou XLSX baseado nos dados fornecidos.",
            parameters: {
                type: "object",
                properties: {
                    fileType: {
                        type: "string",
                        enum: ["pdf", "docx", "csv", "xlsx"],
                    },
                    title: {
                        type: "string",
                        description: "Título do arquivo gerado"
                    },
                    fields: {
                        type: "object",
                        description: "Dados estruturados para incluir no arquivo"
                    }
                },
                required: ["fileType", "fields"]
            }
        },
        // 🔥 NOVAS FUNÇÕES DE WORKSPACE
        {
            name: "create_folder",
            description: "Cria uma nova pasta/categoria para organizar informações do usuário.",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Nome da pasta (ex: 'Evento Aniversário', 'Fornecedores Q1')"
                    },
                    description: {
                        type: "string",
                        description: "Descrição opcional da pasta"
                    },
                    icon: {
                        type: "string",
                        description: "Emoji para representar a pasta (ex: 🎉, 📦, 💼)"
                    },
                    color: {
                        type: "string",
                        description: "Cor em hex (ex: #3B82F6, #10B981)"
                    }
                },
                required: ["name"]
            }
        },
        {
            name: "add_item_to_folder",
            description: "Adiciona um item/registro em uma pasta. Se a pasta não existir, será criada automaticamente.",
            parameters: {
                type: "object",
                properties: {
                    folderName: {
                        type: "string",
                        description: "Nome da pasta onde adicionar (ex: 'Compras', 'Eventos', 'Tarefas')"
                    },
                    title: {
                        type: "string",
                        description: "Título descritivo do item (ex: 'Compra de Cadeiras', 'Reunião com Cliente')"
                    },
                    content: {
                        type: "object",
                        description: "Dados estruturados do item (pode conter qualquer campo relevante)",
                        additionalProperties: true
                    },
                    itemType: {
                        type: "string",
                        description: "Tipo do item para categorização",
                        enum: ["compra", "evento", "tarefa", "nota", "fornecedor", "pagamento", "contrato"]
                    },
                    tags: {
                        type: "array",
                        items: { type: "string" },
                        description: "Tags para facilitar busca (ex: ['urgente', 'cliente-X'])"
                    }
                },
                required: ["folderName", "title", "content"]
            }
        },
        {
            name: "list_folders",
            description: "Lista todas as pastas do usuário com contagem de items.",
            parameters: {
                type: "object",
                properties: {}
            }
        },
        {
            name: "search_items",
            description: "Busca items salvos por texto, pasta ou tags.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Termo de busca no título ou conteúdo"
                    },
                    folderName: {
                        type: "string",
                        description: "Filtrar por pasta específica"
                    },
                    tags: {
                        type: "array",
                        items: { type: "string" },
                        description: "Filtrar por tags"
                    }
                }
            }
        },
        {
            name: "delete_folder",
            description: "Deleta uma pasta e todos os seus items. Use com cautela!",
            parameters: {
                type: "object",
                properties: {
                    folderId: {
                        type: "string",
                        description: "ID da pasta a ser deletada"
                    }
                },
                required: ["folderId"]
            }
        }
    ]
};
exports.default = openAIConfig;
