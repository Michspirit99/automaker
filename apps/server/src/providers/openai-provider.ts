/**
 * OpenAI Provider - Executes queries using OpenAI SDK
 */

import OpenAI from 'openai';
import type {
  AIProvider,
  ModelDefinition,
  ExecuteOptions,
  ExecuteResult,
  InstallationStatus,
  AuthenticationStatus,
} from '@automaker/providers';

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  readonly id = 'openai';

  private client?: OpenAI;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async executeAgent(options: ExecuteOptions): Promise<ExecuteResult> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY environment variable.');
    }

    const messages: any[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: options.prompt });

    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4-turbo-preview',
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      tools: options.tools,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }

  async detectInstallation(): Promise<InstallationStatus> {
    const hasApiKey = !!process.env.OPENAI_API_KEY;

    return {
      installed: true,
      method: 'api',
      hasApiKey,
      authenticated: hasApiKey,
    };
  }

  async checkAuthentication(): Promise<AuthenticationStatus> {
    const hasApiKey = !!process.env.OPENAI_API_KEY;

    return {
      authenticated: hasApiKey,
      method: hasApiKey ? 'api_key' : 'none',
    };
  }

  getAvailableModels(): ModelDefinition[] {
    return [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        modelString: 'gpt-4-turbo-preview',
        provider: 'openai',
        description: 'Most capable GPT-4 model',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        supportsVision: true,
        supportsTools: true,
        tier: 'premium',
        default: true,
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        modelString: 'gpt-4',
        provider: 'openai',
        description: 'Standard GPT-4',
        contextWindow: 8192,
        maxOutputTokens: 4096,
        supportsVision: false,
        supportsTools: true,
        tier: 'premium',
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        modelString: 'gpt-3.5-turbo',
        provider: 'openai',
        description: 'Fast and cost-effective',
        contextWindow: 16385,
        maxOutputTokens: 4096,
        supportsVision: false,
        supportsTools: true,
        tier: 'standard',
      },
    ];
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = ['tools', 'text', 'vision'];
    return supportedFeatures.includes(feature);
  }
}
