import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, Radio, Wifi, GitMerge, GitFork, Globe, Server, Mail, Shield, Activity, Network, FileText, Lock } from 'lucide-react';
import React, { useState } from 'react';

interface PacketDetails {
  packetType: string;
  totalPackets: number;
  packetsPerSecond: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
}

interface PacketTypeTableProps {
  packetDetails: PacketDetails[];
  totalPackets: number;
  currentPacketsPerSecond: number;
  metrics?: {
    total_broadcast_packets: number;
    total_unicast_packets: number;
    arp_requests: number;
    arp_replies: number;
    ip_packets: number;
    tcp_packets: number;
    udp_packets: number;
    icmp_packets: number;
    dns_queries: number;
    dhcp_packets: number;
    http_requests: number;
    tls_handshakes: number;
    total_packets: number;
  };
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Helper function to format packets per second
const formatRate = (rate: number): string => {
  if (typeof rate !== 'number' || isNaN(rate)) return '0.0';
  if (rate >= 1000) return (rate / 1000).toFixed(1) + 'K';
  return rate.toFixed(1);
};

// Get icon based on packet type
const getPacketTypeIcon = (packetType: string, className?: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Broadcast': <Radio className={className} />,
    'Unicast': <Wifi className={className} />,
    'ARP Requests': <GitMerge className={className} />,
    'ARP Replies': <GitFork className={className} />,
    'IP Packets': <Globe className={className} />,
    'TCP Packets': <Server className={className} />,
    'UDP Packets': <Activity className={className} />,
    'ICMP Packets': <Shield className={className} />,
    'DNS Queries': <Network className={className} />,
    'DHCP Packets': <Mail className={className} />,
    'HTTP Requests': <FileText className={className} />,
    'TLS Handshakes': <Lock className={className} />
  };
  return icons[packetType] || <Activity className={className} />;
};

// Get badge color based on packet type
const getBadgeColor = (packetType: string): string => {
  const colors: Record<string, string> = {
    'Broadcast': 'bg-purple-50 text-purple-700 border-purple-200',
    'Unicast': 'bg-blue-50 text-blue-700 border-blue-200',
    'ARP Requests': 'bg-amber-50 text-amber-700 border-amber-200',
    'ARP Replies': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'IP Packets': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'TCP Packets': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'UDP Packets': 'bg-sky-50 text-sky-700 border-sky-200',
    'ICMP Packets': 'bg-rose-50 text-rose-700 border-rose-200',
    'DNS Queries': 'bg-violet-50 text-violet-700 border-violet-200',
    'DHCP Packets': 'bg-orange-50 text-orange-700 border-orange-200',
    'HTTP Requests': 'bg-pink-50 text-pink-700 border-pink-200',
    'TLS Handshakes': 'bg-teal-50 text-teal-700 border-teal-200'
  };
  return colors[packetType] || 'bg-slate-50 text-slate-700 border-slate-200';
};

// Get progress bar color
const getProgressBarColor = (packetType: string): string => {
  const colors: Record<string, string> = {
    'Broadcast': 'bg-purple-500',
    'Unicast': 'bg-blue-500',
    'ARP Requests': 'bg-amber-500',
    'ARP Replies': 'bg-emerald-500',
    'IP Packets': 'bg-indigo-500',
    'TCP Packets': 'bg-cyan-500',
    'UDP Packets': 'bg-sky-500',
    'ICMP Packets': 'bg-rose-500',
    'DNS Queries': 'bg-violet-500',
    'DHCP Packets': 'bg-orange-500',
    'HTTP Requests': 'bg-pink-500',
    'TLS Handshakes': 'bg-teal-500'
  };
  return colors[packetType] || 'bg-slate-500';
};

// Get trend indicator
const getTrendIndicator = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <span className="text-green-600 text-sm">↑</span>;
    case 'down':
      return <span className="text-red-600 text-sm">↓</span>;
    default:
      return <span className="text-slate-400 text-sm">→</span>;
  }
};

const PacketTypeTable: React.FC<PacketTypeTableProps> = ({ 
  packetDetails: initialPacketDetails, 
  totalPackets,
  currentPacketsPerSecond,
  metrics 
}) => {
  const [sortField, setSortField] = useState<'totalPackets' | 'packetsPerSecond' | 'percentage'>('totalPackets');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAllTypes, setShowAllTypes] = useState(true);

  // Calculate packets per second (assuming the data is for a 10-second interval)
  const calculatePacketsPerSecond = (packetCount: number = 0): number => {
    return packetCount / 10;
  };

  // Safe access to metrics with default values
  const safeMetrics = {
    total_broadcast_packets: metrics?.total_broadcast_packets ?? 0,
    total_unicast_packets: metrics?.total_unicast_packets ?? 0,
    arp_requests: metrics?.arp_requests ?? 0,
    arp_replies: metrics?.arp_replies ?? 0,
    ip_packets: metrics?.ip_packets ?? 0,
    tcp_packets: metrics?.tcp_packets ?? 0,
    udp_packets: metrics?.udp_packets ?? 0,
    icmp_packets: metrics?.icmp_packets ?? 0,
    dns_queries: metrics?.dns_queries ?? 0,
    dhcp_packets: metrics?.dhcp_packets ?? 0,
    http_requests: metrics?.http_requests ?? 0,
    tls_handshakes: metrics?.tls_handshakes ?? 0,
    total_packets: metrics?.total_packets ?? totalPackets,
  };

  // Helper function to get packet count from either metrics or initialPacketDetails
  const getPacketCount = (packetType: string): number => {
    // First check in initialPacketDetails
    const fromDetails = initialPacketDetails?.find(d => d.packetType === packetType)?.totalPackets;
    if (fromDetails !== undefined && fromDetails > 0) {
      return fromDetails;
    }
    
    // Then check in metrics based on packet type
    switch (packetType) {
      case 'Broadcast':
        return safeMetrics.total_broadcast_packets;
      case 'Unicast':
        return safeMetrics.total_unicast_packets;
      case 'ARP Requests':
        return safeMetrics.arp_requests;
      case 'ARP Replies':
        return safeMetrics.arp_replies;
      case 'IP Packets':
        return safeMetrics.ip_packets;
      case 'TCP Packets':
        return safeMetrics.tcp_packets;
      case 'UDP Packets':
        return safeMetrics.udp_packets;
      case 'ICMP Packets':
        return safeMetrics.icmp_packets;
      case 'DNS Queries':
        return safeMetrics.dns_queries;
      case 'DHCP Packets':
        return safeMetrics.dhcp_packets;
      case 'HTTP Requests':
        return safeMetrics.http_requests;
      case 'TLS Handshakes':
        return safeMetrics.tls_handshakes;
      default:
        return 0;
    }
  };

  // Create complete packet details from metrics and initialPacketDetails
  const allPacketTypes: PacketDetails[] = [
    // Broadcast
    {
      packetType: 'Broadcast',
      totalPackets: getPacketCount('Broadcast'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('Broadcast')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('Broadcast') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // Unicast
    {
      packetType: 'Unicast',
      totalPackets: getPacketCount('Unicast'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('Unicast')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('Unicast') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // ARP Requests
    {
      packetType: 'ARP Requests',
      totalPackets: getPacketCount('ARP Requests'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('ARP Requests')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('ARP Requests') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // ARP Replies
    {
      packetType: 'ARP Replies',
      totalPackets: getPacketCount('ARP Replies'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('ARP Replies')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('ARP Replies') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // IP Packets
    {
      packetType: 'IP Packets',
      totalPackets: getPacketCount('IP Packets'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('IP Packets')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('IP Packets') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // TCP Packets
    {
      packetType: 'TCP Packets',
      totalPackets: getPacketCount('TCP Packets'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('TCP Packets')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('TCP Packets') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // UDP Packets
    {
      packetType: 'UDP Packets',
      totalPackets: getPacketCount('UDP Packets'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('UDP Packets')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('UDP Packets') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // ICMP Packets
    {
      packetType: 'ICMP Packets',
      totalPackets: getPacketCount('ICMP Packets'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('ICMP Packets')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('ICMP Packets') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // DNS Queries
    {
      packetType: 'DNS Queries',
      totalPackets: getPacketCount('DNS Queries'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('DNS Queries')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('DNS Queries') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // DHCP Packets
    {
      packetType: 'DHCP Packets',
      totalPackets: getPacketCount('DHCP Packets'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('DHCP Packets')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('DHCP Packets') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // HTTP Requests
    {
      packetType: 'HTTP Requests',
      totalPackets: getPacketCount('HTTP Requests'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('HTTP Requests')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('HTTP Requests') / totalPackets) * 100).toFixed(1)) : 0,
    },
    // TLS Handshakes
    {
      packetType: 'TLS Handshakes',
      totalPackets: getPacketCount('TLS Handshakes'),
      packetsPerSecond: calculatePacketsPerSecond(getPacketCount('TLS Handshakes')),
      percentage: totalPackets > 0 ? Number(((getPacketCount('TLS Handshakes') / totalPackets) * 100).toFixed(1)) : 0,
    }
  ];

  // Remove duplicates and filter out zero values if desired
  const uniquePacketDetails = Array.from(
    new Map(allPacketTypes.map(item => [item.packetType, item])).values()
  ).filter(detail => showAllTypes || detail.totalPackets > 0);

  const sortedDetails = [...uniquePacketDetails].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'totalPackets') {
      return (a.totalPackets - b.totalPackets) * multiplier;
    }
    if (sortField === 'packetsPerSecond') {
      return (a.packetsPerSecond - b.packetsPerSecond) * multiplier;
    }
    if (sortField === 'percentage') {
      return (a.percentage - b.percentage) * multiplier;
    }
    return 0;
  });

  const handleSort = (field: 'totalPackets' | 'packetsPerSecond' | 'percentage') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Generate dynamic legend items based on packet types that have data
  const getLegendItems = () => {
    const legendMap: Record<string, { color: string, label: string }> = {
      'Broadcast': { color: 'bg-purple-500', label: 'Broadcast' },
      'Unicast': { color: 'bg-blue-500', label: 'Unicast' },
      'ARP Requests': { color: 'bg-amber-500', label: 'ARP' },
      'ARP Replies': { color: 'bg-emerald-500', label: 'ARP Replies' },
      'IP Packets': { color: 'bg-indigo-500', label: 'IP' },
      'TCP Packets': { color: 'bg-cyan-500', label: 'TCP' },
      'UDP Packets': { color: 'bg-sky-500', label: 'UDP' },
      'ICMP Packets': { color: 'bg-rose-500', label: 'ICMP' },
      'DNS Queries': { color: 'bg-violet-500', label: 'DNS' },
      'DHCP Packets': { color: 'bg-orange-500', label: 'DHCP' },
      'HTTP Requests': { color: 'bg-pink-500', label: 'HTTP' },
      'TLS Handshakes': { color: 'bg-teal-500', label: 'TLS' }
    };

    // Get unique packet types that have data
    const packetTypesWithData = new Set(uniquePacketDetails.map(d => d.packetType));
    
    // Return legend items only for packet types that exist in the data
    return Array.from(packetTypesWithData).map(packetType => {
      const legend = legendMap[packetType];
      if (legend) {
        return (
          <div key={packetType} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${legend.color}`}></div>
            <span className="text-xs text-slate-600">{legend.label}</span>
          </div>
        );
      }
      return null;
    }).filter(Boolean);
  };

  if (!uniquePacketDetails.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Packet Type Distribution</CardTitle>
          <CardDescription>Breakdown of network packets by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            No packet data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Packet Type Distribution</CardTitle>
            <CardDescription>Breakdown of network packets by type</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Total: {formatNumber(totalPackets)} packets
            </Badge>
            <Badge variant="outline" className="text-sm bg-blue-50">
              {formatRate(currentPacketsPerSecond)} pps
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards - Now using getPacketCount to ensure correct data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">Broadcast</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(getPacketCount('Broadcast'))}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">Unicast</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(getPacketCount('Unicast'))}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">ARP Total</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(getPacketCount('ARP Requests') + getPacketCount('ARP Replies'))}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">IP Packets</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(getPacketCount('IP Packets'))}
            </p>
          </div>
        </div>

        {/* Additional summary row for more packet types if needed */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">TCP Packets</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(getPacketCount('TCP Packets'))}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">UDP Packets</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(getPacketCount('UDP Packets'))}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">ICMP Packets</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(getPacketCount('ICMP Packets'))}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">DNS Queries</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatNumber(getPacketCount('DNS Queries'))}
            </p>
          </div>
        </div>

        {/* Toggle for showing zero values */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllTypes(!showAllTypes)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showAllTypes ? '▼ Hide zero-value packet types' : '▶ Show all packet types'}
            </button>
            <span className="text-xs text-slate-500">
              ({uniquePacketDetails.length} types displayed)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Packet Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  <button 
                    className="flex items-center gap-1 hover:text-slate-900"
                    onClick={() => handleSort('totalPackets')}
                  >
                    Total Packets
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  <button 
                    className="flex items-center gap-1 hover:text-slate-900"
                    onClick={() => handleSort('packetsPerSecond')}
                  >
                    Packets/Sec
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  <button 
                    className="flex items-center gap-1 hover:text-slate-900"
                    onClick={() => handleSort('percentage')}
                  >
                    % of Total
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {sortedDetails.map((detail, index) => {
                const barWidth = (detail.percentage / 100) * 100;
                
                return (
                  <tr 
                    key={`${detail.packetType}-${index}`} 
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      detail.totalPackets === 0 ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getPacketTypeIcon(detail.packetType, 'h-4 w-4 text-slate-600')}
                        <span className="text-sm font-medium text-slate-900">
                          {detail.packetType}
                        </span>
                        {detail.trend && (
                          <span className="ml-1">{getTrendIndicator(detail.trend)}</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-slate-900">
                        {formatNumber(detail.totalPackets)}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-slate-900 font-medium">
                          {formatRate(detail.packetsPerSecond)}
                        </span>
                        <span className="text-xs text-slate-500">pps</span>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <Badge 
                        variant="outline"
                        className={getBadgeColor(detail.packetType)}
                      >
                        {detail.percentage}%
                      </Badge>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getProgressBarColor(detail.packetType)}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {detail.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            
            {/* Summary Row */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="py-3 px-4 text-sm font-medium text-slate-700">Total</td>
                <td className="py-3 px-4 text-sm font-bold text-slate-900">
                  {formatNumber(totalPackets)}
                </td>
                <td className="py-3 px-4 text-sm text-slate-700">
                  {formatRate(currentPacketsPerSecond)} pps
                </td>
                <td className="py-3 px-4 text-sm text-slate-700">100%</td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Dynamic Legend - Only shows packet types that have data */}
        <div className="mt-4 flex flex-wrap gap-4 pt-4 border-t border-slate-100">
          {getLegendItems()}
        </div>

        {/* Insights based on actual data */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-600">
            <span className="font-medium">Network Analysis:</span>{' '}
            {getPacketCount('DHCP Packets') > 100 
              ? 'High DHCP traffic detected. Multiple devices requesting IP addresses.'
              : getPacketCount('TCP Packets') > getPacketCount('UDP Packets')
              ? 'TCP traffic dominates. Connection-oriented communication prevalent.'
              : getPacketCount('UDP Packets') > getPacketCount('TCP Packets')
              ? 'UDP traffic dominates. Streaming or real-time applications active.'
              : 'Network traffic pattern normal.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PacketTypeTable;