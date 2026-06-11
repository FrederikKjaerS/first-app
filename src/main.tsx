import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/base.css";
import "./styles/recipes.css";
import "./styles/overlays.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Mangler #root-elementet i index.html");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
