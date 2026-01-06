/**
 * Prompt configuration for model-specific prompts
 */
export interface PromptConfig {
  /** Regex pattern to match model IDs */
  modelPattern: RegExp;
  /** Human-readable name for the prompt config */
  name: string;
  /** Function to build the instructions string */
  buildInstructions: () => string;
  /** Optional metadata about the prompt */
  metadata?: {
    /** Suggested max response length in words */
    maxResponseLength?: number;
    /** Whether model supports "thinking aloud" for search strategy */
    supportsThinking?: boolean;
    /** Number of few-shot examples included */
    fewShotCount?: number;
  };
}

/**
 * Few-shot example for training consistent response formatting
 */
export interface FewShotExample {
  /** The user's query */
  userQuery: string;
  /** Optional search strategy thinking (for capable models) */
  searchStrategy?: string;
  /** The ideal assistant response */
  assistantResponse: string;
}
