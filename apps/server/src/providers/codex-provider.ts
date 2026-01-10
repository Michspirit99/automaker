/**
 * OpenAI Codex CLI Provider - Executes queries using OpenAI Codex CLI
 *
 * Provides integration with OpenAI's Codex models via CLI.
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

export class CodexProvider implements AIProvider {
  readonly name = 'OpenAI Codex';
  readonly id = 'codex';

  async executeAgent(options: ExecuteOptions): Promise<ExecuteResult> {
    return new Promise((resolve, reject) => {
      const args = ['complete'];

      if (options.model) {
        args.push('--model', options.model);
      }

      if (options.systemPrompt) {
        args.push('--instruction', options.systemPrompt);
      }

      if (options.temperature !== undefined) {
        args.push('--temperature', options.temperature.toString());
      }

      if (options.maxTokens) {
        args.push('--max-tokens', options.maxTokens.toString());
      }

      args.push(options.prompt);

      const proc = spawn('codex', args, {
        cwd: options.workingDirectory || process.cwd(),
        env: {
          ...process.env,
        },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        if (options.onEvent) {
          options.onEvent({ type: 'data', content: data.toString() });
        }
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            content: stdout.trim(),
            usage: {
              inputTokens: 0,
              outputTokens: 0,
            },
          });
        } else {
          reject(new Error(`Codex CLI failed: ${stderr || `Exit code ${code}`}`));
        }
      });

      proc.on('error', (error) => {
        reject(new Error(`Failed to spawn Codex CLI: ${error.message}`));
      });
    });
  }

  async detectInstallation(): Promise<InstallationStatus> {
    const cliPath = await this.getCLIPath();
    const hasApiKey = !!process.env.OPENAI_API_KEY;

    return {
      installed: cliPath !== null,
      method: 'cli',
      path: cliPath || undefined,
      hasApiKey,
      authenticated: cliPath !== null && hasApiKey,
    };
  }

  async checkAuthentication(): Promise<AuthenticationStatus> {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const cliPath = await this.getCLIPath();

    return {
      authenticated: cliPath !== null && hasApiKey,
      method: hasApiKey ? 'api_key' : 'cli',
    };
  }

  async getCLIPath(): Promise<string | null> {
    return new Promise((resolve) => {
      const checkCmd = process.platform === 'win32' ? 'where' : 'which';
      const proc = spawn(checkCmd, ['codex']);

      let path = '';
      proc.stdout.on('data', (data) => {
        path += data.toString();
      });

      proc.on('close', (code) => {
        resolve(code === 0 ? path.trim().split('\n')[0] : null);
      });

      proc.on('error', () => resolve(null));
    });
  }

  getAvailableModels(): ModelDefinition[] {
    return [
      {
        id: 'code-davinci-002',
        name: 'Codex (Davinci)',
        modelString: 'code-davinci-002',
        provider: 'codex',
        description: 'Most capable Codex model for code generation',
        contextWindow: 8192,
        maxOutputTokens: 4096,
        supportsVision: false,
        supportsTools: false,
        tier: 'premium',
        default: true,
      },
      {
        id: 'code-cushman-001',
        name: 'Codex (Cushman)',
        modelString: 'code-cushman-001',
        provider: 'codex',
        description: 'Faster Codex model for simpler tasks',
        contextWindow: 2048,
        maxOutputTokens: 1024,
        supportsVision: false,
        supportsTools: false,
        tier: 'standard',
      },
    ];
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = ['text', 'code'];
    return supportedFeatures.includes(feature);
  }
}
