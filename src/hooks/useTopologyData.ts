import { useEffect, useState } from "react";
import { connectWebSocket, disconnectWebSocket } from "@/services/websocket";

export interface Device {
  id: string;
  name: string;
  ip: string;
  mac: string;
  vendor: string;
  type: "laptop" | "mobile" | "printer" | "iot" | "network";
  status: "active" | "idle" | "offline";
  firstSeen: string;
  lastSeen: string;
  activityLevel: "low" | "medium" | "high";
  data_sent: number;
  data_received: number;
  packet_count: number;
  online: boolean;
  
}

export const useTopologyData = (showInactive: boolean) => {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    connectWebSocket((data: any) => {

      // Make sure topology exists
      if (!data.topology?.devices) return;

      let incomingDevices: Device[] = data.topology.devices;

      // Filter inactive if toggle is OFF
      if (!showInactive) {
        incomingDevices = incomingDevices.filter(
          (d) => d.status !== "offline"
        );
      }

      setDevices(incomingDevices);
    });

    return () => {
      disconnectWebSocket();
    };
  }, [showInactive]);

  return { devices };
};