import { mapDevice, mapEvent } from "@/lib/mappers";
import { Activity } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  isWebSocketConnected,
} from "../services/websocket";

export interface Device {
  id: string;
  name: string;
  ip: string;
  mac: string;
  vendor: string;
  os: string;
  type: string;
  status: "active" | "idle" | "offline";
  lastSeen: string;
}

export interface Event {
  id: string;
  type: "join" | "leave" | "reassign" | "inactive" | "metric";
  message: string;
  timestamp: string;
  icon?: React.ReactNode;
  payload?: any;
}

export interface Metrics {
  totalDevices: number;
  activeDevices: number;
  dataSent: number;
  dataReceived: number;
  broadcastPackets: number;
  unicastPackets: number;
  arpRequests: number;
  arpReplies: number;
}

export const useDashboardData = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({
    totalDevices: 0,
    activeDevices: 0,
    dataSent: 0,
    dataReceived: 0,
    broadcastPackets: 0,
    unicastPackets: 0,
    arpRequests: 0,
    arpReplies: 0,
  });

  const [dashboardStats, setDashboardStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    idleDevices: 0,
    newDevicesToday: 0,
  });

  // Track previous metric for ARP rate calculation
  const prevArpRef = useRef<{ arpRequests: number; timestamp: number } | null>(
    null,
  );
  const [arpRate, setArpRate] = useState<number>(0);

  useEffect(() => {
    connectWebSocket((data: any) => {
      setIsConnected(true);
      console.log("Received dashboard data:", data);

      // DEVICE_JOINED
      if (
        data.event?.type === "TOPOLOGY" &&
        data.event?.subtype === "DEVICE_JOINED"
      ) {
        const device = mapDevice(data.event.payload.device);
        const event = mapEvent(data.event);

        setDevices((prev) =>
          prev.some((d) => d.id === device.id)
            ? prev
            : [
                {
                  ...device,
                  status: "active",
                  os: "Unknown",
                  lastSeen: new Date().toISOString(),
                },
                ...prev,
              ],
        );

        setEvents((prev) => [event, ...prev]);
      }

      // DEVICE_LEFT
      if (
        data.event?.type === "TOPOLOGY" &&
        data.event?.subtype === "DEVICE_LEFT"
      ) {
        const deviceId = data.event.payload.device.device_id;
        const event = mapEvent(data.event);

        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId
              ? { ...d, status: "offline", lastSeen: new Date().toISOString() }
              : d,
          ),
        );

        setEvents((prev) => [event, ...prev]);
      }

      // METRIC update
      if (
        data.event?.type === "METRIC" &&
        data.event?.subtype === "PERIODIC_METRIC_STATE"
      ) {
        const m = data.event.payload.metrics;
        const metricTime = new Date(
          m.measure_time || data.event.meta.timestamp,
        ).getTime();

        setMetrics((prevMetrics) => ({
          ...prevMetrics,
          dataSent: m.data_sent,
          dataReceived: m.data_received,
          broadcastPackets: m.total_broadcast_packets,
          unicastPackets: m.total_unicast_packets,
          arpRequests: m.arp_requests,
          arpReplies: m.arp_replies,
        }));

        if (data.topology.devices) {
          const incomingDevices = data.topology.devices.map(
            (d: any) => ({
              id: d.id.toString(),
              name: d.name || "Unknown",
              ip: d.ip || "-",
              device_id: d.device_id || "-",
              vendor: d.vendor || "-",
              type: d.type || "unknown",
              os: d.os || "Unknown",
              status: d.status,
              lastSeen: new Date().toISOString(),
            }),
          );
          setDevices(incomingDevices);
        }

        if (prevArpRef.current) {
          const timeDiffMs =
            new Date().getTime() - new Date(m.measure_time).getTime();
          const timeDiffMins = timeDiffMs / (1000 * 60);
          const rate = timeDiffMins > 0 ? m.arp_requests / timeDiffMins : 0;
          setArpRate(Math.round(rate));
        }

        prevArpRef.current = {
          arpRequests: m.arp_requests,
          timestamp: metricTime,
        };

        const metricEvent: Event = {
          id: data.event.meta.sequence.toString(),
          type: "metric",
          message: `Metrics update: ${m.total_devices} devices, ${m.active_devices} active`,
          timestamp: new Date(data.event.meta.timestamp).toLocaleTimeString(),
          icon: <Activity className="h-4 w-4 text-blue-600" />,
          payload: m,
        };
        setEvents((prev) => [metricEvent, ...prev]);
      }

      if (data.topology.devices) {
        setDashboardStats({
          totalDevices: data.topology.devices.length,
          activeDevices: data.topology.devices.filter((d: any) => d.status === "active").length,
          idleDevices: data.topology.devices.filter((d: any) => d.status === "idle").length,
          newDevicesToday: data.dashboard_stats.new_devices_today,
        });
      }
    });

    return () => disconnectWebSocket();
  }, []);

  // Poll connection status
  useEffect(() => {
    const interval = setInterval(
      () => setIsConnected(isWebSocketConnected()),
      500,
    );
    return () => clearInterval(interval);
  }, []);

  return {
    devices,
    events,
    metrics,
    activeDevices: dashboardStats.activeDevices,
    idleDevices: dashboardStats.idleDevices,
    newDevicesToday: dashboardStats.newDevicesToday,
    isConnected,
    arpRate,
  };
};
