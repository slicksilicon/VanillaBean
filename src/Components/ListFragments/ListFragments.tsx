import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import "./ListFragments.css";

export type ListFragmentVariant = "primary" | "secondary" | "success" | "info" | "warning" | "danger" | "default";
export type SelectionMode = "none" | "single" | "multi" | "dual";

export interface FragmentScheme {
    background: string;
    borderColor: string;
    boxShadow: string;
    hoverBackground: string;
    hoverBorderColor: string;
    hoverBoxShadow: string;
}

export interface ListFragmentsProps<T extends Record<string, unknown>> {
    data: T[];
    renderItem: (item: T, index: number) => string;
    keyExtractor?: (item: T, index: number) => string;
    variant?: ListFragmentVariant;
    className?: string;
    selectionMode?: SelectionMode;
    onItemClick?: (item: T, index: number) => void;
    onSelectedItemChange?: (item: T | null, index: number | null) => void;
    onMultiSelectChange?: (selectedItems: T[], selectedIndices: number[]) => void;
    onElementClick?: (item: T, index: number, selector: string, element: HTMLElement, event: MouseEvent) => boolean;
    itemsPerPage?: number;
    loadMoreThreshold?: number;
    selectedItemScheme?: ListFragmentVariant;
    multiSelectedItemScheme?: ListFragmentVariant;
}

export interface ListFragmentsRef {
    clearMultiSelection: () => void;
    setMultiSelection: (indices: number[]) => void;
    clearSelection: () => void;
    setSelection: (index: number) => void;
    getMultiSelectedData: () => unknown[];
}

// Color mappings for each variant
const variantColors: Record<ListFragmentVariant, { r: number; g: number; b: number }> = {
    primary: { r: 100, g: 150, b: 255 },     // Blue
    secondary: { r: 150, g: 150, b: 150 },   // Gray
    success: { r: 100, g: 200, b: 100 },     // Green
    info: { r: 100, g: 180, b: 220 },        // Cyan
    warning: { r: 255, g: 180, b: 100 },     // Orange
    danger: { r: 255, g: 100, b: 100 },      // Red
    default: { r: 150, g: 150, b: 200 }      // Light Purple
};

// Function to generate FragmentScheme from variant name
const generateScheme = (variant: ListFragmentVariant): FragmentScheme => {
    const color = variantColors[variant];
    return {
        background: `rgba(${color.r}, ${color.g}, ${color.b}, 0.25)`,
        borderColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`,
        boxShadow: `0 4px 20px rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`,
        hoverBackground: `rgba(${color.r}, ${color.g}, ${color.b}, 0.35)`,
        hoverBorderColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`,
        hoverBoxShadow: `0 4px 24px rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`
    };
};

const ListFragments = forwardRef(<T extends Record<string, unknown>>({
    data,
    renderItem,
    keyExtractor,
    variant = "default",
    className = "",
    selectionMode = "dual",
    onItemClick,
    onSelectedItemChange,
    onMultiSelectChange,
    onElementClick,
    itemsPerPage = 50,
    loadMoreThreshold = 200,
    selectedItemScheme = "info",
    multiSelectedItemScheme = "success",
}: ListFragmentsProps<T>, ref: React.Ref<ListFragmentsRef>): React.ReactElement => {
    const [displayCount, setDisplayCount] = useState(Math.min(itemsPerPage, data.length));
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [multiSelectedIndices, setMultiSelectedIndices] = useState<Set<number>>(new Set());
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const pendingSelectionIndex = useRef<number | null>(null);

    // Apply pending selection when data updates and index becomes valid
    useEffect(() => {
        if (pendingSelectionIndex.current !== null) {
            if (pendingSelectionIndex.current >= 0 && pendingSelectionIndex.current < data.length) {
                const index = pendingSelectionIndex.current;
                pendingSelectionIndex.current = null;
                setSelectedIndex(index);
                if (onSelectedItemChange) {
                    onSelectedItemChange(data[index], index);
                }
            }
        }
    }, [data, onSelectedItemChange]);

    // Generate schemes from variant names
    const selectedScheme = useMemo(() => generateScheme(selectedItemScheme), [selectedItemScheme]);
    const multiSelectedScheme = useMemo(() => generateScheme(multiSelectedItemScheme), [multiSelectedItemScheme]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        clearMultiSelection: () => {
            setMultiSelectedIndices(new Set());
            if (onMultiSelectChange) {
                onMultiSelectChange([], []);
            }
        },
        setMultiSelection: (indices: number[]) => {
            const newSelectedIndices = new Set(indices);
            setMultiSelectedIndices(newSelectedIndices);
            if (onMultiSelectChange) {
                const selectedItems = indices.map(i => data[i]).filter(Boolean);
                onMultiSelectChange(selectedItems, indices);
            }
        },
        setSelection: (index: number) => {
            if (index >= 0 && index < data.length) {
                pendingSelectionIndex.current = null;
                setSelectedIndex(index);
                if (onSelectedItemChange) {
                    onSelectedItemChange(data[index], index);
                }
            } else {
                pendingSelectionIndex.current = index;
            }
        },
        clearSelection: () => {
            pendingSelectionIndex.current = null;
            setSelectedIndex(null);
            setMultiSelectedIndices(new Set());
            if (onSelectedItemChange) {
                onSelectedItemChange(null, null);
            }
            if (onMultiSelectChange) {
                onMultiSelectChange([], []);
            }
        },
        getMultiSelectedData: () => {
            return Array.from(multiSelectedIndices)
                .filter(index => index >= 0 && index < data.length)
                .map(index => data[index]);
        }
    }), [data, multiSelectedIndices, onSelectedItemChange, onMultiSelectChange]);

    const loadMore = useCallback(() => {
        const newCount = Math.min(displayCount + itemsPerPage, data.length);
        if (newCount > displayCount) {
            setDisplayCount(newCount);
        }
    }, [displayCount, itemsPerPage, data.length]);

    useEffect(() => {
        if (!sentinelRef.current) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && displayCount < data.length) {
                    loadMore();
                }
            },
            {
                root: null,
                rootMargin: `${loadMoreThreshold}px`,
                threshold: 0.1,
            }
        );

        observerRef.current.observe(sentinelRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [displayCount, data.length, loadMore, loadMoreThreshold]);

    useEffect(() => {
        setDisplayCount(Math.min(itemsPerPage, data.length));
    }, [data.length, itemsPerPage]);

    // Handle custom element clicks with capture phase
    useEffect(() => {
        if (!onElementClick || !containerRef.current) return;

        const container = containerRef.current;
        const handleElementClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const listItem = target.closest(".list-fragment-item") as HTMLElement;
            
            if (!listItem || !container.contains(listItem)) return;

            // Get item index from the list
            const items = Array.from(container.querySelectorAll(".list-fragment-item"));
            const index = items.indexOf(listItem);
            
            if (index === -1 || index >= data.length) return;

            // Check for elements with data-clickable attribute
            const clickableElement = target.closest("[data-clickable]") as HTMLElement;
            if (clickableElement && listItem.contains(clickableElement)) {
                const selector = clickableElement.getAttribute("data-clickable");
                if (selector) {
                    const shouldPreventDefault = onElementClick(data[index], index, selector, clickableElement, event);
                    if (shouldPreventDefault) {
                        event.stopPropagation();
                        event.preventDefault();
                    }
                }
            }
        };

        // Use capture phase to intercept before item click handler
        container.addEventListener("click", handleElementClick, true);
        
        return () => {
            container.removeEventListener("click", handleElementClick, true);
        };
    }, [onElementClick, data]);

    const handleItemClick = useCallback(
        (item: T, index: number, event: React.MouseEvent) => {
            // Handle selection based on mode
            if (selectionMode === "none") {
                // No selection mode - just trigger click callback
                if (onItemClick) {
                    onItemClick(item, index);
                }
                return;
            }

            if (selectionMode === "multi") {
                // Multi-only mode - always do multi-selection regardless of ctrl key
                const newSelectedIndices = new Set(multiSelectedIndices);
                if (newSelectedIndices.has(index)) {
                    newSelectedIndices.delete(index);
                } else {
                    newSelectedIndices.add(index);
                }
                setMultiSelectedIndices(newSelectedIndices);

                // Notify parent of multi-selection change
                if (onMultiSelectChange) {
                    const selectedItems = Array.from(newSelectedIndices).map(i => data[i]);
                    const selectedIndicesArray = Array.from(newSelectedIndices);
                    onMultiSelectChange(selectedItems, selectedIndicesArray);
                }
                
                // Call onItemClick callback
                if (onItemClick) {
                    onItemClick(item, index);
                }
                return;
            }

            if (selectionMode === "single") {
                // Single-only mode - ignore ctrl key, always single selection
                setSelectedIndex(index);

                // Notify parent of selected item change
                if (onSelectedItemChange) {
                    onSelectedItemChange(item, index);
                }
                
                // Call onItemClick callback
                if (onItemClick) {
                    onItemClick(item, index);
                }
                return;
            }

            // Dual mode (default) - check ctrl/cmd key for multi-selection
            if (event.ctrlKey || event.metaKey) {
                // Multi-selection mode
                const newSelectedIndices = new Set(multiSelectedIndices);
                if (newSelectedIndices.has(index)) {
                    newSelectedIndices.delete(index);
                } else {
                    newSelectedIndices.add(index);
                }
                setMultiSelectedIndices(newSelectedIndices);

                // Notify parent of multi-selection change
                if (onMultiSelectChange) {
                    const selectedItems = Array.from(newSelectedIndices).map(i => data[i]);
                    const selectedIndicesArray = Array.from(newSelectedIndices);
                    onMultiSelectChange(selectedItems, selectedIndicesArray);
                }
            } else {
                // Single selection mode
                pendingSelectionIndex.current = null;
                setSelectedIndex(index);

                // Notify parent of selected item change
                if (onSelectedItemChange) {
                    onSelectedItemChange(item, index);
                }
            }

            // Always call the original onItemClick callback
            if (onItemClick) {
                onItemClick(item, index);
            }
        },
        [selectionMode, onItemClick, onSelectedItemChange, onMultiSelectChange, multiSelectedIndices, data]
    );

    const getItemStyle = useCallback((index: number): React.CSSProperties => {
        const isHovered = hoveredIndex === index;
        
        // Check if this item is in multi-selection
        if (multiSelectedIndices.has(index)) {
            return {
                background: isHovered ? multiSelectedScheme.hoverBackground : multiSelectedScheme.background,
                borderColor: isHovered ? multiSelectedScheme.hoverBorderColor : multiSelectedScheme.borderColor,
                boxShadow: isHovered ? multiSelectedScheme.hoverBoxShadow : multiSelectedScheme.boxShadow,
            };
        }
        // Check if this is the single selected item (only if not in multi-selection)
        else if (selectedIndex === index) {
            return {
                background: isHovered ? selectedScheme.hoverBackground : selectedScheme.background,
                borderColor: isHovered ? selectedScheme.hoverBorderColor : selectedScheme.borderColor,
                boxShadow: isHovered ? selectedScheme.hoverBoxShadow : selectedScheme.boxShadow,
            };
        }
        
        return {};
    }, [selectedIndex, multiSelectedIndices, hoveredIndex, selectedScheme, multiSelectedScheme]);

    const combinedClasses = ["list-fragments", variant !== "default" && `list-fragments-${variant}`, className].filter(Boolean).join(" ");

    return (
        <div className={combinedClasses} ref={containerRef}>
            {data.slice(0, displayCount).map((item, index) => {
                const itemKey = keyExtractor ? keyExtractor(item, index) : index;
                return (
                    <div
                        key={itemKey}
                        className="list-fragment-item"
                        style={getItemStyle(index)}
                        onClick={(event) => handleItemClick(item, index, event)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        dangerouslySetInnerHTML={{ __html: renderItem(item, index) }}
                    />
                );
            })}
            {displayCount < data.length && (
                <div ref={sentinelRef} className="list-fragment-sentinel">
                    <div className="list-fragment-loading">Loading more items...</div>
                </div>
            )}
        </div>
    );
}) as <T extends Record<string, unknown>>(props: ListFragmentsProps<T> & { ref?: React.Ref<ListFragmentsRef> }) => React.ReactElement;

export default ListFragments;
