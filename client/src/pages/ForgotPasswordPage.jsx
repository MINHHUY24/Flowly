import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { initSupabaseClient } from "../api/supabaseClient";
import { useBodyClass } from "../hooks/useBodyClass";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  useBodyClass("auth-page");

  const [email, setEmail] = useState("");
  const [messageType, setMessageType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanEmail = email.trim();

    setMessage("");
    setMessageType("");

    if (!cleanEmail) {
      setMessageType("error");
      setMessage(t("auth.missingEmail"));
      return;
    }

    try {
      setLoading(true);

      const client = await initSupabaseClient();

      const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.log("Reset password email error:", error);
        setMessageType("error");
        setMessage(t("auth.resetError"));
        return;
      }

      setMessageType("success");
      setMessage(t("auth.resetEmailSent"));
    } catch (error) {
      console.log("Forgot password error:", error);
      setMessageType("error");
      setMessage(t("auth.resetError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card forgot-card">
        <div className="auth-logo">
          <img src="/assets/images/logo.png" alt="Flowly Logo" />
        </div>

        <div className="forgot-text">
          <h2>{t("auth.forgotTitle")}</h2>
          <p>{t("auth.forgotText")}</p>
        </div>

        {message ? (
          <div className={`auth-message ${messageType}`}>
            <i
              className={
                messageType === "success"
                  ? "fa-solid fa-circle-check"
                  : "fa-solid fa-circle-exclamation"
              }
            />
            <span>{message}</span>
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <i className="fa-regular fa-circle-user" />
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? t("auth.sending") : t("auth.sendRequest")}
          </button>

          <div className="auth-bottom-link">
            <Link to="/login">{t("auth.backToLogin")}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
