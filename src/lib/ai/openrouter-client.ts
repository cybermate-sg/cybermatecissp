import OpenAI from 'openai';
import { QuizFile, validateQuizFile } from '@/lib/validations/quiz';
import { buildCisspQuizPrompt, isValidQuizResponse } from './prompts';
import {
  AIGenerationConfig,
  ModelConfig,
  loadAIConfig,
  getActiveModels,
  validateModelConfig,
} from './model-config';

export interface GenerationResult {
  questions: QuizFile;
  tokensUsed: number;
  costUsd: number;
  responseTimeMs: number;
  rawResponse?: string; // For debugging
}

export interface GenerationError {
  message: string;
  code: 'TIMEOUT' | 'INVALID_RESPONSE' | 'API_ERROR' | 'VALIDATION_ERROR' | 'PARSE_ERROR';
  details?: string;
}

export class OpenRouterQuizGenerator {
  private client: OpenAI;
  private config: AIGenerationConfig;
  private activeModels: ModelConfig[];

  constructor(apiKey: string, config?: AIGenerationConfig) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    // Load configuration (custom or default)
    this.config = config || loadAIConfig();

    // Validate configuration
    const validation = validateModelConfig(this.config);
    if (!validation.valid) {
      console.error('[AI Quiz] Invalid model configuration:', validation.errors);
      throw new Error(`Invalid AI model configuration: ${validation.errors.join(', ')}`);
    }

    // Get active models sorted by priority
    this.activeModels = getActiveModels(this.config);
    console.log(
      `[AI Quiz] Initialized with ${this.activeModels.length} models:`,
      this.activeModels.map(m => `${m.name} (${m.id})`).join(', ')
    );

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://cisspmastery.com',
        'X-Title': 'CISSP Mastery - AI Quiz Generator',
      },
    });
  }

  /**
   * Generates CISSP quiz questions using AI
   * Tries multiple free models as fallback if one fails
   */
  async generateQuizQuestions(
    topic: string,
    questionCount: number
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const prompt = buildCisspQuizPrompt({ topic, questionCount });
    let lastError: Error | null = null;

    // Try each model in order until one succeeds
    for (const modelConfig of this.activeModels) {
      try {
        console.log(`[AI Quiz] Trying model: ${modelConfig.name} (${modelConfig.id})`);

        // Call OpenRouter API with timeout
        const response = await this.callWithTimeout(prompt, modelConfig);

        // Calculate response time
        const responseTimeMs = Date.now() - startTime;

        // Parse and validate the response
        const parsedQuestions = this.parseResponse(response.content);

        // Validate against quiz schema
        const validation = validateQuizFile(parsedQuestions);
        if (!validation.success) {
          throw this.createError(
            'VALIDATION_ERROR',
            'Generated questions failed validation',
            validation.error
          );
        }

        // Extract usage info
        const tokensUsed = response.usage?.total_tokens || 0;
        const costUsd = this.estimateCost(tokensUsed, modelConfig);

        console.log(`[AI Quiz] Successfully generated with model: ${modelConfig.name}`);

        return {
          questions: validation.data,
          tokensUsed,
          costUsd,
          responseTimeMs,
          rawResponse: response.content,
        };
      } catch (error) {
        lastError = error as Error;

        // Check error type
        const errorCode = error instanceof Error && 'code' in error
          ? (error as Error & { code: string }).code
          : null;

        // Don't retry with other models for these errors (they won't help)
        if (errorCode === 'VALIDATION_ERROR' || errorCode === 'PARSE_ERROR') {
          console.log(`[AI Quiz] Model ${modelConfig.name} failed with ${errorCode}, not retrying with other models`);
          throw error;
        }

        // For rate limits, not found, timeouts, or other API errors - try next model
        const shouldTryNextModel =
          (error instanceof Error && error.message.includes('429')) ||
          (error instanceof Error && error.message.includes('404')) ||
          errorCode === 'TIMEOUT' ||
          errorCode === 'API_ERROR' ||
          errorCode === 'INVALID_RESPONSE';

        if (shouldTryNextModel) {
          const reason = errorCode || 'API error';
          console.log(`[AI Quiz] Model ${modelConfig.name} failed (${reason}), trying next model...`);
          continue; // Try next model
        }

        // Unknown error - log and try next model anyway
        console.log(`[AI Quiz] Model ${modelConfig.name} failed with unknown error, trying next model...`);
      }
    }

    // All models failed
    throw lastError || this.createError(
      'API_ERROR',
      'All AI models failed to generate quiz questions',
      'Please try again later or contact support'
    );
  }

  /**
   * Calls OpenRouter API with timeout protection
   */
  private async callWithTimeout(prompt: string, modelConfig: ModelConfig): Promise<{
    content: string;
    usage?: { total_tokens: number };
  }> {
    const timeoutMs = modelConfig.timeoutMs || this.config.defaultTimeoutMs;
    const temperature = modelConfig.temperature ?? this.config.defaultTemperature;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          this.createError(
            'TIMEOUT',
            `Request timed out after ${timeoutMs}ms`,
            'The AI model took too long to respond. Please try again with fewer questions.'
          )
        );
      }, timeoutMs);
    });

    const apiCall = async () => {
      const completion = await this.client.chat.completions.create({
        model: modelConfig.id,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: 'Generate the CISSP practice questions in the specified JSON format.',
          },
        ],
        temperature,
        response_format: { type: 'json_object' },
        ...(modelConfig.maxTokens && { max_tokens: modelConfig.maxTokens }),
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw this.createError(
          'INVALID_RESPONSE',
          'AI returned empty response',
          'No content in API response'
        );
      }

      return {
        content,
        usage: completion.usage,
      };
    };

    return Promise.race([apiCall(), timeoutPromise]);
  }

  /**
   * Parses the AI response into quiz format
   */
  private parseResponse(content: string): unknown {
    try {
      // Remove potential markdown code blocks
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleaned);

      // Validate basic structure
      if (!isValidQuizResponse(parsed)) {
        throw this.createError(
          'INVALID_RESPONSE',
          'AI response does not match expected quiz format',
          'Missing required fields or invalid structure'
        );
      }

      return parsed;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw our custom errors
      }

      throw this.createError(
        'PARSE_ERROR',
        'Failed to parse AI response as JSON',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Estimates cost based on token usage
   * Note: Free models have $0 cost, but we track for monitoring
   */
  private estimateCost(tokens: number, modelConfig: ModelConfig): number {
    const costPer1kTokens = modelConfig.costPer1kTokens ?? 0;
    return (tokens / 1000) * costPer1kTokens;
  }

  /**
   * Creates a structured error with code
   */
  private createError(
    code: GenerationError['code'],
    message: string,
    details?: string
  ): Error & { code: GenerationError['code']; details?: string } {
    const error = new Error(message) as Error & {
      code: GenerationError['code'];
      details?: string;
    };
    error.code = code;
    error.details = details;
    return error;
  }

  /**
   * Retries the generation with exponential backoff
   */
  async generateWithRetry(
    topic: string,
    questionCount: number
  ): Promise<GenerationResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.generateQuizQuestions(topic, questionCount);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on validation errors or parse errors
        if (
          lastError &&
          'code' in lastError &&
          (lastError.code === 'VALIDATION_ERROR' ||
            lastError.code === 'PARSE_ERROR')
        ) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          console.log(`[AI Quiz] Retry attempt ${attempt + 1} after ${delay}ms delay...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Generation failed after retries');
  }

  /**
   * Get current configuration (useful for debugging)
   */
  getConfig(): AIGenerationConfig {
    return this.config;
  }

  /**
   * Get active models (useful for debugging)
   */
  getActiveModels(): ModelConfig[] {
    return this.activeModels;
  }
}

/**
 * Factory function to create a generator instance
 */
export function createQuizGenerator(apiKey?: string): OpenRouterQuizGenerator {
  const key = apiKey || process.env.OPENROUTER_API_KEY;

  if (!key) {
    throw new Error(
      'OPENROUTER_API_KEY not found in environment variables or not provided'
    );
  }

  return new OpenRouterQuizGenerator(key);
}
