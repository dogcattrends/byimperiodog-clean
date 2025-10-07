import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    setupFiles: ['tests/setup/test-env.ts'],
  coverage: { reporter: ['text','html','json-summary'], enabled: true, reportsDirectory: 'coverage' }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
