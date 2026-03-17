import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface MetricCardData {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

const ActivityMetricCard: React.FC<MetricCardData> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendValue 
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <div className="text-slate-400">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
      {trend && trendValue && (
        <div className={`flex items-center mt-2 text-xs ${
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
        }`}>
          {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
          {trendValue}
        </div>
      )}
    </CardContent>
  </Card>
);

export default ActivityMetricCard;