/**
 * AI Model Configuration
 * Supports dynamic model selection and fallback strategies
 */

export interface ModelConfig {
  /** Model identifier from OpenRouter */
  id: string;
  /** Display name for logging */
  name: string;
  /** Priority (lower = try first) */
  priority: number;
  /** Whether this model is enabled */
  enabled: boolean;
  /** Timeout in milliseconds for this specific model */
  timeoutMs?: number;
  /** Maximum tokens for this model */
  maxTokens?: number;
  /** Temperature setting (0-1) */
  temperature?: number;
  /** Cost per 1k tokens (for monitoring) */
  costPer1kTokens?: number;
}

export interface AIGenerationConfig {
  /** List of models to try in order */
  models: ModelConfig[];
  /** Default timeout if model doesn't specify */
  defaultTimeoutMs: number;
  /** Default temperature */
  defaultTemperature: number;
  /** Maximum retries per model */
  maxRetries: number;
}

/**
 * Default configuration - can be overridden by environment or database
 */
export const DEFAULT_AI_CONFIG: AIGenerationConfig = {
  defaultTimeoutMs: 60000,
  defaultTemperature: 0.7,
  maxRetries: 1,
  models: [
    {
      id: 'meta-llama/llama-3.2-3b-instruct:free',
      name: 'Llama 3.2 3B',
      priority: 1,
      enabled: true,
      timeoutMs: 45000, // Faster model, shorter timeout
      temperature: 0.7,
      costPer1kTokens: 0,
    },
    {
      id: 'mistralai/mistral-7b-instruct:free',
      name: 'Mistral 7B',
      priority: 2,
      enabled: true,
      timeoutMs: 60000,
      temperature: 0.7,
      costPer1kTokens: 0,
    },
    {
      id: 'google/gemini-2.0-flash-exp:free',
      name: 'Gemini 2.0 Flash',
      priority: 3,
      enabled: true,
      timeoutMs: 45000,
      temperature: 0.7,
      costPer1kTokens: 0,
    },
    {
      id: 'qwen/qwen-2-7b-instruct:free',
      name: 'Qwen 2 7B',
      priority: 4,
      enabled: true,
      timeoutMs: 60000,
      temperature: 0.7,
      costPer1kTokens: 0,
    },
  ],
};

/**
 * Loads AI configuration from environment variables or returns default
 */
export function loadAIConfig(): AIGenerationConfig {
  // Check for environment variable override
  const configEnv = process.env.AI_MODEL_CONFIG;

  if (configEnv) {
    try {
      const customConfig = JSON.parse(configEnv) as Partial<AIGenerationConfig>;
      return mergeConfig(DEFAULT_AI_CONFIG, customConfig);
    } catch (error) {
      console.warn('[AI Config] Failed to parse AI_MODEL_CONFIG, using defaults:', error);
    }
  }

  // Check for individual model overrides
  const enabledModels = process.env.AI_MODELS_ENABLED?.split(',').map(s => s.trim());
  if (enabledModels) {
    return {
      ...DEFAULT_AI_CONFIG,
      models: DEFAULT_AI_CONFIG.models.map(model => ({
        ...model,
        enabled: enabledModels.includes(model.id) || enabledModels.includes(model.name),
      })),
    };
  }

  return DEFAULT_AI_CONFIG;
}

/**
 * Merges custom config with default config
 */
function mergeConfig(
  defaultConfig: AIGenerationConfig,
  customConfig: Partial<AIGenerationConfig>
): AIGenerationConfig {
  return {
    defaultTimeoutMs: customConfig.defaultTimeoutMs ?? defaultConfig.defaultTimeoutMs,
    defaultTemperature: customConfig.defaultTemperature ?? defaultConfig.defaultTemperature,
    maxRetries: customConfig.maxRetries ?? defaultConfig.maxRetries,
    models: customConfig.models?.length
      ? customConfig.models
      : defaultConfig.models,
  };
}

/**
 * Gets active models sorted by priority
 */
export function getActiveModels(config: AIGenerationConfig): ModelConfig[] {
  return config.models
    .filter(model => model.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Validates model configuration
 */
// codacy-disable-next-line Lizard_ccn-medium
export function validateModelConfig(config: AIGenerationConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.models || config.models.length === 0) {
    errors.push('No models configured');
  }

  const activeModels = getActiveModels(config);
  if (activeModels.length === 0) {
    errors.push('No enabled models found');
  }

  if (config.defaultTimeoutMs < 1000 || config.defaultTimeoutMs > 300000) {
    errors.push('defaultTimeoutMs must be between 1000 and 300000');
  }

  if (config.defaultTemperature < 0 || config.defaultTemperature > 1) {
    errors.push('defaultTemperature must be between 0 and 1');
  }

  // Check for duplicate priorities
  const priorities = config.models.map(m => m.priority);
  const duplicates = priorities.filter((p, i) => priorities.indexOf(p) !== i);
  if (duplicates.length > 0) {
    console.warn('[AI Config] Warning: Duplicate priorities found:', duplicates);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
