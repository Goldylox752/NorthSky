// index.js
// NorthSky Enterprise Pipeline Platform — Supabase + Stripe Integration

const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const Stripe = require("stripe");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================
   SUPABASE INIT
   Set these in your .env file:
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
========================================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* =========================================
   STRIPE INIT
   Set these in your .env file:
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
========================================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* =========================================
   MIDDLEWARE
========================================= */
// Raw body needed for Stripe webhook signature verification
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================
   STATIC FRONTEND
========================================= */
app.use(express.static(path.join(__dirname, "public")));

/* =========================================
   MEMORY FALLBACK (if Supabase is unreachable)
========================================= */
const cache = {
  pageViews: 0,
  events: [],
};

/* =========================================
   GLOBAL VISITOR TRACKING
========================================= */
app.use((req, res, next) => {
  cache.pageViews++;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌐 VISITOR");
  console.log("URL:", req.originalUrl);
  console.log("IP:", req.headers["x-forwarded-for"] || req.socket.remoteAddress);
  console.log("TIME:", new Date().toISOString());

  next();
});

/* =========================================
   HEALTH CHECK
========================================= */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    app: "NorthSky Elite",
    uptime: process.uptime(),
    pageViews: cache.pageViews,
    timestamp: Date.now(),
    integrations: {
      supabase: !!process.env.SUPABASE_URL,
      stripe: !!process.env.STRIPE_SECRET_KEY,
    },
  });
});

/* =========================================
   ANALYTICS EVENT TRACKING → SUPABASE
   Supabase table: events
   Columns: id, event_name, metadata (jsonb),
            ip, user_agent, created_at
========================================= */
app.post("/api/track", async (req, res) => {
  try {
    const event = {
      event_name: req.body.event || "page_view",
      metadata: req.body,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      user_agent: req.headers["user-agent"],
      created_at: new Date().toISOString(),
    };

    // Write to Supabase
    const { error } = await supabase.from("events").insert([event]);

    if (error) {
      console.error("Supabase event error:", error.message);
      cache.events.push(event); // fallback to memory
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 EVENT TRACKED");
    console.log(JSON.stringify(event, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ success: false, error: "Tracking failed" });
  }
});

/* =========================================
   VIP DEMO REQUESTS → SUPABASE
   Supabase table: vip_leads
   Columns: id, name, email, company,
            ip, user_agent, lead_score,
            source, created_at
========================================= */
app.post("/api/demo-request", async (req, res) => {
  try {
    const { name, email, company } = req.body;

    if (!name || !email || !company) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const lead = {
      name,
      email,
      company,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      user_agent: req.headers["user-agent"],
      lead_score: "HIGH VALUE",
      source: "northsky_elite",
      created_at: new Date().toISOString(),
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from("vip_leads")
      .insert([lead])
      .select()
      .single();

    if (error) {
      console.error("Supabase lead error:", error.message);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💎 VIP LEAD CAPTURED");
    console.log(JSON.stringify(lead, null, 2));

    res.json({
      success: true,
      message: "VIP request submitted",
      id: data?.id || null,
    });
  } catch (err) {
    console.error("VIP request error:", err);
    res.status(500).json({ success: false, error: "Submission failed" });
  }
});

/* =========================================
   STRIPE — CREATE CHECKOUT SESSION
   POST /api/stripe/checkout
   Body: { priceId, email, companyName }

   Returns: { url } — redirect the user to this
========================================= */
app.post("/api/stripe/checkout", async (req, res) => {
  try {
    const { priceId, email, companyName } = req.body;

    if (!priceId) {
      return res.status(400).json({ success: false, error: "Missing priceId" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        company: companyName || "",
        source: "northsky_elite",
      },
      success_url: `${process.env.APP_URL || "http://localhost:" + PORT}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || "http://localhost:" + PORT}/pricing`,
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💳 STRIPE CHECKOUT CREATED");
    console.log("Session:", session.id);
    console.log("Email:", email);

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================================
   STRIPE — CUSTOMER PORTAL
   POST /api/stripe/portal
   Body: { customerId }

   Lets existing customers manage billing
========================================= */
app.post("/api/stripe/portal", async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, error: "Missing customerId" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL || "http://localhost:" + PORT}/dashboard`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================================
   STRIPE — WEBHOOK HANDLER
   POST /api/stripe/webhook
   Verifies signature and syncs to Supabase

   Supabase table: subscriptions
   Columns: id, stripe_customer_id,
            stripe_subscription_id,
            status, plan, current_period_end,
            created_at, updated_at
========================================= */
app.post("/api/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚡ STRIPE WEBHOOK:", event.type);

  try {
    switch (event.type) {

      // New subscription created
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        await supabase.from("subscriptions").upsert(
          {
            stripe_customer_id: sub.customer,
            stripe_subscription_id: sub.id,
            status: sub.status,
            plan: sub.items?.data?.[0]?.price?.nickname || "unknown",
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );
        console.log("✅ Subscription synced:", sub.id, sub.status);
        break;
      }

      // Subscription cancelled
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);
        console.log("❌ Subscription canceled:", sub.id);
        break;
      }

      // Payment succeeded
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        await supabase.from("payments").insert([
          {
            stripe_customer_id: invoice.customer,
            stripe_invoice_id: invoice.id,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            status: "paid",
            created_at: new Date().toISOString(),
          },
        ]);
        console.log("💰 Payment logged:", invoice.id, invoice.amount_paid / 100);
        break;
      }

      // Payment failed
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn("🚨 Payment failed for customer:", invoice.customer);
        // TODO: trigger dunning email via your email provider
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }

  res.json({ received: true });
});

/* =========================================
   LIVE DASHBOARD DATA → SUPABASE
========================================= */
app.get("/api/stats", async (req, res) => {
  try {
    const [leadsRes, eventsRes, subsRes] = await Promise.all([
      supabase.from("vip_leads").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("subscriptions").select("*").eq("status", "active"),
    ]);

    const latestLead = await supabase
      .from("vip_leads")
      .select("name, company, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    res.json({
      success: true,
      stats: {
        pageViews: cache.pageViews,
        vipRequests: leadsRes.count || 0,
        trackedEvents: eventsRes.count || 0,
        activeSubscriptions: subsRes.data?.length || 0,
        latestLead: latestLead.data || null,
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ success: false, error: "Stats unavailable" });
  }
});

/* =========================================
   FALLBACK ROUTE
========================================= */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================================
   START SERVER
========================================= */
app.listen(PORT, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 NORTHSKY ELITE ACTIVE");
  console.log(`🌍 PORT: ${PORT}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
});
