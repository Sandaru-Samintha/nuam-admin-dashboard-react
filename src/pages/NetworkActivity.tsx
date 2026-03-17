import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Activity,
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNetworkActivityPageData } from '@/hooks/useNetworkActivityPageData';

// Import all our components
import MetricsContainer from '@/components/network/MetricsContainer';
import TrafficLineChart from '@/components/network/TrafficLineChart';
import ARPActivityChart from '@/components/network/ARPActivityChart';
import TrafficDistributionChart from '@/components/network/TrafficDistributionChart';
import DeviceActivityTable from '@/components/network/DeviceActivityTable';
import ActivityEventFeed from '@/components/network/ActivityEventFeed';
import InsightsPanel from '@/components/network/InsightsPanel';
import PacketTypeTable from '@/components/network/PacketTypeTable'; // Add this import

// Main Network Activity Page Component
const NetworkActivityPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  
  // Use our custom hook
  const {
    metrics,
    trafficData,
    devices,
    events,
    distribution,
    insights,
    currentPacketsPerSecond,
    avgArpRate,
    activeDevicesCount,
    packetDetails, // Make sure this is exposed from your hook
    totalPacketsCount,
    isLoading,
    error,
    isConnected,
    refreshData
  } = useNetworkActivityPageData(timeRange);

  // Calculate total packets from packet details
  const totalPackets = packetDetails?.reduce((sum, detail) => sum + detail.totalPackets, 0) || 0;

  // Get metrics for advanced packet types
  const packetMetrics = trafficData.length > 0 ? {
    ip_packets: trafficData.reduce((sum, d) => sum + (d.arpRequests + d.arpReplies), 0), // Example calculation
    tcp_packets: 0, // These would come from your actual data
    udp_packets: 0,
    icmp_packets: 0,
    dns_queries: 0,
    dhcp_packets: 0,
    http_requests: 0,
    tls_handshakes: 0
  } : undefined;

  // Update last updated timestamp when data changes
  useEffect(() => {
    if (!isLoading) {
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [trafficData, devices, events, isLoading]);

  // Add icons to events and limit to most recent 100 for pagination
  const eventsWithIcons = events.slice(0, 100).map(event => ({
    ...event,
    icon: event.type === 'active' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
          event.type === 'spike' ? <TrendingUp className="h-4 w-4 text-blue-600" /> :
          event.type === 'idle' ? <AlertCircle className="h-4 w-4 text-yellow-600" /> :
          event.type === 'load_change' ? <Activity className="h-4 w-4 text-purple-600" /> :
          <Activity className="h-4 w-4 text-slate-600" />,
    // Add ARP rate to load_change events
    ...(event.type === 'load_change' && {
      arpRate: {
        value: `${avgArpRate}/min`,
        trend: avgArpRate > 100 ? 'up' : avgArpRate < 40 ? 'down' : 'stable',
        trendValue: avgArpRate > 100 ? 'High' : avgArpRate < 40 ? 'Low' : 'Normal'
      }
    })
  }));

  // Handle refresh button click
  // const handleRefresh = () => {
  //   refreshData();
  //   setLastUpdated(new Date().toLocaleTimeString());
  // };

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading network activity data...</p>
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
        
        {/* <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">Last 5 minutes</SelectItem>
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div> */}
      </div>

      <Separator />

      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Using mock data - Real-time connection unavailable
            </p>
            {error && <p className="text-xs text-yellow-700 mt-1">{error}</p>}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Retry Connection
          </Button>
        </div>
      )}

      {/* Error Banner */}
      {error && isConnected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error loading data</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white border-red-300 text-red-700 hover:bg-red-50"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      )}

      {/* High-Level Metrics */}
      <MetricsContainer
        metrics={metrics}
        currentPacketsPerSecond={currentPacketsPerSecond}
        avgArpRate={avgArpRate}
        activeDevicesCount={activeDevicesCount}
        devices={devices}
        distribution={distribution}
      />

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
          <TrafficDistributionChart distribution={distribution} />
        </div>
      </div>

      {/* ARP Activity Chart */}
      <ARPActivityChart data={trafficData} />

      {/* Packet Type Distribution Table - This will show above Device Activity */}
      <PacketTypeTable 
        packetDetails={packetDetails || []}
        totalPackets={totalPackets}
        currentPacketsPerSecond={currentPacketsPerSecond}
        metrics={packetMetrics}
      />

      {/* Device Activity Table */}
      <DeviceActivityTable devices={devices} />

      {/* Bottom Section: Activity Feed and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityEventFeed 
          events={eventsWithIcons} 
          pageSize={10}
          currentArpRate={{
            value: `${avgArpRate}/min`,
            trend: avgArpRate > 100 ? 'up' : avgArpRate < 40 ? 'down' : 'stable',
            trendValue: avgArpRate > 100 ? '+15% from average' : 
                       avgArpRate < 40 ? '-10% from average' : 'Within normal range'
          }}
        />
        <InsightsPanel insights={insights} />
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span>
            {isConnected ? 'Connected to live data' : 'Using mock data'}
          </span>
          {isConnected && <span className="text-green-600 text-xs">● Live</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>Last updated: {lastUpdated}</span>
          {trafficData.length > 0 && (
            <span className="text-slate-500">
              {trafficData.length} data points
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkActivityPage;