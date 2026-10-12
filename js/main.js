/* TENFOLD — Website 2.0 interactions */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Active page in the nav
  ------------------------------------------------------------------ */
  const page = document.body.dataset.page;
  $$("[data-page]").forEach((a) => a.classList.toggle("is-active", a.dataset.page === page));

  /* ------------------------------------------------------------------
     Hero — crossfade through a myriad of photos (and video, if any)
  ------------------------------------------------------------------ */
  const hero = $("[data-slideshow]");
  if (hero) {
    const slides = $$("img, video", hero);
    let i = 0;
    const show = (n) => {
      slides.forEach((s, k) => {
        const on = k === n;
        s.classList.toggle("is-active", on);
        if (s.tagName === "VIDEO") { on ? s.play().catch(() => {}) : s.pause(); }
      });
    };
    show(0);
    if (slides.length > 1 && !reduceMotion) {
      const interval = Number(hero.dataset.interval) || 4200;
      setInterval(() => { i = (i + 1) % slides.length; show(i); }, interval);
    }
  }

  /* ------------------------------------------------------------------
     "What inspires us" — arrows scroll the carousel one card at a time
  ------------------------------------------------------------------ */
  $$("[data-carousel]").forEach((wrap) => {
    const track = $(".carousel", wrap);
    if (!track) return;
    const step = () => {
      const card = $(".card", track);
      return card ? card.getBoundingClientRect().width + 9 : 260;
    };
    $$("[data-prev]", wrap).forEach((b) => b.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" })));
    $$("[data-next]", wrap).forEach((b) => b.addEventListener("click", () => track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" })));
  });

  /* ------------------------------------------------------------------
     Mobile menu
  ------------------------------------------------------------------ */
  const menu = $("#menu");
  const burger = $("[data-menu-toggle]");
  const setMenu = (open) => {
    if (!menu || !burger) return;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
  };
  burger?.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
  $$("[data-menu-close]").forEach((el) => el.addEventListener("click", () => setMenu(false)));

  /* ------------------------------------------------------------------
     Contact panel — pops out over the current page, no page load
  ------------------------------------------------------------------ */
  const panel = $("#contact-panel");
  let lastFocus = null;
  const openPanel = () => {
    if (!panel) return;
    lastFocus = document.activeElement;
    setMenu(false);
    document.body.classList.add("panel-open", "is-locked");
    panel.setAttribute("aria-hidden", "false");
    setTimeout(() => $("input", panel)?.focus(), 400);
  };
  const closePanel = () => {
    if (!panel) return;
    document.body.classList.remove("panel-open", "is-locked");
    panel.setAttribute("aria-hidden", "true");
    lastFocus?.focus?.();
  };
  $$("[data-open-contact]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); openPanel(); }));
  $$("[data-close-contact]").forEach((el) => el.addEventListener("click", closePanel));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.body.classList.contains("panel-open")) closePanel();
    else if (menu?.classList.contains("is-open")) setMenu(false);
  });
  // deep link: index.html#contact opens the panel
  if (location.hash === "#contact") openPanel();

  /* ------------------------------------------------------------------
     Forms — no backend yet; validate, then confirm inline.
     Point `action` at Formspree / Netlify Forms etc. when ready.
  ------------------------------------------------------------------ */
  $$("form.form").forEach((form) => {
    const select = $("select", form);
    select?.addEventListener("change", () => select.classList.toggle("has-value", !!select.value));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      form.classList.add("is-sent");
      const ok = $(".form__ok", form);
      if (ok) ok.textContent = "Thank you. We have received your message and will reply shortly.";
      if (panel && panel.contains(form)) setTimeout(closePanel, 2400);
    });
  });

  /* ------------------------------------------------------------------
     Misc
  ------------------------------------------------------------------ */
  $$(".year").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
