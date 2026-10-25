import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { getColorFromScheme } from "../Helpers/GetColorsFromScheme";
import type { ColorSchemeNames } from "../Helpers/GetColorsFromScheme";
import "../Helpers/ColorScheme.css";
import "./Vector3D.css";

/* ── Exported Types ── */

export interface Vector3DPoint {
    id: string;
    x: number;
    y: number;
    z: number;
    confidence: number;
    label?: string;
    trackId?: number;
    clusterId?: number;
    eyesOpen?: boolean;
    fullFace?: boolean;
    facingFront?: boolean;
}

export interface Vector3DClusterInfo {
    clusterId: number;
    pointIds: string[];
}

export interface Vector3DProps {
    points: Vector3DPoint[];
    mode?: "2D" | "3D";
    colorScheme?: ColorSchemeNames;
    clusterRadius?: number;
    minDotRadius?: number;
    maxDotRadius?: number;
    glowRadius?: number;
    showLegend?: boolean;
    showBadge?: boolean;
    showAxes?: boolean;
    className?: string;
    onPointClick?: (point: Vector3DPoint) => void;
    onClusterSelect?: (cluster: Vector3DClusterInfo | null) => void;
}

/* ── 3D Math Helpers ── */

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

function rotateY(v: Vec3, angle: number): Vec3 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: v.x * cos + v.z * sin, y: v.y, z: -v.x * sin + v.z * cos };
}

function rotateX(v: Vec3, angle: number): Vec3 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: v.x, y: v.y * cos - v.z * sin, z: v.y * sin + v.z * cos };
}

function project(v: Vec3, width: number, height: number, fov: number, viewDist: number): { sx: number; sy: number; depth: number } {
    const factor = fov / (viewDist + v.z);
    const sx = v.x * factor + width / 2;
    const sy = -v.y * factor + height / 2;
    return { sx, sy, depth: v.z };
}

/* ── DBSCAN-style Clustering (3D) ── */

interface ClusterAssignment3D {
    clusterId: number;
    point: Vector3DPoint;
}

function clusterPoints3D(points: Vector3DPoint[], eps: number): ClusterAssignment3D[] {
    const n = points.length;
    const labels = new Array<number>(n).fill(-1);
    let clusterId = 0;

    const dist = (a: Vector3DPoint, b: Vector3DPoint): number => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
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

    // Assign noise to nearest cluster or singleton
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

/* ── Auto-compute eps from 3D data spread ── */

function computeEps3D(points: Vector3DPoint[], userEps: number | undefined): number {
    if (userEps !== undefined) return userEps;
    if (points.length < 2) return 1;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
    }

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const rangeZ = maxZ - minZ || 1;
    const diagonal = Math.sqrt(rangeX * rangeX + rangeY * rangeY + rangeZ * rangeZ);

    return diagonal * 0.08;
}

/* ── Normalize data to centered coordinate system ── */

interface NormalizedData {
    points: Vec3[];
    scale: number;
}

function normalizePoints(points: Vector3DPoint[]): NormalizedData {
    if (points.length === 0) return { points: [], scale: 1 };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const rangeZ = maxZ - minZ || 1;
    const maxRange = Math.max(rangeX, rangeY, rangeZ);
    const scale = 200 / maxRange; // Normalize to ±200 range

    const normalized = points.map((p) => ({
        x: (p.x - cx) * scale,
        y: (p.y - cy) * scale,
        z: (p.z - cz) * scale,
    }));

    return { points: normalized, scale };
}

/* ── Component ── */

const FOV = 400;
const VIEW_DIST = 600;
const AXIS_SIZE = 220;

const Vector3DChart: React.FC<Vector3DProps> = ({
    points,
    mode = "3D",
    colorScheme = "gemini-large",
    clusterRadius,
    minDotRadius = 3,
    maxDotRadius = 14,
    glowRadius = 20,
    showLegend = true,
    showBadge = true,
    showAxes = true,
    className = "",
    onPointClick,
    onClusterSelect,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const is2D = mode === "2D";

    // Rotation angles (orbit via drag)
    const [rotX, setRotX] = useState(-0.4);
    const [rotY, setRotY] = useState(0.6);

    // Reset rotation when switching between 2D/3D
    useEffect(() => {
        if (is2D) {
            setRotX(0);
            setRotY(0);
        } else {
            setRotX(-0.4);
            setRotY(0.6);
        }
    }, [is2D]);

    // Zoom
    const [zoom, setZoom] = useState(1);

    // Panning state
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const rotStart = useRef({ x: 0, y: 0 });

    // Selected cluster
    const [selectedCluster, setSelectedCluster] = useState<number | null>(null);

    // Tooltip
    const [tooltip, setTooltip] = useState<{ x: number; y: number; point: Vector3DPoint } | null>(null);

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

    // Clustering
    const eps = useMemo(() => computeEps3D(points, clusterRadius), [points, clusterRadius]);
    const clustered = useMemo(() => {
        const hasPreAssigned = points.length > 0 && points.every((p) => p.clusterId !== undefined && p.clusterId >= 0);
        if (hasPreAssigned) {
            return points.map((point) => ({ clusterId: point.clusterId!, point }));
        }
        return clusterPoints3D(points, eps);
    }, [points, eps]);
    const colors = useMemo(() => getColorFromScheme(colorScheme), [colorScheme]);

    const clusterIds = useMemo(() => {
        const ids = new Set(clustered.map((c) => c.clusterId));
        return Array.from(ids).sort((a, b) => a - b);
    }, [clustered]);

    const topPerCluster = useMemo(() => {
        const map = new Map<number, Vector3DPoint>();
        for (const c of clustered) {
            const existing = map.get(c.clusterId);
            if (!existing || c.point.confidence > existing.confidence) {
                map.set(c.clusterId, c.point);
            }
        }
        return map;
    }, [clustered]);

    // Normalize to centered coordinate space
    const normalized = useMemo(() => normalizePoints(points), [points]);

    // Dot radius from confidence
    const dotRadius = useCallback(
        (confidence: number) => minDotRadius + (maxDotRadius - minDotRadius) * confidence,
        [minDotRadius, maxDotRadius]
    );

    // Project a 3D normalized point to 2D screen coords with current rotation + zoom
    const project3D = useCallback(
        (v: Vec3): { sx: number; sy: number; depth: number } => {
            const scaled = { x: v.x * zoom, y: v.y * zoom, z: v.z * zoom };
            if (is2D) {
                // Flat projection: x/y map directly to screen, no rotation
                return project(scaled, dimensions.width, dimensions.height, FOV, VIEW_DIST);
            }
            const ry = rotateY(scaled, rotY);
            const rx = rotateX(ry, rotX);
            return project(rx, dimensions.width, dimensions.height, FOV, VIEW_DIST);
        },
        [rotX, rotY, zoom, dimensions, is2D]
    );

    /* ── Orbit (drag to rotate) ── */
    const handleMouseDown = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            if (e.button !== 0) return;
            isDragging.current = true;
            dragStart.current = { x: e.clientX, y: e.clientY };
            rotStart.current = { x: rotX, y: rotY };
        },
        [rotX, rotY]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            if (!isDragging.current || is2D) return;
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            setRotY(rotStart.current.y + dx * 0.005);
            setRotX(rotStart.current.x + dy * 0.005);
        },
        [is2D]
    );

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    /* ── Zoom (wheel) — imperative with passive:false to prevent page scroll ── */
    const handleWheelNative = useCallback(
        (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
            setZoom((prev) => Math.max(0.1, Math.min(20, prev * factor)));
        },
        []
    );

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        svg.addEventListener("wheel", handleWheelNative, { passive: false });
        return () => svg.removeEventListener("wheel", handleWheelNative);
    }, [handleWheelNative, dimensions, points.length]);

    /* ── Zoom buttons ── */
    const resetView = useCallback(() => {
        setRotX(is2D ? 0 : -0.4);
        setRotY(is2D ? 0 : 0.6);
        setZoom(1);
    }, [is2D]);

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

    /* ── Axis endpoints ── */
    const axes = useMemo(() => {
        if (!showAxes || dimensions.width === 0) return [];
        const axisLen = AXIS_SIZE * zoom;
        const axisDefs = is2D
            ? [
                { from: { x: 0, y: 0, z: 0 }, to: { x: axisLen, y: 0, z: 0 }, label: "X" },
                { from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: axisLen, z: 0 }, label: "Y" },
            ]
            : [
                { from: { x: 0, y: 0, z: 0 }, to: { x: axisLen, y: 0, z: 0 }, label: "X" },
                { from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: axisLen, z: 0 }, label: "Y" },
                { from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: 0, z: axisLen }, label: "Z" },
            ];
        return axisDefs.map((a) => {
            if (is2D) {
                const fromP = project(a.from, dimensions.width, dimensions.height, FOV, VIEW_DIST);
                const toP = project(a.to, dimensions.width, dimensions.height, FOV, VIEW_DIST);
                return { x1: fromP.sx, y1: fromP.sy, x2: toP.sx, y2: toP.sy, label: a.label };
            }
            const fromRy = rotateY(a.from, rotY);
            const fromRx = rotateX(fromRy, rotX);
            const fromP = project(fromRx, dimensions.width, dimensions.height, FOV, VIEW_DIST);
            const toRy = rotateY(a.to, rotY);
            const toRx = rotateX(toRy, rotX);
            const toP = project(toRx, dimensions.width, dimensions.height, FOV, VIEW_DIST);
            return { x1: fromP.sx, y1: fromP.sy, x2: toP.sx, y2: toP.sy, label: a.label };
        });
    }, [showAxes, rotX, rotY, zoom, dimensions, is2D]);

    /* ── Build projected point data for rendering ── */
    const projectedPoints = useMemo(() => {
        if (dimensions.width === 0 || dimensions.height === 0) return [];

        return clustered.map((c, i) => {
            const normVec = normalized.points[i];
            if (!normVec) return null;
            const { sx, sy, depth } = project3D(normVec);
            const isTop = topPerCluster.get(c.clusterId)?.id === c.point.id;
            return {
                ...c,
                sx,
                sy,
                depth,
                isTop,
                color: colors[c.clusterId % colors.length],
            };
        }).filter((p): p is NonNullable<typeof p> => p !== null);
    }, [clustered, normalized, project3D, topPerCluster, colors, dimensions]);

    // Sort by depth: far points first (painter's algorithm)
    const sortedPoints = useMemo(
        () => [...projectedPoints].sort((a, b) => b.depth - a.depth),
        [projectedPoints]
    );

    /* ── Cluster bounding squares (in projected 2D screen space) ── */
    const clusterBounds3D = useMemo(() => {
        const RECT_PAD = 10;
        return clusterIds.map((cid) => {
            const pts = projectedPoints.filter((p) => p.clusterId === cid);
            if (pts.length === 0) return null;
            let minSx = Infinity, maxSx = -Infinity, minSy = Infinity, maxSy = -Infinity;
            for (const p of pts) {
                const r = dotRadius(p.point.confidence);
                if (p.sx - r < minSx) minSx = p.sx - r;
                if (p.sx + r > maxSx) maxSx = p.sx + r;
                if (p.sy - r < minSy) minSy = p.sy - r;
                if (p.sy + r > maxSy) maxSy = p.sy + r;
            }
            // Make it a square by using the larger dimension
            const w = maxSx - minSx + RECT_PAD * 2;
            const h = maxSy - minSy + RECT_PAD * 2;
            const side = Math.max(w, h);
            const cx = (minSx + maxSx) / 2;
            const cy = (minSy + maxSy) / 2;
            return {
                cid,
                x: cx - side / 2,
                y: cy - side / 2,
                side,
                color: colors[cid % colors.length],
            };
        }).filter((b): b is NonNullable<typeof b> => b !== null);
    }, [clusterIds, projectedPoints, dotRadius, colors]);

    /* ── Render ── */
    return (
        <div ref={containerRef} className={`vector3d-container ${className}`}>
            {points.length === 0 ? (
                <div className="vector3d-empty"><p>No data to display</p></div>
            ) : (<>
            {showBadge && (
                <div className="vector3d-badge">{points.length.toLocaleString()} pts</div>
            )}

            {dimensions.width > 0 && dimensions.height > 0 && (
                <svg
                    ref={svgRef}
                    className="vector3d-svg"
                    width={dimensions.width}
                    height={dimensions.height}
                    viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <defs>
                        {clusterIds.map((cid) => (
                            <filter key={`glow3d-${cid}`} id={`glow3d-${cid}`} x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation={glowRadius / 3} result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        ))}
                    </defs>

                    {/* Axes */}
                    {axes.map((a) => (
                        <React.Fragment key={a.label}>
                            <line className="vector3d-axis" x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} />
                            <text className="vector3d-axis-label" x={a.x2 + 4} y={a.y2 - 4}>{a.label}</text>
                        </React.Fragment>
                    ))}

                    {/* Cluster bounding squares */}
                    {clusterBounds3D.map((b) => (
                        <React.Fragment key={`cluster-sq-${b.cid}`}>
                            {selectedCluster === b.cid && (
                                <rect
                                    x={b.x}
                                    y={b.y}
                                    width={b.side}
                                    height={b.side}
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
                                width={b.side}
                                height={b.side}
                                rx={8}
                                ry={8}
                                fill="transparent"
                                stroke={b.color}
                                strokeWidth={1.5}
                                strokeDasharray="6 4"
                                opacity={selectedCluster === null || selectedCluster === b.cid ? 0.6 : 0.2}
                                style={{ cursor: "pointer" }}
                                onClick={() => handleClusterClick(b.cid)}
                            />
                        </React.Fragment>
                    ))}

                    {/* Glow circles behind top-confidence points */}
                    {sortedPoints.filter((p) => p.isTop).map((p) => (
                        <circle
                            key={`glow3d-bg-${p.point.id}`}
                            cx={p.sx}
                            cy={p.sy}
                            r={glowRadius}
                            fill={p.color}
                            opacity={0.3}
                            filter={`url(#glow3d-${p.clusterId})`}
                        />
                    ))}

                    {/* Render all data points (back-to-front) */}
                    {sortedPoints.map((p) => {
                        const r = dotRadius(p.point.confidence);
                        // Depth-based opacity fade: closer = more opaque (flat in 2D)
                        const depthOpacity = is2D ? 1 : Math.max(0.3, Math.min(1, 1 - p.depth / (VIEW_DIST * 1.5)));
                        const baseOpacity = 0.5 + p.point.confidence * 0.5;

                        return (
                            <circle
                                key={p.point.id}
                                cx={p.sx}
                                cy={p.sy}
                                r={r}
                                fill={p.color}
                                opacity={baseOpacity * depthOpacity}
                                style={{ cursor: "pointer", transition: "r 0.2s ease, opacity 0.2s ease" }}
                                filter={p.isTop ? `url(#glow3d-${p.clusterId})` : undefined}
                                onMouseEnter={(e) => {
                                    const rect = (e.target as SVGCircleElement).ownerSVGElement?.getBoundingClientRect();
                                    if (rect) {
                                        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, point: p.point });
                                    }
                                }}
                                onMouseLeave={() => setTooltip(null)}
                                onClick={() => onPointClick?.(p.point)}
                            />
                        );
                    })}
                </svg>
            )}

            {/* Tooltip */}
            {tooltip && (
                <div className="vector3d-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
                    {tooltip.point.label && <div className="vector3d-tooltip-label">{tooltip.point.label}</div>}
                    <div className="vector3d-tooltip-row">x: {tooltip.point.x.toFixed(4)}</div>
                    <div className="vector3d-tooltip-row">y: {tooltip.point.y.toFixed(4)}</div>
                    <div className="vector3d-tooltip-row">z: {tooltip.point.z.toFixed(4)}</div>
                    <div className="vector3d-tooltip-row">confidence: {(tooltip.point.confidence * 100).toFixed(1)}%</div>
                </div>
            )}

            {/* Legend */}
            {showLegend && clusterIds.length > 1 && (
                <div className="vector3d-legend">
                    {clusterIds.map((cid) => (
                        <div key={cid} className="vector3d-legend-item">
                            <div className="vector3d-legend-dot" style={{ background: colors[cid % colors.length] }} />
                            <span>Cluster {cid + 1}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Zoom Controls */}
            <div className="vector3d-controls">
                <button onClick={resetView} title="Reset view">⌂</button>
                {selectedCluster !== null && (
                    <button onClick={handleDeselectCluster} title="Deselect group" className="vector3d-deselect-btn">✕</button>
                )}
            </div>
            </>)}
        </div>
    );
};

export default Vector3DChart;
