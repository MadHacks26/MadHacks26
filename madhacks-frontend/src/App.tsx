import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Summary from "./pages/Summary.tsx";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}