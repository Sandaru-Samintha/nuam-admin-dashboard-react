// hooks/useNetworkActivityPageData.ts
import { useState, useEffect, useRef, useCallback } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  isWebSocketConnected,
} from "../services/websocket";

// Types matching your existing interfaces
export interface MetricCardData {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export interface TrafficDataPoint {
  time: string;
  packets: number;
  arpRequests: number;
  arpReplies: number;
}

export interface DeviceActivity {
  id: string;
  name: string;
  ip: string;
  type: 'laptop' | 'mobile' | 'printer' | 'iot' | 'network';
  packetsSent: number;
  packetsReceived: number;
  activityLevel: 'low' | 'medium' | 'high';
  lastActive: string;
}

export interface ActivityEvent {
  id: string;
  type: 'active' | 'idle' | 'spike' | 'load_change';
  message: string;
  timestamp: string;
  icon?: React.ReactNode;
}

export interface TrafficDistribution {
  broadcast: number;
  unicast: number;
}

export interface NetworkInsight {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  description: string;
}

export interface NetworkMetrics {
  totalDevices: number;
  activeDevices: number;
  dataSent: number;
  dataReceived: number;
  broadcastPackets: number;
  unicastPackets: number;
  arpRequests: number;
  arpReplies: number;
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Helper to determine activity level based on packet count
const determineActivityLevel = (packetsSent: number, packetsReceived: number): 'low' | 'medium' | 'high' => {
  const totalPackets = packetsSent + packetsReceived;
  if (totalPackets > 50000) return 'high';
  if (totalPackets > 10000) return 'medium';
  return 'low';
};

// Helper to map device type from backend to frontend
const mapDeviceType = (type: string): 'laptop' | 'mobile' | 'printer' | 'iot' | 'network' => {
  const typeMap: Record<string, any> = {
    'computer': 'laptop',
    'laptop': 'laptop',
    'desktop': 'laptop',
    'workstation': 'laptop',
    'mobile': 'mobile',
    'phone': 'mobile',
    'smartphone': 'mobile',
    'tablet': 'mobile',
    'printer': 'printer',
    'iot': 'iot',
    'sensor': 'iot',
    'camera': 'iot',
    'thermostat': 'iot',
    'router': 'network',
    'switch': 'network',
    'access_point': 'network',
    'gateway': 'network'
  };
  return typeMap[type?.toLowerCase()] || 'network';
};

// Helper to generate insights from metrics
const generateInsights = (metrics: NetworkMetrics, devices: DeviceActivity[]): NetworkInsight[] => {
  const insights: NetworkInsight[] = [];
  
  // Most active device insight
  const mostActive = [...devices].sort((a, b) => 
    (b.packetsSent + b.packetsReceived) - (a.packetsSent + a.packetsReceived)
  )[0];
  
  if (mostActive) {
    insights.push({
      id: `most-active-${Date.now()}`,
      type: 'success',
      title: `Most active device: ${mostActive.name}`,
      description: `Generated ${formatNumber(mostActive.packetsSent + mostActive.packetsReceived)} packets total`
    });
  }

  // Traffic trend insight
  const totalTraffic = metrics.unicastPackets + metrics.broadcastPackets;
  if (totalTraffic > 0) {
    const broadcastRatio = (metrics.broadcastPackets / totalTraffic) * 100;
    
    if (broadcastRatio > 20) {
      insights.push({
        id: `high-broadcast-${Date.now()}`,
        type: 'warning',
        title: 'High broadcast traffic detected',
        description: `Broadcast traffic is ${broadcastRatio.toFixed(1)}% of total, above normal range`
      });
    } else {
      insights.push({
        id: `normal-broadcast-${Date.now()}`,
        type: 'info',
        title: 'Broadcast traffic is normal',
        description: `Broadcast traffic is ${broadcastRatio.toFixed(1)}% of total, within expected range`
      });
    }
  }

  // ARP activity insight
  if (metrics.arpReplies > 0) {
    const arpRatio = metrics.arpRequests / metrics.arpReplies;
    if (arpRatio > 2) {
      insights.push({
        id: `high-arp-${Date.now()}`,
        type: 'warning',
        title: 'High ARP request rate',
        description: `${arpRatio.toFixed(1)} requests per reply, possible network scanning`
      });
    } else {
      insights.push({
        id: `normal-arp-${Date.now()}`,
        type: 'info',
        title: 'ARP activity is stable',
        description: 'Request/reply ratio within normal range'
      });
    }
  }

  return insights;
};

export const useNetworkActivityPageData = (timeRange: string = '1h') => {
  const [metrics, setMetrics] = useState<MetricCardData[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([]);
  const [devices, setDevices] = useState<DeviceActivity[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [distribution, setDistribution] = useState<TrafficDistribution>({
    broadcast: 0,
    unicast: 0
  });
  const [insights, setInsights] = useState<NetworkInsight[]>([]);
  const [currentPacketsPerSecond, setCurrentPacketsPerSecond] = useState<number>(0);
  const [arpRate, setArpRate] = useState<number>(0);
  const [activeDevicesCount, setActiveDevicesCount] = useState<number>(0);
  const [totalDevicesCount, setTotalDevicesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Track previous metric for rate calculations
  const prevMetricsRef = useRef<{ 
    timestamp: number; 
    arpRequests: number; 
    packets: number;
    broadcastPackets: number;
    unicastPackets: number;
  } | null>(null);
  
  // Track previous ARP for rate calculation
  const prevArpRef = useRef<{
    arpRequests: number;
    timestamp: number;
  } | null>(null);
  
  const trafficHistoryRef = useRef<TrafficDataPoint[]>([]);
  const maxHistoryPoints = timeRange === '5m' ? 5 : timeRange === '1h' ? 12 : 24;

  // Calculate metrics cards from raw data
  const calculateMetricsCards = useCallback((
    networkMetrics: NetworkMetrics,
    packetsPerSecond: number,
    currentArpRate: number,
    devicesList: DeviceActivity[],
    backendActiveDevices: number // Add this parameter
  ): MetricCardData[] => {
    // Use backend active devices count instead of calculating from activity level
    const activeDevices = backendActiveDevices;
    const totalTraffic = networkMetrics.broadcastPackets + networkMetrics.unicastPackets;
    const broadcastPercent = totalTraffic > 0 ? ((networkMetrics.broadcastPackets / totalTraffic) * 100).toFixed(1) : '0';
    const unicastPercent = totalTraffic > 0 ? ((networkMetrics.unicastPackets / totalTraffic) * 100).toFixed(1) : '0';

    // Determine network load based on packets per second
    let networkLoad = 'Low';
    let networkLoadTrend: 'up' | 'down' | 'stable' = 'stable';
    
    if (packetsPerSecond > 1400) {
      networkLoad = 'High';
      networkLoadTrend = 'up';
    } else if (packetsPerSecond > 1000) {
      networkLoad = 'Medium';
      networkLoadTrend = 'stable';
    } else if (packetsPerSecond < 600) {
      networkLoad = 'Low';
      networkLoadTrend = 'down';
    }

    return [
      {
        title: 'Packets per Second',
        value: formatNumber(packetsPerSecond),
        description: 'Current network throughput',
        icon: undefined,
        trend: packetsPerSecond > 1300 ? 'up' : packetsPerSecond < 700 ? 'down' : 'stable',
        trendValue: packetsPerSecond > 1300 ? '+12% from baseline' : 
                   packetsPerSecond < 700 ? '-8% from baseline' : 'Within normal range'
      },
      {
        title: 'Active Devices',
        value: activeDevices,
        description: 'Currently transmitting',
        icon: undefined,
        trend: activeDevices > 5 ? 'up' : activeDevices < 2 ? 'down' : 'stable',
        trendValue: activeDevices > 5 ? '+2 from average' : 
                   activeDevices < 2 ? '-1 from average' : 'No change'
      },
      {
        title: 'ARP Requests Rate',
        value: `${currentArpRate}/min`,
        description: 'Address resolution activity',
        icon: undefined,
        trend: currentArpRate > 100 ? 'up' : currentArpRate < 40 ? 'down' : 'stable',
        trendValue: currentArpRate > 100 ? '+15% from average' : 
                   currentArpRate < 40 ? '-10% from average' : 'Within normal range'
      },
      {
        title: 'Broadcast Traffic',
        value: `${broadcastPercent}%`,
        description: 'Of total network traffic',
        icon: undefined,
        trend: parseFloat(broadcastPercent) > 15 ? 'up' : parseFloat(broadcastPercent) < 8 ? 'down' : 'stable',
        trendValue: parseFloat(broadcastPercent) > 15 ? '+2% from average' : 
                   parseFloat(broadcastPercent) < 8 ? '-2% from average' : 'Stable'
      },
      {
        title: 'Unicast Traffic',
        value: `${unicastPercent}%`,
        description: 'Direct device communication',
        icon: undefined,
        trend: parseFloat(unicastPercent) > 92 ? 'up' : parseFloat(unicastPercent) < 85 ? 'down' : 'stable',
        trendValue: parseFloat(unicastPercent) > 92 ? '+2% from average' : 
                   parseFloat(unicastPercent) < 85 ? '-2% from average' : 'Stable'
      },
      {
        title: 'Network Load',
        value: networkLoad,
        description: 'Overall utilization status',
        icon: undefined,
        trend: networkLoadTrend,
        trendValue: networkLoad === 'High' ? 'Increasing' : 
                   networkLoad === 'Low' ? 'Decreasing' : 'Stable'
      }
    ];
  }, []);

  // Update traffic history with new data point
  const updateTrafficHistory = useCallback((dataPoint: TrafficDataPoint) => {
    trafficHistoryRef.current = [...trafficHistoryRef.current, dataPoint].slice(-maxHistoryPoints);
    setTrafficData(trafficHistoryRef.current);
  }, [maxHistoryPoints]);

  useEffect(() => {
    setIsLoading(true);
    
    connectWebSocket((data: any) => {
      setIsConnected(true);
      setError(null);

      // Handle DEVICE_JOINED events
      if (data.event?.type === "TOPOLOGY" && data.event?.subtype === "DEVICE_JOINED") {
        const deviceData = data.event.payload.device;
        const device: DeviceActivity = {
          id: deviceData.device_id || deviceData.mac_address,
          name: deviceData.hostname || deviceData.device_name || 'Unknown Device',
          ip: deviceData.ip_address || '-',
          type: mapDeviceType(deviceData.device_type || 'unknown'),
          packetsSent: deviceData.packets_sent || 0,
          packetsReceived: deviceData.packets_received || 0,
          activityLevel: determineActivityLevel(
            deviceData.packets_sent || 0, 
            deviceData.packets_received || 0
          ),
          lastActive: 'Just now'
        };

        setDevices(prev => {
          const exists = prev.some(d => d.id === device.id);
          if (exists) {
            return prev.map(d => d.id === device.id ? { ...d, ...device } : d);
          }
          return [device, ...prev].slice(0, 100);
        });

        const event: ActivityEvent = {
          id: data.event.meta.sequence.toString(),
          type: 'active',
          message: `${device.name} (${device.ip}) joined the network`,
          timestamp: new Date(data.event.meta.timestamp).toLocaleTimeString()
        };
        setEvents(prev => [event, ...prev].slice(0, 50));
      }

      // Handle DEVICE_LEFT events
      if (data.event?.type === "TOPOLOGY" && data.event?.subtype === "DEVICE_LEFT") {
        const deviceId = data.event.payload.device.device_id;
        
        setDevices(prev => {
          const device = prev.find(d => d.id === deviceId);
          const updated = prev.map(d => d.id === deviceId ? { ...d, activityLevel: 'low', lastActive: 'Just now' } : d);
          
          const event: ActivityEvent = {
            id: data.event.meta.sequence.toString(),
            type: 'idle',
            message: `${device?.name || 'Device'} (${device?.ip || 'Unknown'}) left the network`,
            timestamp: new Date(data.event.meta.timestamp).toLocaleTimeString()
          };
          setEvents(prevEvents => [event, ...prevEvents].slice(0, 50));
          
          return updated;
        });
      }

      // Handle METRIC updates
      if (data.event?.type === "METRIC" && data.event?.subtype === "PERIODIC_METRIC_STATE") {
        const m = data.event.payload.metrics;
        const metricTime = new Date(m.measure_time || data.event.meta.timestamp).getTime();

        const networkMetrics: NetworkMetrics = {
          totalDevices: m.total_devices || 0,
          activeDevices: m.active_devices || 0,
          dataSent: m.data_sent || 0,
          dataReceived: m.data_received || 0,
          broadcastPackets: m.total_broadcast_packets || 0,
          unicastPackets: m.total_unicast_packets || 0,
          arpRequests: m.arp_requests || 0,
          arpReplies: m.arp_replies || 0,
        };

        // Update distribution
        setDistribution({
          broadcast: networkMetrics.broadcastPackets,
          unicast: networkMetrics.unicastPackets
        });

        // Update total devices count
        setTotalDevicesCount(networkMetrics.totalDevices);

        // Calculate packets per second
        let packetsPerSecond = 0;
        
        if (prevMetricsRef.current) {
          const timeDiffMs = metricTime - prevMetricsRef.current.timestamp;
          const timeDiffSec = timeDiffMs / 1000;
          
          if (timeDiffSec > 0) {
            // Calculate packets per second
            const currentTotalPackets = networkMetrics.broadcastPackets + networkMetrics.unicastPackets;
            const packetsDiff = currentTotalPackets - prevMetricsRef.current.packets;
            packetsPerSecond = Math.round(Math.max(0, packetsDiff / timeDiffSec));
            setCurrentPacketsPerSecond(packetsPerSecond);
          }
        }

        // Calculate ARP rate
        if (prevArpRef.current) {
          const timeDiffMs = new Date().getTime() - new Date(m.measure_time || data.event.meta.timestamp).getTime();
          const timeDiffMins = timeDiffMs / (1000 * 60);
          const rate = timeDiffMins > 0 ? networkMetrics.arpRequests / timeDiffMins : 0;
          setArpRate(Math.round(rate));
        }

        // Update prevArpRef for next calculation
        prevArpRef.current = {
          arpRequests: networkMetrics.arpRequests,
          timestamp: metricTime,
        };

        prevMetricsRef.current = {
          timestamp: metricTime,
          arpRequests: networkMetrics.arpRequests,
          packets: networkMetrics.broadcastPackets + networkMetrics.unicastPackets,
          broadcastPackets: networkMetrics.broadcastPackets,
          unicastPackets: networkMetrics.unicastPackets
        };

        // Add traffic data point
        const trafficPoint: TrafficDataPoint = {
          time: new Date(m.measure_time || data.event.meta.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          packets: networkMetrics.broadcastPackets + networkMetrics.unicastPackets,
          arpRequests: networkMetrics.arpRequests,
          arpReplies: networkMetrics.arpReplies
        };
        updateTrafficHistory(trafficPoint);

        // Add metric event
        const metricEvent: ActivityEvent = {
          id: data.event.meta.sequence.toString(),
          type: 'load_change',
          message: `Network load: ${networkMetrics.activeDevices} active devices, ${formatNumber(packetsPerSecond)} pps, ARP: ${arpRate}/min`,
          timestamp: new Date(data.event.meta.timestamp).toLocaleTimeString()
        };
        setEvents(prev => [metricEvent, ...prev].slice(0, 50));

        setIsLoading(false);
      }

      // Handle dashboard stats for device list and active devices count
      if (data.dashboard_stats) {
        // Update active devices count directly from dashboard_stats
        if (data.dashboard_stats.active_devices !== undefined) {
          setActiveDevicesCount(data.dashboard_stats.active_devices);
        }

        // Update total devices from dashboard_stats if available
        if (data.dashboard_stats.total_devices !== undefined) {
          setTotalDevicesCount(data.dashboard_stats.total_devices);
        }

        // Process devices array if present
        if (data.dashboard_stats.devices && Array.isArray(data.dashboard_stats.devices)) {
          const incomingDevices = data.dashboard_stats.devices.map((d: any) => ({
            id: d.id || d.mac || d.mac_address,
            name: d.name || d.hostname || 'Unknown',
            ip: d.ip || d.ip_address || '-',
            type: mapDeviceType(d.type || d.device_type || 'unknown'),
            packetsSent: d.packets_sent || 0,
            packetsReceived: d.packets_received || 0,
            activityLevel: determineActivityLevel(d.packets_sent || 0, d.packets_received || 0),
            lastActive: d.last_seen ? new Date(d.last_seen).toLocaleString() : 'Unknown'
          }));

          setDevices(prev => {
            const updated = [...prev];
            incomingDevices.forEach((device: DeviceActivity) => {
              const index = updated.findIndex(d => d.id === device.id);
              if (index >= 0) {
                updated[index] = { ...updated[index], ...device };
              } else {
                updated.unshift(device);
              }
            });
            return updated.slice(0, 100);
          });
        }
      }

      // Handle traffic spike events
      if (data.event?.type === "METRIC" && data.event?.subtype === "TRAFFIC_SPIKE") {
        const spikeEvent: ActivityEvent = {
          id: data.event.meta.sequence.toString(),
          type: 'spike',
          message: `Traffic spike detected: ${data.event.payload.value}% above normal`,
          timestamp: new Date(data.event.meta.timestamp).toLocaleTimeString()
        };
        setEvents(prev => [spikeEvent, ...prev].slice(0, 50));
      }
    });

    return () => disconnectWebSocket();
  }, [timeRange, updateTrafficHistory]);

  // Separate effect to update metrics and insights when dependencies change
  useEffect(() => {
    if (devices.length > 0 || distribution.broadcast + distribution.unicast > 0) {
      const networkMetrics: NetworkMetrics = {
        totalDevices: totalDevicesCount || devices.length,
        activeDevices: activeDevicesCount,
        dataSent: devices.reduce((sum, d) => sum + d.packetsSent, 0),
        dataReceived: devices.reduce((sum, d) => sum + d.packetsReceived, 0),
        broadcastPackets: distribution.broadcast,
        unicastPackets: distribution.unicast,
        arpRequests: trafficData.length > 0 ? trafficData[trafficData.length - 1]?.arpRequests || 0 : 0,
        arpReplies: trafficData.length > 0 ? trafficData[trafficData.length - 1]?.arpReplies || 0 : 0
      };

      setMetrics(calculateMetricsCards(
        networkMetrics,
        currentPacketsPerSecond,
        arpRate,
        devices,
        activeDevicesCount // Pass the backend active devices count
      ));

      setInsights(generateInsights(networkMetrics, devices));
    }
  }, [currentPacketsPerSecond, devices, arpRate, distribution, activeDevicesCount, trafficData, totalDevicesCount, calculateMetricsCards]);

  // Poll connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(isWebSocketConnected());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Refresh function
  const refreshData = useCallback(() => {
    if (isWebSocketConnected()) {
      // You can implement a refresh message if your backend supports it
      connectWebSocket((data: any) => {
        // Re-fetch logic here if needed
      });
    }
  }, []);

  return {
    metrics,
    trafficData,
    devices,
    events,
    distribution,
    insights,
    currentPacketsPerSecond,
    avgArpRate: arpRate,
    activeDevicesCount,
    totalDevicesCount, 
    isLoading,
    error,
    isConnected,
    refreshData
  };
};