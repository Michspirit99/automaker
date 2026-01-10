/**
 * Provider Registry
 *
 * Manages registration and discovery of AI providers.
 */

import type { AIProvider } from './base-provider.js';

export class ProviderRegistry {
  private providers = new Map<string, AIProvider>();
  private defaultProvider?: string;

  /**
   * Register a provider
   */
  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Get a provider by ID
   */
  get(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all registered providers
   */
  getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Set the default provider
   */
  setDefault(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`Provider ${id} not found`);
    }
    this.defaultProvider = id;
  }

  /**
   * Get the default provider
   */
  getDefault(): AIProvider | undefined {
    if (this.defaultProvider) {
      return this.providers.get(this.defaultProvider);
    }
    // Return first provider if no default set
    return this.providers.values().next().value;
  }

  /**
   * Detect all available (installed and authenticated) providers
   */
  async detectAvailable(): Promise<AIProvider[]> {
    const available: AIProvider[] = [];

    for (const provider of this.providers.values()) {
      const status = await provider.detectInstallation();
      if (status.installed && status.authenticated) {
        available.push(provider);
      }
    }

    return available;
  }

  /**
   * Check if a provider is registered
   */
  has(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * Get all provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Global provider registry instance
 */
export const providerRegistry = new ProviderRegistry();
