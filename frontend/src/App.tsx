import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import FlowBuilderPage from './pages/FlowBuilderPage';
import FlowDashboardPage from './pages/FlowDashboardPage';
import AuthenticationPage from './pages/AuthenticationPage';
import ProtectedLayout from './features/auth/ProtectedLayout';
import { Toaster } from './components/ui/sonner';
function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/auth" element={<AuthenticationPage />} />

          {/* Protected routes grouped under ProtectedLayout */}
          <Route element={<ProtectedLayout />}>
            <Route path="/flow" element={<FlowBuilderPage />} />
            <Route path="/flow/:flow_id" element={<FlowBuilderPage />} />

            <Route path="/dashboard" element={<FlowDashboardPage />} />
          </Route>

          {/* Optional redirect from root */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
      <Toaster 
        closeButton={true}
        duration={1000}
        visibleToasts={1}
      />
    </>
  );
}

export default App;
