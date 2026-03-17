import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

interface NetworkInsight {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  description: string;
}

interface InsightsPanelProps {
  insights: NetworkInsight[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => (
  <Card>
    <CardHeader>
      <CardTitle>Network Insights</CardTitle>
      <CardDescription>Automated observations from activity analysis</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.id} className={`flex items-start gap-3 p-3 rounded-lg ${
            insight.type === 'info' ? 'bg-blue-50' :
            insight.type === 'success' ? 'bg-green-50' :
            'bg-yellow-50'
          }`}>
            {insight.type === 'info' && <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />}
            {insight.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />}
            {insight.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />}
            <div>
              <p className="text-sm font-medium text-slate-900">{insight.title}</p>
              <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default InsightsPanel;