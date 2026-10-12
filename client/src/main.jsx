import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import favicon from "./assets/favicon.svg";

const faviconLink = document.querySelector("link[rel='icon']");

if (faviconLink) {
  faviconLink.href = favicon;
} else {
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = favicon;
  document.head.appendChild(link);
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
