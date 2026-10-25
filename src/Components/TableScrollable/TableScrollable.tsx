import React from "react";
import "./TableScrollable.css";
import "../../Helpers/ColorScheme.css";
import Button from "../Button/Button";
import StatusPill from "../StatusPill/StatusPill";
import DropdownSelectorManaged from "../DropdownSelector/DropdownSelectorManaged";
import TextInputManaged from "../TextInput/TextInputManaged";
import Checkbox from "../Checkbox/Checkbox";
import ProgressCircular from "../ProgressCircular/ProgressCircular";
import ProgressBar from "../ProgressBar/ProgressBar";
import { displayRinggit } from "../../Helpers/CurrencyDisplay";

export type CellType = "date" | "string" | "number" | "currency" | "dropdown" | "button" | "checkbox" | "textinput" | "statuspill" | "progressbar" | "progressCircular" | "node";

export type CellAlignment = "left" | "center" | "right";

export interface TableScrollableColumn {
    key: string;
    title: string;
    type: CellType;
    width?: number;
    align?: CellAlignment;
    // Dropdown specific
    dropdownItems?: string[];
    onDropdownChange?: (rowId: string, value: string, index: number) => void;
    // Button specific
    buttonText?: string;
    buttonVariant?: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
    onButtonClick?: (rowId: string) => void;
    // Checkbox specific
    onCheckboxChange?: (rowId: string, checked: boolean) => void;
    // Text input specific
    onTextInputChange?: (rowId: string, value: string) => void;
    // Status pill specific
    statusVariant?: "success" | "warning" | "danger" | "info" | "primary";
    // Progress bar specific
    progressVariant?: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
    progressSize?: "small" | "medium" | "large";
    showProgressPercentage?: boolean;
    // Currency specific
    currencyCode?: string;
}

export interface TableScrollableRowData {
    id: string;
    [key: string]: string | number | boolean | React.ReactNode;
}

export interface TableScrollableProps {
    title: string;
    columns: TableScrollableColumn[];
    data: TableScrollableRowData[];
    className?: string;
    colorScheme?: "primary" | "orange" | "green" | "blue";
    onRowClick?: (id: string) => void;
    maxHeight?: string;
}

const TableScrollable: React.FC<TableScrollableProps> = ({ 
    title, 
    columns, 
    data, 
    className, 
    colorScheme = "primary", 
    onRowClick,
    maxHeight = "calc(100% - 90px)"
}) => {
    const renderCellContent = (row: TableScrollableRowData, column: TableScrollableColumn): React.ReactNode => {
        const value = row[column.key];
        
        switch (column.type) {
            case "date":
                if (typeof value === "string" || typeof value === "number") {
                    const date = new Date(value);
                    return date.toLocaleDateString();
                }
                return value;
                
            case "string":
                return value?.toString() || "";

            // Already-composed content: rendered as given. Every other cell type stringifies its
            // value, so this is the escape hatch for a cell that needs markup — a two-line cell,
            // a signed amount coloured by its sign, a badge beside a label.
            case "node":
                return value as React.ReactNode;

                
            case "number":
                if (typeof value === "number") {
                    return value.toLocaleString();
                }
                return value?.toString() || "";
                
            case "currency":
                if (typeof value === "number") {
                    return displayRinggit(value);
                }
                return value?.toString() || "";
                
            case "dropdown":
                return (
                    <DropdownSelectorManaged
                        options={(column.dropdownItems || []).map(item => ({ id: item, value: item }))}
                        defaultValue={value?.toString() ? { id: value.toString(), value: value.toString() } : null}
                        placeholder="Select..."
                        onChange={(selectedValue) => {
                            column.onDropdownChange?.(row.id, selectedValue?.value || "", 0);
                        }}
                    />
                );
                
            case "button": {
                const buttonDisabledKey = `${column.key}Disabled`;
                const isButtonDisabled = typeof row[buttonDisabledKey] === "boolean" ? row[buttonDisabledKey] as boolean : false;
                
                const buttonVariantKey = `${column.key}Variant`;
                const buttonVariant = row[buttonVariantKey] ? String(row[buttonVariantKey]) as "primary" | "secondary" | "success" | "info" | "warning" | "danger" : column.buttonVariant || "primary";
                
                const buttonText = value ? String(value) : column.buttonText || "Action";
                
                return (
                    <Button
                        variant={buttonVariant}
                        size="small"
                        onClick={() => column.onButtonClick?.(row.id)}
                        disabled={isButtonDisabled}
                    >
                        {buttonText}
                    </Button>
                );
            }
                
            case "checkbox": {
                const checkboxValue = typeof value === "boolean" ? value : false;
                const checkboxDisabledKey = `${column.key}Disabled`;
                const isCheckboxDisabled = typeof row[checkboxDisabledKey] === "boolean" ? row[checkboxDisabledKey] as boolean : false;
                return (
                    <Checkbox
                        checked={checkboxValue}
                        onChange={(checked) => {
                            column.onCheckboxChange?.(row.id, checked);
                        }}
                        colorScheme="primary"
                        size="small"
                        disabled={isCheckboxDisabled}
                    />
                );
            }
                
            case "textinput":
                return (
                    <TextInputManaged
                        defaultValue={value?.toString() || ""}
                        placeholder="Enter text..."
                        onChange={(newValue) => {
                            column.onTextInputChange?.(row.id, newValue);
                        }}
                    />
                );
                
            case "statuspill": {
                // Check if there's a variant field in the row data
                const variantKey = `${column.key}Variant`;
                const variant = (row[variantKey] as "success" | "warning" | "danger" | "info" | "primary") || column.statusVariant || "primary";
                return (
                    <StatusPill
                        text={value?.toString() || ""}
                        variant={variant}
                    />
                );
            }
                
            case "progressbar": {
                const progressValue = typeof value === "number" ? value : 0;
                const actionText = row[`${column.key}_action`]?.toString() || "";
                return (
                    <ProgressBar
                        title=""
                        progress={progressValue}
                        currentAction={actionText}
                        variant={column.progressVariant || "primary"}
                        size={column.progressSize || "small"}
                        showPercentage={column.showProgressPercentage !== false}
                    />
                );
            }
                
            case "progressCircular": {
                const circularProgressValue = typeof value === "number" ? value : 0;
                const circularActionText = row[`${column.key}_action`]?.toString() || "";
                return (
                    <ProgressCircular
                        title=""
                        progress={circularProgressValue}
                        currentAction={circularActionText}
                        variant={column.progressVariant || "primary"}
                        size={column.progressSize || "small"}
                        showPercentage={column.showProgressPercentage !== false}
                    />
                );
            }
                
            default:
                return value;
        }
    };

    return (
        <div className={`st-container color-scheme-${colorScheme} ${className || ""}`}>
            <div className="component-title">{title}</div>
            
            {/* Header Row */}
            <div className="st-header">
                {columns.map((col, colIndex) => (
                    <div
                        key={colIndex}
                        className="st-header-cell"
                        style={{
                            flex: col.width ? `0 0 ${col.width}%` : "1",
                            // Follow the column's alignment so a right-aligned figure sits under its own
                            // title; unaligned columns keep the centred default.
                            justifyContent: col.align ? (col.align === "center" ? "center" : col.align === "right" ? "flex-end" : "flex-start") : "center",
                        }}
                    >
                        {col.title}
                    </div>
                ))}
            </div>
            
            {/* Scrollable Body */}
            <div className="st-body" style={{ maxHeight }}>
                {data.map((row) => (
                    <div 
                        key={row.id} 
                        className={`st-row ${onRowClick ? "st-row-hover-effect" : ""}`}
                        onClick={() => onRowClick?.(row.id)}
                    >
                        {columns.map((col, colIndex) => (
                            <div
                                key={colIndex}
                                className="st-row-cell"
                                style={{
                                    flex: col.width ? `0 0 ${col.width}%` : "1",
                                    justifyContent: col.align ? (col.align === "center" ? "center" : col.align === "right" ? "flex-end" : "flex-start") : "flex-start"
                                }}
                            >
                                {renderCellContent(row, col)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableScrollable;
