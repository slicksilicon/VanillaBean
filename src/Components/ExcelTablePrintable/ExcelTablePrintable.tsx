import React, { useMemo } from "react";
import "./ExcelTablePrintable.css";

// Reuse your existing types
import type { 
  ExcelTableProps, 
  ExcelTableRow, 
  ExcelTableColumn 
} from "../ExcelTable/ExcelTable"; // Adjust import path as needed

// We only need a subset of props for printing (no callbacks needed)
type PrintableTableProps = Pick<
  ExcelTableProps, 
  "columns" | "data" | "dividers" | "getRowClassName" | "headerClassName" | "className"
>;

const ExcelTablePrintable: React.FC<PrintableTableProps> = ({
  columns,
  data,
  dividers = [],
  getRowClassName,
  headerClassName,
  className = "",
}) => {
  
  // 1. Calculate Column Widths (Exclude Delete Column logic)
  const gridTemplateColumns = useMemo(() => {
    return columns.map(col => col.width ?? "1fr").join(" ");
  }, [columns]);

  const totalColumnSpan = columns.length;

  // 2. Merge Data and Dividers (Same logic as original)
  const sortedDividers = useMemo(() => {
    return [...dividers].sort((a, b) => a.beforeRowIndex - b.beforeRowIndex);
  }, [dividers]);

  const renderedRows = useMemo(() => {
    const rows: Array<{ type: "data"; row: ExcelTableRow; index: number } | { type: "divider"; label: string }> = [];
    let dividerIdx = 0;

    for (let i = 0; i < data.length; i++) {
      while (dividerIdx < sortedDividers.length && sortedDividers[dividerIdx].beforeRowIndex === i) {
        rows.push({ type: "divider", label: sortedDividers[dividerIdx].label });
        dividerIdx++;
      }
      rows.push({ type: "data", row: data[i], index: i });
    }
    while (dividerIdx < sortedDividers.length) {
      rows.push({ type: "divider", label: sortedDividers[dividerIdx].label });
      dividerIdx++;
    }
    return rows;
  }, [data, sortedDividers]);

  // 3. Render Cell Content (simplified: no inputs/steppers, just text)
  const renderCellContent = (row: ExcelTableRow, col: ExcelTableColumn): React.ReactNode => {
    // Just render the value directly. 
    // If you have specific formatting (e.g., currency), apply it here.
    const val = row[col.key];
    return val as React.ReactNode;
  };

  return (
    <div className={`printable-excel-table ${className}`}>
      
      {/* Header Row */}
      <div className="printable-header-row" style={{ gridTemplateColumns }}>
        {columns.map((col, idx) => {
            const isLastCol = idx === columns.length - 1;
            return (
                <div 
                    key={col.key} 
                    className={`printable-header-cell ${headerClassName ?? ''} ${col.major && !isLastCol ? 'printable-border-major' : ''}`}
                    style={{ textAlign: col.align ?? "center" }}
                >
                    {col.title}
                </div>
            );
        })}
      </div>

      {/* Body */}
      <div className="printable-body">
        {renderedRows.map((entry, rowIdx) => {
          
          // Render Divider
          if (entry.type === "divider") {
            return (
              <div 
                key={`divider-${rowIdx}`} 
                className="printable-divider no-break" 
                style={{ 
                    gridColumn: `1 / ${totalColumnSpan + 1}` 
                }}
              >
                {entry.label}
              </div>
            );
          }

          // Render Data Row
          const { row } = entry;          
          const customRowClass = getRowClassName?.(row) ?? "";
          
          return (
            /* We wrap the whole row in a display:contents or handle the grid directly. 
               To ensure page breaks don't cut a row, we wrap the cells in a container 
               mimicking the grid row, OR we apply no-break to cells. 
               
               Best approach for Grid Printing: render the cells flat but use the 
               CSS Grid on the parent. However, keeping cells together requires 
               wrapping them in a container if we want 'break-inside: avoid'. 
               
               Let's stick to the grid layout but apply 'no-break' to the Cells.
            */
            <React.Fragment key={String(row.id)}>
              {columns.map((col, colIdx) => {
                const isLastCol = colIdx === columns.length - 1;
                return (
                    <div
                        key={`${row.id}-${col.key}`}
                        className={`
                            printable-cell                            
                            printable-row-even
                            ${col.major && !isLastCol ? "printable-border-major" : ""}
                            ${customRowClass}
                            no-break
                        `}
                        style={{ 
                            textAlign: col.align ?? "left",
                            /* We need to manually assign grid position if we are in a single grid container,
                               but here we are generating flat divs inside 'printable-body' which is the grid. 
                            */
                        }}
                    >
                        {renderCellContent(row, col)}
                    </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ExcelTablePrintable;