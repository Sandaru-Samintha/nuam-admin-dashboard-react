<<<<<<< Updated upstream
import React, { useState, useMemo } from 'react';
=======
import React, { useState, useMemo, useEffect } from "react";
>>>>>>> Stashed changes
import {
  Search,
  RefreshCw,
  Plus,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Filter,
  ChevronDown,
  MoreVertical,
  Eye,
  Lock,
  Unlock,
  TrendingUp,
  MapPin,
  Info,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<<<<<<< Updated upstream
=======
import { useIpAddressManagement } from "@/hooks/useIpAddressManagement";

>>>>>>> Stashed changes
// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface IPDevice {
  id: string;
  ipAddress: string;
  macAddress: string;
  deviceName: string;
  hostType: "PC" | "Mobile" | "Server" | "IoT" | "Router" | "Unknown";
  assignedBy: "DHCP" | "Static";
  leaseStatus: "Active" | "Idle" | "Offline";
  firstSeen: string;
  lastSeen: string;
  riskStatus: "Normal" | "Conflict" | "Unauthorized";
  macVendor?: string;
  connectionDuration?: string;
  userAgent?: string;
}

interface IPAlert {
  id: string;
  timestamp: string;
  type: "Conflict" | "Spoofing" | "Unauthorized" | "Expired";
  severity: "Low" | "Medium" | "High";
  description: string;
  affectedIPs: string[];
  status: "Active" | "Resolved";
}

interface NetworkStats {
  totalIPs: number;
  inUse: number;
  available: number;
  conflicts: number;
  unauthorized: number;
  poolRange: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

// const mockDevices: IPDevice[] = [
//   {
//     id: '1',
//     ipAddress: '192.168.1.10',
//     macAddress: '00:1A:2B:3C:4D:5E',
//     deviceName: 'DESKTOP-USER01',
//     hostType: 'PC',
//     assignedBy: 'DHCP',
//     leaseStatus: 'Active',
//     firstSeen: '2026-01-15 08:30',
//     lastSeen: '2026-01-22 14:45',
//     riskStatus: 'Normal',
//     macVendor: 'Intel Corporate',
//     connectionDuration: '7 days 6 hours',
//   },
//   {
//     id: '2',
//     ipAddress: '192.168.1.11',
//     macAddress: '00:1A:2B:3C:4D:5F',
//     deviceName: 'LAPTOP-ADMIN',
//     hostType: 'PC',
//     assignedBy: 'Static',
//     leaseStatus: 'Active',
//     firstSeen: '2026-01-10 09:15',
//     lastSeen: '2026-01-22 15:20',
//     riskStatus: 'Normal',
//     macVendor: 'Apple Inc.',
//     connectionDuration: '12 days 6 hours',
//   },
//   {
//     id: '3',
//     ipAddress: '192.168.1.12',
//     macAddress: '00:1A:2B:3C:4D:60',
//     deviceName: 'IPHONE-USER02',
//     hostType: 'Mobile',
//     assignedBy: 'DHCP',
//     leaseStatus: 'Active',
//     firstSeen: '2026-01-20 10:00',
//     lastSeen: '2026-01-22 15:18',
//     riskStatus: 'Normal',
//     macVendor: 'Apple Inc.',
//     connectionDuration: '2 days 5 hours',
//   },
//   {
//     id: '4',
//     ipAddress: '192.168.1.100',
//     macAddress: '00:1A:2B:3C:4D:61',
//     deviceName: 'SRV-DATABASE',
//     hostType: 'Server',
//     assignedBy: 'Static',
//     leaseStatus: 'Active',
//     firstSeen: '2025-12-01 00:00',
//     lastSeen: '2026-01-22 15:30',
//     riskStatus: 'Normal',
//     macVendor: 'Dell Inc.',
//     connectionDuration: '52 days 15 hours',
//   },
//   {
//     id: '5',
//     ipAddress: '192.168.1.50',
//     macAddress: '00:1A:2B:3C:4D:62',
//     deviceName: 'SmartHome-Hub',
//     hostType: 'IoT',
//     assignedBy: 'DHCP',
//     leaseStatus: 'Active',
//     firstSeen: '2026-01-18 14:20',
//     lastSeen: '2026-01-22 15:25',
//     riskStatus: 'Normal',
//     macVendor: 'Philips Electronics',
//     connectionDuration: '4 days 1 hour',
//   },
//   {
//     id: '6',
//     ipAddress: '192.168.1.20',
//     macAddress: '00:1A:2B:3C:4D:5E', // Duplicate MAC - conflict
//     deviceName: 'UNKNOWN-DEVICE',
//     hostType: 'Unknown',
//     assignedBy: 'DHCP',
//     leaseStatus: 'Active',
//     firstSeen: '2026-01-22 14:00',
//     lastSeen: '2026-01-22 15:30',
//     riskStatus: 'Conflict',
//     macVendor: 'Intel Corporate',
//     connectionDuration: '1 hour 30 minutes',
//   },
//   {
//     id: '7',
//     ipAddress: '192.168.1.99',
//     macAddress: '00:1A:2B:3C:4D:63',
//     deviceName: 'SUSPICIOUS-DEVICE',
//     hostType: 'Unknown',
//     assignedBy: 'DHCP',
//     leaseStatus: 'Active',
//     firstSeen: '2026-01-22 14:15',
//     lastSeen: '2026-01-22 15:22',
//     riskStatus: 'Unauthorized',
//     macVendor: 'Unknown',
//     connectionDuration: '1 hour 7 minutes',
//   },
//   {
//     id: '8',
//     ipAddress: '192.168.1.25',
//     macAddress: '00:1A:2B:3C:4D:64',
//     deviceName: 'PRINTER-OFFICE',
//     hostType: 'IoT',
//     assignedBy: 'Static',
//     leaseStatus: 'Expired',
//     firstSeen: '2026-01-01 08:00',
//     lastSeen: '2026-01-15 10:30',
//     riskStatus: 'Normal',
//     macVendor: 'Xerox Corporation',
//     connectionDuration: '0 minutes',
//   },
// ];

// const mockAlerts: IPAlert[] = [
//   {
//     id: '1',
//     timestamp: '2026-01-22 15:15',
//     type: 'Conflict',
//     severity: 'High',
//     description: 'IP conflict detected between DESKTOP-USER01 and UNKNOWN-DEVICE',
//     affectedIPs: ['192.168.1.10', '192.168.1.20'],
//     status: 'Active',
//   },
//   {
//     id: '2',
//     timestamp: '2026-01-22 14:45',
//     type: 'Unauthorized',
//     severity: 'High',
//     description: 'Unauthorized device detected on network',
//     affectedIPs: ['192.168.1.99'],
//     status: 'Active',
//   },
//   {
//     id: '3',
//     timestamp: '2026-01-22 10:30',
//     type: 'Expired',
//     severity: 'Medium',
//     description: 'DHCP lease expired for PRINTER-OFFICE',
//     affectedIPs: ['192.168.1.25'],
//     status: 'Active',
//   },
// ];

// ============================================================================
// COMPONENT: Network Summary Cards
// ============================================================================

const NetworkSummaryCards: React.FC<{ stats: NetworkStats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total IP Pool */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            IP Pool
          </span>
          <MapPin className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-lg font-bold text-slate-900">
          {stats.poolRange}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Total capacity: {stats.totalIPs}
        </div>
      </div>

      {/* IPs In Use */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            In Use
          </span>
          <Activity className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-lg font-bold text-slate-900">{stats.inUse}</div>
        <div className="text-xs text-gray-500 mt-2">
          {Math.round((stats.inUse / stats.totalIPs) * 100)}% utilization
        </div>
      </div>

      {/* Available IPs */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Available
          </span>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-lg font-bold text-slate-900">
          {stats.available}
        </div>
        <div className="text-xs text-gray-500 mt-2">Ready for assignment</div>
      </div>

      {/* Conflicts */}
      {/* <div className="bg-white border border-yellow-200 rounded-lg p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Conflicts
          </span>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </div>
        <div className="text-lg font-bold text-yellow-600">{stats.conflicts}</div>
        <div className="text-xs text-yellow-600 mt-2">Requires attention</div>
      </div> */}

      {/* Unauthorized */}
      {/* <div className="bg-white border border-red-200 rounded-lg p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Unauthorized
          </span>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </div>
        <div className="text-lg font-bold text-red-600">{stats.unauthorized}</div>
        <div className="text-xs text-red-600 mt-2">Security risk</div>
      </div> */}
    </div>
  );
};

// ============================================================================
// COMPONENT: IP Utilization Bar
// ============================================================================

const IPUtilizationBar: React.FC<{ stats: NetworkStats }> = ({ stats }) => {
  const percentage = (stats.inUse / stats.totalIPs) * 100;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            IP Range Utilization
          </h3>
          <p className="text-xs text-gray-600">192.168.1.0/24</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-900">{stats.inUse}</div>
          <div className="text-xs text-gray-600">of {stats.totalIPs} IPs</div>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
        <div
          className={`h-full transition-all duration-300 ${
            percentage > 80
              ? "bg-red-500"
              : percentage > 60
                ? "bg-yellow-500"
                : "bg-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-600">
          {percentage.toFixed(1)}% utilization
        </span>
        <span className="text-xs font-medium text-gray-700">
          {stats.available} available
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: IP Alerts Panel
// ============================================================================

const IPAlertsPanel: React.FC<{ alerts: IPAlert[] }> = ({ alerts }) => {
  const activeAlerts = alerts.filter((a) => a.status === "Active");

  const severityColor = {
    Low: "text-blue-600 bg-blue-50",
    Medium: "text-yellow-600 bg-yellow-50",
    High: "text-red-600 bg-red-50",
  };

  const severityBorder = {
    Low: "border-l-blue-600",
    Medium: "border-l-yellow-500",
    High: "border-l-red-500",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Active Alerts ({activeAlerts.length})
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {activeAlerts.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No active alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 ${severityBorder[alert.severity]} bg-gray-50`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          severityColor[alert.severity]
                        }`}
                      >
                        {alert.type}
                      </span>
                      <span className="text-xs text-gray-600">
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {alert.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {alert.affectedIPs.map((ip) => (
                        <span
                          key={ip}
                          className="text-xs bg-gray-200 text-slate-900 px-2 py-1 rounded font-mono"
                        >
                          {ip}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="text-xs font-medium text-orange-500 hover:text-orange-400 whitespace-nowrap">
                    Investigate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Device Details Modal
// ============================================================================

interface DeviceDetailsModalProps {
  device: IPDevice | null;
  onClose: () => void;
}

const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  device,
  onClose,
}) => {
  if (!device) return null;

  const riskColor = {
    Normal: "bg-green-50 text-green-700 border-green-300",
    Conflict: "bg-yellow-50 text-yellow-700 border-yellow-300",
    Unauthorized: "bg-red-50 text-red-700 border-red-300",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {device.deviceName}
            </h2>
            <p className="text-sm text-gray-600">{device.ipAddress}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Risk Status */}
          {/* <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Risk Status</h3>
            <div className={`inline-block px-3 py-1 rounded border ${riskColor[device.riskStatus]}`}>
              {device.riskStatus}
            </div>
          </div> */}

          {/* Device Information Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                IP Address
              </p>
              <p className="text-sm font-mono text-slate-900">
                {device.ipAddress}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                MAC Address
              </p>
              <p className="text-sm font-mono text-slate-900">
                {device.macAddress}
              </p>
            </div>
            {/* <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Host Type
              </p>
              <p className="text-sm text-slate-700">{device.hostType}</p>
            </div> */}
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                MAC Vendor
              </p>
              <p className="text-sm text-slate-700">
                {device.macVendor || "Unknown"}
              </p>
            </div>
            {/* <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Assigned By
              </p>
              <p className="text-sm text-slate-700">{device.assignedBy}</p>
            </div> */}
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Lease Status
              </p>
              <p className="text-sm text-slate-700">{device.leaseStatus}</p>
            </div>
          </div>

          {/* Connection Timeline */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Connection Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">First Seen</span>
                <span className="text-sm font-mono text-slate-700">
                  {device.firstSeen}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Seen</span>
                <span className="text-sm font-mono text-slate-700">
                  {device.lastSeen}
                </span>
              </div>
              {/* <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection Duration</span>
                <span className="text-sm font-medium text-slate-700">{device.connectionDuration}</span>
              </div> */}
            </div>
          </div>

          {/* Action Buttons */}
          {/* <div className="border-t border-gray-200 pt-4 flex gap-3">
            <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors">
              Reserve IP
            </button>
            <button className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-slate-900 rounded font-medium text-sm transition-colors border border-gray-300">
              Release IP
            </button>
            <button className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded font-medium text-sm transition-colors border border-red-300">
              Block MAC
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: IP Address Management Page
// ============================================================================

export default function IPAddressManagement() {
<<<<<<< Updated upstream
  const [devices, setDevices] = useState<IPDevice[]>(mockDevices);
=======
  const {
    networkStats,
    devices: wsDevices,
    alerts: wsAlerts,
    updateSubnetMask,
  } = useIpAddressManagement();

  const [subnet, setSubnet] = useState("");

  const [devices, setDevices] = useState<IPDevice[]>([]);
>>>>>>> Stashed changes
  const [selectedDevice, setSelectedDevice] = useState<IPDevice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"All" | "DHCP" | "Static">(
    "All",
  );
  const [filterStatus, setFilterStatus] = useState<
    "All" | "Active" | "Idle" | "Offline"
  >("All");
  const [filterRisk, setFilterRisk] = useState<
    "All" | "Normal" | "Conflict" | "Unauthorized"
  >("All");
  const [sortColumn, setSortColumn] = useState<keyof IPDevice>("ipAddress");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Network stats calculation
<<<<<<< Updated upstream
  const stats: NetworkStats = {
    totalIPs: 254,
    inUse: devices.length,
    available: 254 - devices.length,
    conflicts: devices.filter((d) => d.riskStatus === 'Conflict').length,
    unauthorized: devices.filter((d) => d.riskStatus === 'Unauthorized').length,
    poolRange: '192.168.1.0/24',
  };
=======
  const stats: NetworkStats = networkStats ?? {
    totalIPs: 0,
    inUse: 0,
    available: 0,
    conflicts: 0,
    unauthorized: 0,
    poolRange: "-",
  };

  const handleSubnetUpdate = () => {
    if (subnet.trim() !== "") {
      updateSubnetMask(subnet.trim());
      setSubnet(""); // clear input
    }
  };

  useEffect(() => {
    if (wsDevices) {
      setDevices(wsDevices);
    }
  }, [wsDevices]);
>>>>>>> Stashed changes

  // Filter and search logic
  const filteredDevices = useMemo(() => {
    let filtered = devices.filter((device) => {
      const matchesSearch =
        device.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.macAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.deviceName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "All" || device.assignedBy === filterType;
      const matchesStatus =
        filterStatus === "All" || device.leaseStatus === filterStatus;
      const matchesRisk =
        filterRisk === "All" || device.riskStatus === filterRisk;

      return matchesSearch && matchesType && matchesStatus && matchesRisk;
    });

    // Sorting
    filtered.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal == null || bVal == null) return 0;
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    devices,
    searchTerm,
    filterType,
    filterStatus,
    filterRisk,
    sortColumn,
    sortDirection,
  ]);

  const handleSort = (column: keyof IPDevice) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // const getRiskColor = (risk: string) => {
  //   switch (risk) {
  //     case 'Normal':
  //       return 'bg-green-50 text-green-700 border-green-300';
  //     case 'Conflict':
  //       return 'bg-yellow-50 text-yellow-700 border-yellow-300';
  //     case 'Unauthorized':
  //       return 'bg-red-50 text-red-700 border-red-300';
  //     default:
  //       return 'bg-gray-100 text-gray-600 border-gray-300';
  //   }
  // };

  const getHostTypeIcon = (type: string) => {
    switch (type) {
      case "PC":
        return <Activity className="h-4 w-4" />;
      case "Mobile":
        return <Wifi className="h-4 w-4" />;
      case "Server":
        return <TrendingUp className="h-4 w-4" />;
      case "IoT":
        return <Wifi className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              IP Address Management
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor, manage, and audit IP allocations in the network
            </p>
          </div>
          {/* <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm text-slate-700">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm text-slate-900">
              <Wifi className="h-4 w-4" />
              Scan Network
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm text-white">
              <Plus className="h-4 w-4" />
              Add Reservation
            </button>
          </div> */}
          {/* Subnet Mask Update */}
          <div className="mb-6 flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter subnet mask (e.g. 255.255.255.0)"
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
            />
            <button
              onClick={handleSubnetUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Network Summary Cards */}
      <div className="mb-8">
        <NetworkSummaryCards stats={stats} />
      </div>

      {/* IP Utilization Bar & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <IPUtilizationBar stats={stats} />
        </div>
        <div>
          <IPAlertsPanel alerts={mockAlerts} />
        </div>
      </div>

      {/* IP Address Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Table Header with Filters */}
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              IP Address Inventory
            </h3>
            <span className="text-xs font-medium text-gray-600">
              {filteredDevices.length} device
              {filteredDevices.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search IP, MAC, device name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 placeholder-gray-500"
              />
            </div>

            {/* Filter: Assignment Type */}
            {/* <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
              <SelectTrigger className="border-gray-300 bg-white text-slate-900">
                <SelectValue placeholder="Assignment Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="DHCP">DHCP</SelectItem>
                <SelectItem value="Static">Static</SelectItem>
              </SelectContent>
            </Select> */}

            {/* Filter: Lease Status */}
            <Select
              value={filterStatus}
              onValueChange={(val: any) => setFilterStatus(val)}
            >
              <SelectTrigger className="border-gray-300 bg-white text-slate-900">
                <SelectValue placeholder="Lease Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Idle">Idle</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter: Risk Status */}
            {/* <Select value={filterRisk} onValueChange={(val: any) => setFilterRisk(val)}>
              <SelectTrigger className="border-gray-300 bg-white text-slate-900">
                <SelectValue placeholder="Risk Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="All">All Risks</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Conflict">Conflict</SelectItem>
                <SelectItem value="Unauthorized">Unauthorized</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                {[
                  { key: "ipAddress", label: "IP Address" },
                  { key: "macAddress", label: "MAC Address" },
                  { key: "deviceName", label: "Device Name" },
                  { key: "hostType", label: "Type" },
                  // { key: 'assignedBy', label: 'Assigned By' },
                  { key: "leaseStatus", label: "Status" },
                  // { key: 'riskStatus', label: 'Risk' },
                  { key: "lastSeen", label: "Last Seen" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort(col.key as keyof IPDevice)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {sortColumn === col.key && (
                        <ChevronDown
                          className={`h-3 w-3 text-blue-600 transition-transform ${
                            sortDirection === "desc" ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </th>
                ))}
                {/* <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Actions
                </th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDevices.map((device) => (
                <tr
                  key={device.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedDevice(device)}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-slate-900">
                      {device.ipAddress}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-600">
                      {device.macAddress}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">
                      {device.deviceName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      {getHostTypeIcon(device.hostType)}
                      {device.hostType}
                    </div>
                  </td>
                  {/* <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{device.assignedBy}</span>
                  </td> */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        device.leaseStatus === "Active"
                          ? "bg-green-50 text-green-700"
                          : device.leaseStatus === "Expired"
                            ? "bg-red-50 text-red-700"
                            : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {device.leaseStatus}
                    </span>
                  </td>
                  {/* <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded border ${getRiskColor(
                        device.riskStatus
                      )}`}
                    >
                      {device.riskStatus}
                    </span>
                  </td> */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {device.lastSeen}
                    </span>
                  </td>
                  {/* <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Details Modal */}
      <DeviceDetailsModal
        device={selectedDevice}
        onClose={() => setSelectedDevice(null)}
      />
    </div>
  );
}
