/**
 * GitHub Copilot CLI Provider - Executes queries using GitHub Copilot CLI
 *
 * Provides integration with GitHub Copilot's AI capabilities via CLI.
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

export class CopilotProvider implements AIProvider {
  readonly name = 'GitHub Copilot';
  readonly id = 'copilot';

  async executeAgent(options: ExecuteOptions): Promise<ExecuteResult> {
    return new Promise((resolve, reject) => {
      const args = ['suggest'];

      if (options.model) {
        args.push('--model', options.model);
      }

      args.push(options.prompt);

      const proc = spawn('github-copilot-cli', args, {
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
          reject(new Error(`Copilot CLI failed: ${stderr || `Exit code ${code}`}`));
        }
      });

      proc.on('error', (error) => {
        reject(new Error(`Failed to spawn Copilot CLI: ${error.message}`));
      });
    });
  }

  async detectInstallation(): Promise<InstallationStatus> {
    const cliPath = await this.getCLIPath();

    // Check if authenticated via GitHub CLI
    let authenticated = false;
    if (cliPath) {
      try {
        const ghProc = spawn('gh', ['auth', 'status']);
        authenticated = await new Promise<boolean>((resolve) => {
          ghProc.on('close', (code) => resolve(code === 0));
          ghProc.on('error', () => resolve(false));
        });
      } catch {
        authenticated = false;
      }
    }

    return {
      installed: cliPath !== null,
      method: 'cli',
      path: cliPath || undefined,
      hasApiKey: false,
      authenticated,
    };
  }

  async checkAuthentication(): Promise<AuthenticationStatus> {
    const status = await this.detectInstallation();

    return {
      authenticated: status.authenticated,
      method: 'cli',
    };
  }

  async getCLIPath(): Promise<string | null> {
    return new Promise((resolve) => {
      const checkCmd = process.platform === 'win32' ? 'where' : 'which';
      const proc = spawn(checkCmd, ['github-copilot-cli']);

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
        id: 'copilot-gpt-4',
        name: 'Copilot GPT-4',
        modelString: 'gpt-4',
        provider: 'copilot',
        description: 'GitHub Copilot with GPT-4',
        contextWindow: 8192,
        maxOutputTokens: 4096,
        supportsVision: false,
        supportsTools: true,
        tier: 'premium',
        default: true,
      },
      {
        id: 'copilot-gpt-3.5',
        name: 'Copilot GPT-3.5',
        modelString: 'gpt-3.5-turbo',
        provider: 'copilot',
        description: 'GitHub Copilot with GPT-3.5',
        contextWindow: 4096,
        maxOutputTokens: 2048,
        supportsVision: false,
        supportsTools: true,
        tier: 'standard',
      },
    ];
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = ['tools', 'text', 'code'];
    return supportedFeatures.includes(feature);
  }
}
