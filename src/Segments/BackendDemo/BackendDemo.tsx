import StatItem from "../../Components/StatItem/StatItem";
import QueryState from "../../Components/QueryState/QueryState";
import { useGetVersion } from "../../Backends/EscapeVelocity/Query/useGetVersion";
import { useGetAuthMe } from "../../Backends/EscapeVelocity/Query/useGetAuthMe";
import { backendUrl } from "../../Backends/backends";

import "./BackendDemo.css";

/*
 * Calls an EscapeVelocity backend through its generated hooks. App.tsx wraps this segment in BackendGate, so by the
 * time it renders the backend is reachable and the user is signed in; the queries still handle their own error state.
 * Hidden whenever VITE_BACKEND_ESCAPEVELOCITY_URL is unset - which is always the case on Vercel.
 */
const BackendDemo: React.FC = () => {
    const version = useGetVersion();
    const me = useGetAuthMe();

    return (
        <div className="backend-demo-container">
            <QueryState
                isLoading={version.isLoading || me.isLoading}
                isError={version.isError || me.isError}
                error={version.error ?? me.error}
                onRetry={() => { void version.refetch(); void me.refetch(); }}
            >
                <div className="backend-demo-stats">
                    <StatItem number={version.data?.version ?? "N/A"} label="EscapeVelocity API version" variant="success" />
                    <StatItem number={me.data?.name ?? "N/A"} label={me.data?.email ?? "Signed-in user"} variant="info" />
                </div>
                <p className="backend-demo-text">
                    Served by <code>{backendUrl("EscapeVelocity")}</code> using the hooks in <code>src/Backends/EscapeVelocity/Query/</code>.
                </p>
            </QueryState>
        </div>
    );
};

export default BackendDemo;
export const segmentName = "Backend Demo";
export const requiredBackends = "EscapeVelocity";
