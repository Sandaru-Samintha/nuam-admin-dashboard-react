import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Radio, TrendingUp, TrendingDown } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'active' | 'idle' | 'spike' | 'load_change';
  message: string;
  timestamp: string;
  icon?: React.ReactNode;
  arpRate?: {
    value: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
  };
}

interface ActivityEventFeedProps {
  events: ActivityEvent[];
  pageSize?: number; // number of events per page
  currentArpRate?: {
    value: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
  };
}

const ActivityEventFeed: React.FC<ActivityEventFeedProps> = ({ 
  events, 
  pageSize = 10,
  currentArpRate = { value: '0/min', trend: 'stable', trendValue: 'No data' }
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(events.length / pageSize);

  const startIdx = (currentPage - 1) * pageSize;
  const pagedEvents = events.slice(startIdx, startIdx + pageSize);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Reset to first page when events change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [events.length]);

  // Get trend icon
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch(trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>Recent network events and changes</CardDescription>
          </div>
          
          {/* ARP Rate Indicator */}
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-lg">
            <Radio className="h-4 w-4 text-blue-600" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">ARP Rate:</span>
              <span className="text-sm font-bold text-slate-900">{currentArpRate.value}</span>
              {currentArpRate.trend && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(currentArpRate.trend)}
                  <span className={`text-xs ${
                    currentArpRate.trend === 'up' ? 'text-green-600' :
                    currentArpRate.trend === 'down' ? 'text-red-600' :
                    'text-slate-600'
                  }`}>
                    {currentArpRate.trendValue}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 min-h-[400px]">
          {pagedEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No events to display</p>
            </div>
          ) : (
            pagedEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                <div className="mt-0.5">{event.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-900">{event.message}</p>
                    {/* Show ARP rate for events that have it */}
                    {event.arpRate && (
                      <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-md">
                        <Radio className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">{event.arpRate.value}</span>
                        {event.arpRate.trend && event.arpRate.trendValue && (
                          <div className="flex items-center gap-1 ml-1">
                            {getTrendIcon(event.arpRate.trend)}
                            <span className={`text-xs ${
                              event.arpRate.trend === 'up' ? 'text-green-600' :
                              event.arpRate.trend === 'down' ? 'text-red-600' :
                              'text-slate-600'
                            }`}>
                              {event.arpRate.trendValue}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.timestamp}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-100 transition-colors text-sm font-medium"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-100 transition-colors text-sm font-medium"
            >
              Next
            </button>
          </div>
        )}
        
        {/* Show event count */}
        {events.length > 0 && (
          <div className="text-xs text-slate-400 mt-2 text-center">
            Showing {startIdx + 1}-{Math.min(startIdx + pageSize, events.length)} of {events.length} events
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityEventFeed;