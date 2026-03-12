import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useWebSocket } from '@/contexts/WebSocketContext';
import type { NetworkInsight } from '@/hooks/useNetworkActivityData';
import {
  Activity,
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Cpu,
  Laptop,
  Printer,
  Radio,
  RefreshCw,
  Server,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Wifi
} from 'lucide-react';
import React, { useState } from 'react';

// TypeScript Interfaces
interface MetricCardData {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

interface TrafficDataPoint {
  time: string;
  packets: number;
  arpRequests: number;
  arpReplies: number;
}

interface DeviceActivity {
  id: string;
  name: string;
  ip: string;
  type: 'laptop' | 'mobile' | 'printer' | 'iot' | 'network';
  packetsSent: number;
  packetsReceived: number;
  activityLevel: 'low' | 'medium' | 'high';
  lastActive: string;
}

interface ActivityEvent {
  id: string;
  type: 'active' | 'idle' | 'spike' | 'load_change';
  message: string;
  timestamp: string;
  icon: React.ReactNode;
}

interface TrafficDistribution {
  broadcast: number;
  unicast: number;
}

// Mock Data Generation (unused in production) -- removed helper


// Helper Functions
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const getDeviceIcon = (type: DeviceActivity['type'], className?: string) => {
  const icons = {
    laptop: <Laptop className={className} />,
    mobile: <Smartphone className={className} />,
    printer: <Printer className={className} />,
    iot: <Cpu className={className} />,
    network: <Server className={className} />
  };
  return icons[type] || <Server className={className} />;
};

// Components
const ActivityMetricCard: React.FC<MetricCardData> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendValue 
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <div className="text-slate-400">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
      {trend && trendValue && (
        <div className={`flex items-center mt-2 text-xs ${
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
        }`}>
          {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
          {trendValue}
        </div>
      )}
    </CardContent>
  </Card>
);

const TrafficLineChart: React.FC<{ data: TrafficDataPoint[]; title: string; description: string }> = ({ 
  data, 
  title, 
  description 
}) => {
  const width = 800;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Handle empty or minimal data
  const hasValidData = data && data.length >= 2;
  const maxPackets = hasValidData ? Math.max(...data.map(d => d.packets)) : 0;
  const minPackets = hasValidData ? Math.min(...data.map(d => d.packets)) : 0;
  const packetRange = maxPackets - minPackets;

  const scaleY = (value: number) => {
    if (!hasValidData || packetRange === 0) return graphHeight / 2;
    return graphHeight - ((value - minPackets) / packetRange) * graphHeight;
  };

  const scaleX = (index: number) => {
    if (!hasValidData) return 0;
    return (index / (data.length - 1)) * graphWidth;
  };

  const path = hasValidData
    ? data
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.packets)}`)
        .join(' ')
    : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasValidData ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <p>No data available</p>
          </div>
        ) : (
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <g key={i}>
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
                    {Math.round(maxPackets - packetRange * ratio)}
                  </text>
                </g>
              ))}

              {/* Chart line */}
              {path && (
                <path
                  d={path}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              )}

              {/* Data points */}
              {data.map((d, i) => (
                <circle
                  key={i}
                  cx={scaleX(i)}
                  cy={scaleY(d.packets)}
                  r={3}
                  fill="#3b82f6"
                />
              ))}

              {/* X-axis labels */}
              {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
                <text
                  key={i}
                  x={scaleX(i)}
                  y={graphHeight + 25}
                  textAnchor="middle"
                  className="text-xs fill-slate-500"
                >
                  {data[i]?.time || ''}
                </text>
              ))}
              <text
                x={graphWidth / 2}
                y={graphHeight + 35}
                textAnchor="middle"
                className="text-xs fill-slate-600 font-medium"
              >
                Time
              </text>
              <text
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
        )}
      </CardContent>
    </Card>
  );
};

const ARPActivityChart: React.FC<{ data: TrafficDataPoint[] }> = ({ data }) => {
  const width = 800;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Handle empty or minimal data
  const hasValidData = data && data.length >= 2;
  const maxValue = hasValidData
    ? Math.max(...data.map(d => Math.max(d.arpRequests, d.arpReplies)))
    : 0;

  const scaleY = (value: number) => {
    if (!hasValidData || maxValue === 0) return graphHeight / 2;
    return graphHeight - (value / maxValue) * graphHeight;
  };

  const scaleX = (index: number) => {
    if (!hasValidData) return 0;
    return (index / (data.length - 1)) * graphWidth;
  };

  const requestsPath = hasValidData
    ? data
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.arpRequests)}`)
        .join(' ')
    : '';

  const repliesPath = hasValidData
    ? data
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.arpReplies)}`)
        .join(' ')
    : '';

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
        {!hasValidData ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <p>No data available</p>
          </div>
        ) : (
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <g key={i}>
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
              {requestsPath && (
                <path
                  d={requestsPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              )}

              {/* ARP Replies line */}
              {repliesPath && (
                <path
                  d={repliesPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              )}

              {/* X-axis labels */}
              {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
                <text
                  key={i}
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
        )}
      </CardContent>
    </Card>
  );
};

const TrafficDistributionChart: React.FC<{ distribution: TrafficDistribution }> = ({ distribution }) => {
  const total = distribution.broadcast + distribution.unicast;
  
  // Handle case where total is 0
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Distribution</CardTitle>
          <CardDescription>Broadcast vs Unicast traffic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-slate-500">
            <p>No traffic data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const broadcastPercent = (distribution.broadcast / total) * 100;
  const unicastPercent = (distribution.unicast / total) * 100;

  const radius = 80;
  const centerX = 120;
  const centerY = 120;
  const innerRadius = 50;

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

const DeviceActivityTable: React.FC<{ devices: DeviceActivity[] }> = ({ devices }) => {
  const [sortField, setSortField] = useState<'packetsSent' | 'packetsReceived' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedDevices = [...devices].sort((a, b) => {
    if (!sortField) return 0;
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (a[sortField] - b[sortField]) * multiplier;
  });

  const handleSort = (field: 'packetsSent' | 'packetsReceived') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Activity</CardTitle>
        <CardDescription>Network traffic by device</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Device</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">IP Address</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  <button 
                    className="flex items-center gap-1 hover:text-slate-900"
                    onClick={() => handleSort('packetsSent')}
                  >
                    Packets Sent
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  <button 
                    className="flex items-center gap-1 hover:text-slate-900"
                    onClick={() => handleSort('packetsReceived')}
                  >
                    Packets Received
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Activity Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {sortedDevices.map((device) => (
                <tr 
                  key={device.id} 
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.type, 'h-4 w-4 text-slate-600')}
                      <span className="text-sm font-medium text-slate-900">{device.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 font-mono">{device.ip}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 capitalize">{device.type}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 font-medium">{formatNumber(device.packetsSent)}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 font-medium">{formatNumber(device.packetsReceived)}</td>
                  <td className="py-3 px-4">
                    <Badge 
                      variant="outline"
                      className={
                        device.activityLevel === 'high'
                          ? 'border-green-300 text-green-700 bg-green-50'
                          : device.activityLevel === 'medium'
                          ? 'border-blue-300 text-blue-700 bg-blue-50'
                          : 'border-slate-300 text-slate-700 bg-slate-50'
                      }
                    >
                      {device.activityLevel}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500">{device.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityEventFeed: React.FC<{ events: ActivityEvent[] }> = ({ events }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(events.length / pageSize);

  const startIdx = (currentPage - 1) * pageSize;
  const pagedEvents = events.slice(startIdx, startIdx + pageSize);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent network events and changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pagedEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
              <div className="mt-0.5">{event.icon}</div>
              <div className="flex-1">
                <p className="text-sm text-slate-900">{event.message}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {event.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between mt-4 items-center">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-slate-100 text-slate-700 disabled:opacity-50 hover:bg-slate-200 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-slate-100 text-slate-700 disabled:opacity-50 hover:bg-slate-200 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const InsightsPanel: React.FC<{ insights: NetworkInsight[] }> = ({ insights }) => (
  <Card>
    <CardHeader>
      <CardTitle>Network Insights</CardTitle>
      <CardDescription>Automated observations from activity analysis</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {insights.length > 0 ? insights.map((insight) => (
          <div key={`${insight.title}-${insight.timestamp}`} className={`flex items-start gap-3 p-3 rounded-lg ${
            insight.type === 'warning' ? 'bg-yellow-50' :
            insight.type === 'error' ? 'bg-red-50' :
            insight.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
          }`}>
            {insight.type === 'warning' ? <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" /> :
             insight.type === 'error' ? <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" /> :
             insight.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" /> :
             <Activity className="h-5 w-5 text-blue-600 mt-0.5" />}
            <div>
              <p className="text-sm font-medium text-slate-900">{insight.title}</p>
              <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
            </div>
          </div>
        )) : (
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <Activity className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-900">No insights available</p>
              <p className="text-xs text-slate-600 mt-1">Network activity is being monitored</p>
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Main Network Activity Page Component
const NetworkActivityPage: React.FC = () => {
  const { data, isConnected, error, getActiveDevices, getLatestInsights, formatBytes, formatTimestamp, requestRefresh } = useWebSocket();
  const [timeRange, setTimeRange] = useState('1h');

  // Transform data to match component interfaces (compute ARP rate per minute)
  const trafficData: TrafficDataPoint[] = (() => {
    if (!data?.metrics?.packet_rate_history) return [];
    const arpHist = data.metrics.arp_history || [];
    const computeRate = (current: { timestamp: string; requests: number }, prev?: { timestamp: string; requests: number }) => {
      if (!prev) return 0;
      const t1 = new Date(current.timestamp).getTime();
      const t0 = new Date(prev.timestamp).getTime();
      const mins = (t1 - t0) / (1000 * 60);
      let delta = current.requests - prev.requests;
      if (delta < 0) delta = current.requests;
      return mins > 0 ? Math.round(delta / mins) : 0;
    };

    return data.metrics.packet_rate_history.map(item => {
      const time = new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const packets = item.value;
      const arpPoint = arpHist.find(arp => arp.timestamp === item.timestamp);
      let arpRate = 0;
      if (arpPoint) {
        const idx = arpHist.findIndex(a => a.timestamp === arpPoint.timestamp);
        if (idx > 0) {
          arpRate = computeRate(arpPoint, arpHist[idx - 1]);
        }
      }
      return {
        time,
        packets,
        arpRequests: arpRate,
        arpReplies: arpPoint?.replies || 0,
      };
    });
  })();

  // Get current packets per second from latest traffic data
  const currentPacketsPerSecond = trafficData.length > 0 
    ? trafficData[trafficData.length - 1].packets 
    : data?.metrics?.packets_per_second || 0;

  const deviceActivities: DeviceActivity[] = data?.devices?.map(device => ({
    id: device.id,
    name: device.name,
    ip: device.ip_address,
    type: device.type as 'laptop' | 'mobile' | 'printer' | 'iot' | 'network',
    packetsSent: device.packets_sent,
    packetsReceived: device.packets_received,
    activityLevel: device.activity_level,
    lastActive: formatTimestamp(device.last_active),
  })) || [];

  const activityEvents: ActivityEvent[] = data?.timeline?.map(event => ({
    id: event.device_mac,
    type: event.event as 'active' | 'idle' | 'spike' | 'load_change',
    message: event.details,
    timestamp: formatTimestamp(event.timestamp),
    icon: event.event === 'device_active' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />,
  })) || [];

  const trafficDistribution: TrafficDistribution = data?.metrics ? {
    broadcast: data.metrics.broadcast_traffic || 0,
    unicast: data.metrics.unicast_traffic || 0,
  } : { broadcast: 0, unicast: 0 };

  const activeDevices = getActiveDevices().length;
  const latestInsights = getLatestInsights();

  // derive current ARP rate (req/min) from last two history points
  const currentArpRate = (() => {
    const h = data?.metrics?.arp_history;
    if (!h || h.length < 2) return 0;
    const last = h[h.length - 1];
    const prev = h[h.length - 2];
    const mins = (new Date(last.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60);
    let delta = last.requests - prev.requests;
    if (delta < 0) delta = last.requests;
    return mins > 0 ? Math.round(delta / mins) : 0;
  })();

  // keep previous rate for trend arrows
  const [prevArpRate, setPrevArpRate] = useState<number>(0);
  React.useEffect(() => {
    setPrevArpRate(currentArpRate);
  }, [currentArpRate]);

  const metricsData: MetricCardData[] = [
    {
      title: 'Packets per Second',
      value: formatNumber(currentPacketsPerSecond),
      description: 'Current network throughput',
      icon: <Activity className="h-4 w-4" />,
      trend: 'up',
      trendValue: '+12% from baseline'
    },
    {
      title: 'Active Devices',
      value: activeDevices,
      description: 'Currently transmitting',
      icon: <Wifi className="h-4 w-4" />,
      trend: 'stable',
      trendValue: 'No change'
    },
    {
      title: 'ARP Requests Rate',
      value: `${currentArpRate}/min`,
      description: 'Address resolution activity',
      icon: <Radio className="h-4 w-4" />,
      trend: currentArpRate >= prevArpRate ? 'up' : 'down',
      trendValue: `${currentArpRate - prevArpRate >= 0 ? `+${currentArpRate - prevArpRate}` : currentArpRate - prevArpRate} req/min`
    },
    {
      title: 'Broadcast Traffic',
      value: trafficDistribution.broadcast || trafficDistribution.unicast
        ? `${((trafficDistribution.broadcast / (trafficDistribution.broadcast + trafficDistribution.unicast)) * 100).toFixed(1)}%`
        : '0%',
      description: 'Of total network traffic',
      icon: <Radio className="h-4 w-4" />,
      trend: trafficDistribution.broadcast >= trafficDistribution.unicast ? 'up' : 'down',
      trendValue: `${((trafficDistribution.broadcast - trafficDistribution.unicast) / ((trafficDistribution.broadcast + trafficDistribution.unicast) || 1) * 100).toFixed(1)}% diff`
    },

    {
      title: 'Unicast Traffic',
      value: trafficDistribution.broadcast || trafficDistribution.unicast
        ? `${((trafficDistribution.unicast / (trafficDistribution.broadcast + trafficDistribution.unicast)) * 100).toFixed(1)}%`
        : '0%',
      description: 'Direct device communication',
      icon: <Activity className="h-4 w-4" />,
      trend: trafficDistribution.unicast >= trafficDistribution.broadcast ? 'up' : 'down',
      trendValue: `${((trafficDistribution.unicast - trafficDistribution.broadcast) / ((trafficDistribution.broadcast + trafficDistribution.unicast) || 1) * 100).toFixed(1)}% diff`
    },
    {
      title: 'Network Load',
      value: data?.metrics?.network_load ? `${formatBytes(data.metrics.network_load)}/s` : '0 B/s',
      description: 'Overall utilization status',
      icon: <TrendingUp className="h-4 w-4" />,
      trend: 'stable',
      trendValue: 'Stable'
    }
  ];

  if (!isConnected) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Connecting to Network Activity Feed</h2>
            <p className="text-slate-500">Please wait while we establish connection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Connection Error</h2>
            <p className="text-slate-500 mb-4">Failed to connect to network activity feed.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Loading Network Data</h2>
            <p className="text-slate-500">Fetching real-time network activity...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Network Activity</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time and historical LAN traffic insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">Last 5 minutes</SelectItem>
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={requestRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Separator />

      {/* High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricsData.map((metric) => (
          <ActivityMetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Traffic Trends Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficLineChart 
            data={trafficData}
            title="Packet Rate Over Time"
            description="Network throughput trends"
          />
        </div>
        
        <div>
          <TrafficDistributionChart distribution={trafficDistribution} />
        </div>
      </div>

      {/* ARP Activity Chart */}
      <ARPActivityChart data={trafficData} />

      {/* Device Activity Table */}
      <DeviceActivityTable devices={deviceActivities} />

      {/* Bottom Section: Activity Feed and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityEventFeed events={activityEvents} />
        <InsightsPanel insights={latestInsights} />
      </div>
    </div>
  );
};

export default NetworkActivityPage;