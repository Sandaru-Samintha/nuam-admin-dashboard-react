import type { UseNetworkActivityOptions, UseNetworkActivityReturn } from '@/hooks/useNetworkActivityData';
import { useNetworkActivityData } from '@/hooks/useNetworkActivityData';
import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';

interface WebSocketProviderProps {
  children: ReactNode;
  options?: UseNetworkActivityOptions;
}

const WebSocketContext = createContext<UseNetworkActivityReturn | null>(null);

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  options = {} 
}) => {
  const socketData = useNetworkActivityData(options);
  
  return (
    <WebSocketContext.Provider value={socketData}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): UseNetworkActivityReturn => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};