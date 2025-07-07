import { AIService, AIModelResponse, AIServiceOptions } from './AIService';
import Anthropic from '@anthropic-ai/sdk';
import promptService from './PromptService';
import aiUtils from './AIUtilsService';
import cacheService from './CacheService';
import { AIServiceFactory } from './AIServiceFactory';

/**
 * Anthropic service implementation of the AIService interface
 */
export class AnthropicService implements AIService {
  private anthropic: Anthropic;
  private defaultModel: string = 'claude-3-haiku-20240307';
  private maxRetries: number = 0; // Disabled retries by default

  /**
   * Creates a new AnthropicService instance
   * @param apiKey Optional API key (falls back to environment variable)
   */
  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    
    // Configure max retries from environment variable if set
    if (process.env.CLAUDE_MAX_RETRIES) {
      const configuredRetries = parseInt(process.env.CLAUDE_MAX_RETRIES);
      if (!isNaN(configuredRetries) && configuredRetries >= 0) {
        console.log(`Setting Claude max retries to ${configuredRetries} from environment variable`);
        this.maxRetries = configuredRetries;
      }
    }
  }

  /**
   * Core function to generate text from the Anthropic API.
   * 
   * @param prompt - The text prompt to send to the Anthropic API
   * @param options - Configuration options including API key, model, temperature, etc.
   * @returns A promise resolving to the AI response
   */
  async generateText(prompt: string, options?: AIServiceOptions): Promise<AIModelResponse> {
    // If apiKey is provided in options, create a new instance with that key
    if (options?.apiKey && options.apiKey !== process.env.ANTHROPIC_API_KEY) {
      const tempService = new AnthropicService(options.apiKey);
      return tempService.generateText(prompt, { ...options, apiKey: undefined });
    }
    
    // Get model and other parameters
    let model = options?.model || this.defaultModel;
    
    // Validate model is a Claude model
    if (!this.isValidClaudeModel(model)) {
      console.warn(`Warning: Model ${model} is not a valid Claude model. Falling back to ${this.defaultModel}`);
      model = this.defaultModel;
    }
    
    const temperature = options?.temperature || 0.7;
    let maxTokens = options?.maxTokens || 1000;
    
    // Get the model's max output token limit
    const modelMaxOutputTokens = this.getModelMaxOutputTokens(model);
    
    // Cap maxTokens to model's output limit
    if (maxTokens > modelMaxOutputTokens) {
      console.warn(`Requested max_tokens (${maxTokens}) exceeds model limit (${modelMaxOutputTokens}). Capping to ${modelMaxOutputTokens}.`);
      maxTokens = modelMaxOutputTokens - 100; // Leave 100 token buffer
    }
    
    // Estimate token count and adjust parameters if needed
    const estimatedTokenCount = aiUtils.estimateTokenCount(prompt);
    const modelMaxTokens = this.getModelMaxTokens(model);
    
    // Check if our prompt might exceed the model's context limit
    if (estimatedTokenCount + maxTokens > modelMaxTokens) {
      console.warn(`WARNING: Estimated prompt token count (${estimatedTokenCount}) + requested max tokens (${maxTokens}) exceeds model limit (${modelMaxTokens})`);
      
      // If we're clearly over the limit, throw an error rather than failing API call
      if (estimatedTokenCount > modelMaxTokens * 0.9) {
        throw new Error(`Content too large for ${model}. Please reduce content length or use a model with larger context window.`);
      }
      
      // Otherwise adjust max_tokens to fit within the model's limit
      const adjustedMaxTokens = Math.max(100, modelMaxTokens - estimatedTokenCount - 100); // Leave 100 token buffer
      console.log(`Adjusting max_tokens from ${maxTokens} to ${adjustedMaxTokens} to fit within model context limit`);
      maxTokens = adjustedMaxTokens;
    }
    
    // Generate a cache key and check cache
    const cacheKey = aiUtils.generateCacheKey(prompt, model, temperature, maxTokens);
    const cachedResponse = cacheService.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Execute the API call with retries if enabled
    return this.executeWithRetry(async () => {
      console.log(`Calling Anthropic API with model: ${model}`);
      
      // Create clean request parameters
      const requestParams = {
        model,
        messages: [{ role: 'user' as const, content: prompt }],
        temperature,
        max_tokens: maxTokens
      };
      
      // Log the request parameters for debugging
      console.log('API request parameters:', JSON.stringify({
        model: requestParams.model,
        temperature: requestParams.temperature,
        max_tokens: requestParams.max_tokens,
        messages_length: requestParams.messages.length
      }));
      
      // Call the API with the clean parameters
      const message = await this.anthropic.messages.create(requestParams);

      console.log('--------------------------------');
      console.log('Anthropic response:', message);
      console.log('--------------------------------');

      // Extract the text content from the first content block
      let content = '';
      if (Array.isArray(message.content) && message.content.length > 0) {
        const firstBlock = message.content[0];
        if ('text' in firstBlock) {
          content = firstBlock.text;
        }
      }

      const response = {
        content,
        modelUsed: message.model,
        tokenCount: message.usage?.input_tokens + message.usage?.output_tokens,
      };

      // Cache the successful response
      cacheService.set(cacheKey, response);
      
      return response;
    });
  }

  /**
   * Generates a quiz based on provided content and parameters
   */
  async generateQuiz(
    fileContent: string, 
    topic: string, 
    numberOfQuestions: number, 
    difficultyLevel: string,
    options?: AIServiceOptions,
    userComments?: string,
    selectedSubjectNames?: string[],
    previousQuestions?: string[]
  ): Promise<AIModelResponse> {
    // Create a prompt that specifically asks for valid JSON formatting
    let enhancedPrompt = promptService.createQuizPrompt(
      fileContent, 
      topic, 
      numberOfQuestions, 
      difficultyLevel, 
      options, 
      userComments, 
      selectedSubjectNames, 
      previousQuestions
    );
    
    // Add special instructions for JSON formatting to handle RTL text
    enhancedPrompt += `\n\nVERY IMPORTANT: Your response MUST be VALID JSON ONLY, with NO additional text or markdown formatting.

SPECIAL INSTRUCTIONS FOR HEBREW/RTL TEXT IN JSON:
1. All quotes must be properly escaped within strings, especially within Hebrew text
2. All brackets {}, braces [], and commas must be properly balanced and located
3. Do not include any Unicode control characters or directional indicators (like U+202B, U+202E, etc.)
4. Ensure all Hebrew text is properly UTF-8 encoded without control character insertions
5. Every property name must be enclosed in double quotes
6. Every string value must be enclosed in double quotes
7. Follow strict JSON syntax - no trailing commas, no single quotes for keys/values

Example of properly formatted Hebrew text in JSON:
{
  "question": "שאלה בעברית עם \"מרכאות כפולות\" שהן מוברחות כראוי",
  "options": [
    {"id": "א", "text": "תשובה אפשרית ראשונה"}
  ]
}

Return ONLY the complete JSON object with no explanations before or after.`;
    
    console.log("QUIZ GENERATION PROMPT LENGTH:", enhancedPrompt.length);
    console.log("Using Claude model (in generateQuiz before options applied):", this.defaultModel);
    
    // For quiz generation, we need a much larger max_tokens to ensure the JSON response is not truncated
    // Each question can take ~250-500 tokens when formatted as JSON with explanations
    const estimatedRequiredTokens = 1000 + (numberOfQuestions * 500);
    
    // Get the model to use (either from options or default)
    const modelToUse = options?.model || this.defaultModel;
    
    // Get the model-specific max output token limit
    const maxTokenLimit = this.getModelMaxOutputTokens(modelToUse);
    console.log(`Using ${modelToUse} with max output token limit of ${maxTokenLimit}`);
    
    // Cap the tokens to the model's limit
    const requestedTokens = Math.min(estimatedRequiredTokens, maxTokenLimit - 100); // Leave 100 token buffer
    console.log(`Setting max_tokens to ${requestedTokens} for quiz generation (capped to model limit)`);
    
    // Make sure we're explicitly setting the model to the current default with adequate tokens
    const quizOptions = {
      ...options,
      model: this.defaultModel,
      maxTokens: Math.max(options?.maxTokens || 0, requestedTokens)
    };
    
    return this.generateText(enhancedPrompt, quizOptions);
  }

  /**
   * Generates subject extraction from file content
   */
  async generateSubjects(fileContent: string, options?: AIServiceOptions): Promise<AIModelResponse> {
    const prompt = promptService.createSubjectsPrompt(fileContent, options);
    
    console.log("SUBJECT EXTRACTION PROMPT LENGTH:", prompt.length);
    console.log("Using Claude model (in generateSubjects before options applied):", this.defaultModel);
    
    // For subject extraction, ensure we have enough tokens for the response
    // This is less than quiz generation but still needs adequate space
    const estimatedRequiredTokens = 2000;
    console.log(`Setting max_tokens to ${estimatedRequiredTokens} for subject extraction to prevent truncation`);
    
    // Make sure we're explicitly setting the model to the current default with adequate tokens
    const subjectOptions = {
      ...options,
      model: this.defaultModel,
      maxTokens: Math.max(options?.maxTokens || 0, estimatedRequiredTokens)
    };
    
    return this.generateText(prompt, subjectOptions);
  }

  /**
   * Gets the maximum token limit for Claude models context window
   * @param model Model name
   * @returns Maximum token limit for the model's context window
   */
  private getModelMaxTokens(model: string): number {
    const modelLimits: Record<string, number> = {
      // Claude 3.5 models (latest)
      'claude-3-5-sonnet-20240620': 200000,
      
      // Current Claude 3 models
      'claude-3-opus-20240229': 200000,
      'claude-3-sonnet-20240229': 200000,
      'claude-3-haiku-20240307': 200000,
      
      // Legacy Claude models
      'claude-2.1': 100000,
      'claude-2.0': 100000,
      'claude-instant-1.2': 100000,
    };
    
    // Use model-specific limit or default to 100000 if unknown
    return modelLimits[model] || 100000;
  }

  /**
   * Gets the maximum output token limit for Claude models
   * @param model Model name
   * @returns Maximum output token limit for the model
   */
  private getModelMaxOutputTokens(model: string): number {
    const outputTokenLimits: Record<string, number> = {
      // Claude 3.5 models have 8,192 output token limit
      'claude-3-5-sonnet-20240620': 8192,
      
      // Claude 3 models have 4,096 output token limit
      'claude-3-opus-20240229': 4096,
      'claude-3-sonnet-20240229': 4096,
      'claude-3-haiku-20240307': 4096,
      
      // Legacy Claude models have various limits
      'claude-2.1': 4096,
      'claude-2.0': 4096,
      'claude-instant-1.2': 4096,
    };
    
    // Use model-specific limit or default to 4096 if unknown
    return outputTokenLimits[model] || 4096;
  }

  /**
   * Validates if a model is a supported Claude model
   * @param model Model name to validate
   * @returns True if it's a valid Claude model, false otherwise
   */
  private isValidClaudeModel(model: string): boolean {
    // List of supported Claude models as of current API documentation
    const validModels = [
      // Claude 3.5 models (latest)
      'claude-3-5-sonnet-20240620',
      
      // Claude 3 models (current)
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229', 
      'claude-3-haiku-20240307',
      
      // Legacy Claude models
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
    
    return validModels.includes(model) || model.startsWith('claude-');
  }

  /**
   * Executes an operation with retry logic for handling rate limits
   * @param operation Async operation to execute
   * @returns Result of the operation
   */
  private async executeWithRetry(operation: () => Promise<AIModelResponse>): Promise<AIModelResponse> {
    if (this.maxRetries <= 0) {
      return operation();
    }

    let lastError: Error | null = null;
    let delay = 1000; // Start with a 1 second delay
    const maxRetries = Math.max(3, this.maxRetries); // Ensure at least 3 retries for overloaded errors
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);
        lastError = error;
        
        // If it's a rate limit error or service overloaded error, wait and retry
        if (error.status === 429 || error.status === 529) {
          // Get retry-after header if available or use exponential backoff
          const retryAfter = error.headers?.['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
          
          const errorType = error.status === 429 ? 'Rate limited' : 'Service overloaded';
          console.log(`${errorType}. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Exponential backoff with jitter for next attempt (longer for overloaded errors)
          const backoffFactor = error.status === 529 ? 3 : 2; // Longer backoff for overloaded errors
          delay = delay * backoffFactor * (0.8 + Math.random() * 0.4);
        } else {
          // For non-retryable errors, don't retry
          break;
        }
      }
    }
    
    // Enhanced error handling
    if (lastError) {
      console.error('Error generating text with Anthropic after retries:', lastError);
      
      // Check for specific error types
      if ((lastError as any).status === 429) {
        throw new Error(
          'Anthropic API rate limit exceeded after multiple retries. This could indicate: ' +
          '1. Your usage exceeds your current tier\'s rate limits\n' +
          '2. You need to verify your payment method or check for billing issues\n' +
          'Please check your Anthropic dashboard and billing details.'
        );
      } else if ((lastError as any).status === 529) {
        throw new Error(
          'Anthropic API is currently overloaded. This is a temporary issue on Anthropic\'s side.\n' +
          'Please try again in a few minutes when their servers are less busy.'
        );
      } else if ((lastError as any).status) {
        throw new Error(`Anthropic API error (${(lastError as any).status}): ${lastError.message || 'Unknown error'}`);
      } else {
        throw new Error('Failed to generate text with AI service: ' + (lastError.message || 'Unknown error'));
      }
    }
    
    throw new Error('Failed to generate text after maximum retries');
  }

  /**
   * Sets the number of retries for API calls
   * @param retries Number of retries
   */
  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }

  /**
   * Sets the default model
   * @param model Model name
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
  }
} 