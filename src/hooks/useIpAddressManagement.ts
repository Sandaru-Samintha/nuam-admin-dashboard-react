import { useState, useEffect, useRef  } from "react"

export interface NetworkStats {
  totalIPs: number
  inUse: number
  available: number
  conflicts: number
  unauthorized: number
  poolRange: string
}

export interface IPAlerts {
  id: string
  timestamp: string
  type: "Conflict" | "Spoofing" | "Unauthorized" | "Expired"
  severity: "Low" | "Medium" | "High"
  description: string
  affectedIPs: string[]
  status: "Active" | "Resolved"
}

export interface IPDevice {
  id: string
  ipAddress: string
  macAddress: string
  deviceName: string
  hostType: "PC" | "Mobile" | "Server" | "IoT" | "Router" | "Unknown"
  assignedBy: "DHCP" | "Static"
  leaseStatus: "Active" | "Expired" | "Reserved"
  firstSeen: string
  lastSeen: string
  riskStatus: "Normal" | "Conflict" | "Unauthorized"
  macVendor?: string
  connectionDuration?: string
  userAgent?: string
}

export function useIpAddressManagement() {

  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null)
  const [devices, setDevices] = useState<IPDevice[]>([])
  const [alerts, setAlerts] = useState<IPAlerts[]>([])

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {

     // Only create WebSocket once
    wsRef.current = new WebSocket("ws://localhost:8000/ws/frontend")

    wsRef.current.onopen = () => {
      console.log("IP Address WebSocket Connected")
    }

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)


        // Update state safely inside the callback
        if (data.ip_address_management.networkStats) setNetworkStats(data.ip_address_management.networkStats)
        if (data.ip_address_management.devices) setDevices(data.ip_address_management.devices)
        if (data.ip_address_management.alerts) setAlerts(data.ip_address_management.alerts)
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err)
      }
    }

    wsRef.current.onerror = (error) => {
      console.error("WebSocket Error:", error)
    }

    wsRef.current.onclose = () => {
      console.log("WebSocket Closed")
    }

    // Cleanup when unmounting
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [])

  //Send subnet mask update to backend
  const updateSubnetMask = (subnetMask: string) => {
    if (!subnetMask || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({ subnetMask }))
  }

  return { networkStats, devices, alerts, updateSubnetMask }
}