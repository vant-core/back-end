import { Request } from "express";

/* -------------------------------------------------------
   USER / AUTH
------------------------------------------------------- */
export interface UserPayload {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
}

export interface WhatsappUserDTO {
  phone: string;
  name?: string;
}

/* -------------------------------------------------------
   CHAT / AI
------------------------------------------------------- */
export interface ChatMessageDTO {
  message: string;
  conversationId?: string;
}

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/* -------------------------------------------------------
   EVENT DATA EXTRACTION
------------------------------------------------------- */
export interface ExtractedEventData {
  quantidade?: number | string;
  item?: string;
  produto?: string;
  categoria?: string;
  fornecedor?: string;
  valorUnitario?: number;
  valorTotal?: number;
  dataEntrega?: string;
  local?: string;

  [key: string]: any;
}

/* -------------------------------------------------------
   EVENT REGISTRATION DTO
------------------------------------------------------- */
export interface EventRegistrationDTO {
  id?: string;
  userId: string;
  conversationId?: string | null;
  data: ExtractedEventData;
  createdAt?: Date;
}

/* -------------------------------------------------------
   CONVERSATION TYPES
------------------------------------------------------- */
export interface MessageDTO {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ConversationDTO {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: MessageDTO[];
}

/* -------------------------------------------------------
   API RESPONSE SHAPE (AIController)
------------------------------------------------------- */
export interface ChatApiResponse {
  success: boolean;
  data: {
    conversationId: string;
    message: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    _links?: any;
  };
}

/* -------------------------------------------------------
   🔥 WORKSPACE / FOLDERS
------------------------------------------------------- */
export interface Folder {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderItem {
  id: string;
  folderId: string;
  userId: string;
  title: string;
  content: Record<string, any>;
  itemType?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFolderDTO {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
}

export interface CreateItemDTO {
  folderId: string;
  title: string;
  content: Record<string, any>;
  itemType?: string;
  tags?: string[];
}

export interface FolderWithCount extends Folder {
  itemCount: number;
  subFolders?: Folder[];
}

export interface FolderItemWithFolder extends FolderItem {
  folder?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

/* -------------------------------------------------------
   🔥 NOVOS TIPOS PARA SUPORTE A SUBPASTAS PROFUNDAS
------------------------------------------------------- */

/** Ex: ["Eventos", "Coca-Cola", "Financeiro"] */
export interface FolderPathDTO {
  folderPath: string[];
}

/** Ex: "Eventos/Coca-Cola/Financeiro" */
export interface RawPathDTO {
  path: string;
}

/* ------------ Criar estrutura completa ("A/B/C") ------------ */
export interface CreateFolderPathDTO extends RawPathDTO {
  icon?: string;
  color?: string;
}

/* ------------ Criar subpasta profunda ------------ */
export interface CreateSubfolderDTO extends FolderPathDTO {
  name: string;
  icon?: string;
  color?: string;
}

/* ------------ Adicionar item usando caminho array ------------ */
export interface AddItemToFolderPathDTO extends FolderPathDTO {
  title: string;
  content: any;
  itemType?: string;
  tags?: string[];
}

/* ------------ Adicionar item usando path "A/B/C" ------------ */
export interface AddItemToPathDTO extends RawPathDTO {
  title: string;
  content: any;
  itemType?: string;
  tags?: string[];
}

/* ------------ Buscar items em caminhos profundos ------------ */
export interface SearchItemsDTO {
  query?: string;
  folderPath?: string[];
  tags?: string[];
}

/* -------------------------------------------------------
   📊 REPORT SYSTEM TYPES
------------------------------------------------------- */

/** Configuração visual do relatório */
export interface ReportConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  logo?: string;
}

/** Tipos de seção disponíveis no relatório */
export type ReportSectionType = 'text' | 'table' | 'cards' | 'list' | 'chart';

/** Card para seção de resumo */
export interface ReportCard {
  label: string;
  value: string | number;
  icon?: string;
  description?: string;
}

/** Conteúdo de tabela */
export interface ReportTableContent {
  headers: string[];
  rows: (string | number)[][];
}

/** Item de lista */
export interface ReportListItem {
  title: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/** Seção do relatório */
export interface ReportSection {
  id?: string;
  title: string;
  type: ReportSectionType;
  content: any; // Pode ser ReportCard[], ReportTableContent, ReportListItem[], string, etc.
  description?: string;
}

/** Dados completos do relatório */
export interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: string;
  sections: ReportSection[];
  metadata?: {
    userId?: string;
    folderId?: string;
    totalItems?: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

/** DTO para requisição de geração de relatório */
export interface GenerateReportDTO {
  userId: string;
  folderId?: string;
  title?: string;
  subtitle?: string;
  config?: ReportConfig;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    tags?: string[];
    itemTypes?: string[];
  };
}

/** DTO para geração de PDF a partir de HTML customizado */
export interface GeneratePDFFromHTMLDTO {
  html: string;
  filename?: string;
}

/** Resposta de preview do relatório */
export interface ReportPreviewResponse {
  success: boolean;
  html: string;
  data: ReportData;
  config: ReportConfig;
}

/** Resposta de geração de PDF */
export interface ReportPDFResponse {
  success: boolean;
  filename: string;
  size: number;
  downloadUrl?: string;
}

/** Opções para geração de PDF via Puppeteer */
export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

/** Função do OpenAI para gerar relatório */
export interface GenerateReportFunctionArgs {
  folderId?: string;
  title: string;
  subtitle?: string;
  config?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logo?: string;
  };
}

/** Resultado do processamento de função do relatório */
export interface ReportFunctionResult {
  success: boolean;
  message: string;
  reportId?: string;
  previewUrl?: string;
  error?: string;
}