import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import FlowBuilderPage from './pages/FlowBuilderPage';
import FlowDashboardPage from './pages/FlowDashboardPage';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<FlowBuilderPage />} />
        <Route path="/dashboard" element={<FlowDashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App
