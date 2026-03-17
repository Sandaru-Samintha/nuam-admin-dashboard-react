import { useState, useEffect, useRef } from "react";

interface NetworkStats {
  available: number;
  base_ip: string;
  conflicts: number;
  inUse: number;
  poolRange: string;
  subnet_mask: string;
  totalIPs: number;
  unauthorized: number;
}
interface InputData {
  ip: string;
  subnet: string;
}


export interface IPAlerts {
  id: string;
  timestamp: string;
  type: "Conflict" | "Spoofing" | "Unauthorized" | "Expired";
  severity: "Low" | "Medium" | "High";
  description: string;
  affectedIPs: string[];
  status: "Active" | "Resolved";
}

export interface IPDevice {
  id: string;
  ipAddress: string;
  macAddress: string;
  deviceName: string;
  hostType: "PC" | "Mobile" | "Server" | "IoT" | "Router" | "Unknown";
  assignedBy: "DHCP" | "Static";
  leaseStatus: "Active" | "Expired" | "Reserved";
  firstSeen: string;
  lastSeen: string;
  riskStatus: "Normal" | "Conflict" | "Unauthorized";
  macVendor?: string;
  connectionDuration?: string;
  userAgent?: string;
}

export function useIpAddressManagement() {
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalIPs: 0,
    inUse: 0,
    available: 0,
    conflicts: 0,
    unauthorized: 0,
    poolRange: "-",
    base_ip: "-",
    subnet_mask: "-",
  });
  const [devices, setDevices] = useState<IPDevice[]>([]);
  const [alerts, setAlerts] = useState<IPAlerts[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only create WebSocket once
    wsRef.current = new WebSocket("ws://localhost:8000/ws/frontend");

    wsRef.current.onopen = () => {
      console.log("IP Address WebSocket Connected");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Subnet update will only send networkStats
        if (data.networkStats || data.ip_address_management?.networkStats) {
          setNetworkStats((prev) => ({
            ...prev,
            ...data.networkStats, ...data.ip_address_management?.networkStats,
          }));
        }

        // Device updates come from device websocket
        if (data.ip_address_management?.devices) {
          setDevices(data.ip_address_management.devices);
        }

        if (data.ip_address_management?.alerts) {
          setAlerts(data.ip_address_management.alerts);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };
    wsRef.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket Closed");
    };

    // Cleanup when unmounting
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  // Inside your hook, below wsRef definition
  const updateNetworkSettings = (subnetMask?: string, deviceIP?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return alert("WebSocket not connected");
    }

    const payload: any = {};

    if (subnetMask) payload.subnetMask = subnetMask.trim();
    if (deviceIP) payload.newDeviceIP = deviceIP.trim();

    if (Object.keys(payload).length === 0) return alert("No data to send");

    wsRef.current.send(JSON.stringify(payload));
  };

  function extractInputData(stats: NetworkStats): InputData {
  return {
    ip: stats.base_ip || "",
    subnet: stats.subnet_mask || ""
  };
}

  return { networkStats, devices, alerts, updateNetworkSettings,extractInputData };
}
