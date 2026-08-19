import { Overview } from './pages/Overview';
import { MLInsights } from './pages/MLInsights';
import { Environment } from './pages/Environment';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { Wearable } from './pages/Wearable';
import { Trends } from './pages/Trends';
import { Events } from './pages/Events';
import { Settings } from './pages/Settings';
import { DemoProvider } from './data/demoContext';
import { Layout } from './components/Layout';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/monitoring" element={<LiveMonitoring />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/events" element={<Events />} />
            <Route path="/insights" element={<MLInsights />} />
            <Route path="/environment" element={<Environment />} />
            <Route path="/wearable" element={<Wearable />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </DemoProvider>
  );
}

export default App;
