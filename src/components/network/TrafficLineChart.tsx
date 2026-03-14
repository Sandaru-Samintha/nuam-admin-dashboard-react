import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TrafficDataPoint {
  time: string;
  packets: number;
  arpRequests: number;
  arpReplies: number;
}

interface TrafficLineChartProps {
  data: TrafficDataPoint[];
  title: string;
  description: string;
}

const TrafficLineChart: React.FC<TrafficLineChartProps> = ({ data, title, description }) => {
  const width = 800;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const maxPackets = Math.max(...data.map(d => d.packets), 1);
  const minPackets = Math.min(...data.map(d => d.packets), 0);

  const scaleY = (value: number) => {
    return graphHeight - ((value - minPackets) / (maxPackets - minPackets || 1)) * graphHeight;
  };

  const scaleX = (index: number) => {
    return (index / (data.length - 1 || 1)) * graphWidth;
  };

  const path = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.packets)}`)
    .join(' ');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid lines - use unique keys with 'grid-' prefix */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <g key={`grid-${i}`}>
                <line
                  x1={0}
                  y1={graphHeight * ratio}
                  x2={graphWidth}
                  y2={graphHeight * ratio}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text
                  x={-10}
                  y={graphHeight * ratio + 5}
                  textAnchor="end"
                  className="text-xs fill-slate-500"
                >
                  {Math.round(maxPackets - (maxPackets - minPackets) * ratio)}
                </text>
              </g>
            ))}

            {/* Chart line */}
            <path
              d={path}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
            />

            {/* Data points */}
            {data.map((d, i) => (
              <circle
                key={`point-${i}`}
                cx={scaleX(i)}
                cy={scaleY(d.packets)}
                r={3}
                fill="#3b82f6"
              />
            ))}

            {/* X-axis labels - use unique keys with 'label-' prefix */}
            {[0, Math.floor(data.length / 2), data.length - 1].map((i, index) => (
              <text
                key={`label-${index}-${i}`}
                x={scaleX(i)}
                y={graphHeight + 25}
                textAnchor="middle"
                className="text-xs fill-slate-500"
              >
                {data[i]?.time || ''}
              </text>
            ))}

            {/* Axis labels */}
            <text
              key="x-axis-label"
              x={graphWidth / 2}
              y={graphHeight + 35}
              textAnchor="middle"
              className="text-xs fill-slate-600 font-medium"
            >
              Time
            </text>
            <text
              key="y-axis-label"
              x={-graphHeight / 2}
              y={-45}
              textAnchor="middle"
              transform="rotate(-90)"
              className="text-xs fill-slate-600 font-medium"
            >
              Packets per Second
            </text>
          </g>
        </svg>
      </CardContent>
    </Card>
  );
};

export default TrafficLineChart;