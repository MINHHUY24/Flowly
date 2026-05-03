import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "flag-icons/css/flag-icons.min.css";
import "./i18n";

import App from "./App.jsx";

import "./styles/base.css";
import "./styles/home.css";
import "./styles/tasks.css";
import "./styles/schedule.css";
import "./styles/auth.css";
import "./styles/confirm-login.css";
import "./styles/search.css";
import "./styles/responsive.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
