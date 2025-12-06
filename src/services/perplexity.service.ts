import axios from 'axios';
import perplexityConfig from '../config/perplexity.config';
import { PerplexityMessage, PerplexityResponse } from '../types/user';

class PerplexityService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private systemPrompt: string;

  constructor() {
    this.apiKey = perplexityConfig.apiKey;
    this.apiUrl = perplexityConfig.apiUrl;
    this.model = perplexityConfig.model;
    this.systemPrompt = perplexityConfig.systemPrompt;
  }

  async sendMessage(messages: PerplexityMessage[]): Promise<PerplexityResponse> {
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
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error: any) {
      console.error("🔥 STATUS:", error.response?.status);
      console.error("🔥 ERROR DATA:", JSON.stringify(error.response?.data, null, 2));
      console.error("🔥 ERROR HEADERS:", JSON.stringify(error.response?.headers, null, 2));
      throw error;
    }
  }

  async chat(
    userMessage: string,
    conversationHistory: PerplexityMessage[] = [],
    ragContext: string | null = null
  ): Promise<PerplexityResponse> {

    const messages: PerplexityMessage[] = [
      { role: "system", content: this.systemPrompt }
    ];

    if (ragContext) {
      messages.push({
        role: "system",
        content: `CONTEXT FROM INTERNAL DOCUMENTS:\n\n${ragContext}`
      });
    }

    messages.push(...conversationHistory);

    messages.push({
      role: "user",
      content: userMessage
    });

    return await this.sendMessage(messages);
  }
}

export default new PerplexityService();
