import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TrafficDistribution {
  broadcast: number;
  unicast: number;
}

interface TrafficDistributionChartProps {
  distribution: TrafficDistribution;
}

const TrafficDistributionChart: React.FC<TrafficDistributionChartProps> = ({ distribution }) => {
  const total = distribution.broadcast + distribution.unicast;
  const broadcastPercent = total > 0 ? (distribution.broadcast / total) * 100 : 0;
  const unicastPercent = total > 0 ? (distribution.unicast / total) * 100 : 0;

  const radius = 80;
  const centerX = 120;
  const centerY = 120;
  const innerRadius = 50;

  const broadcastAngle = (broadcastPercent / 100) * 360;
  const unicastAngle = (unicastPercent / 100) * 360;

  const createArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + outerR * Math.cos(start);
    const y1 = centerY + outerR * Math.sin(start);
    const x2 = centerX + outerR * Math.cos(end);
    const y2 = centerY + outerR * Math.sin(end);
    const x3 = centerX + innerR * Math.cos(end);
    const y3 = centerY + innerR * Math.sin(end);
    const x4 = centerX + innerR * Math.cos(start);
    const y4 = centerY + innerR * Math.sin(start);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  // Helper function to format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Distribution</CardTitle>
        <CardDescription>Broadcast vs Unicast traffic</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <svg width="240" height="240" viewBox="0 0 240 240">
            {/* Unicast (larger portion) */}
            <path
              d={createArc(0, unicastAngle, radius, innerRadius)}
              fill="#3b82f6"
            />
            {/* Broadcast */}
            <path
              d={createArc(unicastAngle, 360, radius, innerRadius)}
              fill="#10b981"
            />
            {/* Center text */}
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              className="text-xl font-bold fill-slate-900"
            >
              {total}
            </text>
            <text
              x={centerX}
              y={centerY + 15}
              textAnchor="middle"
              className="text-xs fill-slate-500"
            >
              Total Packets
            </text>
          </svg>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 bg-blue-500 rounded"></div>
                <span className="text-sm font-medium text-slate-900">Unicast</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{unicastPercent.toFixed(1)}%</div>
              <p className="text-xs text-slate-500 mt-1">{formatNumber(distribution.unicast)} packets</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 bg-green-500 rounded"></div>
                <span className="text-sm font-medium text-slate-900">Broadcast</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{broadcastPercent.toFixed(1)}%</div>
              <p className="text-xs text-slate-500 mt-1">{formatNumber(distribution.broadcast)} packets</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficDistributionChart;