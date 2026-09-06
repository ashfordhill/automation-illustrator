/** React entry — tokens.css is the light/dark palette used by tiles and the app shell. */
import React from "react";
import ReactDOM from "react-dom/client";
import "@mantine/core/styles.css";
import App from "./app/App";
import "./app/styles/tokens.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
