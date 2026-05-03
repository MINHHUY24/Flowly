import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

export async function initSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const response = await fetch("/api/config");

  if (!response.ok) {
    throw new Error("Không tải được cấu hình Supabase");
  }

  const config = await response.json();

  supabaseClient = createClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
  );

  return supabaseClient;
}
