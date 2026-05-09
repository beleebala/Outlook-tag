import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import "./styles.css";

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <App />
    </FluentProvider>
  </React.StrictMode>
);
