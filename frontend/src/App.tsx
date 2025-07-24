import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import FlowBuilderPage from './pages/FlowBuilderPage';
import FlowDashboardPage from './pages/FlowDashboardPage';
import AuthenticationPage from './pages/AuthenticationPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FlowBuilderPage />} />
        <Route path="/dashboard" element={<FlowDashboardPage />} />
        <Route path="/auth" element={<AuthenticationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
