/**
 * AI Quiz Generation - Main Exports
 */

// Main quiz generator
export {
  OpenRouterQuizGenerator,
  createQuizGenerator,
  type GenerationResult,
  type GenerationError,
} from './openrouter-client';

// Configuration types and helpers
export {
  type ModelConfig,
  type AIGenerationConfig,
  DEFAULT_AI_CONFIG,
  loadAIConfig,
  getActiveModels,
  validateModelConfig,
} from './model-config';

// Prompt builders
export { buildCisspQuizPrompt, isValidQuizResponse } from './prompts';
