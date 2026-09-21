import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { syncHashPathToHistory } from "./lib/route";
import "./index.css";

syncHashPathToHistory();

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root was not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
