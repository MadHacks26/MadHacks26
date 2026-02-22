import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./auth";
import Create from "./pages/Create.tsx";
import Summary from "./pages/Summary.tsx";
import Roadmap from "./pages/Roadmap.tsx";
import MockInterview from "./pages/MockInterview";
import MockPrepScreen from "./pages/MockPrepScreen.tsx";
import Auth from "./pages/Auth";
import FeedbackScreen from "./pages/FeedbackScreen.tsx";
import Home from "./pages/Home.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
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
                path="/create"
                element={
                  <ProtectedRoute>
                    <Create />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roadmap"
                element={
                  <ProtectedRoute>
                    <Roadmap />
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
              <Route
                path="/mock-feedback"
                element={
                  <ProtectedRoute>
                    <FeedbackScreen />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>

          <footer className="text-center text-sm text-white py-6">
            Made with 🧀 in Madison
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
