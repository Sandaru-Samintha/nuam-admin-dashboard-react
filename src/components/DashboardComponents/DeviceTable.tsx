import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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

interface DeviceTableProps {
  devices: Device[];
  pageSize?: number;
}

const DeviceTable: React.FC<DeviceTableProps> = ({ devices, pageSize = 8 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(devices.length / pageSize);

  const startIdx = (currentPage - 1) * pageSize;
  const pagedDevices = devices.slice(startIdx, startIdx + pageSize);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Sort active devices first
  const sortedDevices = [...pagedDevices].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "active" ? -1 : 1;
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Connected Devices</CardTitle>
        <CardDescription>
          Currently monitored devices on the network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Device Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  IP Address
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  MAC Address
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Vendor
                </th>
                {/* <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Type
                </th> */}
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  OS
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDevices.map((device) => (
                <tr
                  key={device.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">
                    {device.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 font-mono">
                    {device.ip}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 font-mono">
                    {device.id}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {device.vendor}
                  </td>
                  {/* <td className="py-3 px-4 text-sm text-slate-600">
                    {device.type}
<<<<<<< Updated upstream
=======
                  </td> */}
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {device.os}
>>>>>>> Stashed changes
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {device.os}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        device.status === "active" ? "default" : "secondary"
                      }
                      className={
                        device.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }
                    >
                      {device.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500">
                    {device.lastSeen
                      ? new Date(device.lastSeen).toLocaleTimeString()
                      : "-"}
                  </td>
                </tr>
              ))}
              {sortedDevices.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-4 text-sm text-slate-500"
                  >
                    No devices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between mt-4 items-center">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Showing {startIdx + 1}-
              {Math.min(startIdx + pageSize, devices.length)} of{" "}
              {devices.length} devices
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceTable;
