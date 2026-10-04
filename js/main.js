/* TENFOLD INDUSTRIES — Website 2.0 interactions */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     01. Masthead — two-stage scroll (collage → loop)
     Writes --p (0..1) onto the section as the sticky viewport scrolls.
  ------------------------------------------------------------------ */
  const masthead = $("#masthead");
  const loop = $("#loop");
  const video = loop ? $(".loop__video", loop) : null;

  let ticking = false;
  const updateMasthead = () => {
    if (!masthead) return;
    const rect = masthead.getBoundingClientRect();
    const total = masthead.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -rect.top / total));
    masthead.style.setProperty("--p", p.toFixed(4));
    masthead.classList.toggle("stage-2", p > 0.5);
    // pause the frame loop when it's not visible, to save battery
    const visible = rect.bottom > 0 && rect.top < window.innerHeight;
    loop.classList.toggle("is-paused", !visible);
    if (video && loop.classList.contains("has-video")) {
      if (visible && p > 0.25 && video.paused) video.play().catch(() => {});
      if ((!visible || p < 0.2) && !video.paused) video.pause();
    }
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateMasthead(); ticking = false; });
  };
  if (masthead) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateMasthead();
  }

  // If real footage exists at assets/video/drape-loop.mp4 it replaces the image loop.
  if (video && !reduceMotion) {
    video.addEventListener("canplay", () => loop.classList.add("has-video"), { once: true });
    video.addEventListener("error", () => loop.classList.remove("has-video"), { once: true });
    const src = $("source", video);
    if (src) src.addEventListener("error", () => loop.classList.remove("has-video"));
    try { video.load(); } catch (_) {}
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
  ------------------------------------------------------------------ */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ------------------------------------------------------------------
     Nav theme (blocks carry data-theme) + active page
  ------------------------------------------------------------------ */
  const nav = $("#nav");
  const dock = $("#dock");
  const blocks = $$("[data-theme]");
  const page = document.body.dataset.page;

  // current page is marked in the top nav, mobile menu and bottom dock
  $$("[data-page]").forEach((a) => a.classList.toggle("is-active", a.dataset.page === page));

  const themeAt = () => {
    // theme is decided by whichever block sits under the nav bar
    const y = 36;
    let current = blocks[0];
    for (const s of blocks) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { current = s; break; }
    }
    const theme = (current && current.dataset.theme) || "light";
    nav.classList.toggle("is-light", theme !== "dark");
    nav.classList.toggle("is-scrolled", window.scrollY > 24);

    // hide the dock while the full footer wordmark is in view
    const foot = $(".footer__bottom");
    if (foot) dock.classList.toggle("is-hidden", foot.getBoundingClientRect().top < window.innerHeight - 20);
  };
  window.addEventListener("scroll", () => requestAnimationFrame(themeAt), { passive: true });
  window.addEventListener("resize", themeAt);
  themeAt();

  /* ------------------------------------------------------------------
     Mobile menu
  ------------------------------------------------------------------ */
  const menu = $("#menu");
  const burger = $("[data-menu-toggle]");
  const setMenu = (open) => {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
    if (open) nav.classList.remove("is-light");
    else themeAt();
  };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
  $$("[data-menu-close]").forEach((el) => el.addEventListener("click", () => setMenu(false)));

  /* ------------------------------------------------------------------
     03. Macro-zoom modules in the archive
     Pointer position becomes transform-origin; hover / tap zooms.
  ------------------------------------------------------------------ */
  const canHover = window.matchMedia("(hover: hover)").matches;
  $$(".swatch.zoom").forEach((tile) => {
    tile.style.setProperty("--z", tile.dataset.zoom || 2.2);
    const img = $("img", tile);
    const track = (e) => {
      const r = tile.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      img.style.setProperty("--mx", `${Math.min(100, Math.max(0, x))}%`);
      img.style.setProperty("--my", `${Math.min(100, Math.max(0, y))}%`);
    };
    if (canHover) {
      tile.addEventListener("pointerenter", (e) => { track(e); tile.classList.add("is-zooming"); });
      tile.addEventListener("pointermove", track);
      tile.addEventListener("pointerleave", () => tile.classList.remove("is-zooming"));
    } else {
      tile.addEventListener("click", (e) => {
        track(e);
        const on = tile.classList.toggle("is-zooming");
        if (on) $$(".swatch.is-zooming").forEach((t) => t !== tile && t.classList.remove("is-zooming"));
      });
    }
  });

  /* ------------------------------------------------------------------
     Lightbox (Contact us)
  ------------------------------------------------------------------ */
  const lightbox = $("#lightbox");
  let lastFocus = null;
  const openLightbox = () => {
    lastFocus = document.activeElement;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    setTimeout(() => $("input", lightbox)?.focus(), 350);
  };
  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    if (!menu.classList.contains("is-open")) document.body.classList.remove("is-locked");
    lastFocus?.focus?.();
  };
  $$("[data-open-lightbox]").forEach((b) => b.addEventListener("click", openLightbox));
  $$("[data-close-lightbox]").forEach((b) => b.addEventListener("click", closeLightbox));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (lightbox.classList.contains("is-open")) closeLightbox();
      else if (menu.classList.contains("is-open")) setMenu(false);
    }
  });

  /* ------------------------------------------------------------------
     Forms — no backend yet; validate, then confirm inline.
     Wire `action` to a form endpoint (Formspree, Netlify, etc.) later.
  ------------------------------------------------------------------ */
  const confirmations = {
    "form-consult": "Thank you. We will be in touch within two working days to confirm your consultation.",
    "form-kit": "Thank you. Your swatch kit will be dispatched within five working days.",
    "form-contact": "Thank you. We have received your message and will reply shortly.",
  };
  $$("form.form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const ok = $(".form__ok", form);
      form.classList.add("is-sent");
      if (ok) ok.textContent = confirmations[form.id] || "Thank you — we have received your request.";
      if (form.id === "form-contact") setTimeout(closeLightbox, 2600);
    });
  });

  /* ------------------------------------------------------------------
     Misc
  ------------------------------------------------------------------ */
  $$(".year").forEach((el) => (el.textContent = new Date().getFullYear()));

  // In-page anchors (if any) scroll smoothly, accounting for the fixed nav
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", `#${id}`);
    });
  });
})();
