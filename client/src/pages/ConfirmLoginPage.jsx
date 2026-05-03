import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { initSupabaseClient } from "../api/supabaseClient";
import { useBodyClass } from "../hooks/useBodyClass";

export default function ConfirmLoginPage() {
  const { t } = useTranslation();
  useBodyClass("confirm-page");

  const navigate = useNavigate();

  useEffect(() => {
    let redirectTimer;
    let fadeTimer;
    let isMounted = true;

    async function confirmSession() {
      try {
        const client = await initSupabaseClient();
        const { data, error } = await client.auth.getSession();

        if (error || !data.session) {
          navigate("/login", { replace: true });
          return;
        }

        redirectTimer = window.setTimeout(() => {
          document.body.classList.add("page-out");

          fadeTimer = window.setTimeout(() => {
            if (isMounted) {
              navigate("/home", { replace: true });
            }
          }, 350);
        }, 2000);
      } catch (error) {
        console.log("Confirm login error:", error);
        navigate("/login", { replace: true });
      }
    }

    confirmSession();

    return () => {
      isMounted = false;
      document.body.classList.remove("page-out");
      window.clearTimeout(redirectTimer);
      window.clearTimeout(fadeTimer);
    };
  }, [navigate]);

  return (
    <div className="confirm-wrapper">
      <div className="confirm-card">
        <div className="confirm-icon">
          <i className="fa-solid fa-check" />
        </div>

        <h1>{t("auth.loginSuccess")}</h1>
      </div>
    </div>
  );
}
