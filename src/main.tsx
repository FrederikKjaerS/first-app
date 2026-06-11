import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import "./styles/base.css";
import "./styles/recipes.css";
import "./styles/overlays.css";
import "./styles/social.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Mangler #root-elementet i index.html");

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
