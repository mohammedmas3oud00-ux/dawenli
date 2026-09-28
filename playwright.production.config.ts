import { defineConfig } from '@playwright/test';
import localConfig from './playwright.config';

export default defineConfig({
  ...localConfig,
  webServer: undefined,
  use: {
    ...localConfig.use,
    baseURL: process.env.PLAYWRIGHT_BASE_URL?.trim() || 'https://dawenli-green.vercel.app',
  },
});
