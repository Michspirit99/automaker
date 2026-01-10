/**
 * GET /copilot-status endpoint - Get GitHub Copilot CLI installation and auth status
 */

import type { Request, Response } from 'express';
import { CopilotProvider } from '../../../providers/copilot-provider.js';
import { getErrorMessage, logError } from '../common.js';

/**
 * Creates handler for GET /api/setup/copilot-status
 * Returns GitHub Copilot CLI installation and authentication status
 */
export function createCopilotStatusHandler() {
  const installCommand = 'gh extension install github/gh-copilot';
  const loginCommand = 'gh auth login';

  return async (_req: Request, res: Response): Promise<void> => {
    try {
      const provider = new CopilotProvider();
      const status = await provider.detectInstallation();

      // Derive auth method from authenticated status
      let authMethod = 'none';
      if (status.authenticated) {
        authMethod = 'gh_cli';
      }

      res.json({
        success: true,
        installed: status.installed,
        version: status.version || null,
        path: status.path || null,
        auth: {
          authenticated: status.authenticated || false,
          method: authMethod,
          hasGhCli: status.installed || false,
        },
        installCommand,
        loginCommand,
      });
    } catch (error) {
      logError(error, 'Get Copilot status failed');
      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  };
}
