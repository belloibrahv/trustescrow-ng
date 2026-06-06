// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/services/**', 'src/utils/**'],
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
    testTimeout: 15_000,
  },
});
