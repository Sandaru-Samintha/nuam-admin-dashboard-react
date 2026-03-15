import React, { useState, useRef, useEffect } from "react";
import {
  RefreshCw,
  Laptop,
  Smartphone,
  Printer,
  Cpu,
  Server,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Wifi,
  Circle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import RealtimeDataDialog from "@/components/topology/RealtimeDataDialog";
import { useTopologyData } from "@/hooks/useTopologyData";

interface Device {
  device_id: string;
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
  os: string;
  data_sent: number;
  data_received: number;
  packet_count: number;
  online: boolean;
  x?: number;
  y?: number;
}

interface NetworkSwitch {
  id: string;
  name: string;
  status: "healthy" | "warning" | "error";
  x: number;
  y: number;
}

const mockSwitch: NetworkSwitch = {
  id: "switch-1",
  name: "Core Switch",
  status: "healthy",
  x: 400,
  y: 300,
};



const calculateDevicePositions = (
  devices: Device[],
  centerX: number,
  centerY: number,
  radius: number,
): Device[] => {
  return devices.map((device, index) => {
    const angle = (index / devices.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...device,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
};

const DeviceIcon: React.FC<{ type: Device["type"]; className?: string }> = ({
  type,
  className = "h-6 w-6",
}) => {
  const icons = {
    laptop: <Laptop className={className} />,
    mobile: <Smartphone className={className} />,
    printer: <Printer className={className} />,
    iot: <Cpu className={className} />,
    network: <Server className={className} />,
  };
  return icons[type] || <Server className={className} />;
};

const getStatusColor = (status: Device["status"]) => {
  switch (status) {
    case "active":
      return "#22c55e";
    case "idle":
      return "#eab308";
    case "offline":
      return "#94a3b8";
    default:
      return "#94a3b8";
  }
};

const SwitchNode: React.FC<{ switch_: NetworkSwitch }> = ({ switch_ }) => (
  <g>
    <circle
      cx={switch_.x}
      cy={switch_.y}
      r={40}
      fill="#0f172a"
      stroke={switch_.status === "healthy" ? "#22c55e" : "#eab308"}
      strokeWidth={3}
    />
    <foreignObject x={switch_.x - 20} y={switch_.y - 20} width={40} height={40}>
      <div className="flex items-center justify-center h-full">
        <Server className="h-8 w-8 text-slate-100" />
      </div>
    </foreignObject>
    <text
      x={switch_.x}
      y={switch_.y + 60}
      textAnchor="middle"
      className="text-sm font-semibold fill-slate-700"
    >
      {switch_.name}
    </text>
    <foreignObject x={switch_.x - 30} y={switch_.y + 70} width={60} height={20}>
      <div className="flex justify-center">
        <Badge className="bg-green-100 text-green-800 text-xs">
          {/* {switch_.status} */}
        </Badge>
      </div>
    </foreignObject>
  </g>
);

const DeviceNode: React.FC<{
  device: Device;
  onClick: () => void;
  isSelected: boolean;
}> = ({ device, onClick, isSelected }) => {
  if (!device.x || !device.y) return null;

  const statusColor = getStatusColor(device.status);

  return (
    <g onClick={onClick} className="cursor-pointer">
      <circle
        cx={device.x}
        cy={device.y}
        r={isSelected ? 35 : 30}
        fill="white"
        stroke={isSelected ? "#3b82f6" : statusColor}
        strokeWidth={isSelected ? 3 : 2}
        className="transition-all"
      />
      <circle cx={device.x + 18} cy={device.y - 18} r={6} fill={statusColor} />
      <foreignObject x={device.x - 15} y={device.y - 15} width={30} height={30}>
        <div className="flex items-center justify-center h-full">
          <DeviceIcon type={device.type} className="h-5 w-5 text-slate-700" />
        </div>
      </foreignObject>
      <text
        x={device.x}
        y={device.y + 45}
        textAnchor="middle"
        className="text-xs font-medium fill-slate-700"
      >
        {device.name.length > 15
          ? device.name.substring(0, 15) + "..."
          : device.name}
      </text>
      <text
        x={device.x}
        y={device.y + 60}
        textAnchor="middle"
        className="text-xs fill-slate-500 font-mono"
      >
        {device.ip}
      </text>
    </g>
  );
};

const ConnectionLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  activityLevel: Device["activityLevel"];
}> = ({ x1, y1, x2, y2, activityLevel }) => {
  const strokeWidth =
    activityLevel === "high" ? 5 : activityLevel === "medium" ? 4 : 3;
  const opacity = 1.0; // activityLevel === 'high' ? 0.8 : activityLevel === 'medium' ? 0.5 : 0.3;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={
        activityLevel === "high"
          ? "#cd0000d5"
          : activityLevel === "medium"
            ? "#00cd1fae"
            : "#232ec6d2"
      }
      strokeWidth={strokeWidth}
      opacity={opacity}
      strokeDasharray={"none"}
    />
  );
};

const DeviceDetailsPanel: React.FC<{
  device: Device | null;
  onClose: () => void;
}> = ({ device, onClose }) => {
  if (!device) return null;

  return (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DeviceIcon type={device.type} className="h-5 w-5 text-slate-700" />
            <CardTitle className="text-lg">{device.name}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        <CardDescription>Device Information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-slate-500">Status</Label>
            <div className="mt-1">
              <Badge
                className={
                  device.status === "active"
                    ? "bg-green-100 text-green-800"
                    : device.status === "idle"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-slate-100 text-slate-600"
                }
              >
                {device.status}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs text-slate-500">IP Address</Label>
            <p className="text-sm font-mono text-slate-900 mt-1">{device.ip}</p>
          </div>

          <div>
            <Label className="text-xs text-slate-500">MAC Address</Label>
            <p className="text-sm font-mono text-slate-900 mt-1">
              {device.device_id}
            </p>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Vendor</Label>
            <p className="text-sm text-slate-900 mt-1">{device.vendor}</p>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Device Type</Label>
            <p className="text-sm text-slate-900 mt-1 capitalize">
              {device.type}
            </p>
          </div>

          <Separator />

          <div>
            <Label className="text-xs text-slate-500">Activity Level</Label>
            <div className="mt-1">
              <Badge
                variant="outline"
                className={
                  device.activityLevel === "high"
                    ? "border-green-300 text-red-700"
                    : device.activityLevel === "medium"
                      ? "border-blue-300 text-green-700"
                      : "border-slate-300 text-blue-700"
                }
              >
                {device.activityLevel}
              </Badge>
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Data Sent</Label>
            <p className="text-sm font-mono text-slate-900 mt-1">
              {device.data_sent} bytes
            </p>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Data Received</Label>
            <p className="text-sm font-mono text-slate-900 mt-1">
              {device.data_received} bytes
            </p>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Packet Count</Label>
            <p className="text-sm font-mono text-slate-900 mt-1">
              {device.packet_count}
            </p>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Online</Label>
            <p className="text-sm text-slate-900 mt-1">
              {device.online ? "Connected" : "Disconnected"}
            </p>
          </div>

          <Separator />

          <div>
            <Label className="text-xs text-slate-500">First Seen</Label>
            <p className="text-sm text-slate-900 mt-1">{device.firstSeen}</p>
          </div>

          <div>
            <Label className="text-xs text-slate-500">Last Seen</Label>
            <p className="text-sm text-slate-900 mt-1">{device.lastSeen}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TopologyLegend: React.FC = () => (
  <Card className="w-64">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm">Legend</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <Label className="text-xs text-slate-500 mb-2 block">Status</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 fill-green-500 text-green-500" />
            <span className="text-xs text-slate-700">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs text-slate-700">Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 fill-slate-400 text-slate-400" />
            <span className="text-xs text-slate-700">Offline</span>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <Label className="text-xs text-slate-500 mb-2 block">
          Device Types
        </Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-slate-600" />
            <span className="text-xs text-slate-700">Laptop</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-slate-600" />
            <span className="text-xs text-slate-700">Mobile</span>
          </div>
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-slate-600" />
            <span className="text-xs text-slate-700">Printer</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-slate-600" />
            <span className="text-xs text-slate-700">IoT Device</span>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <Label className="text-xs text-slate-500 mb-2 block">
          Connection Activity
        </Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-8 bg-red-700 "></div>
            <span className="text-xs text-slate-700">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-8 bg-green-700 "></div>
            <span className="text-xs text-slate-700">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-8 bg-blue-700"></div>
            <span className="text-xs text-slate-700">Low</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const TopologyCanvas: React.FC<{
  devices: Device[];
  switch_: NetworkSwitch;
  onDeviceClick: (device: Device) => void;
  selectedDeviceId: string | null;
}> = ({ devices, switch_, onDeviceClick, selectedDeviceId }) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleReset = () => setZoom(1);

  return (
    <div className="relative h-full bg-white rounded-lg border border-slate-200">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button size="sm" variant="outline" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={canvasRef}
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        className="w-full h-full"
      >
        <g transform={`scale(${zoom})`} transform-origin="400 300">
          {/* Draw connection lines first (behind nodes) */}
          {devices.map(
            (device) =>
              device.x &&
              device.y && (
                <ConnectionLine
                  key={`line-${device.id}`}
                  x1={switch_.x}
                  y1={switch_.y}
                  x2={device.x}
                  y2={device.y}
                  activityLevel={device.activityLevel}
                />
              ),
          )}

          {/* Draw switch node */}
          <SwitchNode switch_={switch_} />

          {/* Draw device nodes */}
          {devices.map((device) => (
            <DeviceNode
              key={device.id}
              device={device}
              onClick={() => onDeviceClick(device)}
              isSelected={selectedDeviceId === device.id}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

const NetworkTopologyPage: React.FC = () => {
  const [showInactive, setShowInactive] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isRealtimeDialogOpen, setIsRealtimeDialogOpen] = useState(true);
  const { devices: realtimeDevices } = useTopologyData(showInactive);

  const positionedDevices = calculateDevicePositions(
    realtimeDevices,
    400,
    300,
    200
  );

  useEffect(() => {
    console.log("Positioned devices updated:", realtimeDevices);

    if(selectedDevice !== null) {
      const updatedSelected = realtimeDevices.find(d => d.id === selectedDevice.id);
      if(updatedSelected) {
        setSelectedDevice(updatedSelected);
      }
    }

  }, [realtimeDevices]);

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
  };

  return (
    <div className="p-6 space-y-6 h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Network Topology
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Logical view of connected devices
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm text-slate-700">
              Show inactive devices
            </Label>
          </div>

          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main Content Area */}
      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Left: Legend */}
        <div className="flex-shrink-0">
          <TopologyLegend />
        </div>

        {/* Center: Topology Canvas */}
        <div className="flex-1">
          <TopologyCanvas
            devices={positionedDevices}
            switch_={mockSwitch}
            onDeviceClick={handleDeviceClick}
            selectedDeviceId={selectedDevice?.id || null}
          />
        </div>

        {/* Right: Device Details (conditionally shown) */}
        {selectedDevice && (
          <div className="flex-shrink-0">
            <DeviceDetailsPanel
              device={selectedDevice}
              onClose={() => setSelectedDevice(null)}
            />
          </div>
        )}

        <RealtimeDataDialog
          isOpen={isRealtimeDialogOpen && false}
          onClose={() => setIsRealtimeDialogOpen(false)}
          deviceName="Device Name"
          deviceIP="192.168.1.100"
        />
      </div>
    </div>
  );
};

export default NetworkTopologyPage;
