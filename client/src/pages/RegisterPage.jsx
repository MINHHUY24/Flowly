import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { initSupabaseClient } from "../api/supabaseClient";
import { useBodyClass } from "../hooks/useBodyClass";

export default function RegisterPage() {
  const { t } = useTranslation();
  useBodyClass("auth-page");

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      return;
    }

    if (password.length < 6) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    try {
      const client = await initSupabaseClient();
      const { error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: email.trim().split("@")[0],
          },
        },
      });

      if (error) {
        return;
      }

      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card register-card">
        <div className="auth-logo">
          <img src="/assets/images/logo.png" alt="Flowly Logo" />
        </div>

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

          <div className="auth-input-group">
            <i className="fa-solid fa-key" />
            <input
              type="password"
              placeholder={t("auth.password")}
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

          <button className="auth-btn" type="submit">
            {t("auth.register")}
          </button>

          <div className="auth-bottom-link">
            <span>{t("auth.alreadyHaveAccount")}</span>
            <Link to="/login">{t("auth.login")}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
