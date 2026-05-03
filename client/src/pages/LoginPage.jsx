import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { initSupabaseClient } from "../api/supabaseClient";
import { useBodyClass } from "../hooks/useBodyClass";

export default function LoginPage() {
  const { t } = useTranslation();
  useBodyClass("login-page");

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      const client = await initSupabaseClient();
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        return;
      }

      navigate("/confirm-login");
    } catch (error) {
      console.log(error);
    }
  }

  async function handleGoogleLogin() {
    try {
      const client = await initSupabaseClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/confirm-login`,
        },
      });

      if (error) {
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">
          <img src="/assets/images/logo.png" alt="Flowly Logo" />
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <i className="fa-regular fa-circle-user" />
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="login-input-group">
            <i className="fa-solid fa-key" />
            <input
              type="password"
              placeholder={t("auth.password")}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="login-links">
            <Link to="/register">{t("auth.register")}</Link>
            <Link to="/forgot-password">{t("auth.forgotPassword")}</Link>
          </div>

          <button className="login-btn" type="submit">
            {t("auth.login")}
          </button>
        </form>

        <div className="login-divider">OR</div>

        <div className="social-login">
          <button
            className="social-btn google-btn"
            type="button"
            onClick={handleGoogleLogin}
          >
            <i className="fa-brands fa-google" />
            <span>{t("auth.loginWithGoogle")}</span>
          </button>

          <button className="social-btn facebook-btn" type="button">
            <i className="fa-brands fa-facebook" />
            <span>{t("auth.loginWithFacebook")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
