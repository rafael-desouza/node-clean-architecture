import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  envDir: './',
  test: {
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/composition-root.ts',
        'src/**/*.d.ts',
        'src/core/application/ports',
        'src/core/application/repositories',
        'src/core/application/object-values/interfaces',
        'src/presentation/contracts',
        'drizzle.config.ts',
        'src/infra/persistence/drizzle/client.ts',
        'src/infra/persistence/drizzle/schema.ts',
      ],
    },
  },
});
