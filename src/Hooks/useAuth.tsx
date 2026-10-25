/* NO FAST REFRESH SUPPORT FOR THIS MODULE */
import React, { createContext, useCallback, useContext, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthMeQueryKey, useGetAuthMe } from "../Backends/App/Query/useGetAuthMe";
import { usePostAuthGoogleCallback } from "../Backends/App/Query/usePostAuthGoogleCallback";
import { usePostAuthLogout } from "../Backends/App/Query/usePostAuthLogout";
import type { UserInfo } from "../Backends/App/Query/Types";

/**
 * Window event asking AuthProvider to drop the session and fall back to the login screen.
 *
 * Raised from the shared QueryCache/MutationCache in main.tsx whenever any request comes back 401,
 * so a token that expires mid-session returns the user to the login screen instead of leaving every
 * panel showing an error. The name is exported rather than inlined so both ends cannot drift.
 */
export const AUTH_EXPIRED_EVENT = "app:auth-expired";

export interface AuthContextInterface {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (code: string, redirectUri: string) => Promise<void>;
    logout: () => Promise<void>;
}

const defaultAuthContext: AuthContextInterface = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => {},
    logout: async () => {},
};

const AuthContext = createContext<AuthContextInterface>(defaultAuthContext);

export const AuthProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const queryClient = useQueryClient();

    /* Validate the existing session cookie on mount (and whenever the cache is invalidated). */
    const { data: user, isLoading } = useGetAuthMe();

    const { mutateAsync: googleCallback } = usePostAuthGoogleCallback();
    const { mutateAsync: logoutRequest } = usePostAuthLogout();

    /*
     * Clearing the cached user is all that is needed: App gates on isAuthenticated, so dropping it
     * renders the login screen. Safe to fire on a cold load too, where /api/auth/me legitimately
     * 401s - the write is idempotent against an already-empty entry, and the generated auth hook
     * sets retry: false, so there is no refetch storm.
     */
    useEffect(() => {
        const handleExpired = () => queryClient.setQueryData(getAuthMeQueryKey(), null);
        window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
        return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    }, [queryClient]);

    const login = useCallback(async (code: string, redirectUri: string) => {
        const userData = await googleCallback({ data: { code, redirect_uri: redirectUri } });
        queryClient.setQueryData(getAuthMeQueryKey(), userData);
    }, [googleCallback, queryClient]);

    const logout = useCallback(async () => {
        try {
            await logoutRequest();
        } finally {
            /* Drop the session locally even if the server call failed - the cookie is already gone
               as far as the user is concerned, and leaving them on a dead session helps nobody. */
            queryClient.setQueryData(getAuthMeQueryKey(), null);
        }
    }, [logoutRequest, queryClient]);

    return (
        <AuthContext.Provider value={{ user: user ?? null, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};


// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};
