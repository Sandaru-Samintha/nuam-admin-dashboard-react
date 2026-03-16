import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, Cpu, Laptop, Printer, Server, Smartphone } from 'lucide-react';
import React, { useState } from 'react';

interface DeviceActivity {
  id: string;
  name: string;
  ip: string;
  type: 'laptop' | 'mobile' | 'printer' | 'iot' | 'network';
  packetsSent: number;
  packetsReceived: number;
  activityLevel: 'low' | 'medium' | 'high';
  lastActive: string;
}

interface DeviceActivityTableProps {
  devices: DeviceActivity[];
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const getDeviceIcon = (type: DeviceActivity['type'], className?: string) => {
  const icons = {
    laptop: <Laptop className={className} />,
    mobile: <Smartphone className={className} />,
    printer: <Printer className={className} />,
    iot: <Cpu className={className} />,
    network: <Server className={className} />
  };
  return icons[type] || <Server className={className} />;
};

const DeviceActivityTable: React.FC<DeviceActivityTableProps> = ({ devices }) => {
  const [sortField, setSortField] = useState<'packetsSent' | 'packetsReceived' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedDevices = [...devices].sort((a, b) => {
    if (!sortField) return 0;
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (a[sortField] - b[sortField]) * multiplier;
  });

  const handleSort = (field: 'packetsSent' | 'packetsReceived') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Activity</CardTitle>
        <CardDescription>Network traffic by device</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Device</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">IP Address</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  <button 
                    className="flex items-center gap-1 hover:text-slate-900"
                    onClick={() => handleSort('packetsSent')}
                  >
                    Packets Sent
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  <button 
                    className="flex items-center gap-1 hover:text-slate-900"
                    onClick={() => handleSort('packetsReceived')}
                  >
                    Packets Received
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Activity Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {sortedDevices.map((device) => (
                <tr 
                  key={device.id} 
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.type, 'h-4 w-4 text-slate-600')}
                      <span className="text-sm font-medium text-slate-900">{device.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 font-mono">{device.ip}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 capitalize">{device.type}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 font-medium">{formatNumber(device.packetsSent)}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 font-medium">{formatNumber(device.packetsReceived)}</td>
                  <td className="py-3 px-4">
                    <Badge 
                      variant="outline"
                      className={
                        device.activityLevel === 'high'
                          ? 'border-green-300 text-green-700 bg-green-50'
                          : device.activityLevel === 'medium'
                          ? 'border-blue-300 text-blue-700 bg-blue-50'
                          : 'border-slate-300 text-slate-700 bg-slate-50'
                      }
                    >
                      {device.activityLevel}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500">{device.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceActivityTable;