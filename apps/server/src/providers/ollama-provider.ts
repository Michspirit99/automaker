/**
 * Ollama Provider - Executes queries using local Ollama models
 */

import { spawn } from 'child_process';
import type {
  AIProvider,
  ModelDefinition,
  ExecuteOptions,
  ExecuteResult,
  InstallationStatus,
  AuthenticationStatus,
} from '@automaker/providers';

export class OllamaProvider implements AIProvider {
  readonly name = 'Ollama (Local)';
  readonly id = 'ollama';

  private baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  async executeAgent(options: ExecuteOptions): Promise<ExecuteResult> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || 'llama2',
        prompt: options.prompt,
        system: options.systemPrompt,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    // Ollama returns streaming NDJSON, collect all chunks
    const text = await response.text();
    const lines = text.trim().split('\n');
    let fullResponse = '';

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.response) {
          fullResponse += json.response;
        }
      } catch {
        // Skip invalid JSON lines
      }
    }

    return {
      content: fullResponse,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
    };
  }

  async detectInstallation(): Promise<InstallationStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      const installed = response.ok;

      return {
        installed,
        method: 'local',
        hasApiKey: false,
        authenticated: installed,
      };
    } catch {
      return {
        installed: false,
        method: 'local',
        hasApiKey: false,
        authenticated: false,
      };
    }
  }

  async checkAuthentication(): Promise<AuthenticationStatus> {
    const status = await this.detectInstallation();
    return {
      authenticated: status.authenticated,
      method: 'none',
    };
  }

  async getCLIPath(): Promise<string | null> {
    return new Promise((resolve) => {
      const checkCmd = process.platform === 'win32' ? 'where' : 'which';
      const proc = spawn(checkCmd, ['ollama']);

      let path = '';
      proc.stdout.on('data', (data) => {
        path += data.toString();
      });

      proc.on('close', (code) => {
        resolve(code === 0 ? path.trim() : null);
      });

      proc.on('error', () => resolve(null));
    });
  }

  getAvailableModels(): ModelDefinition[] {
    return [
      {
        id: 'llama2',
        name: 'Llama 2',
        modelString: 'llama2',
        provider: 'ollama',
        description: 'Meta Llama 2 - runs locally',
        contextWindow: 4096,
        maxOutputTokens: 2048,
        supportsVision: false,
        supportsTools: false,
        tier: 'basic',
        default: true,
      },
      {
        id: 'codellama',
        name: 'Code Llama',
        modelString: 'codellama',
        provider: 'ollama',
        description: 'Specialized for code generation',
        contextWindow: 4096,
        maxOutputTokens: 2048,
        supportsVision: false,
        supportsTools: false,
        tier: 'standard',
      },
      {
        id: 'mistral',
        name: 'Mistral',
        modelString: 'mistral',
        provider: 'ollama',
        description: 'Fast and capable local model',
        contextWindow: 8192,
        maxOutputTokens: 4096,
        supportsVision: false,
        supportsTools: false,
        tier: 'standard',
      },
    ];
  }

  supportsFeature(feature: string): boolean {
    return feature === 'text';
  }
}
