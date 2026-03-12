import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import IPAddressManagement from './pages/IPAddressManagement';
import NetworkActivityPage from './pages/NetworkActivity';
import NetworkTopologyPage from './pages/Topology';


function App() {
  return (
    <WebSocketProvider options={{ autoConnect: true }}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/topological-view" element={<NetworkTopologyPage />} />
            <Route path="/network-activity" element={<NetworkActivityPage />} />
            <Route path="/ip-management" element={<IPAddressManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WebSocketProvider>
  );
}

export default App;