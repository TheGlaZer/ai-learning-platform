import { AIService, AIModelResponse, AIServiceOptions } from './AIService';
import OpenAI from 'openai';
import promptService from './PromptService';
import aiUtils from './AIUtilsService';
import cacheService from './CacheService';

/**
 * OpenAI service implementation of the AIService interface
 */
export class OpenAIService implements AIService {
  private openai: OpenAI;
  private defaultModel: string = 'gpt-4o-mini';
  private maxRetries: number = 0; // Disabled retries by default

  /**
   * Creates a new OpenAIService instance
   * @param apiKey Optional API key (falls back to environment variable)
   * @param organizationId Optional organization ID (falls back to environment variable)
   */
  constructor(apiKey?: string, organizationId?: string) {
    const config: any = {
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    };
    
    // Only add organization if it's actually provided
    if (organizationId || process.env.OPENAI_ORGANIZATION_ID) {
      config.organization = organizationId || process.env.OPENAI_ORGANIZATION_ID;
    }
    
    this.openai = new OpenAI(config);
  }

  /**
   * Core function to generate text from the OpenAI API.
   * 
   * @param prompt - The text prompt to send to the OpenAI API
   * @param options - Configuration options including API key, model, temperature, etc.
   * @returns A promise resolving to the AI response
   */
  async generateText(prompt: string, options?: AIServiceOptions): Promise<AIModelResponse> {
    // If apiKey is provided in options, create a new instance with that key
    if (options?.apiKey && options.apiKey !== process.env.OPENAI_API_KEY) {
      const tempService = new OpenAIService(options.apiKey);
      return tempService.generateText(prompt, { ...options, apiKey: undefined });
    }
    
    // Get model and other parameters
    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature || 0.7;
    const maxTokens = options?.maxTokens || 1000;
    
    // Estimate token count and adjust parameters if needed
    const estimatedTokenCount = aiUtils.estimateTokenCount(prompt);
    const modelMaxTokens = aiUtils.getModelMaxTokens(model);
    
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
      options = { ...options, maxTokens: adjustedMaxTokens };
    }
    
    // Generate a cache key and check cache
    const cacheKey = aiUtils.generateCacheKey(prompt, model, temperature, options?.maxTokens || maxTokens);
    const cachedResponse = cacheService.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Execute the API call with retries if enabled
    return this.executeWithRetry(async () => {
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: temperature,
        max_tokens: options?.maxTokens || maxTokens,
      });

      const response = {
        content: completion.choices[0].message.content || '',
        modelUsed: completion.model,
        tokenCount: completion.usage?.total_tokens,
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
    const prompt = promptService.createQuizPrompt(
      fileContent, 
      topic, 
      numberOfQuestions, 
      difficultyLevel, 
      options, 
      userComments, 
      selectedSubjectNames, 
      previousQuestions
    );
    
    console.log("QUIZ GENERATION PROMPT LENGTH:", prompt.length);
    return this.generateText(prompt, options);
  }

  /**
   * Generates subjects from content
   */
  async generateSubjects(
    fileContent: string,
    options?: AIServiceOptions
  ): Promise<AIModelResponse> {
    // Get model being used
    const model = options?.model || this.defaultModel;
    console.log(`Using model ${model} for subject generation`);
    
    // Estimate token count of the full content
    const fileContentTokens = aiUtils.estimateTokenCount(fileContent);
    console.log(`Estimated content token count: ${fileContentTokens}`);
    
    // Adjust chunk sizes and thresholds based on the model
    const isGpt4oMini = model === 'gpt-4o-mini';
    
    // If using gpt-4o-mini, we can process larger chunks since it has higher rate limits
    const PROCESSING_THRESHOLD = isGpt4oMini ? 50000 : 10000; // 50K tokens for mini, 10K for others
    const CHUNK_SIZE = isGpt4oMini ? 150000 : 40000; // ~40K chars for regular models, ~150K for mini
    const DELAY_BETWEEN_CHUNKS = isGpt4oMini ? 2000 : 10000; // 2s for mini, 10s for others
    
    // If the content is small enough, process it in one go
    if (fileContentTokens < PROCESSING_THRESHOLD) {
      const prompt = promptService.createSubjectsPrompt(fileContent, options);
      console.log("SUBJECT GENERATION PROMPT LENGTH:", prompt.length);
      
      return this.generateText(prompt, {
        ...options,
        model: model,
        temperature: 0.2,
        maxTokens: 2000
      });
    }
    
    // For large content, we'll process it in chunks and combine the results
    console.log(`Content too large, splitting into chunks for processing with ${model}`);
    
    // Split the content into smaller chunks 
    const chunks = aiUtils.splitContentIntoChunks(fileContent, CHUNK_SIZE);
    console.log(`Split content into ${chunks.length} chunks`);
    
    // Process each chunk with appropriate delay between requests
    let allSubjects: any[] = [];
    // Keep track of retry counts for each chunk
    const retryMap = new Map<number, number>();
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i+1} of ${chunks.length}`);
      
      // Create prompt for this chunk
      const chunkPrompt = promptService.createSubjectsPrompt(
        chunks[i], 
        {
          ...options,
          // Pass all previously found subjects to avoid duplicates
          existingSubjects: [
            ...(options?.existingSubjects || []),
            ...allSubjects
          ]
        }
      );
      
      console.log(`Chunk ${i+1} prompt length: ${chunkPrompt.length}`);
      
      try {
        // Process this chunk - if we're on the first chunk, proceed immediately
        // For subsequent chunks, add delay based on the model
        if (i > 0) {
          console.log(`Waiting ${DELAY_BETWEEN_CHUNKS}ms before processing next chunk (using ${model})...`);
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS));
        }
        
        // Process this chunk
        const chunkResponse = await this.generateText(chunkPrompt, {
          ...options,
          model: model,
          temperature: 0.2,
          maxTokens: 2000
        });
        
        // Parse the subjects from this chunk
        let chunkSubjects: any[] = [];
        try {
          // Clean the response content
          let cleanedContent = chunkResponse.content;
          cleanedContent = cleanedContent.replace(/```json\s*/g, '');
          cleanedContent = cleanedContent.replace(/```\s*/g, '');
          cleanedContent = cleanedContent.trim();
          
          // Parse the JSON
          const parsedSubjects = JSON.parse(cleanedContent);
          
          if (Array.isArray(parsedSubjects)) {
            chunkSubjects = parsedSubjects.filter(subject => subject && typeof subject === 'object' && subject.name);
            console.log(`Found ${chunkSubjects.length} subjects in chunk ${i+1}`);
            
            // Add these subjects to our master list
            allSubjects = [...allSubjects, ...chunkSubjects];
          }
        } catch (parseError) {
          console.error(`Failed to parse chunk ${i+1} response:`, parseError);
        }
      } catch (chunkError: any) {
        // Better error handling for rate limits
        if (chunkError.status === 429 || (chunkError.message && chunkError.message.includes('rate limit'))) {
          const retryDelay = isGpt4oMini ? 20000 : 60000; // 20s for mini, 60s for others
          const MAX_RETRIES = 3; // Maximum number of retries for rate limit errors
          
          // Track retries for this chunk using the retry map
          const currentRetryCount = retryMap.get(i) || 0;
          const newRetryCount = currentRetryCount + 1;
          retryMap.set(i, newRetryCount);
          
          // Check if we've exceeded max retries
          if (newRetryCount > MAX_RETRIES) {
            console.error(`Maximum retries (${MAX_RETRIES}) exceeded for chunk ${i+1}. Skipping to next chunk.`);
            continue; // Skip to next chunk
          }
          
          console.error(`Rate limit exceeded on chunk ${i+1}. Retry ${newRetryCount}/${MAX_RETRIES}. Waiting ${retryDelay/1000} seconds before retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Try this chunk again
          i--; // Decrement i to retry the current chunk
          continue;
        }
        
        console.error(`Error processing chunk ${i+1}:`, chunkError);
        // Continue with next chunk for other types of errors
      }
    }
    
    // Combine all subjects
    console.log(`Total subjects found across all chunks: ${allSubjects.length}`);
    
    // Deduplicate subjects by name (case insensitive)
    const uniqueSubjects = aiUtils.deduplicateSubjects(allSubjects);
    console.log(`After deduplication: ${uniqueSubjects.length} unique subjects`);
    
    // Return a response object with the combined unique subjects
    return {
      content: JSON.stringify(uniqueSubjects),
      modelUsed: model,
      tokenCount: undefined // We don't have an exact count for the combined process
    };
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
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        console.error(`Attempt ${attempt + 1}/${this.maxRetries} failed:`, error);
        lastError = error;
        
        // If it's a rate limit error, wait and retry
        if (error.status === 429) {
          // Get retry-after header if available or use exponential backoff
          const retryAfter = error.headers?.['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
          
          console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Exponential backoff with jitter for next attempt
          delay = delay * 2 * (0.8 + Math.random() * 0.4);
        } else {
          // For non-rate-limit errors, don't retry
          break;
        }
      }
    }
    
    // Enhanced error handling
    if (lastError) {
      console.error('Error generating text with OpenAI after retries:', lastError);
      
      // Check for quota exceeded errors specifically
      if ((lastError as any).status === 429) {
        throw new Error(
          'OpenAI API rate limit exceeded after multiple retries. This could indicate: ' +
          '1. Your usage exceeds your current tier\'s rate limits\n' +
          '2. You need to verify your payment method or check for billing issues\n' +
          '3. Your organization has reached its shared rate limit\n' +
          'Please check your OpenAI dashboard and billing details.'
        );
      } else if ((lastError as any).status) {
        throw new Error(`OpenAI API error (${(lastError as any).status}): ${lastError.message || 'Unknown error'}`);
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