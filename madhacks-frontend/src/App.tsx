import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./auth";
import Home from "./pages/Home";
import Summary from "./pages/Summary.tsx";
import Dashboard from "./pages/Dashboard";
import MockInterview from "./pages/MockInterview";
import MockPrepScreen from "./pages/MockPrepScreen.tsx";
import Auth from "./pages/Auth";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>} 
          />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/summary"
            element={
              <ProtectedRoute>
                <Summary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-interview"
            element={
              <ProtectedRoute>
                <MockPrepScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-interview/session"
            element={
              <ProtectedRoute>
                <MockInterview />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}