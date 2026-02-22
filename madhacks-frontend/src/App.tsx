import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth";
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
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mock-interview" element={<MockPrepScreen />} />
          <Route path="/mock-interview/session" element={<MockInterview />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}