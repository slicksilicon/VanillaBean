import React, { useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import "./ScoreDistributionChart.css";

interface DistributionBin {
    label: string;
    count: number;
    start: number;
    end: number;
}

interface ScoreDistributionChartProps {
    values: number[];
    min: number;
    max: number;
    binCount?: number;
}

const DEFAULT_BIN_COUNT = 16;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const formatValue = (value: number): string => {
    if (Math.abs(value) >= 10) {
        return value.toFixed(1);
    }
    return value.toFixed(2);
};

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ values, min, max, binCount = DEFAULT_BIN_COUNT }) => {
    const bins = useMemo<DistributionBin[]>(() => {
        if (binCount <= 0) {
            return [];
        }

        const safeMin = Math.min(min, max);
        const safeMax = Math.max(min, max);

        if (safeMin === safeMax) {
            const total = values.filter((value) => Number.isFinite(value) && value === safeMin).length;
            return [{ label: formatValue(safeMin), count: total, start: safeMin, end: safeMax }];
        }

        const step = (safeMax - safeMin) / binCount;
        const counts = new Array<number>(binCount).fill(0);

        for (const value of values) {
            if (!Number.isFinite(value)) {
                continue;
            }

            const bounded = clamp(value, safeMin, safeMax);
            const ratio = (bounded - safeMin) / step;
            const index = Math.min(binCount - 1, Math.floor(ratio));
            counts[index] += 1;
        }

        return counts.map((count, index) => {
            const start = safeMin + index * step;
            const end = safeMin + (index + 1) * step;
            return {
                label: `${formatValue(start)} to ${formatValue(end)}`,
                count,
                start,
                end,
            };
        });
    }, [values, min, max, binCount]);

    if (values.length === 0) {
        return <div className="score-distribution-chart-empty">No captured faces yet.</div>;
    }

    return (
        <div className="score-distribution-chart-root">
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bins} margin={{ top: 10, right: 12, left: 4, bottom: 36 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.12)" />
                    <XAxis
                        dataKey="label"
                        interval={Math.max(0, Math.floor(binCount / 8) - 1)}
                        angle={-28}
                        textAnchor="end"
                        height={56}
                        tick={{ fill: "rgba(255, 255, 255, 0.72)", fontSize: 11 }}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: "rgba(255, 255, 255, 0.72)", fontSize: 11 }} />
                    <Tooltip
                        cursor={{ fill: "rgba(255, 255, 255, 0.06)" }}
                        contentStyle={{ background: "rgba(18, 20, 24, 0.95)", border: "1px solid rgba(255,255,255,0.16)" }}
                        formatter={(value: number) => [value, "Faces"]}
                        labelFormatter={(label: string, payload: ReadonlyArray<{ payload?: DistributionBin }>) => {
                            const bin = payload?.[0]?.payload;
                            if (!bin) {
                                return label;
                            }
                            return `${formatValue(bin.start)} to ${formatValue(bin.end)}`;
                        }}
                    />
                    <Bar dataKey="count" fill="rgba(99, 179, 237, 0.88)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ScoreDistributionChart;