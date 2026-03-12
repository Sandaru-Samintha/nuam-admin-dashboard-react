// hooks/useNetworkActivityData.ts
import { connectWebSocket, disconnectWebSocket, isWebSocketConnected } from '@/services/websocket';
import { useCallback, useEffect, useRef, useState } from 'react';

// Types for network activity data
export interface NetworkMetrics {
  packets_per_second: number;
  active_devices: number;
  total_devices: number;
  arp_requests_rate: number;
  arp_requests_total: number;
  arp_replies_total: number;
  broadcast_traffic: number;
  unicast_traffic: number;
  broadcast_percentage: number;
  unicast_percentage: number;
  network_load: number;
  data_sent: number;
  data_received: number;
  total_packets: number;
  tcp_packets: number;
  udp_packets: number;
  dns_queries: number;
  dhcp_packets: number;
  packet_rate_history: PacketRateData[];
  arp_history: ARPData[];
  insights: NetworkInsight[];
}

export interface PacketRateData {
  timestamp: string;
  value: number;
  broadcast: number;
  unicast: number;
}

export interface ARPData {
  timestamp: string;
  requests: number;
  replies: number;
}

export interface NetworkInsight {
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description: string;
  timestamp: string;
}

export interface NetworkDevice {
  id: string;
  name: string;
  ip_address: string;
  type: string;
  vendor: string;
  status: string;
  online: boolean;
  packets_sent: number;
  packets_received: number;
  data_sent: number;
  data_received: number;
  activity_level: 'high' | 'medium' | 'low';
  last_active: string;
  first_seen?: string;
}

export interface TimelineEvent {
  timestamp: string;
  device_mac: string;
  device_name: string;
  event: 'device_active' | 'device_offline' | 'device_added' | 'device_removed';
  details: string;
}

export interface NetworkActivityData {
  type: string;
  timestamp: string;
  metrics: NetworkMetrics;
  devices: NetworkDevice[];
  device_count: number;
  active_device_count: number;
  timeline: TimelineEvent[];
  packet_rate_trend: PacketRateData[];
  arp_trend: ARPData[];
}

export interface UseNetworkActivityOptions {
  onMessage?: (data: NetworkActivityData) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface UseNetworkActivityReturn {
  data: NetworkActivityData | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Event | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  requestRefresh: () => void;
  connectionAttempts: number;
  getMetricsSummary: () => MetricsSummary | null;
  getActiveDevices: () => NetworkDevice[];
  getTopTalkers: () => NetworkDevice[];
  getLatestInsights: () => NetworkInsight[];
  formatBytes: (bytes: number) => string;
  formatTimestamp: (timestamp: string) => string;
}

export interface MetricsSummary {
  avgPacketRate: number;
  maxPacketRate: number;
  totalDataTransferred: number;
  arpActivity: number;
  protocolDistribution: {
    tcp: number;
    udp: number;
    other: number;
  };
  trafficRatio: {
    broadcast: number;
    unicast: number;
  };
}

export const useNetworkActivityData = (
  options: UseNetworkActivityOptions = {}
): UseNetworkActivityReturn => {
  // State
  const [data, setData] = useState<NetworkActivityData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<Event | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);

  // Refs for accumulated data
  const devicesRef = useRef<NetworkDevice[]>([]);
  const timelineRef = useRef<TimelineEvent[]>([]);
  const metricsRef = useRef<NetworkMetrics | null>(null);
  const packetRateHistoryRef = useRef<PacketRateData[]>([]);
  const arpHistoryRef = useRef<ARPData[]>([]);
  const prevArpRef = useRef<{ arpRequests: number; timestamp: number } | null>(null);

  // Utility functions
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatTimestamp = useCallback((timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHr < 24) return `${diffHr} hours ago`;
    if (diffDay < 7) return `${diffDay} days ago`;
    
    return date.toLocaleDateString();
  }, []);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((wsData: any) => {
    setIsConnected(true);

    // Process topology events
    if (wsData.event?.type === "TOPOLOGY") {
      if (wsData.event?.subtype === "DEVICE_JOINED") {
        const device = wsData.event.payload.device;
        const networkDevice: NetworkDevice = {
          id: device.device_id || device.id,
          name: device.name || "Unknown",
          ip_address: device.ip || "-",
          type: device.type || "unknown",
          vendor: device.vendor || "-",
          status: "active",
          online: true,
          packets_sent: device.packet_count || 0,
          packets_received: 0,
          data_sent: device.data_sent || 0,
          data_received: device.data_received || 0,
          activity_level: device.activity_level || "medium",
          last_active: new Date().toISOString(),
          first_seen: device.first_seen,
        };

        // Update devices
        devicesRef.current = devicesRef.current.filter(d => d.id !== networkDevice.id);
        devicesRef.current.unshift(networkDevice);

        // Add timeline event
        const timelineEvent: TimelineEvent = {
          timestamp: new Date().toISOString(),
          device_mac: device.mac || device.device_id,
          device_name: device.name || "Unknown",
          event: 'device_added',
          details: `${device.name || "Unknown"} joined the network`,
        };
        timelineRef.current.unshift(timelineEvent);

      } else if (wsData.event?.subtype === "DEVICE_LEFT") {
        const deviceId = wsData.event.payload.device.device_id;
        
        // Update device status
        devicesRef.current = devicesRef.current.map(d => 
          d.id === deviceId 
            ? { ...d, online: false, status: "idle", last_active: new Date().toISOString() }
            : d
        );

        // Add timeline event
        const device = devicesRef.current.find(d => d.id === deviceId);
        const timelineEvent: TimelineEvent = {
          timestamp: new Date().toISOString(),
          device_mac: deviceId,
          device_name: device?.name || "Unknown",
          event: 'device_offline',
          details: `${device?.name || "Unknown"} went offline`,
        };
        timelineRef.current.unshift(timelineEvent);
      }
    }

    // Process metric updates
    if (wsData.event?.type === "METRIC" && wsData.event?.subtype === "PERIODIC_METRIC_STATE") {
      const m = wsData.event.payload.metrics;
      const timestamp = new Date(m.measure_time || wsData.event.meta.timestamp).toISOString();

      // Calculate ARP rate using the same delta-based logic as dashboard
      let arpRate = 0;
      const metricTime = new Date(m.measure_time || wsData.event.meta.timestamp).getTime();
      if (prevArpRef.current) {
        const timeDiffMs = metricTime - prevArpRef.current.timestamp;
        const timeDiffMins = timeDiffMs / (1000 * 60);
        let arpDelta = m.arp_requests - prevArpRef.current.arpRequests;
        if (arpDelta < 0) {
          // handle counter reset
          arpDelta = m.arp_requests;
        }
        arpRate = timeDiffMins > 0 ? arpDelta / timeDiffMins : 0;
      }
      prevArpRef.current = {
        arpRequests: m.arp_requests,
        timestamp: metricTime,
      };

      // Update packet rate history
      const packetRateData: PacketRateData = {
        timestamp,
        value: m.packets_per_second || 0,
        broadcast: m.broadcast_packets || 0,
        unicast: m.unicast_packets || 0,
      };
      packetRateHistoryRef.current.push(packetRateData);
      if (packetRateHistoryRef.current.length > 100) {
        packetRateHistoryRef.current.shift();
      }

      // Update ARP history
      const arpData: ARPData = {
        timestamp,
        requests: m.arp_requests || 0,
        replies: m.arp_replies || 0,
      };
      arpHistoryRef.current.push(arpData);
      if (arpHistoryRef.current.length > 100) {
        arpHistoryRef.current.shift();
      }

      // Update metrics
      const networkMetrics: NetworkMetrics = {
        packets_per_second: m.packets_per_second || 0,
        active_devices: m.active_devices || 0,
        total_devices: m.total_devices || 0,
        arp_requests_rate: arpRate,
        arp_requests_total: m.arp_requests || 0,
        arp_replies_total: m.arp_replies || 0,
        broadcast_traffic: m.total_broadcast_packets || 0,
        unicast_traffic: m.total_unicast_packets || 0,
        // calculate percentages even when one side is zero
        broadcast_percentage: (() => {
          const total = (m.total_broadcast_packets || 0) + (m.total_unicast_packets || 0);
          return total > 0 ? ((m.total_broadcast_packets || 0) / total) * 100 : 0;
        })(),
        unicast_percentage: (() => {
          const total = (m.total_broadcast_packets || 0) + (m.total_unicast_packets || 0);
          return total > 0 ? ((m.total_unicast_packets || 0) / total) * 100 : 0;
        })(),
        network_load: m.data_sent + m.data_received || 0,
        data_sent: m.data_sent || 0,
        data_received: m.data_received || 0,
        total_packets: m.total_packets || 0,
        tcp_packets: m.tcp_packets || 0,
        udp_packets: m.udp_packets || 0,
        dns_queries: m.dns_queries || 0,
        dhcp_packets: m.dhcp_packets || 0,
        packet_rate_history: packetRateHistoryRef.current,
        arp_history: arpHistoryRef.current,
        insights: [], // Could be populated from backend data
      };
      metricsRef.current = networkMetrics;

      // Add metric timeline event
      const timelineEvent: TimelineEvent = {
        timestamp,
        device_mac: "",
        device_name: "System",
        event: 'device_active',
        details: `Metrics update: ${m.total_devices} devices, ${m.active_devices} active`,
      };
      timelineRef.current.unshift(timelineEvent);
    }

    // Process dashboard stats for device updates
    if (wsData.dashboard_stats?.devices) {
      const incomingDevices = wsData.dashboard_stats.devices.map((d: any) => ({
        id: d.id.toString(),
        name: d.name || "Unknown",
        ip_address: d.ip || "-",
        type: d.type || "unknown",
        vendor: d.vendor || "-",
        status: d.status,
        online: d.status === "active",
        packets_sent: d.packet_count || 0,
        packets_received: 0,
        data_sent: d.data_sent || 0,
        data_received: d.data_received || 0,
        activity_level: d.activity_level || "medium",
        last_active: new Date().toISOString(),
        first_seen: d.first_seen,
      }));

      // Merge with existing devices
      incomingDevices.forEach((device: any) => {
        const existingIndex = devicesRef.current.findIndex(d => d.id === device.id);
        if (existingIndex >= 0) {
          devicesRef.current[existingIndex] = { ...devicesRef.current[existingIndex], ...device };
        } else {
          devicesRef.current.unshift(device);
        }
      });
    }

    // Update the data state
    const networkActivityData: NetworkActivityData = {
      type: "network_activity",
      timestamp: new Date().toISOString(),
      metrics: metricsRef.current || {
        packets_per_second: 0,
        active_devices: 0,
        total_devices: 0,
        arp_requests_rate: 0,
        arp_requests_total: 0,
        arp_replies_total: 0,
        broadcast_traffic: 0,
        unicast_traffic: 0,
        broadcast_percentage: 0,
        unicast_percentage: 0,
        network_load: 0,
        data_sent: 0,
        data_received: 0,
        total_packets: 0,
        tcp_packets: 0,
        udp_packets: 0,
        dns_queries: 0,
        dhcp_packets: 0,
        packet_rate_history: [],
        arp_history: [],
        insights: [],
      },
      devices: devicesRef.current,
      device_count: devicesRef.current.length,
      active_device_count: devicesRef.current.filter(d => d.online).length,
      timeline: timelineRef.current.slice(0, 50), // Keep last 50 events
      packet_rate_trend: packetRateHistoryRef.current,
      arp_trend: arpHistoryRef.current,
    };

    setData(networkActivityData);

    // Call custom onMessage handler if provided
    if (options.onMessage) {
      options.onMessage(networkActivityData);
    }
  }, [options.onMessage]);

  // Connect WebSocket
  const connect = useCallback(() => {
    setIsConnecting(true);
    setError(null);

    connectWebSocket(handleWebSocketMessage);

    // Set connected after a short delay to allow connection
    setTimeout(() => {
      setIsConnected(isWebSocketConnected());
      setIsConnecting(false);
    }, 1000);

    if (options.onConnect) {
      options.onConnect();
    }
  }, [handleWebSocketMessage, options]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    disconnectWebSocket();
    setIsConnected(false);
    setIsConnecting(false);

    if (options.onDisconnect) {
      options.onDisconnect();
    }
  }, [options]);

  // Send message
  const sendMessage = useCallback((message: string) => {
    // The websocket service doesn't expose send, so this is a no-op for now
    console.log('Send message not implemented:', message);
  }, []);

  // Request refresh
  const requestRefresh = useCallback(() => {
    // Could send a refresh message if the backend supports it
    console.log('Request refresh');
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Retry connection if it fails
    const retryInterval = setInterval(() => {
      if (!isWebSocketConnected()) {
        setConnectionAttempts(prev => prev + 1);
        connect();
      }
    }, 5000); // Retry every 5 seconds

    return () => {
      clearInterval(retryInterval);
      disconnect();
    };
  }, [connect, disconnect]);

  // Poll connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(isWebSocketConnected());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Get metrics summary
  const getMetricsSummary = useCallback((): MetricsSummary | null => {
    if (!data?.metrics) return null;

    const { metrics } = data;
    const packetRates = metrics.packet_rate_history?.map(p => p.value) || [];
    const avgPacketRate = packetRates.length > 0
      ? packetRates.reduce((a, b) => a + b, 0) / packetRates.length
      : 0;

    return {
      avgPacketRate: Math.round(avgPacketRate * 100) / 100,
      maxPacketRate: Math.max(...packetRates, 0),
      totalDataTransferred: (metrics.data_sent || 0) + (metrics.data_received || 0),
      arpActivity: (metrics.arp_requests_total || 0) + (metrics.arp_replies_total || 0),
      protocolDistribution: {
        tcp: metrics.tcp_packets || 0,
        udp: metrics.udp_packets || 0,
        other: (metrics.total_packets || 0) - (metrics.tcp_packets || 0) - (metrics.udp_packets || 0),
      },
      trafficRatio: {
        broadcast: metrics.broadcast_percentage || 0,
        unicast: metrics.unicast_percentage || 0,
      },
    };
  }, [data]);

  // Get active devices
  const getActiveDevices = useCallback((): NetworkDevice[] => {
    if (!data?.devices) return [];
    return data.devices.filter(device => device.online);
  }, [data]);

  // Get top talkers (most active devices)
  const getTopTalkers = useCallback((): NetworkDevice[] => {
    if (!data?.devices) return [];
    return [...data.devices]
      .sort((a, b) => (b.packets_sent + b.packets_received) - (a.packets_sent + a.packets_received))
      .slice(0, 5);
  }, [data]);

  // Get latest insights
  const getLatestInsights = useCallback((): NetworkInsight[] => {
    if (!data?.metrics?.insights) return [];
    return data.metrics.insights.slice(0, 5);
  }, [data]);

  return {
    data,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    requestRefresh,
    connectionAttempts,
    getMetricsSummary,
    getActiveDevices,
    getTopTalkers,
    getLatestInsights,
    formatBytes,
    formatTimestamp,
  };
};