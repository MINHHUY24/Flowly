import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { initSupabaseClient } from "../api/supabaseClient";
import { useBodyClass } from "../hooks/useBodyClass";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  useBodyClass("auth-page");

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [messageType, setMessageType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let subscription;

    async function initRecovery() {
      try {
        const client = await initSupabaseClient();

        const { data } = client.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
            setReady(true);
          }
        });

        subscription = data.subscription;

        const { data: sessionData } = await client.auth.getSession();

        if (sessionData.session) {
          setReady(true);
        }
      } catch (error) {
        console.log("Reset password init error:", error);
      }
    }

    initRecovery();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    setMessage("");
    setMessageType("");

    if (!cleanPassword || !cleanConfirmPassword) {
      setMessageType("error");
      setMessage(t("auth.missingRegister"));
      return;
    }

    if (cleanPassword.length < 6) {
      setMessageType("error");
      setMessage(t("auth.passwordMin"));
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setMessageType("error");
      setMessage(t("auth.passwordMismatch"));
      return;
    }

    try {
      setLoading(true);

      const client = await initSupabaseClient();

      const { error } = await client.auth.updateUser({
        password: cleanPassword,
      });

      if (error) {
        console.log("Update password error:", error);
        setMessageType("error");
        setMessage(t("auth.updatePasswordError"));
        return;
      }

      await client.auth.signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.log("Reset password error:", error);
      setMessageType("error");
      setMessage(t("auth.updatePasswordError"));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card forgot-card">
          <div className="auth-logo">
            <img src="/assets/images/logo.png" alt="Flowly Logo" />
          </div>

          <div className="forgot-text">
            <h2>{t("auth.resetPasswordTitle")}</h2>
            <p>{t("auth.resetPasswordText")}</p>
          </div>

          <div className="auth-message success">
            <i className="fa-solid fa-circle-info" />
            <span>{t("auth.loadingResetLink")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card forgot-card">
        <div className="auth-logo">
          <img src="/assets/images/logo.png" alt="Flowly Logo" />
        </div>

        <div className="forgot-text">
          <h2>{t("auth.resetPasswordTitle")}</h2>
          <p>{t("auth.resetPasswordText")}</p>
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
            <i className="fa-solid fa-key" />
            <input
              type="password"
              placeholder={t("auth.newPassword")}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="auth-input-group">
            <i className="fa-solid fa-key" />
            <input
              type="password"
              placeholder={t("auth.confirmPassword")}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? t("auth.saving") : t("auth.updatePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
