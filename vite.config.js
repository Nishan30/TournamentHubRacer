import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import reactJsx from 'vite-react-jsx'

export default defineConfig({
  build: {
    target: 'es2020', // Ensure this is set
  },
  esbuild: {
    target: 'es2020', // Or 'esnext'
  },
  plugins: [reactJsx(), reactRefresh()],
})
