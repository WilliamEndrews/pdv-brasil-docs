// src/main.tsx - Ponto de entrada da aplicação PDV Brasil
// Última atualização: 03:30 PM -03, Segunda-feira, 27 de Outubro de 2025
// Descrição: Inicializa React DOM e renderiza App no elemento #root

import React from "react";
import ReactDOM from "react-dom/client";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
