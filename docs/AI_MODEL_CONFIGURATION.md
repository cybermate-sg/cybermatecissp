# AI Model Configuration Guide

This guide explains how to dynamically configure AI models for quiz generation in CISSP Mastery.

## Overview

The AI quiz generation system supports multiple models with automatic fallback. You can configure models via:

1. **Environment Variables** (Simple)
2. **JSON Configuration** (Advanced)
3. **Code/Database** (Future extensibility)

## Quick Start

### Default Configuration

By default, the system uses 4 free OpenRouter models in priority order:

1. `meta-llama/llama-3.2-3b-instruct:free` (45s timeout)
2. `mistralai/mistral-7b-instruct:free` (60s timeout)
3. `google/gemini-2.0-flash-exp:free` (45s timeout)
4. `qwen/qwen-2-7b-instruct:free` (60s timeout)

The system automatically tries each model until one succeeds.

## Configuration Methods

### Method 1: Enable/Disable Specific Models (Simple)

Add to your `.env.local`:

```bash
# Only use these models
AI_MODELS_ENABLED=meta-llama/llama-3.2-3b-instruct:free,google/gemini-2.0-flash-exp:free
```

You can use either model IDs or display names:

```bash
# Using display names
AI_MODELS_ENABLED=Llama 3.2 3B,Gemini 2.0 Flash
```

### Method 2: Full JSON Configuration (Advanced)

For complete control, use `AI_MODEL_CONFIG`:

```bash
AI_MODEL_CONFIG='{"models":[{"id":"meta-llama/llama-3.2-3b-instruct:free","name":"Llama 3.2","priority":1,"enabled":true,"timeoutMs":45000,"temperature":0.7,"costPer1kTokens":0}],"defaultTimeoutMs":60000,"defaultTemperature":0.7,"maxRetries":1}'
```

Better: Create a config file and load it:

```javascript
// config/ai-models.json
{
  "defaultTimeoutMs": 60000,
  "defaultTemperature": 0.7,
  "maxRetries": 1,
  "models": [
    {
      "id": "meta-llama/llama-3.2-3b-instruct:free",
      "name": "Llama 3.2 3B",
      "priority": 1,
      "enabled": true,
      "timeoutMs": 45000,
      "temperature": 0.7,
      "costPer1kTokens": 0
    },
    {
      "id": "mistralai/mistral-7b-instruct:free",
      "name": "Mistral 7B",
      "priority": 2,
      "enabled": true,
      "timeoutMs": 60000,
      "temperature": 0.7,
      "costPer1kTokens": 0
    }
  ]
}
```

Then load it in code:

```javascript
import aiConfig from './config/ai-models.json';
const generator = new OpenRouterQuizGenerator(apiKey, aiConfig);
```

## Configuration Schema

### `AIGenerationConfig`

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `models` | `ModelConfig[]` | Array of model configurations | See defaults |
| `defaultTimeoutMs` | `number` | Default timeout in milliseconds | `60000` |
| `defaultTemperature` | `number` | Default temperature (0-1) | `0.7` |
| `maxRetries` | `number` | Maximum retry attempts | `1` |

### `ModelConfig`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | OpenRouter model ID |
| `name` | `string` | ✅ | Display name for logging |
| `priority` | `number` | ✅ | Priority (lower = try first) |
| `enabled` | `boolean` | ✅ | Whether model is active |
| `timeoutMs` | `number` | ❌ | Model-specific timeout |
| `maxTokens` | `number` | ❌ | Maximum tokens to generate |
| `temperature` | `number` | ❌ | Temperature (0-1) |
| `costPer1kTokens` | `number` | ❌ | Cost per 1k tokens (monitoring) |

## How Fallback Works

When generating a quiz:

1. **Try models in priority order** (lowest priority number first)
2. **Automatic retry** on these errors:
   - 429 (Rate limit)
   - 404 (Model not found)
   - Timeout
   - API errors
3. **Immediate failure** on these errors:
   - Validation errors
   - Parse errors
4. **All models failed?** Returns error to user

## Common Scenarios

### Scenario 1: One Model is Rate-Limited

```bash
# The system automatically tries the next model
[AI Quiz] Trying model: Llama 3.2 3B (meta-llama/llama-3.2-3b-instruct:free)
[AI Quiz] Model Llama 3.2 3B failed (API error), trying next model...
[AI Quiz] Trying model: Mistral 7B (mistralai/mistral-7b-instruct:free)
[AI Quiz] Successfully generated with model: Mistral 7B
```

### Scenario 2: Use Only Specific Models

```bash
# .env.local
AI_MODELS_ENABLED=google/gemini-2.0-flash-exp:free
```

### Scenario 3: Custom Timeout for Slow Models

```json
{
  "models": [
    {
      "id": "some-slow-model:free",
      "name": "Slow Model",
      "priority": 1,
      "enabled": true,
      "timeoutMs": 120000  // 2 minutes
    }
  ]
}
```

### Scenario 4: Add Paid Models

```json
{
  "models": [
    {
      "id": "anthropic/claude-3-sonnet",
      "name": "Claude 3 Sonnet",
      "priority": 1,
      "enabled": true,
      "timeoutMs": 30000,
      "costPer1kTokens": 0.003  // $3 per 1M tokens
    },
    {
      "id": "meta-llama/llama-3.2-3b-instruct:free",
      "name": "Llama 3.2 (Fallback)",
      "priority": 2,
      "enabled": true
    }
  ]
}
```

## Database-Driven Configuration (Future)

You can extend this system to load from database:

```typescript
// Example: Load from database
async function loadAIConfigFromDB() {
  const settings = await db.query.aiSettings.findFirst();

  if (settings?.modelConfig) {
    return JSON.parse(settings.modelConfig);
  }

  return loadAIConfig(); // Fallback to env/defaults
}

// Use it
const config = await loadAIConfigFromDB();
const generator = new OpenRouterQuizGenerator(apiKey, config);
```

## Debugging

### View Current Configuration

```typescript
const generator = createQuizGenerator();
console.log('Active models:', generator.getActiveModels());
console.log('Full config:', generator.getConfig());
```

### Logs to Watch

```bash
[AI Quiz] Initialized with 4 models: Llama 3.2 3B, Mistral 7B, Gemini 2.0 Flash, Qwen 2 7B
[AI Quiz] Trying model: Llama 3.2 3B (meta-llama/llama-3.2-3b-instruct:free)
[AI Quiz] Successfully generated with model: Llama 3.2 3B
```

## Best Practices

1. **Start with defaults** - They work well for most cases
2. **Use simple config first** - `AI_MODELS_ENABLED` for basic needs
3. **Monitor performance** - Check which models succeed most often
4. **Set appropriate timeouts** - Faster models = shorter timeout
5. **Keep free fallbacks** - Always have at least one free model enabled
6. **Test configuration** - Validate before deploying to production

## Available Free Models (OpenRouter)

Current free models (as of Dec 2024):

- `meta-llama/llama-3.2-3b-instruct:free`
- `meta-llama/llama-3.2-1b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `google/gemini-2.0-flash-exp:free`
- `qwen/qwen-2-7b-instruct:free`
- `microsoft/phi-3-mini-128k-instruct:free`

Check [OpenRouter Models](https://openrouter.ai/models) for the latest list.

## Troubleshooting

### Error: "No enabled models found"

**Cause:** All models are disabled in config
**Fix:** Check `AI_MODELS_ENABLED` or ensure at least one model has `enabled: true`

### Error: "All AI models failed"

**Cause:** All models returned errors
**Fix:**
1. Check API key is valid
2. Check internet connection
3. Try models individually to identify issues
4. Check OpenRouter status

### Models timing out frequently

**Cause:** Timeout too short or models overloaded
**Fix:** Increase `timeoutMs` for specific models or globally

## Migration from Old Config

If you have the old hardcoded model list:

**Before:**
```typescript
private readonly models = ['google/gemini-flash-1.5:free'];
```

**After:**
```typescript
// Just use the factory function - it loads config automatically
const generator = createQuizGenerator();
```

Or override:
```typescript
const customConfig = {
  models: [{ id: 'your-model', name: 'Custom', priority: 1, enabled: true }],
  defaultTimeoutMs: 60000,
  defaultTemperature: 0.7,
  maxRetries: 1,
};
const generator = new OpenRouterQuizGenerator(apiKey, customConfig);
```
