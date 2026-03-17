import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  Activity, 
  Wifi, 
  WifiOff, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  User, 
  ChevronRight,
  X,
  Server,
  Zap,
  Search
} from 'lucide-react';
import MetricCard from '@/components/DashboardComponents/MetricCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchDailySummary, fetchDeviceReport } from '@/services/api';

interface SummaryData {
  date: string;
  summary: {
    connected_devices_count: number;
    peak_active_concurrently: number;
    inactive_devices_count: number;
    total_traffic: {
      sent_mb: number;
      received_mb: number;
      total_packets: number;
    };
  };
  device_ids: string[];
}

interface DeviceReport {
  device_info: {
    device_id: string;
    hostname: string;
    ip_address: string;
    vendor: string;
    device_type: string;
    os: string;
  };
  report_date: string;
  metrics: {
    connection_count: number;
    total_duration_minutes: number;
    data_sent_bytes: number;
    data_received_bytes: number;
  };
  activities: Array<{
    timestamp: string;
    event_type: string;
    details: any;
  }>;
}

const Reports: React.FC = () => {
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [devicesDetails, setDevicesDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailySummary(targetDate);
      setSummaryData(data);
      
      // Load basic details for each device in the summary
      if (data.device_ids && data.device_ids.length > 0) {
        loadDevicesDetails(data.device_ids, targetDate);
      } else {
        setDevicesDetails([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load report summary');
    } finally {
      setLoading(false);
    }
  };

  const loadDevicesDetails = async (ids: string[], date: string) => {
    setLoadingDevices(true);
    try {
      const details = await Promise.all(
        ids.map(async (id) => {
          try {
            const report = await fetchDeviceReport(id, date);
            return report.device_info;
          } catch (e) {
            return { device_id: id, hostname: 'Unknown', ip_address: '-' };
          }
        })
      );
      setDevicesDetails(details);
    } catch (err) {
      console.error('Error loading device details', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleViewDeviceDetail = async (deviceId: string) => {
    setFetchingDetail(true);
    try {
      const report = await fetchDeviceReport(deviceId, targetDate);
      setSelectedDevice(report);
      setIsModalOpen(true);
    } catch (err) {
      alert('Failed to fetch device details');
    } finally {
      setFetchingDetail(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [targetDate]);

  return (
    <div className="space-y-6">
      {/* Header & Date Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Network Reports
          </h2>
          <p className="text-slate-500 text-sm">Analyze network activity and device behavior by date</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="date" 
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button 
            onClick={loadSummary}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Refresh Report"
          >
            <Activity className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Devices Seen"
          value={summaryData?.summary.connected_devices_count ?? 0}
          description="Total active on this day"
          icon={<Wifi className="h-4 w-4 text-blue-600" />}
        />
        <MetricCard
          title="Peak Concurrent"
          value={summaryData?.summary.peak_active_concurrently ?? 0}
          description="Highest simultaneous connections"
          icon={<Zap className="h-4 w-4 text-amber-500" />}
        />
        <MetricCard
          title="Inactive Devices"
          value={summaryData?.summary.inactive_devices_count ?? 0}
          description="Known but not seen today"
          icon={<Clock className="h-4 w-4 text-slate-400" />}
        />
        <MetricCard
          title="Total Packets"
          value={summaryData?.summary.total_traffic.total_packets.toLocaleString() ?? "0"}
          description="Network throughput volume"
          icon={<Activity className="h-4 w-4 text-emerald-500" />}
        />
      </div>

      {/* Traffic Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ArrowUpRight className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Data Sent</p>
              <h3 className="text-2xl font-bold text-slate-900">{summaryData?.summary.total_traffic.sent_mb ?? 0} <span className="text-sm font-normal text-slate-500">MB</span></h3>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none">Outgoing</Badge>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <ArrowDownRight className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Data Received</p>
              <h3 className="text-2xl font-bold text-slate-900">{summaryData?.summary.total_traffic.received_mb ?? 0} <span className="text-sm font-normal text-slate-500">MB</span></h3>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-none">Incoming</Badge>
          </div>
        </div>
      </div>

      {/* Active Devices Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Devices on {targetDate}</CardTitle>
              <CardDescription>Click on a device to view its specific activity report</CardDescription>
            </div>
            {loadingDevices && <Activity className="h-4 w-4 animate-spin text-blue-600" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Device Hostname</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">IP Address</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">MAC / Device ID</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Vendor</th>
                  <th className="text-right py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {devicesDetails.length > 0 ? (
                  devicesDetails.map((device) => (
                    <tr key={device.device_id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                            <Server className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="font-medium text-slate-900">{device.hostname || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-mono text-slate-600">{device.ip_address}</td>
                      <td className="py-4 px-4 text-sm font-mono text-slate-400">{device.device_id}</td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary" className="font-normal">{device.vendor || 'Unknown'}</Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => handleViewDeviceDetail(device.device_id)}
                          disabled={fetchingDetail}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          View Report
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                      {loading ? 'Loading summary...' : 'No active devices recorded for this date'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Device Detail Modal */}
      {isModalOpen && selectedDevice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl text-white">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedDevice.device_info.hostname}</h3>
                  <p className="text-sm text-slate-500 font-mono">{selectedDevice.device_info.ip_address} • {selectedDevice.device_info.device_id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Device Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Vendor</p>
                  <p className="text-slate-900 font-medium">{selectedDevice.device_info.vendor || 'N/A'}</p>
                </div>
                {/* <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Type</p>
                  <p className="text-slate-900 font-medium">{selectedDevice.device_info.device_type || 'N/A'}</p>
                </div> */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">OS</p>
                  <p className="text-slate-900 font-medium">{selectedDevice.device_info.os || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Report Date</p>
                  <p className="text-slate-900 font-medium">{selectedDevice.report_date}</p>
                </div>
              </div>

              {/* Device Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-slate-500 font-medium">Connections</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{selectedDevice.metrics.connection_count} <span className="text-sm font-normal text-slate-400">times</span></p>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <span className="text-sm text-slate-500 font-medium">Total Duration</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{selectedDevice.metrics.total_duration_minutes} <span className="text-sm font-normal text-slate-400">min</span></p>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-slate-500 font-medium">Data Exchanged</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {((selectedDevice.metrics.data_sent_bytes + selectedDevice.metrics.data_received_bytes) / (1024 * 1024)).toFixed(2)}
                    <span className="text-sm font-normal text-slate-400"> MB</span>
                  </p>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Search className="h-5 w-5 text-slate-400" />
                  Activity Timeline
                </h4>
                <div className="space-y-4">
                  {selectedDevice.activities.length > 0 ? (
                    selectedDevice.activities.map((act, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full mt-1.5 ${
                            act.event_type === 'DEVICE_JOINED' ? 'bg-emerald-500' : 
                            act.event_type === 'DEVICE_LEFT' ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>
                          {idx !== selectedDevice.activities.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-slate-900">{act.event_type.replace('_', ' ')}</span>
                            <span className="text-xs text-slate-400 font-mono">{new Date(act.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <pre className="text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(act.details, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic text-center py-4">No activities logged for this device</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
