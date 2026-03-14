import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'active' | 'idle' | 'spike' | 'load_change';
  message: string;
  timestamp: string;
  icon?: React.ReactNode;
}

interface ActivityEventFeedProps {
  events: ActivityEvent[];
  pageSize?: number; // number of events per page
}

const ActivityEventFeed: React.FC<ActivityEventFeedProps> = ({ events, pageSize = 10 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(events.length / pageSize);

  const startIdx = (currentPage - 1) * pageSize;
  const pagedEvents = events.slice(startIdx, startIdx + pageSize);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent network events and changes</CardDescription>
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
                  <p className="text-sm text-slate-900">{event.message}</p>
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
      </CardContent>
    </Card>
  );
};

export default ActivityEventFeed;