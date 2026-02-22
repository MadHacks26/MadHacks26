import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import AppBackground from "./components/AppBackground";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppBackground>
      <App />
    </AppBackground>
  </StrictMode>
);