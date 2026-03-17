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
  dataSent?: number;
  dataReceived?: number;
  activityLevel: 'low' | 'medium' | 'high';
  lastActive: string;
  lastSeen?: string;
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
  dhcpPackets: number;
  dnsQueries: number;
  httpRequests: number;
  tlsHandshakes: number;
  tcpPackets: number;
  udpPackets: number;
  icmpPackets: number;
  ipPackets: number;
}


export interface PacketDetails {
  packetType: string;
  totalPackets: number;
  packetsPerSecond: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface PacketTypeData {
  type: string;
  count: number;
  rate: number;
}

export interface ProtocolPpsPoint {
  time: string;
  ipPacketsPerSecond: number;
  tcpPacketsPerSecond: number;
  icmpPacketsPerSecond: number;
  udpPacketsPerSecond: number;
  dnsQueriesPerSecond: number;
  dhcpPacketsPerSecond: number;
}

const safeTimestampMs = (...values: Array<unknown>): number => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const parsed = new Date(value as string | number | Date).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
};

const calculateRatePerSecond = (
  currentValue: number,
  previousValue: number | null,
  elapsedSeconds: number
): number => {
  if (elapsedSeconds <= 0) return 0;

  if (previousValue === null) {
    return Number((currentValue / elapsedSeconds).toFixed(2));
  }

  const delta = currentValue - previousValue;

  // Support both cumulative counters and interval counters from backend.
  const normalized = delta >= 0 ? delta : currentValue;

  return Number((normalized / elapsedSeconds).toFixed(2));
};

const normalizeElapsedSeconds = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 1;
  // Metric events are expected to be periodic; very large gaps usually indicate bad timestamp input.
  if (value > 60) return 5;
  return value;
};

const asNumber = (value: unknown): number => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const getMetricValue = (source: Record<string, unknown>, keys: string[]): number => {
  for (const key of keys) {
    const value = source[key];
    if (value !== null && value !== undefined) {
      return asNumber(value);
    }
  }
  return 0;
};

// Add this helper function:
const formatDataRate = (bytesPerSec: number): string => {
  if (bytesPerSec >= 1000000000) return (bytesPerSec / 1000000000).toFixed(1) + ' GB';
  if (bytesPerSec >= 1000000) return (bytesPerSec / 1000000).toFixed(1) + ' MB';
  if (bytesPerSec >= 1000) return (bytesPerSec / 1000).toFixed(1) + ' KB';
  return bytesPerSec + ' B';
};

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Helper to calculate packet details
const calculatePacketDetails = (
  currentPackets: {
    broadcast: number;
    unicast: number;
    arpRequests: number;
    arpReplies: number;
    total: number;
  },
  previousPackets?: {
    broadcast: number;
    unicast: number;
    arpRequests: number;
    arpReplies: number;
    total: number;
  },
  timeDiffSec: number = 1
): PacketDetails[] => {

  const calculateRate = (current: number, previous?: number): number => {
    if (!previous || timeDiffSec <= 0) return 0;
    const delta = Math.max(0, current - previous);
    return Number((delta / timeDiffSec).toFixed(2));
  };

  const broadcastRate = calculateRate(currentPackets.broadcast, previousPackets?.broadcast);
  const unicastRate = calculateRate(currentPackets.unicast, previousPackets?.unicast);
  const arpRequestRate = calculateRate(currentPackets.arpRequests, previousPackets?.arpRequests);
  const arpReplyRate = calculateRate(currentPackets.arpReplies, previousPackets?.arpReplies);
  const totalRate = calculateRate(currentPackets.total, previousPackets?.total);

  const details: PacketDetails[] = [
    {
      packetType: 'Broadcast',
      totalPackets: currentPackets.broadcast,
      packetsPerSecond: broadcastRate,
      percentage: currentPackets.total > 0 ? Number(((currentPackets.broadcast / currentPackets.total) * 100).toFixed(1)) : 0,
      trend: broadcastRate > 100 ? 'up' : broadcastRate < 10 ? 'down' : 'stable'
    },
    {
      packetType: 'Unicast',
      totalPackets: currentPackets.unicast,
      packetsPerSecond: unicastRate,
      percentage: currentPackets.total > 0 ? Number(((currentPackets.unicast / currentPackets.total) * 100).toFixed(1)) : 0,
      trend: unicastRate > 1000 ? 'up' : unicastRate < 100 ? 'down' : 'stable'
    },
    {
      packetType: 'ARP Requests',
      totalPackets: currentPackets.arpRequests,
      packetsPerSecond: arpRequestRate,
      percentage: currentPackets.total > 0 ? Number(((currentPackets.arpRequests / currentPackets.total) * 100).toFixed(1)) : 0,
      trend: arpRequestRate > 50 ? 'up' : arpRequestRate < 5 ? 'down' : 'stable'
    },
    {
      packetType: 'ARP Replies',
      totalPackets: currentPackets.arpReplies,
      packetsPerSecond: arpReplyRate,
      percentage: currentPackets.total > 0 ? Number(((currentPackets.arpReplies / currentPackets.total) * 100).toFixed(1)) : 0,
      trend: arpReplyRate > 50 ? 'up' : arpReplyRate < 5 ? 'down' : 'stable'
    }
  ];

  return details;
};

// Helper to determine activity level based on packet count
const determineActivityLevel = (packetsSent: number, packetsReceived: number, dataSent?: number, dataReceived?: number)
  : 'low' | 'medium' | 'high' => {
  const totalPackets = packetsSent + packetsReceived;
  const totalData = (dataSent || 0) + (dataReceived || 0);
  if (totalPackets > 50000 || totalData > 10000000) return 'high';
  if (totalPackets > 10000 || totalData > 1000000) return 'medium';
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
  const [currentDataRate, setCurrentDataRate] = useState<number>(0);
  const [packetDetails, setPacketDetails] = useState<PacketDetails[]>([]);
  const [packetTypeBreakdown, setPacketTypeBreakdown] = useState<PacketTypeData[]>([]);
  const [metricSnapshot, setMetricSnapshot] = useState<NetworkMetrics | null>(null);
  const [protocolPpsData, setProtocolPpsData] = useState<ProtocolPpsPoint[]>([]);
  const [measureTimestamp, setMeasureTimestamp] = useState<number>(0);


  useEffect(() => {
    console.log("metricSnapshot updated:", metricSnapshot);
  }, [metricSnapshot])


  // Add this ref to track packet history
  const packetHistoryRef = useRef<{
    timestamp: number;
    broadcastPackets: number;
    unicastPackets: number;
    arpRequests: number;
    arpReplies: number;
    totalPackets: number;
  }[]>([]);

  // Track previous metric for rate calculations
  const prevMetricsRef = useRef<{
    timestamp: number;
    arpRequests: number;
    packets: number;
    broadcastPackets: number;
    unicastPackets: number;
  } | null>(null);

  const prevDataRef = useRef<{
    timestamp: number;
    dataSent: number;
    dataReceived: number;
  } | null>(null);

  // Track previous ARP for rate calculation
  const prevArpRef = useRef<{
    arpRequests: number;
    timestamp: number;
  } | null>(null);

  const trafficHistoryRef = useRef<TrafficDataPoint[]>([]);
  const protocolPpsHistoryRef = useRef<ProtocolPpsPoint[]>([]);
  const prevProtocolTotalsRef = useRef<{
    timestamp: number;
    ipPackets: number;
    tcpPackets: number;
    icmpPackets: number;
    udpPackets: number;
    dnsQueries: number;
    dhcpPackets: number;
  } | null>(null);
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
      },

      // Add this card to the returned array in calculateMetricsCards:
      {
        title: 'Data Transfer Rate',
        value: `${formatDataRate(currentDataRate)}/s`,
        description: 'Current network throughput',
        icon: undefined,
        trend: currentDataRate > 1000000 ? 'up' : currentDataRate < 100000 ? 'down' : 'stable',
        trendValue: currentDataRate > 1000000 ? 'High bandwidth' :
          currentDataRate < 100000 ? 'Low bandwidth' : 'Normal'
      }
    ];
  }, []);

  // Update traffic history with new data point
  const updateTrafficHistory = useCallback((dataPoint: TrafficDataPoint) => {
    trafficHistoryRef.current = [...trafficHistoryRef.current, dataPoint].slice(-maxHistoryPoints);
    setTrafficData(trafficHistoryRef.current);
  }, [maxHistoryPoints]);

  const updateProtocolPpsHistory = useCallback((dataPoint: ProtocolPpsPoint) => {
    protocolPpsHistoryRef.current = [...protocolPpsHistoryRef.current, dataPoint].slice(-maxHistoryPoints);
    setProtocolPpsData(protocolPpsHistoryRef.current);
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

        setDevices((prev: any) => {
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
        const metricTime = safeTimestampMs(m.measure_time, data.event?.meta?.timestamp, Date.now());
        const metricTimeLabel = new Date(metricTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log("Received metric event:", m.measure_time, data.event.meta.timestamp, metricTime);
        setMeasureTimestamp(metricTime);

        const networkMetrics: NetworkMetrics = {
          totalDevices: getMetricValue(m, ['total_devices', 'totalDevices']),
          activeDevices: getMetricValue(m, ['active_devices', 'activeDevices']),
          dataSent: getMetricValue(m, ['data_sent', 'dataSent']),
          dataReceived: getMetricValue(m, ['data_received', 'dataReceived']),
          broadcastPackets: getMetricValue(m, ['total_broadcast_packets', 'broadcast_packets', 'totalBroadcastPackets', 'broadcastPackets']),
          unicastPackets: getMetricValue(m, ['total_unicast_packets', 'unicast_packets', 'totalUnicastPackets', 'unicastPackets']),
          arpRequests: getMetricValue(m, ['arp_requests', 'total_arp_requests', 'arpRequests', 'totalArpRequests']),
          arpReplies: getMetricValue(m, ['arp_replies', 'total_arp_replies', 'arpReplies', 'totalArpReplies']),
          tcpPackets: getMetricValue(m, ['tcp_packets', 'total_tcp_packets', 'tcpPackets', 'totalTcpPackets']),
          udpPackets: getMetricValue(m, ['udp_packets', 'total_udp_packets', 'udpPackets', 'totalUdpPackets']),
          icmpPackets: getMetricValue(m, ['icmp_packets', 'total_icmp_packets', 'icmpPackets', 'totalIcmpPackets']),
          ipPackets: getMetricValue(m, ['ip_packets', 'total_ip_packets', 'ipPackets', 'totalIpPackets']),
          dnsQueries: getMetricValue(m, ['dns_queries', 'total_dns_queries', 'dnsQueries', 'totalDnsQueries']),
          dhcpPackets: getMetricValue(m, ['dhcp_packets', 'total_dhcp_packets', 'dhcpPackets', 'totalDhcpPackets']),
          httpRequests: getMetricValue(m, ['http_requests', 'total_http_requests', 'httpRequests', 'totalHttpRequests']),
          tlsHandshakes: getMetricValue(m, ['tls_handshakes', 'total_tls_handshakes', 'tlsHandshakes', 'totalTlsHandshakes'])
        };

        setMetricSnapshot(networkMetrics);

        let ipPacketsPerSecond = 0;
        let tcpPacketsPerSecond = 0;
        let icmpPacketsPerSecond = 0;
        let udpPacketsPerSecond = 0;
        let dnsQueriesPerSecond = 0;
        let dhcpPacketsPerSecond = 0;

        let protocolTimestamp = metricTime;
        if (prevProtocolTotalsRef.current && protocolTimestamp <= prevProtocolTotalsRef.current.timestamp) {
          protocolTimestamp = Date.now();
        }

        if (prevProtocolTotalsRef.current) {
          const protocolTimeDiffSec = normalizeElapsedSeconds(
            (protocolTimestamp - prevProtocolTotalsRef.current.timestamp) / 1000
          );

          ipPacketsPerSecond = calculateRatePerSecond(
            networkMetrics.ipPackets,
            prevProtocolTotalsRef.current.ipPackets,
            protocolTimeDiffSec
          );
          tcpPacketsPerSecond = calculateRatePerSecond(
            networkMetrics.tcpPackets,
            prevProtocolTotalsRef.current.tcpPackets,
            protocolTimeDiffSec
          );
          icmpPacketsPerSecond = calculateRatePerSecond(
            networkMetrics.icmpPackets,
            prevProtocolTotalsRef.current.icmpPackets,
            protocolTimeDiffSec
          );
          udpPacketsPerSecond = calculateRatePerSecond(
            networkMetrics.udpPackets,
            prevProtocolTotalsRef.current.udpPackets,
            protocolTimeDiffSec
          );
          dnsQueriesPerSecond = calculateRatePerSecond(
            networkMetrics.dnsQueries,
            prevProtocolTotalsRef.current.dnsQueries,
            protocolTimeDiffSec
          );
          dhcpPacketsPerSecond = calculateRatePerSecond(
            networkMetrics.dhcpPackets,
            prevProtocolTotalsRef.current.dhcpPackets,
            protocolTimeDiffSec
          );
        }

        prevProtocolTotalsRef.current = {
          timestamp: protocolTimestamp,
          ipPackets: networkMetrics.ipPackets,
          tcpPackets: networkMetrics.tcpPackets,
          icmpPackets: networkMetrics.icmpPackets,
          udpPackets: networkMetrics.udpPackets,
          dnsQueries: networkMetrics.dnsQueries,
          dhcpPackets: networkMetrics.dhcpPackets
        };

        updateProtocolPpsHistory({
          time: metricTimeLabel,
          ipPacketsPerSecond,
          tcpPacketsPerSecond,
          icmpPacketsPerSecond,
          udpPacketsPerSecond,
          dnsQueriesPerSecond,
          dhcpPacketsPerSecond
        });

        // Update distribution
        setDistribution({
          broadcast: networkMetrics.broadcastPackets,
          unicast: networkMetrics.unicastPackets
        });

        // Update total devices count
        console.log("Updating active devices count:", m.active_devices);
        setTotalDevicesCount(m.total_devices);
        setActiveDevicesCount(m.active_devices);


        if (data.topology?.devices) {
          const incomingDevices = data.topology.devices.map((d: any) => ({
            id: d.id?.toString() || d.device_id || d.mac_address,
            name: d.name || d.hostname || "Unknown",
            ip: d.ip || d.ip_address || "-",
            device_id: d.device_id || "-",
            vendor: d.vendor || "-",
            type: mapDeviceType(d.type || d.device_type || "unknown"),
            packetsSent: d.data_sent || d.packets_sent || 0,
            packetsReceived: d.data_received || d.packets_received || 0,
            activityLevel: determineActivityLevel(
              d.data_sent || d.packets_sent || 0,
              d.data_received || d.packets_received || 0
            ),
            lastSeen: new Date().toISOString(),
            lastActive: 'Just now'
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



        // Calculate packets per second
        let packetsPerSecond = 0;

        if (prevMetricsRef.current) {
          const rawDiffSec = (metricTime - prevMetricsRef.current.timestamp) / 1000;
          const timeDiffSec = normalizeElapsedSeconds(rawDiffSec);
          const currentTotalPackets = asNumber(m.total_packets ?? m.total_ip_packets ?? m.ip_packets);

          packetsPerSecond = calculateRatePerSecond(
            currentTotalPackets,
            prevMetricsRef.current.packets,
            timeDiffSec
          );

          setCurrentPacketsPerSecond(packetsPerSecond);
        }

        // Calculate data rate
        if (prevDataRef.current) {
          const timeDiffMs = Date.now() - prevDataRef.current.timestamp;
          const timeDiffSec = timeDiffMs / 1000;

          if (timeDiffSec > 0) {
            const dataSentDelta = networkMetrics.dataSent - prevDataRef.current.dataSent;
            const dataReceivedDelta = networkMetrics.dataReceived - prevDataRef.current.dataReceived;
            const totalDataDelta = dataSentDelta + dataReceivedDelta;
            const dataRate = totalDataDelta / timeDiffSec;
            setCurrentDataRate(dataRate);
          }
        }

        // Update prevDataRef
        prevDataRef.current = {
          timestamp: metricTime,
          dataSent: networkMetrics.dataSent,
          dataReceived: networkMetrics.dataReceived
        };

        // Calculate ARP rate
        if (prevArpRef.current) {
          const arpDiffSec = normalizeElapsedSeconds((metricTime - prevArpRef.current.timestamp) / 1000);
          const arpPerSecond = calculateRatePerSecond(
            networkMetrics.arpRequests,
            prevArpRef.current.arpRequests,
            arpDiffSec
          );
          setArpRate(Math.round(arpPerSecond * 60));
        }

        // Update prevArpRef for next calculation
        prevArpRef.current = {
          arpRequests: networkMetrics.arpRequests,
          timestamp: metricTime,
        };

        prevMetricsRef.current = {
          timestamp: metricTime,
          arpRequests: networkMetrics.arpRequests,
          packets: asNumber(m.total_packets ?? m.total_ip_packets ?? m.ip_packets),
          broadcastPackets: networkMetrics.broadcastPackets,
          unicastPackets: networkMetrics.unicastPackets
        };



        // Calculate packet details
        const currentPacketCounts = {
          broadcast: networkMetrics.broadcastPackets,
          unicast: networkMetrics.unicastPackets,
          arpRequests: networkMetrics.arpRequests,
          arpReplies: networkMetrics.arpReplies,
          total: networkMetrics.broadcastPackets + networkMetrics.unicastPackets
        };

        // Get previous packet counts from history
        const lastPacketEntry = packetHistoryRef.current[packetHistoryRef.current.length - 1];
        const previousPacketCounts = lastPacketEntry ? {
          broadcast: lastPacketEntry.broadcastPackets,
          unicast: lastPacketEntry.unicastPackets,
          arpRequests: lastPacketEntry.arpRequests,
          arpReplies: lastPacketEntry.arpReplies,
          total: lastPacketEntry.totalPackets
        } : undefined;

        // Calculate time difference for rates
        const timeDiffSec = prevMetricsRef.current ?
          (metricTime - prevMetricsRef.current.timestamp) / 1000 : 1;

        const newPacketDetails = calculatePacketDetails(
          currentPacketCounts,
          previousPacketCounts,
          timeDiffSec
        );

        setPacketDetails(newPacketDetails);

        // Update packet history
        packetHistoryRef.current = [
          ...packetHistoryRef.current,
          {
            timestamp: metricTime,
            broadcastPackets: networkMetrics.broadcastPackets,
            unicastPackets: networkMetrics.unicastPackets,
            arpRequests: networkMetrics.arpRequests,
            arpReplies: networkMetrics.arpReplies,
            totalPackets: currentPacketCounts.total
          }
        ].slice(-10); // Keep last 10 entries for rate calculations



        // Add traffic data point
        const trafficPoint: TrafficDataPoint = {
          time: metricTimeLabel,
          packets: networkMetrics.broadcastPackets + networkMetrics.unicastPackets,
          arpRequests: networkMetrics.arpRequests,
          arpReplies: networkMetrics.arpReplies
        };
        updateTrafficHistory(trafficPoint);

        // Add metric event
        const metricEvent: ActivityEvent = {
          id: data.event.meta.sequence.toString(),
          type: 'load_change',
          message: `Network load: ${networkMetrics.activeDevices} active devices, ${formatNumber(packetsPerSecond)} pps`,
          timestamp: new Date(data.event.meta.timestamp).toLocaleTimeString()
        };
        setEvents(prev => [metricEvent, ...prev].slice(0, 50));

        setIsLoading(false);
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
  }, [timeRange, updateTrafficHistory, updateProtocolPpsHistory]);

  // Separate effect to update metrics and insights when dependencies change
  useEffect(() => {
    if (devices.length > 0 || distribution.broadcast + distribution.unicast > 0) {
      const networkMetrics: NetworkMetrics = {
        totalDevices: totalDevicesCount,
        activeDevices: activeDevicesCount,
        dataSent: devices.reduce((sum, d) => sum + d.packetsSent, 0),
        dataReceived: devices.reduce((sum, d) => sum + d.packetsReceived, 0),
        broadcastPackets: distribution.broadcast,
        unicastPackets: distribution.unicast,
        arpRequests: trafficData.length > 0 ? trafficData[trafficData.length - 1]?.arpRequests || 0 : 0,
        arpReplies: trafficData.length > 0 ? trafficData[trafficData.length - 1]?.arpReplies || 0 : 0,
        tcpPackets: metricSnapshot?.tcpPackets || 0,
        udpPackets: metricSnapshot?.udpPackets || 0,
        icmpPackets: metricSnapshot?.icmpPackets || 0,
        ipPackets: metricSnapshot?.ipPackets || 0,
        dnsQueries: metricSnapshot?.dnsQueries || 0,
        dhcpPackets: metricSnapshot?.dhcpPackets || 0,
        httpRequests: metricSnapshot?.httpRequests || 0,
        tlsHandshakes: metricSnapshot?.tlsHandshakes || 0
      };

      setMetrics(calculateMetricsCards(
        networkMetrics,
        currentPacketsPerSecond,
        arpRate,
        devices,
        activeDevicesCount
      ));

      setInsights(generateInsights(networkMetrics, devices));
    }
  }, [currentPacketsPerSecond, devices, arpRate, distribution, activeDevicesCount,
    trafficData, totalDevicesCount, calculateMetricsCards, currentDataRate, packetDetails]);

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
    refreshData,
    packetDetails,
    metricSnapshot,
    protocolPpsData,
    measureTimestamp
  };
};