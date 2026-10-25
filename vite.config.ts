import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Feature switches written by ./configure.sh - the server reads the same file (server/features.ts).
const vanillabean = JSON.parse(readFileSync(new URL('./vanillabean.config.json', import.meta.url), 'utf8'))
const features = vanillabean.features

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // API_PORT (optional, .env.local) is where server/dev.ts listens; /api is proxied there so dev is same-origin like Vercel.
    const apiPort = loadEnv(mode, process.cwd(), '').API_PORT || '7410'

    return {
        plugins: [react()],
        define: {
            __VB_API__: JSON.stringify(features.api),
            __VB_AUTH_GOOGLE__: JSON.stringify(features.auth === 'google'),
            __VB_DATABASE__: JSON.stringify(features.database === 'mongodb'),
            // Public OAuth settings, exposed under the names EscapeVelocity's LoginScreen reads.
            'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(vanillabean.google.clientId),
            'import.meta.env.VITE_GOOGLE_OAUTH_SCOPES': JSON.stringify(vanillabean.google.scopes),
        },
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
            proxy: features.api ? { '/api': `http://127.0.0.1:${apiPort}` } : undefined,
            headers: {
                // Lets Google's sign-in popup talk back to this page (same value as vercel.json).
                "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
                "Cross-Origin-Embedder-Policy": "unsafe-none",
            },
        },
    }
})
