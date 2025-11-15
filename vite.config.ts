
import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  base: './', // For relative paths in build (useful for GitHub Pages)
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'tools/**'],
    globals: true
  }
})