import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'query-vendor': ['@tanstack/react-query'],
                    'recharts-vendor': ['recharts'],
                },
            },
        },
        chunkSizeWarningLimit: 600,
    },
    server: {
        port: 7400,
        strictPort: true,
    },
})
