/**
 * GET /gemini-status endpoint - Get Gemini CLI installation and auth status
 */

import type { Request, Response } from 'express';
import { GeminiProvider } from '../../../providers/gemini-provider.js';
import { getErrorMessage, logError } from '../common.js';

/**
 * Creates handler for GET /api/setup/gemini-status
 * Returns Gemini CLI installation and authentication status
 */
export function createGeminiStatusHandler() {
  const installCommand = 'npm install -g @google-ai/gemini-cli';
  const loginCommand = 'gemini auth login';

  return async (_req: Request, res: Response): Promise<void> => {
    try {
      const provider = new GeminiProvider();
      const status = await provider.detectInstallation();

      // Derive auth method from authenticated status and API key presence
      let authMethod = 'none';
      if (status.authenticated) {
        authMethod = status.hasApiKey ? 'api_key' : 'cli';
      }

      res.json({
        success: true,
        installed: status.installed,
        version: status.version || null,
        path: status.path || null,
        auth: {
          authenticated: status.authenticated || false,
          method: authMethod,
          hasApiKey: status.hasApiKey || false,
        },
        installCommand,
        loginCommand,
      });
    } catch (error) {
      logError(error, 'Get Gemini status failed');
      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  };
}
