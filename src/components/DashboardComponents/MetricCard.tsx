import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
    /**
     * Optional trend direction used for coloring and arrow.
     * Use 'up', 'down', or 'stable'.
     */
    trendDirection?: 'up' | 'down' | 'stable';
    /**
     * Optional textual description of the trend (e.g. "+5 since last update").
     * If provided without `trendDirection` it will simply render as text.
     */
    trendValue?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon, trendDirection, trendValue }) => (
    <Card>
        <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
            <div className="text-slate-400">{icon}</div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
            {trendValue && (
                <div className={`flex items-center mt-2 text-xs ${
                    trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-slate-600'
                }`}>
                    {trendDirection === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {trendDirection === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {trendValue}
                </div>
            )}
        </CardContent>
    </Card>
);
export default MetricCard;
