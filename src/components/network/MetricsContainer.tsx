import React, { useMemo } from 'react';
import { Activity, Wifi, Radio, TrendingUp } from 'lucide-react';
import ActivityMetricCard from './ActivityMetricCard';
import type { MetricCardData } from './ActivityMetricCard';

interface MetricsContainerProps {
  metrics: MetricCardData[];
  currentPacketsPerSecond: number;
  avgArpRate: number;
  activeDevicesCount: number; // This is the backend value
  devices: any[];
  distribution: {
    broadcast: number;
    unicast: number;
  };
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const MetricsContainer: React.FC<MetricsContainerProps> = ({
  currentPacketsPerSecond,
  avgArpRate,
  devices,
  distribution,
  activeDevicesCount // Use the backend value directly
}) => {
  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const totalTraffic = distribution.broadcast + distribution.unicast;
    const broadcastPercent = totalTraffic > 0 ? ((distribution.broadcast / totalTraffic) * 100).toFixed(1) : '0';
    const unicastPercent = totalTraffic > 0 ? ((distribution.unicast / totalTraffic) * 100).toFixed(1) : '0';

    // Determine network load based on packets per second
    let networkLoad = 'Low';
    let networkLoadTrend: 'up' | 'down' | 'stable' = 'stable';
    
    if (currentPacketsPerSecond > 1400) {
      networkLoad = 'High';
      networkLoadTrend = 'up';
    } else if (currentPacketsPerSecond > 1000) {
      networkLoad = 'Medium';
      networkLoadTrend = 'stable';
    } else if (currentPacketsPerSecond < 600) {
      networkLoad = 'Low';
      networkLoadTrend = 'down';
    }

    return {
      packetsPerSecond: {
        value: formatNumber(currentPacketsPerSecond),
        trend: currentPacketsPerSecond > 1300 ? 'up' : currentPacketsPerSecond < 700 ? 'down' : 'stable',
        trendValue: currentPacketsPerSecond > 1300 ? '+12% from baseline' : 
                   currentPacketsPerSecond < 700 ? '-8% from baseline' : 'Within normal range'
      },
      activeDevices: {
        value: activeDevicesCount, // Use backend value directly
        trend: activeDevicesCount > 5 ? 'up' : activeDevicesCount < 2 ? 'down' : 'stable',
        trendValue: activeDevicesCount > 5 ? '+2 from average' : 
                   activeDevicesCount < 2 ? '-1 from average' : 'No change'
      },
      arpRate: {
        value: `${avgArpRate}/min`,
        trend: avgArpRate > 100 ? 'up' : avgArpRate < 40 ? 'down' : 'stable',
        trendValue: avgArpRate > 100 ? '+15% from average' : 
                   avgArpRate < 40 ? '-10% from average' : 'Within normal range'
      },
      broadcastTraffic: {
        value: `${broadcastPercent}%`,
        trend: parseFloat(broadcastPercent) > 15 ? 'up' : parseFloat(broadcastPercent) < 8 ? 'down' : 'stable',
        trendValue: parseFloat(broadcastPercent) > 15 ? '+2% from average' : 
                   parseFloat(broadcastPercent) < 8 ? '-2% from average' : 'Stable'
      },
      unicastTraffic: {
        value: `${unicastPercent}%`,
        trend: parseFloat(unicastPercent) > 92 ? 'up' : parseFloat(unicastPercent) < 85 ? 'down' : 'stable',
        trendValue: parseFloat(unicastPercent) > 92 ? '+2% from average' : 
                   parseFloat(unicastPercent) < 85 ? '-2% from average' : 'Stable'
      },
      networkLoad: {
        value: networkLoad,
        trend: networkLoadTrend,
        trendValue: networkLoad === 'High' ? 'Increasing' : 
                   networkLoad === 'Low' ? 'Decreasing' : 'Stable'
      }
    };
  }, [currentPacketsPerSecond, avgArpRate, activeDevicesCount, distribution]);

  // Icons for metrics
  const icons = [
    <Activity className="h-4 w-4" />,
    <Wifi className="h-4 w-4" />,
    <Radio className="h-4 w-4" />,
    <Radio className="h-4 w-4" />,
    <Activity className="h-4 w-4" />,
    <TrendingUp className="h-4 w-4" />
  ];

  // Metric card configurations
  const metricConfigs = [
    {
      title: 'Packets per Second',
      description: 'Current network throughput',
      ...derivedMetrics.packetsPerSecond
    },
    {
      title: 'Active Devices',
      description: 'Currently transmitting',
      ...derivedMetrics.activeDevices
    },
    {
      title: 'ARP Requests Rate',
      description: 'Address resolution activity',
      ...derivedMetrics.arpRate
    },
    {
      title: 'Broadcast Traffic',
      description: 'Of total network traffic',
      ...derivedMetrics.broadcastTraffic
    },
    {
      title: 'Unicast Traffic',
      description: 'Direct device communication',
      ...derivedMetrics.unicastTraffic
    },
    {
      title: 'Network Load',
      description: 'Overall utilization status',
      ...derivedMetrics.networkLoad
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricConfigs.map((config, index) => (
        <ActivityMetricCard
          key={index}
          title={config.title}
          value={config.value}
          description={config.description}
          icon={icons[index]}
          trend={config.trend}
          trendValue={config.trendValue}
        />
      ))}
    </div>
  );
};

export default MetricsContainer;