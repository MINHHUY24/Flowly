import { Link } from "react-router-dom";

import { useBodyClass } from "../hooks/useBodyClass";

export default function DeleteDataPage() {
  useBodyClass("auth-page");

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/assets/images/logo.png" alt="Flowly Logo" />
        </div>

        <div className="forgot-text">
          <h2>Delete user data</h2>
          <p>
            To request deletion of your Flowly account data, please contact us
            at leminhhuy061@gmail.com with the email address linked to your
            account. We will process your request as soon as possible.
          </p>
        </div>

        <div className="auth-bottom-link">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
