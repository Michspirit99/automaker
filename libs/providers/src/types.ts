/**
 * Shared types for AI model providers
 */

export interface ModelDefinition {
  id: string;
  name: string;
  modelString: string;
  provider: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
  tier: 'basic' | 'standard' | 'premium';
  default?: boolean;
}

export interface ExecuteOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: any[];
  images?: string[];
  workingDirectory?: string;
  onEvent?: (event: any) => void;
}

export interface ExecuteResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface InstallationStatus {
  installed: boolean;
  method?: 'sdk' | 'cli' | 'api' | 'local' | 'path';
  version?: string;
  path?: string;
  hasApiKey: boolean;
  authenticated: boolean;
}

export interface AuthenticationStatus {
  authenticated: boolean;
  method: 'api_key' | 'oauth' | 'cli' | 'none';
  expiresAt?: Date;
  details?: Record<string, any>;
}

export interface InstallResult {
  success: boolean;
  error?: string;
  version?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  method?: string;
}
