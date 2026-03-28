import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./pages/Home.css";
import 'antd/dist/reset.css';


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
