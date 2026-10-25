import React, { useMemo } from "react";
import "./ListIcons.css";

export interface IconItem {
    /** Source path for the icon (can be SVG string or image URL) */
    src: string;
    /** Unique identifier for the icon */
    id: string;
    /** Optional alt text for accessibility */
    alt?: string;
}

export interface ListIconsProps {
    /** Array of icons to display */
    icons: IconItem[];
    /** Size of each icon in pixels (icons are displayed as squares) */
    size?: number;
    /** Maximum width of the container in pixels. -1 means no limit (follows parent size) */
    maxWidth?: number;
    /** Additional CSS class name */
    className?: string;
    /** Gap between icons in pixels */
    gap?: number;
    /** Callback when an icon is clicked */
    onIconClick?: (icon: IconItem) => void;
}

// Helper: Convert raw SVG string to a Data URI for CSS background usage
const svgToDataUri = (svgString: string) => {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
};

const ListIcons: React.FC<ListIconsProps> = ({
    icons,
    size = 48,
    maxWidth = -1,
    className = "",
    gap = 8,
    onIconClick,
}) => {
    // Calculate the optimal number of columns
    const columns = useMemo(() => {
        const iconCount = icons.length;
        if (iconCount === 0) return 1;

        // Calculate max columns based on maxWidth constraint
        const iconTotalSize = size + gap;
        let maxAllowedColumns = Infinity;
        if (maxWidth > 0) {
            // Account for gap: n icons need (n-1) gaps, plus the icons themselves
            // Total width = n * size + (n-1) * gap = n * (size + gap) - gap
            // So: maxWidth >= n * (size + gap) - gap
            // n <= (maxWidth + gap) / (size + gap)
            maxAllowedColumns = Math.floor((maxWidth + gap) / iconTotalSize);
            maxAllowedColumns = Math.max(1, maxAllowedColumns);
        }

        // Find the best square-like arrangement
        // We want to minimize the difference between rows and columns while keeping it square-ish
        const sqrtCount = Math.sqrt(iconCount);
        let bestColumns = Math.ceil(sqrtCount);

        // Ensure we don't exceed maxAllowedColumns
        bestColumns = Math.min(bestColumns, maxAllowedColumns);

        // Ensure at least 1 column
        return Math.max(1, bestColumns);
    }, [icons.length, size, maxWidth, gap]);

    // Calculate container width
    const containerStyle = useMemo(() => {
        const style: React.CSSProperties = {};
        if (maxWidth > 0) {
            style.maxWidth = `${maxWidth}px`;
        }
        return style;
    }, [maxWidth]);

    // Calculate grid template
    const gridStyle = useMemo(() => {
        const style: React.CSSProperties = {
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, ${size}px)`,
            gap: `${gap}px`,
            justifyContent: 'center',
            alignItems: 'center',
        };
        return style;
    }, [columns, size, gap]);

    const handleIconClick = (icon: IconItem) => {
        if (onIconClick) {
            onIconClick(icon);
        }
    };

    if (icons.length === 0) {
        return null;
    }

    return (
        <div className={`list-icons-container ${className}`} style={containerStyle}>
            <div className="list-icons-grid" style={gridStyle}>
                {icons.map((icon) => {
                    // Check if the source looks like a raw SVG string
                    const isRawSvg = icon.src.trim().startsWith('<svg');

                    // Calculate the CSS background source
                    // If it's raw SVG, convert to Data URI. Otherwise use the URL.
                    const cssBgSource = isRawSvg 
                        ? `url("${svgToDataUri(icon.src)}")` 
                        : `url("${icon.src}")`;

                    return (
                        <div
                            key={icon.id}
                            className={`list-icons-item`}
                            style={{ 
                                width: `${size}px`, 
                                height: `${size}px`,
                                // Pass the background image as a CSS variable
                                '--icon-bg': cssBgSource 
                            } as React.CSSProperties}
                            onClick={() => handleIconClick(icon)}
                            role={onIconClick ? "button" : undefined}
                            tabIndex={onIconClick ? 0 : undefined}
                            onKeyDown={(e) => {
                                if (onIconClick && (e.key === "Enter" || e.key === " ")) {
                                    e.preventDefault();
                                    handleIconClick(icon);
                                }
                            }}
                        >
                            {/* Inner content */}
                            {isRawSvg ? (
                                // Render raw SVG inline
                                <div 
                                    className="list-icons-svg-wrapper"
                                    dangerouslySetInnerHTML={{ __html: icon.src }} 
                                />
                            ) : (
                                // Render standard image URL
                                <img
                                    src={icon.src}
                                    alt={icon.alt || icon.id}
                                    className="list-icons-image"
                                />
                            )}
                            
                            {/* The Blur Layer (handled in CSS via pseudo-element using --icon-bg) */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ListIcons;