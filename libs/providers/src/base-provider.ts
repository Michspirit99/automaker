/**
 * Base AI Provider Interface
 *
 * This interface defines the contract that all AI provider implementations must follow.
 * Providers can be SDK-based (Claude SDK, OpenAI SDK), API-based, or CLI-based.
 */

import type {
  ModelDefinition,
  ExecuteOptions,
  ExecuteResult,
  InstallationStatus,
  AuthenticationStatus,
  InstallResult,
  AuthResult,
} from './types.js';

/**
 * AIProvider interface that all provider implementations must implement
 */
export interface AIProvider {
  // Basic identification
  readonly name: string;
  readonly id: string;

  // Model management
  getAvailableModels(): ModelDefinition[];

  // Execution
  executeAgent(options: ExecuteOptions): Promise<ExecuteResult>;

  // Installation & Auth
  detectInstallation(): Promise<InstallationStatus>;
  checkAuthentication(): Promise<AuthenticationStatus>;

  // Capabilities
  supportsFeature(feature: string): boolean;

  // CLI operations (optional)
  getCLIPath?(): Promise<string | null>;
  installCLI?(): Promise<InstallResult>;
  authenticateCLI?(): Promise<AuthResult>;
}

/**
 * Abstract base class for AI providers (optional helper)
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly id: string;

  abstract getAvailableModels(): ModelDefinition[];
  abstract executeAgent(options: ExecuteOptions): Promise<ExecuteResult>;
  abstract detectInstallation(): Promise<InstallationStatus>;
  abstract checkAuthentication(): Promise<AuthenticationStatus>;

  supportsFeature(feature: string): boolean {
    // Default implementation - override in subclasses
    const commonFeatures = ['tools', 'text'];
    return commonFeatures.includes(feature);
  }

  async getCLIPath(): Promise<string | null> {
    return null;
  }

  async installCLI(): Promise<InstallResult> {
    return {
      success: false,
      error: 'CLI installation not supported for this provider',
    };
  }

  async authenticateCLI(): Promise<AuthResult> {
    return {
      success: false,
      error: 'CLI authentication not supported for this provider',
    };
  }
}
