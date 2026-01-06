import type { PromptConfig } from './types';
import { geminiFlashPrompt } from './gemini-flash';
import { defaultPrompt } from './default';

/**
 * Ordered list of prompt configurations.
 * First match wins - default should always be last.
 *
 * To add a new model-specific prompt:
 * 1. Create a new file (e.g., llama-maverick.ts) with a PromptConfig export
 * 2. Import it here and add to PROMPT_CONFIGS array (before defaultPrompt)
 */
const PROMPT_CONFIGS: PromptConfig[] = [
  geminiFlashPrompt,
  // Add more model-specific prompts here
  defaultPrompt, // Must be last (catches all)
];

/**
 * Get the appropriate prompt configuration for a model ID.
 * Normalizes model ID by removing provider prefixes if present.
 *
 * @param modelId - The model ID (e.g., "google/gemini-2.0-flash-001" or "openrouter/google/gemini-2.0-flash-001")
 * @returns The matching PromptConfig
 */
export function getPromptForModel(modelId: string): PromptConfig {
  // Normalize: remove "openrouter/" prefix if present
  const normalizedId = modelId.replace(/^openrouter\//, '');

  const config = PROMPT_CONFIGS.find((p) => p.modelPattern.test(normalizedId));
  return config || defaultPrompt;
}

/**
 * Build instructions string for a model.
 *
 * @param modelId - The model ID
 * @returns The complete instructions string for the model
 */
export function buildInstructionsForModel(modelId: string): string {
  const config = getPromptForModel(modelId);
  return config.buildInstructions();
}

/**
 * Get all available prompt configurations (for debugging/admin).
 */
export function getAllPromptConfigs(): PromptConfig[] {
  return PROMPT_CONFIGS;
}

export type { PromptConfig, FewShotExample } from './types';
