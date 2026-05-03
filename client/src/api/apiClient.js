import { initSupabaseClient } from "./supabaseClient";

export async function requireLogin() {
  const client = await initSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error || !data.session) {
    window.location.href = "/login";
    return null;
  }

  return data.session.user;
}

export async function getAccessToken() {
  const client = await initSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error || !data.session) {
    window.location.href = "/login";
    return null;
  }

  return data.session.access_token;
}

export async function apiRequest(url, options = {}) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error("Missing access token");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        result.error ||
        result.details ||
        text ||
        `API error ${response.status}`,
    );
  }

  return result;
}
