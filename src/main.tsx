/** React entry — tokens.css is the light/dark palette used by tiles and the app shell. */
import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/nunito/wght.css";
import "@mantine/core/styles.css";
import App from "./app/App";
import { warmDocumentLayout } from "./board/layout/warmLayout";
import { useStore } from "./state/store";
import "./app/styles/tokens.css";
import "./app/inspector/inspectorFold.css";

void warmDocumentLayout(useStore.getState().workflow);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
