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
   (para garantir consistência com Prisma + controller)
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
