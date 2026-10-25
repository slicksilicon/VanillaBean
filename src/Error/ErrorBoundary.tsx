import { Component, type ErrorInfo, type ReactNode } from "react";
import { showToast } from "../Components/Toast/toastBus";
import "./ErrorBoundary.css";

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Human-readable name of the boundary's contents, used in the fallback UI and toast. */
    label?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        const label = this.props.label ?? "The application";
        console.error(`ErrorBoundary (${label}) caught an error:`, error, errorInfo);
        showToast(`${label} ran into a problem: ${error.message}`, { variant: "error" });
    }

    handleReset = (): void => {
        this.setState({ hasError: false });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            const label = this.props.label ?? "This section";
            return (
                <div className="error-boundary-fallback">
                    <div className="error-boundary-content">
                        <span className="error-boundary-icon">⚠️</span>
                        <p className="error-boundary-message">{label} hit an unexpected error and couldn't render.</p>
                        <button className="error-boundary-retry" onClick={this.handleReset}>
                            Try again
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
