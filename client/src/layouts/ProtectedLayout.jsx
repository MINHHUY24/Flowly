import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { requireLogin } from "../api/apiClient";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function ProtectedLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const nextUser = await requireLogin();
        if (isMounted) {
          setUser(nextUser);
        }
      } catch (error) {
        console.log("Auth error:", error);
        window.location.href = "/login";
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !user) {
    return null;
  }

  return (
    <>
      <Header user={user} />

      <main>
        <Sidebar />
        <Outlet context={{ user }} />
      </main>
    </>
  );
}
