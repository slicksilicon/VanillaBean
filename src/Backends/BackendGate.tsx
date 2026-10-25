import React, { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import QueryState from "../Components/QueryState/QueryState";
import Button from "../Components/Button/Button";
import { showToast } from "../Components/Toast/toastBus";
import { backendEnvVar } from "./backends";
import { BACKEND_SESSION_QUERY_KEY, useBackendSessions, type BackendSession } from "./useBackendSession";
import "./BackendGate.css";

interface BackendGateProps {
    /** Backend folder names under src/Backends/ that the wrapped segment calls. Empty renders children directly. */
    backends: string[];
    children: React.ReactNode;
}

const APP_ORIGIN = window.location.origin;

function describeProblem(session: BackendSession): { title: string; detail: React.ReactNode } {
    const where = <code>{session.url}</code>;
    switch (session.state) {
        case "signed-out":
            return {
                title: `Sign in to ${session.name}`,
                detail: (
                    <>
                        This segment uses your {session.name} session. Open <a href={session.url} target="_blank" rel="noreferrer">{session.url}</a>,
                        sign in there in this browser, then retry.
                    </>
                ),
            };
        case "cors-blocked":
            return {
                title: `${session.name} is not accepting this app`,
                detail: (
                    <>
                        {session.name} answered at {where} but refused requests from <code>{APP_ORIGIN}</code>. Add it to{" "}
                        <code>ALLOWED_FRONTEND_URLS</code> in {session.name}'s <code>BackEnd/.env</code> and restart that backend.
                    </>
                ),
            };
        case "unconfigured":
            return {
                title: `${session.name} is not configured`,
                detail: <>Set <code>{backendEnvVar(session.name)}</code> in <code>.env</code> and restart the dev server.</>,
            };
        default:
            return {
                title: `${session.name} isn't running`,
                detail: <>Nothing answered at {where}. Start {session.name}'s backend, then retry.</>,
            };
    }
}

/*
 * Gate a segment on the EscapeVelocity backends it needs: render it once every backend is reachable and signed in,
 * otherwise explain what to fix. A hook/API mismatch only warns, since most endpoints usually still work.
 */
const BackendGate: React.FC<BackendGateProps> = ({ backends, children }) => {
    const queryClient = useQueryClient();
    const results = useBackendSessions(backends);
    const warnedStale = useRef(new Set<string>());

    const sessions = results.map(r => r.data).filter((s): s is BackendSession => !!s);
    const failed = results.find(r => r.isError);
    const problem = sessions.find(s => s.state !== "ok");

    useEffect(() => {
        for (const session of sessions) {
            const stale = session.state === "ok" && session.generatedVersion && session.liveVersion
                && session.generatedVersion !== session.liveVersion;
            if (stale && !warnedStale.current.has(session.name)) {
                warnedStale.current.add(session.name);
                showToast(
                    `${session.name}'s API is ${session.liveVersion}, hooks were generated from ${session.generatedVersion}. ` +
                    `Run ./build-backends.sh ${session.name}`,
                    { variant: "info", durationMs: 8000 },
                );
            }
        }
    }, [sessions]);

    if (backends.length === 0) {
        return <>{children}</>;
    }

    const retry = () => {
        void queryClient.invalidateQueries({ queryKey: [BACKEND_SESSION_QUERY_KEY] });
    };

    if (results.some(r => r.isLoading) || failed) {
        return (
            <QueryState isLoading={results.some(r => r.isLoading)} isError={!!failed} error={failed?.error} onRetry={retry}
                loadingLabel={`Connecting to ${backends.join(", ")}`}>
                {null}
            </QueryState>
        );
    }

    if (problem) {
        const { title, detail } = describeProblem(problem);
        return (
            <div className="backend-gate">
                <div className="backend-gate-card">
                    <span className="backend-gate-title">{title}</span>
                    <span className="backend-gate-detail">{detail}</span>
                    <Button variant="secondary" size="small" onClick={retry}>Retry</Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default BackendGate;
