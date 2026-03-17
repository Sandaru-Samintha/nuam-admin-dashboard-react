import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtocolPacketRatePoint {
  time: string;
  value: number;
}

interface ProtocolPacketRateChartProps {
  title: string;
  description: string;
  color: string;
  data: ProtocolPacketRatePoint[];
}

const formatRate = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(1);
};

const ProtocolPacketRateChart: React.FC<ProtocolPacketRateChartProps> = ({
  title,
  description,
  color,
  data,
}) => {
  const width = 420;
  const height = 220;
  const padding = { top: 20, right: 12, bottom: 32, left: 44 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const scaleY = (value: number) => graphHeight - (value / maxValue) * graphHeight;
  const scaleX = (index: number) => (index / (data.length - 1 || 1)) * graphWidth;

  const linePath = data
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(point.value)}`)
    .join(' ');

  const latestRate = data.length > 0 ? data[data.length - 1].value : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm text-slate-600">
          Current: <span className="font-semibold text-slate-900">{formatRate(latestRate)} pps</span>
        </div>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <line
                key={`grid-${index}`}
                x1={0}
                y1={graphHeight * ratio}
                x2={graphWidth}
                y2={graphHeight * ratio}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            ))}

            <path d={linePath} fill="none" stroke={color} strokeWidth={2} />

            {data.map((point, index) => (
              <circle
                key={`point-${index}`}
                cx={scaleX(index)}
                cy={scaleY(point.value)}
                r={2.5}
                fill={color}
              />
            ))}

            {[0, Math.floor(data.length / 2), data.length - 1]
              .filter((value, index, self) => value >= 0 && self.indexOf(value) === index)
              .map((pointIndex, labelIndex) => (
                <text
                  key={`label-${labelIndex}`}
                  x={scaleX(pointIndex)}
                  y={graphHeight + 18}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500"
                >
                  {data[pointIndex]?.time || ''}
                </text>
              ))}
          </g>
        </svg>
      </CardContent>
    </Card>
  );
};

export default ProtocolPacketRateChart;
