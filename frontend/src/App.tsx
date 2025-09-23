import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from 'react-router-dom';

import FlowBuilderPage from './pages/FlowBuilderPage';
import DashboardPage from './pages/DashboardPage';
import FlowPage from './pages/FlowPage';
import ApiKeyPage from './pages/ApiKeyPage';
import AuthenticationPage from './pages/AuthenticationPage';
import TemplatesPage from './pages/TemplatesPage';
import ProtectedLayout from './features/auth/components/ProtectedLayout';
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
                        <Route
                            path="/flow/:flow_id"
                            element={<FlowBuilderPage />}
                        />

                        <Route path="/dashboard" element={<DashboardPage />}>
                            <Route
                                index
                                element={<Navigate to="flow" replace />}
                            />
                            <Route path="flow" element={<FlowPage />} />
                            <Route
                                path="templates"
                                element={<TemplatesPage />}
                            />
                            <Route path="api-keys" element={<ApiKeyPage />} />
                        </Route>
                    </Route>

                    {/* Optional redirect from root */}
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Router>
            <Toaster closeButton={true} duration={1000} visibleToasts={1} />
        </>
    );
}

export default App;
