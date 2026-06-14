import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  base: isGitHubPages ? '/spain-geography/' : '/',
  plugins: [vue()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
