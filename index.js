(() => {
  "use strict";

  // =========================================
  // CONFIG
  // =========================================
  const CONFIG = {
    demoUrl: "https://exchange-8gxt.onrender.com",
    animationDuration: 1600,
    revealThreshold: 0.12
  };

  // =========================================
  // HELPERS
  // =========================================
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // =========================================
  // SCROLL REVEAL
  // =========================================
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("in");
        obs.unobserve(entry.target);
      });
    },
    { threshold: CONFIG.revealThreshold }
  );

  $$("[data-reveal]").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 5) * 70}ms`;
    revealObserver.observe(el);
  });

  // =========================================
  // COUNTERS
  // =========================================
  const animateValue = ({
    el,
    target = 0,
    prefix = "",
    suffix = "",
    duration = CONFIG.animationDuration
  }) => {
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);

      el.textContent = `${prefix}${value}${suffix}`;

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;

        const target = Number(el.dataset.count || 0);
        const prefix = el.dataset.prefix || "";
        const suffix = el.dataset.suffix || "";

        if (el.dataset.display) {
          el.textContent = el.dataset.display;
          obs.unobserve(el);
          return;
        }

        animateValue({ el, target, prefix, suffix });
        obs.unobserve(el);
      });
    },
    { threshold: 0.45 }
  );

  $$("[data-count]").forEach(el => counterObserver.observe(el));

  // =========================================
  // HERO METRICS
  // =========================================
  const heroMetrics = [
    { id: "counter-close", target: 41, suffix: "%" },
    { id: "counter-leads", target: 127, suffix: "" }
  ];

  heroMetrics.forEach((m, i) => {
    const el = document.getElementById(m.id);
    if (!el) return;

    setTimeout(() => {
      animateValue({
        el,
        target: m.target,
        suffix: m.suffix,
        duration: 1800
      });
    }, 700 + i * 180);
  });

  // =========================================
  // FEATURE SWITCHER
  // =========================================
  const featureItems = $$(".feat");
  const previewPanels = $$(".preview-panel");

  function switchFeature(index) {
    featureItems.forEach(i => i.classList.remove("active"));
    previewPanels.forEach(p => p.classList.remove("active"));

    const activeItem = document.querySelector(`.feat[data-feat="${index}"]`);
    const activePanel = document.getElementById(`feat-${index}`);

    activeItem?.classList.add("active");
    activePanel?.classList.add("active");
  }

  featureItems.forEach(item => {
    if (item.dataset.bound) return;
    item.dataset.bound = "1";

    item.addEventListener("click", () => {
      switchFeature(item.dataset.feat);
    });
  });

  // =========================================
  // FAQ
  // =========================================
  const faqItems = $$(".faq-item");

  function toggleFaq(item) {
    const isOpen = item.classList.contains("open");

    faqItems.forEach(f => f.classList.remove("open"));

    if (!isOpen) item.classList.add("open");
  }

  faqItems.forEach(item => {
    const btn = $(".faq-btn", item);
    if (!btn || btn.dataset.bound) return;

    btn.dataset.bound = "1";

    btn.addEventListener("click", e => {
      e.preventDefault();
      toggleFaq(item);
    });
  });

  if (faqItems.length && !$(".faq-item.open")) {
    faqItems[0].classList.add("open");
  }

  // =========================================
  // SMOOTH SCROLL
  // =========================================
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      const id = link.getAttribute("href")?.slice(1);
      const target = id ? document.getElementById(id) : null;

      if (!target) return;

      e.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  // =========================================
  // CTA BUTTONS
  // =========================================
  function openDemo() {
    window.open(CONFIG.demoUrl, "_blank", "noopener,noreferrer");
  }

  $$(".btn-primary, .btn-white, .nav-cta").forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", e => {
      e.preventDefault();
      openDemo();
    });
  });

  // =========================================
  // NAVBAR
  // =========================================
  const navbar = document.querySelector("header");

  function updateNavbar() {
    if (!navbar) return;

    const scrolled = window.scrollY > 20;

    navbar.classList.toggle("bg-black/80", scrolled);
    navbar.classList.toggle("backdrop-blur-xl", scrolled);
    navbar.classList.toggle("border-white/10", scrolled);
  }

  window.addEventListener("scroll", updateNavbar, { passive: true });
  updateNavbar();

})();