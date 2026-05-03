const { createSupabaseServerClient } = require("../services/supabaseServer");

async function requireSupabaseUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.replace("Bearer ", "");

    if (!accessToken) {
      return res.status(401).json({
        error: "Missing access token",
      });
    }

    const supabase = createSupabaseServerClient(accessToken);

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return res.status(401).json({
        error: "Invalid or expired session",
      });
    }

    req.supabase = supabase;
    req.user = data.user;

    next();
  } catch (error) {
    console.log("Auth middleware error:", error);

    return res.status(500).json({
      error: "Authentication failed",
    });
  }
}

module.exports = requireSupabaseUser;
