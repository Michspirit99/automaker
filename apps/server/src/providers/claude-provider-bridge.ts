/**
 * Claude Provider Bridge - Adapts existing ClaudeProvider to new AIProvider interface
 *
 * This bridges the existing server-side ClaudeProvider (which uses executeQuery
 * and returns AsyncGenerator) with the new @automaker/providers AIProvider interface
 * (which uses executeAgent and returns Promise<ExecuteResult>).
 */

import { ClaudeProvider as ServerClaudeProvider } from './claude-provider.js';
import type {
  AIProvider,
  ModelDefinition,
  ExecuteOptions as ProviderExecuteOptions,
  ExecuteResult,
  InstallationStatus,
  AuthenticationStatus,
} from '@automaker/providers';

export class ClaudeProviderBridge implements AIProvider {
  readonly name = 'Claude';
  readonly id = 'claude';

  private serverProvider: ServerClaudeProvider;

  constructor() {
    this.serverProvider = new ServerClaudeProvider();
  }

  async executeAgent(options: ProviderExecuteOptions): Promise<ExecuteResult> {
    // For the bridge, we'll collect all messages from the stream
    // In the future, this could support streaming through onEvent callback
    let finalContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    // Convert the new interface options to the server provider's ExecuteOptions
    const serverOptions = {
      prompt: options.prompt,
      model: options.model || 'claude-sonnet-4-20250514',
      cwd: options.workingDirectory || process.cwd(),
      systemPrompt: options.systemPrompt,
      maxTurns: 20,
    };

    try {
      for await (const message of this.serverProvider.executeQuery(serverOptions)) {
        // Handle different message types from the stream
        if (message.type === 'assistant' && message.message?.content) {
          for (const block of message.message.content) {
            if (block.type === 'text' && block.text) {
              finalContent += block.text;
            }
          }
        }

        // Call onEvent if provided
        if (options.onEvent) {
          options.onEvent(message);
        }
      }
    } catch (error) {
      throw error;
    }

    return {
      content: finalContent,
      usage: {
        inputTokens,
        outputTokens,
      },
    };
  }

  async detectInstallation(): Promise<InstallationStatus> {
    const serverStatus = await this.serverProvider.detectInstallation();
    return {
      installed: serverStatus.installed,
      method: serverStatus.method as any,
      version: serverStatus.version,
      path: serverStatus.path,
      hasApiKey: serverStatus.hasApiKey,
      authenticated: serverStatus.authenticated || false,
    };
  }

  async checkAuthentication(): Promise<AuthenticationStatus> {
    const installation = await this.serverProvider.detectInstallation();
    return {
      authenticated: installation.authenticated || false,
      method: installation.hasApiKey ? 'api_key' : 'none',
    };
  }

  getAvailableModels(): ModelDefinition[] {
    const serverModels = this.serverProvider.getAvailableModels();
    return serverModels.map((model) => ({
      id: model.id,
      name: model.name,
      modelString: model.modelString,
      provider: model.provider,
      description: model.description,
      contextWindow: model.contextWindow,
      maxOutputTokens: model.maxOutputTokens,
      supportsVision: model.supportsVision,
      supportsTools: model.supportsTools,
      tier: model.tier,
      default: model.default,
    }));
  }

  supportsFeature(feature: string): boolean {
    return this.serverProvider.supportsFeature(feature);
  }
}
