import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Summary from "./pages/Summary.tsx";
import Dashboard from "./pages/Dashboard";
import MockInterview from "./pages/MockInterview";
import MockPrepScreen from "./pages/MockPrepScreen";
import FeedbackScreen from "./pages/FeedbackScreen.tsx";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mock-interview" element={<MockPrepScreen />} />
        <Route path="/mock-interview/session" element={<MockInterview />} />b 
        <Route path="/mock-feedback"   element={<FeedbackScreen />} />

      </Routes>
    </BrowserRouter>
  );
}