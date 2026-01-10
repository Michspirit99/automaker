/**
 * Provider Abstraction Layer
 *
 * Exports base interfaces and registry for AI model providers
 */

// Export types from types.ts
export type {
  ModelDefinition,
  ExecuteOptions,
  ExecuteResult,
  InstallationStatus,
  AuthenticationStatus,
  InstallResult,
  AuthResult,
} from './types.js';

// Export base provider interface and class
export type { AIProvider } from './base-provider.js';
export { BaseAIProvider } from './base-provider.js';

// Export registry
export { ProviderRegistry, providerRegistry } from './provider-registry.js';
