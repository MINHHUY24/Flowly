import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { initSupabaseClient } from "../api/supabaseClient";

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  async function handleLogout(event) {
    event.preventDefault();

    const client = await initSupabaseClient();
    await client.auth.signOut();

    window.location.href = "/login";
  }

  return (
    <div id="sidebar" className={isOpen ? "is-open" : ""}>
      <button
        className="sidebar-toggle"
        type="button"
        aria-label="Menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-bars"}`} />
      </button>

      <button
        className="sidebar-backdrop"
        type="button"
        aria-label="Close menu"
        onClick={() => setIsOpen(false)}
      />

      <aside className="sidebar">
        <nav className="sidebar-menu">
          <NavLink
            to="/home"
            className="sidebar-link"
            onClick={() => setIsOpen(false)}
          >
            <i className="fa-solid fa-house" />
            <span>{t("nav.home")}</span>
          </NavLink>

          <NavLink
            to="/schedule"
            className="sidebar-link"
            onClick={() => setIsOpen(false)}
          >
            <i className="fa-regular fa-calendar-days" />
            <span>{t("nav.schedule")}</span>
          </NavLink>

          <NavLink
            to="/tasks"
            className="sidebar-link"
            onClick={() => setIsOpen(false)}
          >
            <i className="fa-regular fa-square-check" />
            <span>{t("nav.tasks")}</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-line" />

          <a href="/login" className="sidebar-link logout" onClick={handleLogout}>
            <i className="fa-solid fa-arrow-right-from-bracket" />
            <span>{t("nav.logout")}</span>
          </a>
        </div>
      </aside>
    </div>
  );
}
