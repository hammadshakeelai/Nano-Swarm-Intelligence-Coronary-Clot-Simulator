import "./style.css";

import { createSimulatorApp } from "./app/simulatorApp";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Missing #app root element.");
}

createSimulatorApp(root);
