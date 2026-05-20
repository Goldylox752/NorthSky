import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   PLAN PERMISSIONS
=============================== */
const PERMISSIONS = {
  basic: ["tools"],
  pro: ["tools", "leads", "roof_flow"],
  enterprise: ["tools", "leads", "roof_flow", "marketplace", "admin"],
};

/* ===============================
   ACCESS CHECK HANDLER
=============================== */
export default async function handler(req, res) {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        access: false,
        error: "Missing user id",
      });
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan, status, user_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        access: false,
        error: error.message,
      });
    }

    if (!data) {
      return res.json({
        access: false,
      });
    }

    const plan = data.plan || "basic";

    return res.json({
      access: true,
      plan,
      modules: PERMISSIONS[plan] || [],
    });
  } catch (err) {
    return res.status(500).json({
      access: false,
      error: err?.message || "Server error",
    });
  }
}