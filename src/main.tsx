import { createRoot } from 'react-dom/client'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './Error/ErrorBoundary'
import { ToastContainer } from './Components/Toast/Toast'
import { BACKEND_SESSION_QUERY_KEY } from './Backends/useBackendSession'

/*
 * Detect an EscapeVelocity session that expired mid-use.
 *
 * This has to match on the message text: the generated fetchers in src/Backends/<Name>/Query/ throw a plain Error and
 * discard response.status, so the status code is only recoverable from the string they build. They read `detail`
 * first and fall back to "Network response was not ok: <status>" - EscapeVelocity's error envelope uses `message`,
 * so the bare-status form is the one that normally matches, while "HTTP 401" covers a backend that puts the status in
 * `detail`.
 *
 * The message does not say which backend failed, so every backend session is re-probed; BackendGate then swaps the
 * affected segment for its "Sign in" panel.
 */
function isUnauthorized(error: unknown): boolean {
    return error instanceof Error && (error.message.includes("HTTP 401") || error.message.includes("not ok: 401"));
}

function recheckBackendSessions(error: unknown): void {
    if (isUnauthorized(error)) {
        void queryClient.invalidateQueries({ queryKey: [BACKEND_SESSION_QUERY_KEY] });
    }
}

// Create a client
const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: recheckBackendSessions }),
    mutationCache: new MutationCache({ onError: recheckBackendSessions }),
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
})

createRoot(document.getElementById('root')!).render(
    <>
        <ToastContainer />
        <ErrorBoundary label="The application">
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </ErrorBoundary>
    </>,
)
