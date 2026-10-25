import React, { useEffect, useRef, useState } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getColorFromScheme } from '../Helpers/GetColorsFromScheme';

import ToggleSwitch from "../Components/ToggleSwitch/ToggleSwitch";
import { adjustFontSizeToFitSvg } from '../Helpers/TextAdjust';
import type { ColorSchemeNames } from '../Helpers/GetColorsFromScheme';

import "../Helpers/ColorScheme.css";
import "./BarChart.css";
import { BarLegend } from './BarLegend';

const TEXT_HEIGHT: number = 20;
const MAX_FONT_SIZE: number = 18;
const MIN_FONT_SIZE: number = 8;
// Surface gap carved out of each stacked segment so neighbouring fills never touch.
const SEGMENT_GAP: number = 2;
// Corner radius on the top of a stack. Only the topmost segment that actually has a
// value is rounded, so a stack never ends on a square edge.
const STACK_RADIUS: number = 4;
// Non-hovered segments fade to this rather than being repainted, so a hovered series
// stays its own colour instead of turning into a silhouette.
const DIMMED_OPACITY: number = 0.3;

const AXIS_TICK_COLOR = "rgba(255, 255, 255, 0.40)";
/* Setting `position` at all is what stops the tooltip following the pointer. The actual
   placement is done in BarChart.css, which pins it to the top-right of the plot - that needs
   the rendered width, which this prop cannot express. */
const TOOLTIP_POSITION = { x: 0, y: 0 };
const X_AXIS_TICK_COLOR = "rgba(255, 255, 255, 0.55)";

interface DataKeyType {
    segment: string;
    stackId: string;
}

/* Subset of the props recharts hands a custom <Bar shape> renderer. */
interface BarShapeRenderProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
    index?: number;
}

interface TooltipEntry {
    dataKey?: string | number;
    value?: number | string;
}

interface TooltipRenderProps {
    active?: boolean;
    label?: string | number;
    payload?: TooltipEntry[];
}

export interface BarChartData {
    [key: string]: number | string;
}

export interface BarChartProps {
    data: BarChartData[];
    colorScheme: ColorSchemeNames;
    selectors: boolean;
    selectorsInitialState?: Record<string, boolean>;
    accumulate: boolean;
    accumulateInitial: boolean;
    /* Exact colour per segment name, overriding the scheme. Supplied, a segment keeps its
       colour no matter which other segments are present, so filtering the data does not
       repaint the survivors - and the caller can express relationships the flat scheme
       cannot, such as tones of one hue per group. Any segment absent from the map falls
       back to the scheme by rank, as does every segment when the map is omitted. */
    colorOverrides?: Record<string, string>;
    /* Bottom-to-top order of the stacked segments. Supplied, segments stack in this order,
       which is what lets a caller using a tonal ramp keep the tones in sequence up the bar.
       Omitted, segments stack largest-total first, as before. */
    segmentOrder?: string[];
    /* Show the breakdown popup pinned top-right while a bar is hovered. Off, hovering still
       dims the other segments and swaps the stack label to the hovered segment's value, and
       the cursor band still marks the x position - only the popup is suppressed. */
    showTooltip?: boolean;
}

/* Axis ticks are money; keep them short so the axis stays recessive. */
const formatAxisValue = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
    return String(Math.round(value));
};

const formatCurrency = (value: number): string =>
    `RM ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* Rectangle with only its top two corners rounded. */
const topRoundedPath = (x: number, y: number, width: number, height: number, radius: number): string => {
    const r = Math.max(0, Math.min(radius, width / 2, height));
    if (r === 0) return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
    return [
        `M ${x} ${y + r}`,
        `Q ${x} ${y} ${x + r} ${y}`,
        `L ${x + width - r} ${y}`,
        `Q ${x + width} ${y} ${x + width} ${y + r}`,
        `L ${x + width} ${y + height}`,
        `L ${x} ${y + height}`,
        "Z",
    ].join(" ");
};

export const BarChartComponent: React.FC<BarChartProps> = ({
    data,
    colorScheme,
    selectors,
    selectorsInitialState = {},
    accumulate,
    accumulateInitial,
    colorOverrides,
    segmentOrder,
    showTooltip = true
}) => {

    const color_mapping = useRef<Record<string, string>>({});
    const x_axis_types = useRef<Set<string>>(new Set());
    const stack_types = useRef<Set<string>>(new Set());
    const segment_types = useRef<Array<string>>([]);
    const processedData = useRef<Record<string, string | number>[]>([]);
    const dataKeys = useRef<Set<string>>(new Set());

    const [enabledStacks, setEnabledStacks] = useState<Record<string, boolean>>({});
    const [accumulateState, setAccumulateState] = useState<boolean>(accumulateInitial);
    const [hoveredSegment, setHoveredSegment] = useState<string>("");
    const [hoveredStack, setHoveredStack] = useState<string>("");

    const processData = () => {
        createSortedEmptyProcessedData();

        data.forEach((entry) => {
            const x_axis = entry.x_axis;
            const stackId = entry.stackId;
            if (x_axis === undefined || stackId === undefined) {
                return;
            }

            Object.keys(entry).forEach((key: string) => {
                if (key === 'x_axis' || key === 'stackId') return;
                if (!enabledStacks[stackId as string]) return;

                const dataKey = createDataKey(key, stackId as string);
                // Find the corresponding entry in processedData
                const processedEntry = processedData.current.find(e => e.x_axis === x_axis);
                if (processedEntry) {
                    processedEntry[dataKey] = entry[key];
                }
            });
        });

        // Apply accumulation if enabled
        if (accumulateState) {
            accumulateData();
        }
    };

    const accumulateData = () => {
        // Accumulate values across x-axis for each dataKey
        const accumulators: Record<string, number> = {};

        // Initialize accumulators for all dataKeys
        dataKeys.current.forEach(dataKey => {
            accumulators[dataKey] = 0;
        });

        // Iterate through processedData and accumulate values
        processedData.current.forEach(entry => {
            dataKeys.current.forEach(dataKey => {
                const currentValue = typeof entry[dataKey] === 'number' ? entry[dataKey] as number : 0;
                accumulators[dataKey] += currentValue;
                entry[dataKey] = accumulators[dataKey];
            });
        });
    };

    const createSortedEmptyProcessedData = () => {
        processedData.current = [];
        dataKeys.current.clear();

        x_axis_types.current.forEach((x_axis) => {
            const entry: Record<string, number | string> = { 'x_axis': x_axis };
            stack_types.current.forEach((stackId) => {
                if (!enabledStacks[stackId]) return;

                segment_types.current.forEach((segment) => {
                    const dataKey = createDataKey(segment, stackId);
                    dataKeys.current.add(dataKey);
                    entry[dataKey] = 0;
                });
            });
            processedData.current.push(entry);
        });
    }


    const createDataKey = (segment: string, stackId: string): string => {
        return `${segment}+${stackId}`;
    }

    const parseDataKey = (dataKey: string): DataKeyType => {
        const [segment, stackId] = dataKey.split("+");
        return { segment, stackId };
    }

    /* Process Data */
    useEffect(() => {
        const segmentTotals: Record<string, number> = {};
        data.forEach((entry) => {
            Object.keys(entry).forEach((key: string) => {
                if (key === 'x_axis' || key === 'stackId') return;

                if (!segmentTotals[key]) {
                    segmentTotals[key] = 0;
                }
                const value = entry[key];
                if (typeof value === 'number') {
                    segmentTotals[key] += value;
                }
            });
        });
        const sortedSegmentsByTotals = (): Array<string> => {
            const sorted = Object.entries(segmentTotals).sort((a, b) => b[1] - a[1]);
            return sorted.map(entry => entry[0]);
        }
        /* Extract All X-Axis Types */
        x_axis_types.current.clear();
        data.forEach((data) => {
            if (data.x_axis) {
                x_axis_types.current.add(data.x_axis as string);
            }
        });

        /* Extract All Stack Types */
        stack_types.current.clear();
        data.forEach((data) => {
            if (data.stackId) {
                stack_types.current.add(data.stackId as string);
            }
        });

        stack_types.current = new Set([...stack_types.current].sort());
        stack_types.current.forEach((stackId) => {
            setEnabledStacks((prev) => ({ ...prev, [stackId]: selectorsInitialState[stackId] ?? true }));
        });

        /* Extract All Segment Types. An explicit order wins - filtered to what is actually
           present, then anything the caller did not mention appended by total. */
        segment_types.current.splice(0, segment_types.current.length);
        if (segmentOrder) {
            const present = Object.keys(segmentTotals);
            const ordered = segmentOrder.filter((name) => present.includes(name));
            segment_types.current = ordered.concat(sortedSegmentsByTotals().filter((name) => !ordered.includes(name)));
        } else {
            segment_types.current = sortedSegmentsByTotals();
        }

        /* Map colors to bar segment types. An explicit override wins; anything not covered
           falls back to the scheme by rank. */
        const colors_array = getColorFromScheme(colorScheme);
        segment_types.current.forEach((type, rank) => {
            color_mapping.current[type] = colorOverrides?.[type] ?? colors_array[rank % colors_array.length];
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, colorScheme, colorOverrides, segmentOrder]);

    const onToggleChanged = (stackId: string, isChecked: boolean) => {
        setEnabledStacks((prev) => ({ ...prev, [stackId]: isChecked }));
    }

    /* The dataKeys of one stack that actually carry a value at this x position, bottom
       first. A segment sitting at zero draws nothing, so it must not be treated as the
       top of the stack - otherwise the rounded corner and the total label both land on
       an invisible rectangle. */
    const visibleKeysInStack = (entry: Record<string, string | number> | undefined, stackId: string): string[] => {
        if (!entry) return [];
        return Array.from(dataKeys.current).filter((key) => {
            if (parseDataKey(key).stackId !== stackId) return false;
            const value = entry[key];
            return typeof value === 'number' && value > 0;
        });
    };

    const getSegmentValue = (entry: Record<string, string | number>, segment: string, stackId: string): number => {
        const dataKey = createDataKey(segment, stackId);
        const segmentValue = entry[dataKey];
        if (typeof segmentValue !== 'number') {
            return 0;
        }
        return segmentValue;
    }

    /* Custom shape: carves the surface gap out of every segment that has one below it and
       rounds only the top of the stack. */
    /* recharts types a custom shape as (props: unknown) => Element, so the rectangle props
       are narrowed here rather than in the signature. */
    const createBarShapeRenderer = (dataKey: string) => (rawProps: unknown): React.JSX.Element => {
        const { x = 0, y = 0, width = 0, height = 0, fill, index = 0 } = rawProps as BarShapeRenderProps;
        const { segment, stackId } = parseDataKey(dataKey);

        if (height <= 0 || width <= 0) return <g />;

        const visible = visibleKeysInStack(processedData.current[index], stackId);
        const isBottom = visible[0] === dataKey;
        const isTop = visible[visible.length - 1] === dataKey;

        /* Shrink from the bottom so the gap opens between this segment and the one under
           it. The bottom segment keeps its full height and stays on the axis. */
        const gap = isBottom ? 0 : Math.min(SEGMENT_GAP, Math.max(0, height - 1));
        const drawnHeight = height - gap;
        if (drawnHeight <= 0) return <g />;

        const dimmed = hoveredSegment !== "" && hoveredSegment !== segment;

        /* The stack's total is drawn here rather than through recharts' `label`, so that the
           segment carrying the number is by construction the same one that gets the rounded
           corner. Driving them from two different callbacks let them disagree, and the total
           would sit on the second segment down whenever they picked different rows. */
        const entry = processedData.current[index];
        let totalLabel: React.JSX.Element | null = null;
        if (isTop && entry) {
            const value = hoveredSegment !== ""
                ? getSegmentValue(entry, hoveredSegment, stackId)
                : visible.reduce((sum, key) => sum + (entry[key] as number), 0);

            if (value > 0) {
                const text = formatCurrency(value);
                totalLabel = (
                    <text
                        x={x + width / 2}
                        y={y - 5}
                        textAnchor="middle"
                        fill="palegoldenrod"
                        fontSize={adjustFontSizeToFitSvg(width, TEXT_HEIGHT, MAX_FONT_SIZE, text, MIN_FONT_SIZE)}
                    >
                        {text}
                    </text>
                );
            }
        }

        return (
            <g>
                <path
                    d={topRoundedPath(x, y, width, drawnHeight, isTop ? STACK_RADIUS : 0)}
                    fill={fill}
                    fillOpacity={dimmed ? DIMMED_OPACITY : 1}
                    style={{ transition: "fill-opacity 0.15s ease" }}
                />
                {totalLabel}
            </g>
        );
    };

    /* Tooltip for the hovered bar only. recharts shares one tooltip per x position, so it
       is filtered down to the stack the pointer is actually over. */
    const renderTooltip = (props: TooltipRenderProps): React.ReactNode => {
        const { active, label, payload } = props;
        if (!active || !payload || hoveredStack === "") return null;

        const rows = payload
            .filter((entry) => {
                const key = String(entry.dataKey ?? "");
                return parseDataKey(key).stackId === hoveredStack && Number(entry.value) > 0;
            })
            .reverse();

        if (rows.length === 0) return null;

        const total = rows.reduce((sum, entry) => sum + Number(entry.value), 0);

        return (
            <div className="bar-chart-tooltip">
                <div className="bar-chart-tooltip-header">
                    {label} &middot; {hoveredStack}
                    {accumulateState && <span className="bar-chart-tooltip-note"> &middot; running total</span>}
                </div>
                {rows.map((entry) => {
                    const segment = parseDataKey(String(entry.dataKey ?? "")).segment;
                    return (
                        <div key={String(entry.dataKey)} className="bar-chart-tooltip-row">
                            <i style={{ backgroundColor: color_mapping.current[segment] }} />
                            <span>{segment}</span>
                            <b>{formatCurrency(Number(entry.value))}</b>
                        </div>
                    );
                })}
                {rows.length > 1 && (
                    <div className="bar-chart-tooltip-total">
                        <span>Total</span>
                        <b>{formatCurrency(total)}</b>
                    </div>
                )}
            </div>
        );
    };

    const handleMouseOver = (dataKey: string) => {
        const { segment, stackId } = parseDataKey(dataKey);
        if (hoveredSegment !== segment) {
            setHoveredSegment(segment);
        }
        if (hoveredStack !== stackId) {
            setHoveredStack(stackId);
        }
    }

    const handleMouseOut = () => {
        setHoveredSegment("");
        setHoveredStack("");
    }

    processData();

    /* What the legend reports, over the stacks that are actually drawn.
    
       Derived here on every render rather than cached alongside the colour ranking: a stack
       toggle changes what is plotted without changing `data`, so a total computed in the
       effect above would keep describing every stack that was loaded, including the ones
       switched off. Spending loads up to three years and enables one, so its legend read as
       much as triple the bars beside it.
    
       Summed from `data` and not from processedData because accumulate rewrites the latter
       into running totals, and the sum of a running total is not a total. */
    const visibleTotals: Record<string, number> = {};
    data.forEach((entry) => {
        const stackId = entry.stackId;
        if (typeof stackId !== 'string' || !enabledStacks[stackId]) return;

        Object.keys(entry).forEach((key: string) => {
            if (key === 'x_axis' || key === 'stackId') return;
            const value = entry[key];
            if (typeof value === 'number') {
                visibleTotals[key] = (visibleTotals[key] ?? 0) + value;
            }
        });
    });

    /* Ranking order is kept, so a series keeps its colour and its place as stacks are
       toggled; only those carrying nothing on screen drop out of the list. */
    const legendItems = segment_types.current.filter((segment) => (visibleTotals[segment] ?? 0) > 0);

    /* Changes whenever a segment or stack is added, removed or reordered. */
    const stackOrderSignature = Array.from(dataKeys.current).join("|");

    return (
        <>
            {(selectors || accumulate) && (
                <div className='bar-chart-selectors'>

                    {selectors && (
                        Array.from(stack_types.current).map((stackId) => (
                            <div key={stackId} className='bar-chart-selector'>
                                <ToggleSwitch
                                    id={`stack-toggle-${stackId}`}
                                    variant="success"
                                    label={stackId}
                                    checked={enabledStacks[stackId]}
                                    onChange={(isChecked) => { onToggleChanged(stackId, isChecked); }}
                                />
                            </div>
                        ))
                    )}
                    {accumulate && (
                        <div className='bar-chart-selector'>
                            <ToggleSwitch
                                id={`accumulate-toggle`}
                                variant="info"
                                label={"Accumulate"}
                                checked={accumulateState}
                                onChange={(isChecked) => { setAccumulateState(isChecked); }}
                            />
                        </div>
                    )}


                </div>
            )}

            <RechartsBarChart width="100%" style={{ height: "calc(100%)" }}
                data={processedData.current}
                margin={{ top: 22, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="1 10" vertical={false} stroke="rgba(255, 255, 255, 0.16)" />
                <XAxis
                    dataKey="x_axis"
                    tick={{ fill: X_AXIS_TICK_COLOR, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255, 255, 255, 0.16)" }}
                />
                <YAxis
                    tickFormatter={formatAxisValue}
                    tick={{ fill: AXIS_TICK_COLOR, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    label={{ value: "MYR", position: "top", offset: 12, fill: AXIS_TICK_COLOR, fontSize: 10 }}
                />
                {/* Pinned to the top-right of the plot rather than tracking the pointer: a
                    tooltip that follows the cursor covers the bars next to the one being
                    read, and moves the numbers while the eye is on them. Kept mounted when
                    showTooltip is off so the cursor band still renders. */}
                <Tooltip
                    content={showTooltip ? renderTooltip : () => null}
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                    position={TOOLTIP_POSITION}
                    isAnimationActive={false}
                />

                {Array.from(dataKeys.current).map((dataKey) => (
                    <Bar
                        /* The key carries the whole order, so any change to the set or its
                           order remounts every Bar. recharts registers a graphical item with
                           `cartesianItems.push()` on mount and never re-sorts
                           (state/graphicalItemsSlice.js), so a Bar added later stacks on top
                           regardless of its position in the JSX. Remounting together is what
                           keeps the rendered stacking order equal to the order below - which
                           both the stack total and the tonal sequence depend on. */
                        key={`${stackOrderSignature}::${dataKey}`}
                        dataKey={dataKey}
                        stackId={parseDataKey(dataKey).stackId}
                        fill={color_mapping.current[parseDataKey(dataKey).segment] || "whitesmoke"}
                        shape={createBarShapeRenderer(dataKey)}
                        // animationDuration={0}
                        onMouseOver={() => handleMouseOver(dataKey)}
                        onMouseOut={handleMouseOut}
                    />

                ))}

            </RechartsBarChart>

            <BarLegend colorMapping={color_mapping.current}
                items={legendItems}
                totals={visibleTotals}
                className={""}
                hoveredItem={hoveredSegment}
            />
        </>
    );
};

export default BarChartComponent;
