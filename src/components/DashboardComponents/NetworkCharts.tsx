import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import React, { useMemo } from 'react';
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface NetworkChartsProps {
  metrics: {
    arpRequests: number;
    broadcastPackets: number;
    unicastPackets: number;
  };
  history?: { timestamp: string; arpRequests: number }[]; // optional rolling history
}

const COLORS = ['#4ade80', '#60a5fa']; // green for broadcast, blue for unicast

const NetworkCharts: React.FC<NetworkChartsProps> = ({ metrics, history = [] }) => {
  // Prepare ARP requests data: last few metrics or a single point if no history
  const arpData = useMemo(() => {
    if (history.length > 0) return history;
    return [{ timestamp: 'Now', arpRequests: metrics.arpRequests }];
  }, [metrics.arpRequests, history]);

  // Broadcast vs Unicast Pie
  const trafficData = [
    { name: 'Broadcast', value: metrics.broadcastPackets },
    { name: 'Unicast', value: metrics.unicastPackets },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4">
      {/* ARP Requests Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>ARP Requests per minute</CardTitle>
          <CardDescription>Network resolution activity</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={arpData}>
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="arpRequests"
                stroke="#4ade80"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Broadcast vs Unicast Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast vs Unicast Traffic</CardTitle>
          <CardDescription>Traffic distribution analysis</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={trafficData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {trafficData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkCharts;
