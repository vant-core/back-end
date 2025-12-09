import axios from 'axios';
import openAIConfig from '../config/openAi.config';
import { OpenAIMessage, OpenAIResponse } from '../types/user';

class OpenAIService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private systemPrompt: string;

  constructor() {
    this.apiKey = openAIConfig.apiKey;
    this.apiUrl = openAIConfig.apiUrl;
    this.model = openAIConfig.model;
    this.systemPrompt = openAIConfig.systemPrompt;
  }

  async sendMessage(messages: OpenAIMessage[]): Promise<OpenAIResponse> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error: any) {
      console.error('🔥 STATUS:', error.response?.status);
      console.error('🔥 ERROR DATA:', JSON.stringify(error.response?.data, null, 2));
      console.error('🔥 ERROR HEADERS:', JSON.stringify(error.response?.headers, null, 2));
      throw error;
    }
  }

  async chat(
    userMessage: string,
    conversationHistory: OpenAIMessage[] = [],
    ragContext: string | null = null
  ): Promise<OpenAIResponse> {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: this.systemPrompt }
    ];

    if (ragContext) {
      messages.push({
        role: 'system',
        content: `Contexto dos documentos:\n\n${ragContext}`
      });
    }

    messages.push(...conversationHistory);

    messages.push({
      role: 'user',
      content: userMessage
    });

    return await this.sendMessage(messages);
  }
}

export default new OpenAIService();
