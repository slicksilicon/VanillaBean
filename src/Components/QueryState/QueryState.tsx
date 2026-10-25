import React from "react";
import SpinnerUnknownDuration from "../SpinnerUnknownDuration/SpinnerUnknownDuration";
import Button from "../Button/Button";
import "./QueryState.css";

export interface QueryStateProps {
    isLoading: boolean;
    isError: boolean;
    error?: Error | null;
    isEmpty?: boolean;
    emptyMessage?: React.ReactNode;
    loadingLabel?: string;
    onRetry?: () => void;
    className?: string;
    children: React.ReactNode;
}

/**
 * Shared loading/error/empty gate for query-driven sections. Renders children only
 * once a query has resolved with data, so a failed fetch shows a retryable error
 * instead of falling through to whatever "no data" placeholder the caller has.
 */
const QueryState: React.FC<QueryStateProps> = ({
    isLoading,
    isError,
    error,
    isEmpty = false,
    emptyMessage = "No data found",
    loadingLabel,
    onRetry,
    className = "",
    children,
}) => {
    if (isLoading) {
        return (
            <div className={`query-state query-state-loading ${className}`}>
                <SpinnerUnknownDuration label={loadingLabel} />
            </div>
        );
    }

    if (isError) {
        return (
            <div className={`query-state query-state-error ${className}`}>
                <span className="query-state-error-icon" aria-hidden="true">⚠️</span>
                <span className="query-state-error-message">{error?.message || "Something went wrong"}</span>
                {onRetry && (
                    <Button variant="secondary" size="small" onClick={onRetry}>
                        Retry
                    </Button>
                )}
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className={`query-state query-state-empty ${className}`}>
                <span className="query-state-empty-message">{emptyMessage}</span>
            </div>
        );
    }

    return <>{children}</>;
};

export default QueryState;
