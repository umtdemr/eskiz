/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            globals: true,
            environment: 'node',
            include: ['src/**/*.test.ts'],
            setupFiles: ['src/test/setupTests.ts'],
            coverage: {
                provider: 'v8',
                include: ['src/core/**'],
            },
        },
    }),
)
