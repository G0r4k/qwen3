import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import VirtualCardsApp from "./virtualcards/VirtualCardsApp";

// La app anterior (LocalCoder) sigue disponible en src/legacy por si se desea restaurar.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <VirtualCardsApp />
  </React.StrictMode>
);
