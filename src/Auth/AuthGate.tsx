import React from "react";
import { useAuth } from "../Hooks/useAuth";
import LoginScreen from "../Segments/Login/LoginScreen";

/* EscapeVelocity's App-level gate: a spinner while the session cookie is checked, the login screen without one. */
const AuthGate: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="login-loading">
                <div className="login-spinner" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    return <>{children}</>;
};

export default AuthGate;
