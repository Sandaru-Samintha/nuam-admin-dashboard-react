import { mapDevice, mapEvent } from "@/lib/mappers";
import { Activity } from 'lucide-react';
import React, { useEffect, useRef, useState, type ReactNode } from "react";
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
  type: string;
  status: "active" | "idle";
  lastSeen: string;
}

export interface Event {
  id: string;
  type: "join" | "leave" | "reassign" | "inactive" | "metric";
  message: string;
  timestamp: string;
  icon?: ReactNode;
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

  const prevArpRef = useRef<{ arpRequests: number; timestamp: number } | null>(
    null
  );
  const [arpRate, setArpRate] = useState<number>(0);

  useEffect(() => {
    connectWebSocket((data: any) => {
      setIsConnected(true);

      // DEVICE_JOINED
      if (data.event?.type === "TOPOLOGY" && data.event?.subtype === "DEVICE_JOINED") {
        const device = mapDevice(data.event.payload.device);
        const event = mapEvent(data.event);

        setDevices((prev) =>
          prev.some((d) => d.id === device.id)
            ? prev
            : [
                { ...device, status: "active", lastSeen: new Date().toISOString() },
                ...prev,
              ]
        );

        setEvents((prev) => [event, ...prev]);
      }

      // DEVICE_LEFT
      if (data.event?.type === "TOPOLOGY" && data.event?.subtype === "DEVICE_LEFT") {
        const deviceId = data.event.payload.device.device_id;
        const event = mapEvent(data.event);

        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId
              ? { ...d, status: "idle", lastSeen: new Date().toISOString() }
              : d
          )
        );

        setEvents((prev) => [event, ...prev]);
      }

      // METRIC update
      if (data.event?.type === "METRIC" && data.event?.subtype === "PERIODIC_METRIC_STATE") {
        const m = data.event.payload.metrics;
        const metricTime = new Date(m.measure_time || data.event.meta.timestamp).getTime();

        // Update metrics
        setMetrics({
          totalDevices: m.total_devices,
          activeDevices: m.active_devices,
          dataSent: m.data_sent,
          dataReceived: m.data_received,
          broadcastPackets: m.total_broadcast_packets,
          unicastPackets: m.total_unicast_packets,
          arpRequests: m.arp_requests,
          arpReplies: m.arp_replies,
        });

        if (data.dashboard_stats?.devices) {
          const incomingDevices = data.dashboard_stats.devices.map((d: any) => ({
            id: d.id.toString(),
            name: d.name || "Unknown",
            ip: d.ip || "-",
            device_id: d.device_id || "-",
            vendor: d.vendor || "-",
            type: d.type || "unknown",
            status: d.status,
            lastSeen: new Date().toISOString(),
          }));

          setDevices((prev) => {
            const updated = [...prev];
            incomingDevices.forEach((device: any) => {
              const exists = updated.some((d) => d.id === device.id);
              if (!exists) updated.unshift(device);
            });
            return updated;
          });
        }

        // ARP rate calculation
        if (prevArpRef.current) {
          const timeDiffMs = metricTime - prevArpRef.current.timestamp;
          const timeDiffMins = timeDiffMs / (1000 * 60);
          // compute delta; if counter reset (negative delta) use current count
          let arpDelta = m.arp_requests - prevArpRef.current.arpRequests;
          if (arpDelta < 0) {
            // Counter likely reset on backend restart - fall back to current value
            arpDelta = m.arp_requests;
          }
          const rate = timeDiffMins > 0 ? arpDelta / timeDiffMins : 0;
          setArpRate(Math.round(Math.max(0, rate))); // Ensure non-negative
        } else {
          // On first update we have no baseline. Rate remains 0 until we can compute a delta.
          setArpRate(0);
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
          // ReactNode created without JSX so file can remain .ts
          icon: React.createElement(Activity, { className: "h-4 w-4" }),
          payload: m,
        };
        setEvents((prev) => [metricEvent, ...prev]);
      }

      // Dashboard stats
      if (data.dashboard_stats) {
        setDashboardStats({
          totalDevices: data.dashboard_stats.total_devices,
          activeDevices: data.dashboard_stats.active_devices,
          idleDevices: data.dashboard_stats.idle_devices,
          newDevicesToday: data.dashboard_stats.new_devices_today,
        });
      }
    });

    return () => disconnectWebSocket();
  }, []);

  // Poll connection status
  useEffect(() => {
    const interval = setInterval(() => setIsConnected(isWebSocketConnected()), 500);
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