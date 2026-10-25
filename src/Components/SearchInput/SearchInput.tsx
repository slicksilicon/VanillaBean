import React, { useEffect, useRef, useState } from "react";
import "./SearchInput.css";

export interface SearchInputProps {
    /** The committed search term. Kept in sync with what the caller queries on. */
    value: string;
    /** Fired with the debounced term, so a caller can drive a server query from it directly. */
    onChange: (value: string) => void;
    placeholder?: string;
    /** Milliseconds to wait after typing stops before reporting a change. */
    debounceMs?: number;
    /** Optional right-aligned content, e.g. a result count. */
    trailing?: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

/**
 * Debounced search field.
 *
 * The text the user sees is local state so typing stays responsive, while `onChange` fires only
 * after `debounceMs` of quiet — a caller can therefore pass the reported value straight into a
 * server query without issuing one request per keystroke.
 *
 * No backdrop-filter: this is inline flow content, and blurring it against a solid background
 * produces the tile-raster seam described in docs/glass-panel-seam-fix.md.
 */
const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    placeholder = "Search…",
    debounceMs = 250,
    trailing,
    disabled = false,
    className = "",
}) => {
    const [draft, setDraft] = useState(value);
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Re-sync when the caller resets the term from outside (e.g. clearing a filter).
    useEffect(() => {
        setDraft(value);
    }, [value]);

    // Report the draft once typing settles. Skipped when it already matches, so the effect
    // cannot bounce against the sync above.
    useEffect(() => {
        if (draft === value) {
            return;
        }
        const timer = window.setTimeout(() => onChange(draft), debounceMs);
        return () => window.clearTimeout(timer);
    }, [draft, value, debounceMs, onChange]);

    const handleClear = () => {
        setDraft("");
        onChange("");
        inputRef.current?.focus();
    };

    return (
        <div className={`search-input-container ${className}`}>
            <div className={`search-input-wrapper ${focused ? "focused" : ""} ${disabled ? "disabled" : ""}`}>
                <svg
                    className="search-input-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>
                <input
                    ref={inputRef}
                    type="search"
                    className="search-input-field"
                    value={draft}
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={(event) => setDraft(event.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
                {draft.length > 0 && !disabled && (
                    <button type="button" className="search-input-clear" onClick={handleClear} title="Clear search" aria-label="Clear search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <line x1="6" y1="6" x2="18" y2="18" />
                            <line x1="18" y1="6" x2="6" y2="18" />
                        </svg>
                    </button>
                )}
            </div>
            {trailing && <div className="search-input-trailing">{trailing}</div>}
        </div>
    );
};

export default SearchInput;
