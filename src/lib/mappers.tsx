import { CheckCircle2, LogOut } from "lucide-react";

/* Backend Device → UI Device */
export const mapDevice = (device: any) => ({
  id: device.device_id,
  name: device.hostname ?? "Unknown",
  ip: device.ip_address ?? "—",
  mac: device.mac_address ?? "—",
  vendor: device.vendor ?? "Unknown",
  type: device.device_type ?? "Unknown",
  status: (device.is_active ? "active" : "idle") as "active" | "idle",
  lastSeen: device.last_seen
    ? new Date(device.last_seen).toLocaleTimeString()
    : "—",
});

/* Backend Event → UI Event */
export const mapEvent = (data: any) => {
  const eventSubtype = data.event?.subtype || "UNKNOWN";
  const timestamp = data.meta?.timestamp || data.event?.meta?.timestamp || new Date().toISOString();
  const sequence = data.meta?.sequence || data.event?.meta?.sequence || Date.now();
  
  // Generate unique ID combining sequence and event type
  const uniqueId = `${sequence}-${eventSubtype}-${Date.now()}`;
  
  let type: "join" | "leave" | "reassign" | "inactive" | "metric" = "join";
  let message = "Network event";
  let icon = <CheckCircle2 className="h-4 w-4 text-green-600" />;

  if (data.event?.subtype === "DEVICE_JOINED") {
    type = "join";
    message = `New device connected – ${data.event?.payload?.device?.ip_address || "Unknown IP"}`;
    icon = <CheckCircle2 className="h-4 w-4 text-green-600" />;
  } else if (data.event?.subtype === "DEVICE_LEFT") {
    type = "leave";
    message = `Device disconnected – ${data.event?.payload?.device?.ip_address || "Unknown IP"}`;
    icon = <LogOut className="h-4 w-4 text-red-600" />;
  } else if (eventSubtype === "DEVICE_JOINED") {
    type = "join";
    message = `New device connected – ${data.payload?.device?.ip_address || "Unknown IP"}`;
    icon = <CheckCircle2 className="h-4 w-4 text-green-600" />;
  } else if (eventSubtype === "DEVICE_LEFT") {
    type = "leave";
    message = `Device disconnected – ${data.payload?.device?.ip_address || "Unknown IP"}`;
    icon = <LogOut className="h-4 w-4 text-red-600" />;
  }

  return {
    id: uniqueId,
    type,
    message,
    timestamp: new Date(timestamp).toLocaleTimeString(),
    icon,
  };
};
