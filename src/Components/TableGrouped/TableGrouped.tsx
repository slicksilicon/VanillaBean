import React from "react";
import "./TableGrouped.css";
import "../../Helpers/ColorScheme.css";


export interface TableGroupedColumn {
    title: string;    
    width?: number;
    align?: "left" | "center" | "right";
}

export interface TableGroupedRowData {
    id: string;
    [key: string]: string | number | React.ReactNode;
}

export interface TableGroupedData {
    groupTitle: string;
    rows: TableGroupedRowData[];
}

export interface TableGroupedProps {
    title : string;
    columns: TableGroupedColumn[];
    data: TableGroupedData[];
    className?: string;
    colorScheme?: "primary" | "orange" | "green" | "blue";
    onRowClick?: (id: string) => void;
}

const TableGrouped: React.FC<TableGroupedProps> = ({ title, columns, data, className, colorScheme = "primary", onRowClick }) => {
    return (
        <div className={`tg-container color-scheme-${colorScheme} ${className || ""}`}>
            <div className="component-title">{title}</div>            
                {/* Header Row */}
                <div className={'tg-header'}>
                    {columns.map((col, colIndex) => (
                        <div
                            key={colIndex}
                            className="tg-header-cell"
                            style={{ flex: col.width ? `0 0 ${col.width}%` : "1" }}
                        >
                            {col.title}
                        </div>
                    ))}
                </div>
                {/* Groups */}
                <div className="tg-group-container">
                    {data.map((group, groupIndex) => (
                        <div key={groupIndex} className="tg-group">
                            <div className="tg-group-title">{group.groupTitle}</div>
                            {group.rows.map((row) => (
                                <div key={row.id} className="tg-row tg-row-hover-effect" onClick={() => onRowClick && onRowClick(row.id)}>
                                    {columns.map((col, colIndex) => (
                                        <div 
                                            key={colIndex} 
                                            className="tg-row-cell" 
                                            style={{ 
                                                flex: col.width ? `0 0 ${col.width}%` : "1",
                                                justifyContent: col.align ? (col.align === "center" ? "center" : col.align === "right" ? "flex-end" : "flex-start") : undefined
                                            }}
                                        >
                                            {row[col.title.toLowerCase()] || row.title || ""}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        
    );
}

export default TableGrouped;