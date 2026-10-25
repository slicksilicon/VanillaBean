import { useState, useCallback } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../Hooks/useAuth";
import "./LoginScreen.css";

const GOOGLE_SCOPES = import.meta.env.VITE_GOOGLE_OAUTH_SCOPES || "openid email profile";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const APP_TITLE = import.meta.env.VITE_APP_TITLE || "EscapeVelocity";

const GoogleIcon = () => (
    <svg className="login-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

/**
 * Shown when google.clientId is missing from vanillabean.config.json (vite.config.ts exposes it as
 * VITE_GOOGLE_CLIENT_ID).
 *
 * Without this the app dies at boot with a bare "unexpected error": Google's initCodeClient throws
 * on an empty client_id from inside useGoogleLogin's effect, which propagates to the top-level
 * ErrorBoundary and takes the whole tree down - a misconfiguration presenting as a crash.
 *
 * The value is read at build time, so editing the config is not enough on its own; the bundle has to be
 * rebuilt. That trips people up often enough to be worth saying on screen.
 */
const MissingClientId: React.FC = () => (
    <div className="login-container">
        <div className="login-card">
            <h1 className="login-title">{APP_TITLE}</h1>
            <p className="login-subtitle">Google sign-in is not configured</p>
            <p className="login-error">
                Run <code>./configure.sh</code> and enter your Google OAuth client id (it is stored as{" "}
                <code>google.clientId</code> in <code>vanillabean.config.json</code>), then restart the dev server or
                redeploy - Vite inlines it at build time.
            </p>
        </div>
    </div>
);

const GoogleLoginScreen: React.FC = () => {
    const { login, isLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleGoogleLogin = useGoogleLogin({
        flow: "auth-code",
        scope: GOOGLE_SCOPES,
        onSuccess: useCallback(async (response: { code: string }) => {
            setIsSigningIn(true);
            setError(null);
            try {
                // "postmessage", not window.location.origin. flow: "auth-code" without an explicit
                // ux_mode uses Google's popup UX, which hands the code back through a JS callback
                // rather than an HTTP redirect - so no redirect URI was ever part of the
                // authorization request. "postmessage" is the literal Google expects at the token
                // endpoint to mean "this code came from the popup flow"; sending the page origin
                // instead relies on that origin being registered as an Authorized redirect URI.
                // Switching to ux_mode: "redirect" would mean sending the real registered URI here.
                await login(response.code, "postmessage");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
            } finally {
                setIsSigningIn(false);
            }
        }, [login]),
        onError: useCallback((errorResponse: { error?: string; error_description?: string }) => {
            setError(errorResponse.error_description || errorResponse.error || "Google sign in failed");
        }, []),
    });

    if (isLoading) {
        return (
            <div className="login-loading">
                <div className="login-spinner" />
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">{APP_TITLE}</h1>
                <p className="login-subtitle">Sign in with your Google account to continue</p>

                {error && <p className="login-error">{error}</p>}

                <button
                    className="login-google-button"
                    onClick={() => handleGoogleLogin()}
                    disabled={isSigningIn}
                >
                    <GoogleIcon />
                    {isSigningIn ? "Signing in..." : "Sign in with Google"}
                </button>
            </div>
        </div>
    );
};

/*
 * The client-ID check has to gate which component renders, not which hooks run: useGoogleLogin is
 * a hook and cannot be called conditionally, and it is the hook's own effect that throws. Rendering
 * GoogleLoginScreen only when there is an ID keeps that effect from ever mounting.
 */
const LoginScreen: React.FC = () => (
    GOOGLE_CLIENT_ID ? <GoogleLoginScreen /> : <MissingClientId />
);

export default LoginScreen;
