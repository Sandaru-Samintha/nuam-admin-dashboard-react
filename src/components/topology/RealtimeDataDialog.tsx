import { Badge } from '@/components/ui/badge';
import {
    Activity,
    Clock,
    Download,
    Eye,
    Globe,
    Network,
    Shield,
    TrendingUp,
    Upload,
    X,
    Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface WebsiteAccess {
  url: string;
  ipAddress: string;
  timestamp: string;
  protocol: string;
  responseTime: number;
  status: number;
}

interface NetworkMetric {
  timestamp: number;
  packetsSent: number;
  packetsReceived: number;
  throughput: number;
}

interface RealtimeDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deviceName?: string;
  deviceIP?: string;
}

const RealtimeDataDialog: React.FC<RealtimeDataDialogProps> = ({
  isOpen,
  onClose,
  deviceName = 'Unknown Device',
  deviceIP = '192.168.1.100',
}) => {
  const [websiteAccesses, setWebsiteAccesses] = useState<WebsiteAccess[]>([]);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetric[]>([]);
  const [stats, setStats] = useState({
    totalDataSent: 0,
    totalDataReceived: 0,
    avgLatency: 0,
    packetLoss: 0,
    currentBandwidth: 0,
  });

  // Simulate real-time data updates
  useEffect(() => {
    if (!isOpen) return;

    const dataInterval = setInterval(() => {
      // Simulate website access data
      const websites = [
        'github.com',
        'stackoverflow.com',
        'npmjs.com',
        'google.com',
        'youtube.com',
        'aws.amazon.com',
        'developer.mozilla.org',
      ];
      const newAccess: WebsiteAccess = {
        url: websites[Math.floor(Math.random() * websites.length)],
        ipAddress: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        timestamp: new Date().toLocaleTimeString(),
        protocol: Math.random() > 0.3 ? 'HTTPS' : 'HTTP',
        responseTime: Math.floor(Math.random() * 500) + 50,
        status: Math.random() > 0.95 ? 404 : 200,
      };

      setWebsiteAccesses((prev) => [newAccess, ...prev.slice(0, 14)]);

      // Simulate network metrics
      const newMetric: NetworkMetric = {
        timestamp: Date.now(),
        packetsSent: Math.floor(Math.random() * 1000) + 100,
        packetsReceived: Math.floor(Math.random() * 1500) + 150,
        throughput: Math.floor(Math.random() * 50) + 10,
      };

      setNetworkMetrics((prev) => [...prev.slice(-59), newMetric]);

      // Update statistics
      setStats((prev) => ({
        totalDataSent: prev.totalDataSent + newMetric.packetsSent * 1.5,
        totalDataReceived: prev.totalDataReceived + newMetric.packetsReceived * 1.2,
        avgLatency: Math.floor(Math.random() * 100) + 20,
        packetLoss: parseFloat((Math.random() * 2).toFixed(2)),
        currentBandwidth: newMetric.throughput,
      }));
    }, 1000);

    return () => clearInterval(dataInterval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="w-screen h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-orange-500" />
                <h1 className="text-2xl font-bold text-slate-900">Network Monitor</h1>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-slate-600">Device:</span>
                <span className="text-sm font-mono text-orange-500 font-semibold">{deviceName}</span>
                <span className="text-slate-400">•</span>
                <span className="text-sm font-mono text-slate-600">{deviceIP}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-200 rounded-lg transition-all duration-200 text-slate-600 hover:text-slate-900"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Data Sent */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 text-sm font-medium uppercase tracking-wide">Data Sent</span>
                <Upload className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{(stats.totalDataSent / 1024).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-2">KB • Real-time</div>
            </div>

            {/* Data Received */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 text-sm font-medium uppercase tracking-wide">Data Received</span>
                <Download className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{(stats.totalDataReceived / 1024).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-2">KB • Real-time</div>
            </div>

            {/* Avg Latency */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 text-sm font-medium uppercase tracking-wide">Avg Latency</span>
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.avgLatency}</div>
              <div className="text-xs text-gray-500 mt-2">ms • Current</div>
            </div>

            {/* Packet Loss */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 text-sm font-medium uppercase tracking-wide">Packet Loss</span>
                <Shield className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.packetLoss}</div>
              <div className="text-xs text-gray-500 mt-2">% • Measured</div>
            </div>

            {/* Bandwidth */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 text-sm font-medium uppercase tracking-wide">Bandwidth</span>
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.currentBandwidth}</div>
              <div className="text-xs text-gray-500 mt-2">Mbps • Current</div>
            </div>
          </div>

          {/* Network Throughput Graph */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-orange-500" />
                <div>
                  <h3 className="text-slate-900 font-semibold">Network Throughput</h3>
                  <p className="text-xs text-gray-600">Real-time bandwidth utilization (60 seconds)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                Live
              </div>
            </div>
            <div className="p-6">
              <div className="w-full h-64 bg-gradient-to-b from-gray-100 to-white rounded-lg border border-gray-200 p-4 relative overflow-hidden">
                {/* Grid lines */}
                <svg className="absolute inset-0 w-full h-full opacity-20">
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="30"
                      patternUnits="userSpaceOnUse"
                    >
                      <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Data visualization */}
                <svg className="absolute inset-0 w-full h-full">
                  <polyline
                    points={networkMetrics
                      .map((metric, idx) => {
                        const x = (idx / Math.max(1, networkMetrics.length - 1)) * 100;
                        const y = 100 - (metric.throughput / 60) * 100;
                        return `${x}%,${y}%`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Axis labels */}
                <div className="absolute bottom-2 left-2 text-xs text-gray-600">0 Mbps</div>
                <div className="absolute top-2 right-2 text-xs text-gray-600">60 Mbps</div>
              </div>
            </div>
          </div>

          {/* Website Access Log */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-orange-500" />
                <div>
                  <h3 className="text-slate-900 font-semibold">Network Activity Log</h3>
                  <p className="text-xs text-gray-600">Real-time HTTP/HTTPS request tracking</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Website
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      IP Address
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Protocol
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Response
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {websiteAccesses.map((access) => (
                    <tr
                      key={`${access.url}-${access.timestamp}`}
                      className="hover:bg-gray-50 transition-colors duration-150 animate-slide-up"
                    >
                      <td className="py-4 px-6 text-sm font-mono text-gray-900">{access.url}</td>
                      <td className="py-4 px-6 text-sm font-mono text-gray-700">{access.ipAddress}</td>
                      <td className="py-4 px-6">
                        <Badge
                          className={
                            access.protocol === 'HTTPS'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }
                        >
                          {access.protocol}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">{access.responseTime} ms</td>
                      <td className="py-4 px-6">
                        <Badge
                          className={
                            access.status === 200
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }
                        >
                          {access.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {access.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Network Configuration & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Network Configuration */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Network className="h-5 w-5 text-orange-500" />
                  <h3 className="text-slate-900 font-semibold">Network Configuration</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">IP Address</span>
                  <span className="font-mono text-slate-900">{deviceIP}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Subnet Mask</span>
                  <span className="font-mono text-slate-900">255.255.255.0</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Gateway</span>
                  <span className="font-mono text-slate-900">192.168.1.1</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600">DNS Server</span>
                  <span className="font-mono text-slate-900">8.8.8.8</span>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-orange-500" />
                  <h3 className="text-slate-900 font-semibold">Connection Status</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Connection Type</span>
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-300">WiFi 5GHz</Badge>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Signal Strength</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300">Excellent</Badge>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-emerald-700">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-slate-900">2h 34m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeDataDialog;
