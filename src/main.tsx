import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@adsum/tokens/tokens.css";
import { App } from "./App.js";
import "./styles.css";

document.documentElement.setAttribute("data-theme", "dark");

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
