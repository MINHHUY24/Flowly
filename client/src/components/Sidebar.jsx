import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { initSupabaseClient } from "../api/supabaseClient";

export default function Sidebar() {
  const { t } = useTranslation();

  async function handleLogout(event) {
    event.preventDefault();

    const client = await initSupabaseClient();
    await client.auth.signOut();

    window.location.href = "/login";
  }

  return (
    <div id="sidebar">
      <aside className="sidebar">
        <nav className="sidebar-menu">
          <NavLink to="/home" className="sidebar-link">
            <i className="fa-solid fa-house" />
            <span>{t("nav.home")}</span>
          </NavLink>

          <NavLink to="/schedule" className="sidebar-link">
            <i className="fa-regular fa-calendar-days" />
            <span>{t("nav.schedule")}</span>
          </NavLink>

          <NavLink to="/tasks" className="sidebar-link">
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
