import React, { useMemo } from "react";
import QueryState from "../QueryState/QueryState";
import SpinnerUnknownDuration from "../SpinnerUnknownDuration/SpinnerUnknownDuration";
import "./SelectionListPanel.css";

export interface SelectionListItem {
    id: string;
    label: string;
    count: number;
}

/** Ordering applied before render: alphabetical by label, or by count (descending, label tie-break). */
export type SelectionSort = "label" | "count";

interface SelectionListPanelProps {
    /** Feature-specific header controls (dropdowns, buttons) rendered above the list. */
    controls?: React.ReactNode;
    items: SelectionListItem[];
    sort?: SelectionSort;
    selectedId: string | null;
    onSelect: (id: string) => void;
    /** Pluralized noun for the header count pill, e.g. "Actors" → "922 Actors". */
    countLabel: string;
    isLoading: boolean;
    isFetching?: boolean;
    isError: boolean;
    error: Error | null;
    onRetry: () => void;
    emptyMessage: string;
    className?: string;
}

/**
 * A fixed-width glass side panel holding a scrollable, single-select list of
 * label+count rows — the "category rail" shape shared by master-detail browsers.
 */
const SelectionListPanel: React.FC<SelectionListPanelProps> = ({
    controls,
    items,
    sort,
    selectedId,
    onSelect,
    countLabel,
    isLoading,
    isFetching = false,
    isError,
    error,
    onRetry,
    emptyMessage,
    className = "",
}) => {
    const sorted = useMemo(() => {
        if (!sort) return items;
        const copy = [...items];
        if (sort === "label") {
            return copy.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
        }
        return copy.sort((a, b) => {
            const diff = b.count - a.count;
            return diff !== 0 ? diff : a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
        });
    }, [items, sort]);

    return (
        <div className={`slp-panel ${className}`}>
            {controls && <div className="slp-controls">{controls}</div>}

            <div className="slp-list-head">
                {isFetching && <SpinnerUnknownDuration size={14} />}
                {!isFetching && sorted.length > 0 && <span className="slp-list-count">{sorted.length} {countLabel}</span>}
            </div>

            <div className="slp-list">
                <QueryState
                    isLoading={isLoading}
                    isError={isError}
                    error={error}
                    isEmpty={sorted.length === 0}
                    emptyMessage={emptyMessage}
                    onRetry={onRetry}
                >
                    {sorted.map((item) => (
                        <button
                            key={item.id}
                            className={`slp-row${selectedId === item.id ? " slp-row--selected" : ""}`}
                            onClick={() => onSelect(item.id)}
                            type="button"
                        >
                            <span className="slp-row-name">{item.label}</span>
                            <span className="slp-row-count">{item.count}</span>
                        </button>
                    ))}
                </QueryState>
            </div>
        </div>
    );
};

export default SelectionListPanel;
