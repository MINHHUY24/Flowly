const { createClient } = require("@supabase/supabase-js");

function createSupabaseServerClient(accessToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );
}

module.exports = {
  createSupabaseServerClient,
};
