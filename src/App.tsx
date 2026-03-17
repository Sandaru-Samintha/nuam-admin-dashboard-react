import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import NetworkTopologyPage from './pages/Topology';
import NetworkActivityPage from './pages/NetworkActivity';
import IPAddressManagement from './pages/IPAddressManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/topological-view" element={<NetworkTopologyPage />} />
          <Route path="/network-activity" element={<NetworkActivityPage />} />
          <Route path="/ip-management" element={<IPAddressManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;