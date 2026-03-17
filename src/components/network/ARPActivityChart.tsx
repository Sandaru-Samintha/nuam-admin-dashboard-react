import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TrafficDataPoint {
  time: string;
  packets: number;
  arpRequests: number;
  arpReplies: number;
}

interface ARPActivityChartProps {
  data: TrafficDataPoint[];
}

const ARPActivityChart: React.FC<ARPActivityChartProps> = ({ data }) => {
  const width = 800;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.arpRequests, d.arpReplies)),
    1
  );

  const scaleY = (value: number) => {
    return graphHeight - (value / maxValue) * graphHeight;
  };

  const scaleX = (index: number) => {
    return (index / (data.length - 1 || 1)) * graphWidth;
  };

  const requestsPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.arpRequests)}`)
    .join(' ');

  const repliesPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.arpReplies)}`)
    .join(' ');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>ARP Activity Breakdown</CardTitle>
            <CardDescription>Requests vs Replies over time</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-slate-600">Requests</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded"></div>
              <span className="text-sm text-slate-600">Replies</span>
            </div>
          </div>
        </div>
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
                  {Math.round(maxValue * (1 - ratio))}
                </text>
              </g>
            ))}

            {/* ARP Requests line */}
            <path
              d={requestsPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
            />

            {/* ARP Replies line */}
            <path
              d={repliesPath}
              fill="none"
              stroke="#10b981"
              strokeWidth={2}
            />

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
          </g>
        </svg>
      </CardContent>
    </Card>
  );
};

export default ARPActivityChart;