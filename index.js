// index.js – NorthSky landing page interactions

(function() {
  "use strict";

  // ---------- Scroll Reveal ----------
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll("[data-reveal]").forEach((el, idx) => {
    // staggered delay (optional)
    el.style.transitionDelay = `${(idx % 4) * 60}ms`;
    revealObserver.observe(el);
  });

  // ---------- Number Counters ----------
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute("data-count"));
          const suffix = el.getAttribute("data-suffix") || "";
          const prefix = el.getAttribute("data-prefix") || "";
          const display = el.getAttribute("data-display");
          if (display) {
            // static text – no animation
            countObserver.unobserve(el);
            return;
          }
          const duration = 1600;
          const startTime = performance.now();

          function animate(now) {
            const p = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            const current = Math.round(ease * target);
            el.textContent = prefix + current + suffix;
            if (p < 1) requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
          countObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll("[data-count]").forEach((el) => {
    countObserver.observe(el);
  });

  // ---------- Hero Dashboard Counters (fixed values) ----------
  function runHeroCounter(id, target, suffix, duration = 1800, delay = 800) {
    const el = document.getElementById(id);
    if (!el) return;
    setTimeout(() => {
      const start = performance.now();
      function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const value = Math.round(ease * target);
        el.textContent = value + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
  }

  runHeroCounter("counter-close", 41, "%", 1800, 800);
  runHeroCounter("counter-leads", 127, "", 1400, 800);

  // ---------- Feature Tabs ----------
  window.switchFeat = function(index) {
    // update feature buttons
    const features = document.querySelectorAll(".feat");
    const panels = document.querySelectorAll(".preview-panel");
    if (!features.length || !panels.length) return;

    features.forEach((feat) => feat.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));

    const targetFeat = document.querySelector(`.feat[data-feat="${index}"]`);
    const targetPanel = document.getElementById(`feat-${index}`);
    if (targetFeat) targetFeat.classList.add("active");
    if (targetPanel) targetPanel.classList.add("active");
  };

  // attach click handlers to .feat elements (in case they are not using onclick)
  document.querySelectorAll(".feat").forEach((feat) => {
    const idx = feat.getAttribute("data-feat");
    if (idx !== null && !feat.hasAttribute("data-listener")) {
      feat.setAttribute("data-listener", "true");
      feat.addEventListener("click", () => window.switchFeat(parseInt(idx)));
    }
  });

  // ---------- FAQ Toggle ----------
  window.toggleFaq = function(btn) {
    const item = btn.closest(".faq-item");
    if (!item) return;
    const isOpen = item.classList.contains("open");
    // close all others
    document.querySelectorAll(".faq-item.open").forEach((faq) => {
      faq.classList.remove("open");
    });
    if (!isOpen) item.classList.add("open");
  };

  // attach listeners to FAQ buttons (in case onclick is missing)
  document.querySelectorAll(".faq-btn").forEach((btn) => {
    if (!btn.hasAttribute("data-faq-listener")) {
      btn.setAttribute("data-faq-listener", "true");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        window.toggleFaq(btn);
      });
    }
  });

  // ensure first FAQ item stays open by default (class "open" already in HTML)
  // but if none is open, open the first one (optional)
  if (!document.querySelector(".faq-item.open")) {
    const first = document.querySelector(".faq-item");
    if (first) first.classList.add("open");
  }

  // ---------- Smooth Scroll ----------
  window.scrollTo = function(id) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // handle navigation links with # (optional)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function(e) {
      const targetId = this.getAttribute("href").slice(1);
      if (targetId && document.getElementById(targetId)) {
        e.preventDefault();
        document.getElementById(targetId).scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // ---------- Demo / CTA Handler ----------
  window.openDemo = function() {
    // Replace with actual booking link (Calendly, etc.)
    alert("Connect your Calendly or booking link here.");
  };

  // attach demo handlers to any .btn-primary or .btn-white that have onclick="openDemo()"
  // but also handle them without inline onclick (for safety)
  const demoButtons = document.querySelectorAll(
    ".btn-primary, .btn-white, .nav-cta"
  );
  demoButtons.forEach((btn) => {
    if (!btn.hasAttribute("data-demo-listener")) {
      btn.setAttribute("data-demo-listener", "true");
      btn.addEventListener("click", (e) => {
        // avoid double alert if onclick is already present
        if (!btn.hasAttribute("onclick")) {
          e.preventDefault();
          window.openDemo();
        }
      });
    }
  });
})();