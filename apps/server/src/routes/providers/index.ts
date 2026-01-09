/**
 * Provider Routes - API endpoints for provider management
 */

import { Router } from 'express';
import { providerRegistry } from '@automaker/providers';

export function createProvidersRoutes(): Router {
  const router = Router();

  /**
   * GET /api/providers
   * Get all registered providers with their status
   */
  router.get('/', async (req, res) => {
    try {
      const providers = providerRegistry.getAll();
      const providersWithStatus = await Promise.all(
        providers.map(async (provider) => ({
          id: provider.id,
          name: provider.name,
          models: provider.getAvailableModels(),
          installation: await provider.detectInstallation(),
          authentication: await provider.checkAuthentication(),
        }))
      );

      res.json({ providers: providersWithStatus });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch providers' });
    }
  });

  /**
   * GET /api/providers/:id
   * Get a specific provider by ID
   */
  router.get('/:id', async (req, res) => {
    try {
      const provider = providerRegistry.get(req.params.id);

      if (!provider) {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }

      res.json({
        id: provider.id,
        name: provider.name,
        models: provider.getAvailableModels(),
        installation: await provider.detectInstallation(),
        authentication: await provider.checkAuthentication(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch provider' });
    }
  });

  /**
   * GET /api/providers/detect/available
   * Detect all available (installed and authenticated) providers
   */
  router.get('/detect/available', async (req, res) => {
    try {
      const available = await providerRegistry.detectAvailable();
      res.json({
        providers: available.map((p) => ({
          id: p.id,
          name: p.name,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to detect providers' });
    }
  });

  return router;
}
