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

  // Aceitar novos campos no futuro
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
   🔥 WORKSPACE / FOLDERS (NOVO)
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