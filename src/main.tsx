import { createRoot } from 'react-dom/client'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { AUTH_EXPIRED_EVENT, AuthProvider } from './Hooks/useAuth'
import ErrorBoundary from './Error/ErrorBoundary'
import { ToastContainer } from './Components/Toast/Toast'
import { BACKEND_SESSION_QUERY_KEY } from './Backends/useBackendSession'
import { features } from './features'

/*
 * Detect a session that expired mid-use.
 *
 * This has to match on the message text: the generated fetchers throw a plain Error and discard response.status, so the
 * status code is only recoverable from the string they build. They read `detail` first - "HTTP 401: ..." in both
 * EscapeVelocity's error envelope and this app's (server/errors.ts) - and fall back to "Network response was not ok:
 * <status>".
 *
 * The message does not say which API failed. EscapeVelocity backend sessions are simply re-probed, so BackendGate swaps
 * the affected segment for its "Sign in" panel. The app's own session is checked before acting: a 401 from an
 * EscapeVelocity backend must not sign the user out of this app.
 */
function isUnauthorized(error: unknown): boolean {
    return error instanceof Error && (error.message.includes("HTTP 401") || error.message.includes("not ok: 401"));
}

let appSessionCheck: Promise<void> | null = null;

function recheckAppSession(): void {
    appSessionCheck ??= fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
        .then(response => {
            if (response.status === 401) {
                window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
            }
        })
        .catch(() => undefined)
        .finally(() => {
            appSessionCheck = null;
        });
}

function handleUnauthorized(error: unknown): void {
    if (!isUnauthorized(error)) {
        return;
    }
    void queryClient.invalidateQueries({ queryKey: [BACKEND_SESSION_QUERY_KEY] });
    if (features.authGoogle) {
        recheckAppSession();
    }
}

// Create a client
const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleUnauthorized }),
    mutationCache: new MutationCache({ onError: handleUnauthorized }),
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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

createRoot(document.getElementById('root')!).render(
    <>
        <ToastContainer />
        <ErrorBoundary label="The application">
            {features.authGoogle ? (
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <QueryClientProvider client={queryClient}>
                        <AuthProvider>
                            <App />
                        </AuthProvider>
                    </QueryClientProvider>
                </GoogleOAuthProvider>
            ) : (
                <QueryClientProvider client={queryClient}>
                    <App />
                </QueryClientProvider>
            )}
        </ErrorBoundary>
    </>,
)
