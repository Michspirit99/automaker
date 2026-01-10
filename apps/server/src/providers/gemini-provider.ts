/**
 * Gemini CLI Provider - Executes queries using Google Gemini CLI
 *
 * Provides integration with Google's Gemini AI models via CLI.
 */

import { spawn } from 'child_process';
import type {
  AIProvider,
  ModelDefinition,
  ExecuteOptions,
  ExecuteResult,
  InstallationStatus,
  AuthenticationStatus,
  AuthResult,
} from '@automaker/providers';

export class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini';
  readonly id = 'gemini';

  async executeAgent(options: ExecuteOptions): Promise<ExecuteResult> {
    return new Promise((resolve, reject) => {
      const args = ['chat'];

      if (options.model) {
        args.push('--model', options.model);
      }

      if (options.systemPrompt) {
        args.push('--system', options.systemPrompt);
      }

      if (options.temperature !== undefined) {
        args.push('--temperature', options.temperature.toString());
      }

      if (options.maxTokens) {
        args.push('--max-tokens', options.maxTokens.toString());
      }

      args.push(options.prompt);

      const proc = spawn('gemini', args, {
        cwd: options.workingDirectory || process.cwd(),
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
          reject(new Error(`Gemini CLI failed: ${stderr || `Exit code ${code}`}`));
        }
      });

      proc.on('error', (error) => {
        reject(new Error(`Failed to spawn Gemini CLI: ${error.message}`));
      });
    });
  }

  async detectInstallation(): Promise<InstallationStatus> {
    const cliPath = await this.getCLIPath();
    const hasApiKey = !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;

    // Check if authenticated via OAuth
    let authenticated = hasApiKey;
    if (cliPath && !hasApiKey) {
      try {
        // Check if gemini CLI has OAuth authentication configured
        const authProc = spawn('gemini', ['auth', 'status']);
        authenticated = await new Promise<boolean>((resolve) => {
          authProc.on('close', (code) => resolve(code === 0));
          authProc.on('error', () => resolve(false));
        });
      } catch {
        authenticated = false;
      }
    }

    return {
      installed: cliPath !== null,
      method: 'cli',
      path: cliPath || undefined,
      hasApiKey,
      authenticated: cliPath !== null && authenticated,
    };
  }

  async checkAuthentication(): Promise<AuthenticationStatus> {
    const hasApiKey = !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
    const status = await this.detectInstallation();

    return {
      authenticated: status.authenticated,
      method: hasApiKey ? 'api_key' : 'oauth',
    };
  }

  async authenticateCLI(): Promise<AuthResult> {
    const cliPath = await this.getCLIPath();

    if (!cliPath) {
      return {
        success: false,
        error: 'Gemini CLI not found. Please install the Gemini CLI first.',
      };
    }

    return new Promise((resolve) => {
      const proc = spawn('gemini', ['auth', 'login'], {
        stdio: 'inherit', // Allow interactive authentication
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            method: 'oauth',
          });
        } else {
          resolve({
            success: false,
            error: `Authentication failed with exit code ${code}`,
          });
        }
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to start authentication: ${error.message}`,
        });
      });
    });
  }

  async getCLIPath(): Promise<string | null> {
    return new Promise((resolve) => {
      const checkCmd = process.platform === 'win32' ? 'where' : 'which';
      const proc = spawn(checkCmd, ['gemini']);

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
        id: 'gemini-pro',
        name: 'Gemini Pro',
        modelString: 'gemini-pro',
        provider: 'gemini',
        description: 'Most capable Gemini model for complex tasks',
        contextWindow: 32768,
        maxOutputTokens: 8192,
        supportsVision: false,
        supportsTools: true,
        tier: 'premium',
        default: true,
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        modelString: 'gemini-pro-vision',
        provider: 'gemini',
        description: 'Gemini with vision capabilities',
        contextWindow: 16384,
        maxOutputTokens: 4096,
        supportsVision: true,
        supportsTools: true,
        tier: 'premium',
      },
      {
        id: 'gemini-ultra',
        name: 'Gemini Ultra',
        modelString: 'gemini-ultra',
        provider: 'gemini',
        description: 'Most powerful Gemini model',
        contextWindow: 32768,
        maxOutputTokens: 8192,
        supportsVision: true,
        supportsTools: true,
        tier: 'premium',
      },
    ];
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = ['tools', 'text', 'vision'];
    return supportedFeatures.includes(feature);
  }
}
