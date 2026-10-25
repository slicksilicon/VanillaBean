import React, { useMemo, useState, useRef, useEffect } from "react";
import StepperSelector, { type StepperVariant } from "../StepperSelector/StepperSelector";
import "./ExcelTable.css";

// ============================================================================
// Types
// ============================================================================

export type ExcelTableEditType = "callback" | "text" | "stepper";

export interface ExcelTableColumn {
    /** Data key used to look up cell values from row data */
    key: string;
    /** Display title shown in the header row */
    title: string;
    /** Column width — CSS value: fixed ("150px"), content-fit ("auto"), or fill ("1fr"). Defaults to "1fr" */
    width?: string;
    /** Whether cells in this column can be edited */
    editable?: boolean;
    /**
     * How to handle editing for this column:
     * - "callback" (default): clicking the cell calls onEdit(row) for whole-row editing
     * - "text": renders an inline text input on click
     * - "stepper": renders a StepperSelector directly in the cell
     */
    editType?: ExcelTableEditType;
    /** Items array for stepper (required when editType === "stepper") */
    stepperItems?: number[];
    /** Visual variant for the embedded StepperSelector (default: "primary") */
    stepperVariant?: StepperVariant;
    /** If true, right border of this column is 2px instead of 1px (outer table border takes precedence) */
    major?: boolean;
    /** Text alignment within cells. Defaults to "left" */
    align?: "left" | "center" | "right";
}

export interface ExcelTableRow {
    /** Unique identifier for the row */
    id: string | number;
    /** Row data keyed by column key */
    [key: string]: string | number | boolean | React.ReactNode;
}

export interface ExcelTableDivider {
    /** Always "divider" to distinguish from data rows */
    type: "divider";
    /** Label text displayed centered in the divider row */
    label: string;
    /** The divider appears before this row index (0-based index into the data array) */
    beforeRowIndex: number;
}

export interface ExcelTableProps {
    /** Column definitions */
    columns: ExcelTableColumn[];
    /** Row data — component is fully controlled, parent owns this array */
    data: ExcelTableRow[];
    /** Optional divider rows inserted at specific positions */
    dividers?: ExcelTableDivider[];
    /** Called when the delete button (×) is clicked for a row */
    onDelete?: (row: ExcelTableRow) => void;
    /** Called when the insert button (+) is clicked — parent should show a form then update data */
    onInsert?: () => void;
    /** Called when an editable cell with editType "callback" is clicked — parent should show edit form for the whole row */
    onEdit?: (row: ExcelTableRow) => void;
    /** Called when an inline edit (text or stepper) changes a cell value — parent should update the data array */
    onCellChange?: (rowId: string | number, key: string, value: string | number) => void;
    /** Function to get custom CSS class for a specific row based on row data */
    getRowClassName?: (row: ExcelTableRow) => string;
    /** CSS class to override the default yellow header row styling */
    headerClassName?: string;
    /** Additional CSS class on the outermost wrapper */
    className?: string;
}

// ============================================================================
// Inline Text Editor
// ============================================================================

const InlineTextEditor: React.FC<{
    value: string;
    onCommit: (value: string) => void;
}> = ({ value, onCommit }) => {
    const [inputValue, setInputValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const commit = () => onCommit(inputValue);

    return (
        <input
            ref={inputRef}
            type="text"
            className="excel-table-inline-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") { commit(); }
                if (e.key === "Escape") { onCommit(value); }
            }}
        />
    );
};

// ============================================================================
// Component
// ============================================================================

const ExcelTable: React.FC<ExcelTableProps> = ({
    columns,
    data,
    dividers = [],
    onDelete,
    onInsert,
    onEdit,
    onCellChange,
    getRowClassName,
    headerClassName,
    className = "",
}) => {
    const hasDeleteColumn = !!onDelete;
    const hasInsertButton = !!onInsert;

    // Track which cell is currently being inline-text-edited ("rowId:colKey")
    const [editingCell, setEditingCell] = useState<string | null>(null);

    // Build grid-template-columns from column definitions + optional delete column
    const gridTemplateColumns = useMemo(() => {
        const colWidths = columns.map(col => col.width ?? "1fr").join(" ");
        return hasDeleteColumn ? `${colWidths} 45px` : colWidths;
    }, [columns, hasDeleteColumn]);

    const totalColumnSpan = hasDeleteColumn ? columns.length + 1 : columns.length;

    // Sort dividers by beforeRowIndex for correct insertion
    const sortedDividers = useMemo(() => {
        return [...dividers].sort((a, b) => a.beforeRowIndex - b.beforeRowIndex);
    }, [dividers]);

    // Build the rendered rows: interleave data rows with dividers
    const renderedRows = useMemo(() => {
        const rows: Array<{ type: "data"; row: ExcelTableRow; index: number } | { type: "divider"; label: string }> = [];
        let dividerIdx = 0;

        for (let i = 0; i < data.length; i++) {
            // Insert any dividers that belong before this row index
            while (dividerIdx < sortedDividers.length && sortedDividers[dividerIdx].beforeRowIndex === i) {
                rows.push({ type: "divider", label: sortedDividers[dividerIdx].label });
                dividerIdx++;
            }

            rows.push({ type: "data", row: data[i], index: i });
        }

        // Insert any remaining dividers that come after the last row
        while (dividerIdx < sortedDividers.length) {
            rows.push({ type: "divider", label: sortedDividers[dividerIdx].label });
            dividerIdx++;
        }

        return rows;
    }, [data, sortedDividers]);

    const handleCellClick = (row: ExcelTableRow, col: ExcelTableColumn) => {
        const effectiveEditType = col.editType ?? "callback";
        if (col.editable && effectiveEditType === "callback" && onEdit) {
            onEdit(row);
        } else if (col.editable && effectiveEditType === "text") {
            setEditingCell(`${row.id}:${col.key}`);
        }
    };

    const handleCellKeyDown = (e: React.KeyboardEvent, row: ExcelTableRow, col: ExcelTableColumn) => {
        const effectiveEditType = col.editType ?? "callback";
        if ((e.key === "Enter" || e.key === " ") && col.editable) {
            e.preventDefault();
            if (effectiveEditType === "callback" && onEdit) {
                onEdit(row);
            } else if (effectiveEditType === "text") {
                setEditingCell(`${row.id}:${col.key}`);
            }
        }
    };

    const renderCellContent = (row: ExcelTableRow, col: ExcelTableColumn): React.ReactNode => {
        const effectiveEditType = col.editType ?? "callback";

        if (!col.editable || effectiveEditType === "callback") {
            return row[col.key] as React.ReactNode;
        }

        if (effectiveEditType === "stepper" && col.stepperItems) {
            return (
                <StepperSelector<number>
                    items={col.stepperItems}
                    value={Number(row[col.key]) || 0}
                    onChange={(val) => onCellChange?.(row.id, col.key, val)}
                    variant={col.stepperVariant ?? "primary"}
                    titlePosition="none"
                />
            );
        }

        if (effectiveEditType === "text") {
            const cellId = `${row.id}:${col.key}`;
            if (editingCell === cellId) {
                return (
                    <InlineTextEditor
                        value={String(row[col.key] ?? "")}
                        onCommit={(val) => {
                            setEditingCell(null);
                            onCellChange?.(row.id, col.key, val);
                        }}
                    />
                );
            }
            return row[col.key] as React.ReactNode;
        }

        return row[col.key] as React.ReactNode;
    };

    return (
        <div className={`excel-table-wrapper ${className}`}>
            {/* Scrollable container for header + body */}
            <div className="excel-table-scroll-container">
                {/* Header Row — sticky at top */}
                <div className="excel-table-header" style={{ gridTemplateColumns }}>
                    {columns.map((col, colIdx) => {
                        const isLastCol = colIdx === columns.length - 1;
                        const cellClasses = [
                            "excel-table-header-cell",
                            headerClassName ?? "excel-table-header-default",
                            col.major && !isLastCol ? "excel-table-cell-major" : "",
                        ].filter(Boolean).join(" ");

                        return (
                            <div key={col.key} className={cellClasses} style={{ textAlign: col.align ?? "center" }}>
                                {col.title}
                            </div>
                        );
                    })}
                    {hasDeleteColumn && <div className="excel-table-header-cell excel-table-header-default" >🗑️</div>}
                </div>

                {/* Data Rows */}
                <div className="excel-table-body" style={{ gridTemplateColumns }}>
                    {/* Data Rows & Dividers */}
                    {renderedRows.map((entry, rowIdx) => {
                        if (entry.type === "divider") {
                            return (
                                <div key={`divider-${rowIdx}`} className="excel-table-divider" style={{ gridColumn: `1 / ${totalColumnSpan + 1}` }}>
                                    {entry.label}
                                </div>
                            );
                        }

                        const { row } = entry;
                        const isEvenRow = entry.index % 2 === 0;
                        const customRowClass = getRowClassName?.(row) ?? "";

                        return (
                            <React.Fragment key={String(row.id)}>
                                {columns.map((col, colIdx) => {
                                    const isLastCol = colIdx === columns.length - 1;
                                    const effectiveEditType = col.editType ?? "callback";
                                    const isStepper = col.editable && effectiveEditType === "stepper";
                                    const isTextEditable = col.editable && effectiveEditType === "text";
                                    const isCallbackEditable = col.editable && effectiveEditType === "callback";
                                    const cellClasses = [
                                        "excel-table-cell",
                                        // isEvenRow ? "excel-table-row-even" : "excel-table-row-odd",
                                        "excel-table-row-even",
                                        isCallbackEditable || isTextEditable ? "excel-table-cell-editable" : "",
                                        isStepper ? "excel-table-cell-stepper" : "",
                                        col.major && !isLastCol ? "excel-table-cell-major" : "",
                                        customRowClass,
                                    ].filter(Boolean).join(" ");

                                    return (
                                        <div
                                            key={`${row.id}-${col.key}`}
                                            className={cellClasses}
                                            style={{ textAlign: col.align ?? "left" }}
                                            onClick={(isCallbackEditable || isTextEditable) ? () => handleCellClick(row, col) : undefined}
                                            onKeyDown={(isCallbackEditable || isTextEditable) ? (e) => handleCellKeyDown(e, row, col) : undefined}
                                            role={(isCallbackEditable || isTextEditable) ? "button" : undefined}
                                            tabIndex={(isCallbackEditable || isTextEditable) ? 0 : undefined}
                                        >
                                            {renderCellContent(row, col)}
                                        </div>
                                    );
                                })}
                                {hasDeleteColumn && (
                                    <div className={`excel-table-delete-cell ${isEvenRow ? "excel-table-row-even" : "excel-table-row-odd"} ${customRowClass}`}>
                                        {onDelete && (
                                            <button className="excel-table-delete-btn" onClick={() => onDelete(row)} aria-label="Delete row" title="Delete row">
                                                ✘
                                            </button>
                                        )}
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* Insert Row */}
                    {hasInsertButton && (
                        <div className="excel-table-insert-row" style={{ gridColumn: `1 / ${totalColumnSpan + 1}` }}>
                            <button className="excel-table-insert-btn" onClick={onInsert} aria-label="Insert row" title="Insert new row">
                                + Add Row
                            </button>
                        </div>
                    )}
                </div>

                {/* Filler — fills remaining height below the table rows */}
                <div className="excel-table-filler" />
            </div>
        </div>
    );
};

ExcelTable.displayName = "ExcelTable";

export default ExcelTable;
