import { Overview } from './pages/Overview';
import { MLInsights } from './pages/MLInsights';
import { Environment } from './pages/Environment';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { Wearable } from './pages/Wearable';
import { DemoProvider } from './data/demoContext';
import { Layout } from './components/Layout';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Placeholder components for routing unbuilt pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-[#E8E0D5] rounded-3xl p-10">
    <h2 className="text-3xl font-serif text-[#2A2118] mb-4">{title}</h2>
    <p className="text-[#7A7A52] max-w-md">This view is currently a placeholder for the prototype structural mapping.</p>
  </div>
);

function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/monitoring" element={<LiveMonitoring />} />
            <Route path="/trends" element={<Placeholder title="Trends & Analytics" />} />
            <Route path="/events" element={<Placeholder title="Events Timeline" />} />
            <Route path="/insights" element={<MLInsights />} />
            <Route path="/environment" element={<Environment />} />
            <Route path="/wearable" element={<Wearable />} />
            <Route path="/settings" element={<Placeholder title="Settings" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </DemoProvider>
  );
}

export default App;
