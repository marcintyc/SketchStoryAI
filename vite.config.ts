import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Dynamic base for GitHub Pages: the workflow sets VITE_BASE to "/<repo>/"
  base: process.env.VITE_BASE || './'
})