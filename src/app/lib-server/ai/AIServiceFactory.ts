import { AIService } from './AIService';
import { OpenAIService } from './OpenAIService';

export type AIProviderType = 'openai' | 'azure' | 'anthropic' | 'other';

export class AIServiceFactory {
  static createService(providerType: AIProviderType, apiKey?: string): AIService {
    switch (providerType) {
      case 'openai':
        return new OpenAIService(apiKey);
      // Additional implementations can be added here
      // case 'azure':
      //   return new AzureAIService(apiKey);
      // case 'anthropic':
      //   return new AnthropicService(apiKey);
      default:
        return new OpenAIService(apiKey);
    }
  }
}