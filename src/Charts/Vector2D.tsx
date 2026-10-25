import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { getColorFromScheme } from "../Helpers/GetColorsFromScheme";
import type { ColorSchemeNames } from "../Helpers/GetColorsFromScheme";
import "../Helpers/ColorScheme.css";
import "./Vector2D.css";

/* ── Exported Types ── */

export interface Vector2DPoint {
    id: string;
    x: number;
    y: number;
    confidence: number;
    label?: string;
    trackId?: number;
    clusterId?: number;
}

export interface Vector2DClusterInfo {
    clusterId: number;
    pointIds: string[];
}

export interface Vector2DProps {
    points: Vector2DPoint[];
    colorScheme?: ColorSchemeNames;
    clusterRadius?: number;
    minDotRadius?: number;
    maxDotRadius?: number;
    glowRadius?: number;
    showLegend?: boolean;
    showBadge?: boolean;
    className?: string;
    onPointClick?: (point: Vector2DPoint) => void;
    onClusterSelect?: (cluster: Vector2DClusterInfo | null) => void;
}

/* ── DBSCAN-style Clustering ── */

interface ClusterAssignment {
    clusterId: number;
    point: Vector2DPoint;
}

function clusterPoints(points: Vector2DPoint[], eps: number): ClusterAssignment[] {
    const n = points.length;
    const labels = new Array<number>(n).fill(-1);
    let clusterId = 0;

    const dist = (a: Vector2DPoint, b: Vector2DPoint): number => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const regionQuery = (idx: number): number[] => {
        const neighbors: number[] = [];
        for (let i = 0; i < n; i++) {
            if (dist(points[idx], points[i]) <= eps) {
                neighbors.push(i);
            }
        }
        return neighbors;
    };

    for (let i = 0; i < n; i++) {
        if (labels[i] !== -1) continue;

        const neighbors = regionQuery(i);
        if (neighbors.length < 2) {
            labels[i] = -1; // noise for now, assign later
            continue;
        }

        labels[i] = clusterId;
        const seed = [...neighbors];
        seed.splice(seed.indexOf(i), 1);

        for (let j = 0; j < seed.length; j++) {
            const q = seed[j];
            if (labels[q] === -1) {
                labels[q] = clusterId;
            }
            if (labels[q] !== -1 && labels[q] !== clusterId) continue;
            if (labels[q] !== -1) continue;

            labels[q] = clusterId;
            const qNeighbors = regionQuery(q);
            if (qNeighbors.length >= 2) {
                for (const nn of qNeighbors) {
                    if (!seed.includes(nn)) {
                        seed.push(nn);
                    }
                }
            }
        }

        clusterId++;
    }

    // Assign noise points to nearest cluster, or create singleton cluster
    for (let i = 0; i < n; i++) {
        if (labels[i] !== -1) continue;

        let minDist = Infinity;
        let nearest = -1;
        for (let j = 0; j < n; j++) {
            if (labels[j] === -1 || j === i) continue;
            const d = dist(points[i], points[j]);
            if (d < minDist) {
                minDist = d;
                nearest = j;
            }
        }

        if (nearest !== -1 && minDist <= eps * 2) {
            labels[i] = labels[nearest];
        } else {
            labels[i] = clusterId++;
        }
    }

    return points.map((point, i) => ({ clusterId: labels[i], point }));
}

/* ── Auto-compute eps from data spread ── */

function computeEps(points: Vector2DPoint[], userEps: number | undefined): number {
    if (userEps !== undefined) return userEps;
    if (points.length < 2) return 1;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const diagonal = Math.sqrt(rangeX * rangeX + rangeY * rangeY);

    // Scale eps relative to data spread, targeting ~5-15 clusters for reasonable data
    return diagonal * 0.08;
}

/* ── Component ── */

const Vector2DChart: React.FC<Vector2DProps> = ({
    points,
    colorScheme = "gemini-large",
    clusterRadius,
    minDotRadius = 3,
    maxDotRadius = 14,
    glowRadius = 20,
    showLegend = true,
    showBadge = true,
    className = "",
    onPointClick,
    onClusterSelect,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // View transform: offset (pan) + scale (zoom)
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
    const [viewScale, setViewScale] = useState(1);
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const panOffsetStart = useRef({ x: 0, y: 0 });

    // Selected cluster
    const [selectedCluster, setSelectedCluster] = useState<number | null>(null);

    // Tooltip
    const [tooltip, setTooltip] = useState<{ x: number; y: number; point: Vector2DPoint } | null>(null);

    // Track container size
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Cluster the points
    const eps = useMemo(() => computeEps(points, clusterRadius), [points, clusterRadius]);
    const clustered = useMemo(() => {
        const hasPreAssigned = points.length > 0 && points.every((p) => p.clusterId !== undefined && p.clusterId >= 0);
        if (hasPreAssigned) {
            return points.map((point) => ({ clusterId: point.clusterId!, point }));
        }
        return clusterPoints(points, eps);
    }, [points, eps]);
    const colors = useMemo(() => getColorFromScheme(colorScheme), [colorScheme]);

    // Unique cluster IDs sorted
    const clusterIds = useMemo(() => {
        const ids = new Set(clustered.map((c) => c.clusterId));
        return Array.from(ids).sort((a, b) => a - b);
    }, [clustered]);

    // Find highest confidence point per cluster (for glow)
    const topPerCluster = useMemo(() => {
        const map = new Map<number, Vector2DPoint>();
        for (const c of clustered) {
            const existing = map.get(c.clusterId);
            if (!existing || c.point.confidence > existing.confidence) {
                map.set(c.clusterId, c.point);
            }
        }
        return map;
    }, [clustered]);

    // Data bounds for mapping to SVG coordinates
    const bounds = useMemo(() => {
        if (points.length === 0) return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        // Add 10% padding
        const padX = (maxX - minX) * 0.1 || 1;
        const padY = (maxY - minY) * 0.1 || 1;
        return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
    }, [points]);

    // Map data coordinates to SVG pixel coordinates
    const PADDING = 40;
    const toSvgX = useCallback(
        (dataX: number) => {
            const range = bounds.maxX - bounds.minX || 1;
            return PADDING + ((dataX - bounds.minX) / range) * (dimensions.width - PADDING * 2);
        },
        [bounds, dimensions.width]
    );
    const toSvgY = useCallback(
        (dataY: number) => {
            const range = bounds.maxY - bounds.minY || 1;
            // Invert Y so higher values go up
            return dimensions.height - PADDING - ((dataY - bounds.minY) / range) * (dimensions.height - PADDING * 2);
        },
        [bounds, dimensions.height]
    );

    // Dot radius from confidence
    const dotRadius = useCallback(
        (confidence: number) => {
            return minDotRadius + (maxDotRadius - minDotRadius) * confidence;
        },
        [minDotRadius, maxDotRadius]
    );

    /* ── Mirror viewScale into a ref so the wheel handler can always read the current value ── */
    const viewScaleRef = useRef(viewScale);
    useEffect(() => { viewScaleRef.current = viewScale; }, [viewScale]);

    /* ── Zoom (wheel) — attached imperatively with passive:false to allow preventDefault ── */
    const handleWheelNative = useCallback(
        (e: WheelEvent) => {
            e.preventDefault();
            const svg = svgRef.current;
            if (!svg) return;

            const rect = svg.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const zoomFactor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
            const currentScale = viewScaleRef.current;
            const newScale = Math.max(0.1, Math.min(50, currentScale * zoomFactor));
            const scaleChange = newScale / currentScale;
            // Update ref immediately so rapid wheel events read the just-set value
            viewScaleRef.current = newScale;
            setViewScale(newScale);
            setViewOffset((prev) => ({
                x: mouseX - scaleChange * (mouseX - prev.x),
                y: mouseY - scaleChange * (mouseY - prev.y),
            }));
        },
        []
    );

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        svg.addEventListener("wheel", handleWheelNative, { passive: false });
        return () => svg.removeEventListener("wheel", handleWheelNative);
    }, [handleWheelNative, dimensions, points.length]);

    /* ── Pan (drag) ── */
    const handleMouseDown = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            if (e.button !== 0) return;
            isPanning.current = true;
            panStart.current = { x: e.clientX, y: e.clientY };
            panOffsetStart.current = { ...viewOffset };
        },
        [viewOffset]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            if (!isPanning.current) return;
            const dx = e.clientX - panStart.current.x;
            const dy = e.clientY - panStart.current.y;
            setViewOffset({
                x: panOffsetStart.current.x + dx,
                y: panOffsetStart.current.y + dy,
            });
        },
        []
    );

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
    }, []);

    /* ── Zoom buttons ── */
    const resetView = useCallback(() => {
        setViewOffset({ x: 0, y: 0 });
        setViewScale(1);
    }, []);

    /* ── Cluster selection ── */
    const handleClusterClick = useCallback(
        (clusterId: number) => {
            const newSelected = selectedCluster === clusterId ? null : clusterId;
            setSelectedCluster(newSelected);
            if (onClusterSelect) {
                if (newSelected === null) {
                    onClusterSelect(null);
                } else {
                    const pointIds = clustered.filter((c) => c.clusterId === newSelected).map((c) => c.point.id);
                    onClusterSelect({ clusterId: newSelected, pointIds });
                }
            }
        },
        [selectedCluster, clustered, onClusterSelect]
    );

    const handleDeselectCluster = useCallback(() => {
        setSelectedCluster(null);
        onClusterSelect?.(null);
    }, [onClusterSelect]);

    /* ── Cluster bounding rectangles (in data coordinates, with padding) ── */
    const clusterBounds = useMemo(() => {
        const RECT_PAD = 8;
        return clusterIds.map((cid) => {
            const pts = clustered.filter((c) => c.clusterId === cid);
            let minSx = Infinity, maxSx = -Infinity, minSy = Infinity, maxSy = -Infinity;
            for (const c of pts) {
                const sx = toSvgX(c.point.x);
                const sy = toSvgY(c.point.y);
                const r = dotRadius(c.point.confidence);
                if (sx - r < minSx) minSx = sx - r;
                if (sx + r > maxSx) maxSx = sx + r;
                if (sy - r < minSy) minSy = sy - r;
                if (sy + r > maxSy) maxSy = sy + r;
            }
            return {
                cid,
                x: minSx - RECT_PAD,
                y: minSy - RECT_PAD,
                width: maxSx - minSx + RECT_PAD * 2,
                height: maxSy - minSy + RECT_PAD * 2,
                color: colors[cid % colors.length],
            };
        });
    }, [clusterIds, clustered, toSvgX, toSvgY, dotRadius, colors]);

    /* ── Build the transform string for the group ── */
    const groupTransform = `translate(${viewOffset.x}, ${viewOffset.y}) scale(${viewScale})`;

    /* ── Render ── */
    // Sort: draw lower-confidence first so higher-confidence renders on top
    const sortedClustered = [...clustered].sort((a, b) => a.point.confidence - b.point.confidence);

    return (
        <div ref={containerRef} className={`vector2d-container ${className}`}>
            {points.length === 0 && (
                <div className="vector2d-empty"><p>No data to display</p></div>
            )}

            {points.length > 0 && showBadge && (
                <div className="vector2d-badge">{points.length.toLocaleString()} pts</div>
            )}

            {points.length > 0 && dimensions.width > 0 && dimensions.height > 0 && (
                <svg
                    ref={svgRef}
                    className="vector2d-svg"
                    width={dimensions.width}
                    height={dimensions.height}
                    viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Glow filter definitions */}
                    <defs>
                        {clusterIds.map((cid) => (
                            <filter key={`glow-${cid}`} id={`glow-${cid}`} x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation={glowRadius / 3} result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        ))}
                    </defs>

                    <g transform={groupTransform}>
                        {/* Cluster bounding rectangles */}
                        {clusterBounds.map((b) => (
                            <React.Fragment key={`cluster-rect-${b.cid}`}>
                                {selectedCluster === b.cid && (
                                    <rect
                                        x={b.x}
                                        y={b.y}
                                        width={b.width}
                                        height={b.height}
                                        rx={8}
                                        ry={8}
                                        fill={b.color}
                                        opacity={0.12}
                                        style={{ pointerEvents: "none" }}
                                    />
                                )}
                                <rect
                                    x={b.x}
                                    y={b.y}
                                    width={b.width}
                                    height={b.height}
                                    rx={8}
                                    ry={8}
                                    fill="#10101010"
                                    stroke={b.color}
                                    strokeWidth={1.5}
                                    strokeDasharray="6 4"
                                    opacity={selectedCluster === null || selectedCluster === b.cid ? 0.6 : 0.2}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleClusterClick(b.cid)}
                                />
                            </React.Fragment>
                        ))}

                        {/* Render glow circles (behind) for top-confidence points */}
                        {clusterIds.map((cid) => {
                            const topPoint = topPerCluster.get(cid);
                            if (!topPoint) return null;
                            const cx = toSvgX(topPoint.x);
                            const cy = toSvgY(topPoint.y);
                            const color = colors[cid % colors.length];
                            return (
                                <circle
                                    key={`glow-bg-${cid}`}
                                    cx={cx}
                                    cy={cy}
                                    r={glowRadius}
                                    fill={color}
                                    opacity={0.3}
                                    filter={`url(#glow-${cid})`}
                                />
                            );
                        })}

                        {/* Render all data points */}
                        {sortedClustered.map((c) => {
                            const cx = toSvgX(c.point.x);
                            const cy = toSvgY(c.point.y);
                            const r = dotRadius(c.point.confidence);
                            const color = colors[c.clusterId % colors.length];
                            const isTop = topPerCluster.get(c.clusterId)?.id === c.point.id;

                            return (
                                <circle
                                    key={c.point.id}
                                    cx={cx}
                                    cy={cy}
                                    r={r}
                                    fill={color}
                                    opacity={0.5 + c.point.confidence * 0.5}
                                    style={{ cursor: "pointer", transition: "r 0.2s ease, opacity 0.2s ease" }}
                                    filter={isTop ? `url(#glow-${c.clusterId})` : undefined}
                                    onMouseEnter={(e) => {
                                        const rect = (e.target as SVGCircleElement).ownerSVGElement?.getBoundingClientRect();
                                        if (rect) {
                                            setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, point: c.point });
                                        }
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                    onClick={() => onPointClick?.(c.point)}
                                />
                            );
                        })}
                    </g>
                </svg>
            )}

            {/* Tooltip */}
            {points.length > 0 && tooltip && (
                <div className="vector2d-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
                    {tooltip.point.label && <div className="vector2d-tooltip-label">{tooltip.point.label}</div>}
                    <div className="vector2d-tooltip-row">x: {tooltip.point.x.toFixed(4)}</div>
                    <div className="vector2d-tooltip-row">y: {tooltip.point.y.toFixed(4)}</div>
                    <div className="vector2d-tooltip-row">confidence: {(tooltip.point.confidence * 100).toFixed(1)}%</div>
                </div>
            )}

            {/* Legend */}
            {points.length > 0 && showLegend && clusterIds.length > 1 && (
                <div className="vector2d-legend">
                    {clusterIds.map((cid) => (
                        <div key={cid} className="vector2d-legend-item">
                            <div className="vector2d-legend-dot" style={{ background: colors[cid % colors.length] }} />
                            <span>Cluster {cid + 1}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Zoom Controls */}
            {points.length > 0 && (
                <div className="vector2d-controls">
                    <button onClick={resetView} title="Reset view">⌂</button>
                    {selectedCluster !== null && (
                        <button onClick={handleDeselectCluster} title="Deselect group" className="vector2d-deselect-btn">✕</button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Vector2DChart;
