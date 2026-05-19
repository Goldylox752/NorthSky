// index.js
// Simple Express server for Skymaster X1 funnel tracking

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES
========================= */
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Skymaster X1",
    timestamp: Date.now(),
  });
});

/* =========================
   HOT LEAD TRACKING API
========================= */
app.post("/api/hot-lead", async (req, res) => {
  try {
    const lead = {
      ...req.body,
      ip:
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      receivedAt: new Date().toISOString(),
    };

    console.log("\n==============================");
    console.log("🔥 NEW SKYMASTER EVENT");
    console.log("==============================");
    console.log(JSON.stringify(lead, null, 2));

    // Example integrations:
    // Save to database
    // Send to Discord webhook
    // Push into CRM
    // Trigger automations
    // Send Slack alerts

    res.status(200).json({
      success: true,
      message: "Lead tracked",
    });
  } catch (err) {
    console.error("Lead tracking error:", err);

    res.status(500).json({
      success: false,
      error: "Tracking failed",
    });
  }
});

/* =========================
   FALLBACK ROUTE
========================= */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Skymaster X1 running on port ${PORT}`);
});