import DeviceTable from '@/components/DashboardComponents/DeviceTable';
import EventFeed from '@/components/DashboardComponents/EventFeed';
import MetricCard from '@/components/DashboardComponents/MetricCard';
import NetworkCharts from '@/components/DashboardComponents/NetworkCharts';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Activity, AlertCircle, CheckCircle2, Radio, Server, Wifi, WifiOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ArpHistoryPoint {
  timestamp: string;
  arpRequests: number;
}

const Dashboard: React.FC = () => {
  const {
    devices,
    events,
    metrics,
    activeDevices,
    newDevicesToday,
    idleDevices,
    isConnected,
    arpRate,
  } = useDashboardData();

  const [arpHistory, setArpHistory] = useState<ArpHistoryPoint[]>([]);

  // Track ARP history for charts
  const [prevArpRate, setPrevArpRate] = useState<number>(0);

  useEffect(() => {
    const newPoint: ArpHistoryPoint = {
      timestamp: new Date().toLocaleTimeString(),
      arpRequests: arpRate,
    };
    setArpHistory(prev => [...prev.slice(-29), newPoint]); // Keep last 30 points

    // update previous rate for trend calculation
    setPrevArpRate(arpRate);
  }, [arpRate]);

  // Broadcast ratio calculation
  const totalPackets = (metrics?.broadcastPackets ?? 0) + (metrics?.unicastPackets ?? 0);
  const broadcastRatio =
  totalPackets > 0
    ? ((metrics?.broadcastPackets ?? 0) / totalPackets * 100).toFixed(2) // keep 2 decimals
    : "0.00";


  return (
    <div className="p-4">
      {/* Connection Status Banner */}
      <div
        className={`mb-4 p-3 rounded flex items-center gap-2 ${
          isConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}
      >
        {isConnected ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">WebSocket Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">
              WebSocket Disconnected - Waiting for backend at ws://localhost:8000/ws/frontend
            </span>
          </>
        )}
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Devices"
          value={activeDevices}
          description="Currently connected"
          icon={<Wifi className="h-4 w-4" />}
          trendDirection={activeDevices - idleDevices >= 0 ? 'up' : 'down'}
          trendValue={`${activeDevices - idleDevices >= 0 ? `+${activeDevices - idleDevices}` : activeDevices - idleDevices} since last update`}
        />
        <MetricCard
          title="New Devices Today"
          value={newDevicesToday}
          description="First-time connections today"
          icon={<Server className="h-4 w-4" />}
          trendDirection={newDevicesToday > 0 ? 'up' : 'stable'}
          trendValue={`${newDevicesToday} added today`}
        />
        <MetricCard
          title="Inactive Devices"
          value={idleDevices}
          description="No recent activity"
          icon={<AlertCircle className="h-4 w-4" />}
          trendDirection={idleDevices > 0 ? 'down' : 'stable'}
          trendValue={`${idleDevices} devices idle`}
        />
        <MetricCard
          title="Network Status"
          value="Healthy"
          description="All systems operational"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      {/* Secondary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <MetricCard
          title="ARP Traffic Rate"
          value={`${arpRate} req/min`}
          description="Current ARP resolution activity"
          icon={<Activity className="h-4 w-4" />}
          trendDirection={arpRate >= prevArpRate ? 'up' : 'down'}
          trendValue={`${arpRate - prevArpRate >= 0 ? `+${arpRate - prevArpRate}` : arpRate - prevArpRate} req/min`}
        />
        <MetricCard
          title="Broadcast Ratio"
          value={`${broadcastRatio}%`}
          description="Of total network traffic"
          icon={<Radio className="h-4 w-4" />}
        />
      </div>

      {/* Charts */}
      <NetworkCharts
        metrics={{
          arpRequests: metrics?.arpRequests ?? 0,
          broadcastPackets: metrics?.broadcastPackets ?? 0,
          unicastPackets: metrics?.unicastPackets ?? 0,
        }}
        history={arpHistory}
      />

      {/* Tables */}
      <DeviceTable devices={devices} pageSize={5} /> {/* Show more devices */}
      <EventFeed events={events} pageSize={10} /> {/* Show more events */}
    </div>
  );
};

export default Dashboard;
