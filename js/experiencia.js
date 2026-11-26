/* Saúl Poveda · Experiencia cinematográfica
 * 1) Lo básico (menú, formulario, año) funciona siempre.
 * 2) La capa de cine (GSAP + ScrollTrigger + Lenis) solo se activa si las librerías cargan
 *    y el usuario no ha pedido reducir el movimiento. Sin ella, la página se lee entera. */
(function () {
  "use strict";

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ================= BÁSICO ================= */

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Menú móvil
  const menu = $("#menu-movil");
  const menuBtn = $("#menu-btn");
  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    (open ? menu.querySelector("a") : menuBtn).focus();
  }
  if (menu && menuBtn) {
    menuBtn.addEventListener("click", () => setMenu(menu.hidden));
    $$("a, [data-menu-close]", menu).forEach((el) => el.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });
  }

  // Formulario (Formspree)
  const form = $("#formulario-contacto");
  if (form) {
    const status = $("#form-status");
    const btn = form.querySelector(".btn-enviar");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fields = $$("input, select, textarea", form);
      let firstInvalid = null;
      fields.forEach((f) => {
        const ok = f.checkValidity();
        f.setAttribute("aria-invalid", String(!ok));
        if (!ok && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) {
        status.textContent = firstInvalid.type === "email"
          ? "Revisa el email: escríbelo como nombre@dominio.com."
          : "Falta tu nombre o tu email.";
        firstInvalid.focus();
        return;
      }
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      status.textContent = "Enviando…";
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("envío fallido");
        form.reset();
        fields.forEach((f) => f.removeAttribute("aria-invalid"));
        status.textContent = "Mensaje recibido. Te respondo en menos de 24 h.";
      } catch (err) {
        status.textContent = "No se ha podido enviar. Prueba de nuevo o escríbeme por WhatsApp.";
      } finally {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
      }
    });
  }

  // Navegación: se oculta al bajar, vuelve al subir
  const nav = $("#nav");
  let lastY = 0;
  function onScrollNav(y) {
    if (!nav) return;
    nav.classList.toggle("is-solid", y > 80);
    nav.classList.toggle("is-hidden", y > 400 && y > lastY);
    lastY = y;
  }

  // HUD: código de tiempo (24 fps) según el avance por la página
  // Barra de progreso de lectura
  const prog = $("#hud-progress");
  function onScrollHud(y) {
    if (!prog) return;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    prog.style.transform = `scaleX(${Math.min(1, y / max)})`;
  }

  function onScroll(y) { onScrollNav(y); onScrollHud(y); }
  addEventListener("scroll", () => { if (!window.__lenis) onScroll(scrollY); }, { passive: true });

  // Escena actual en el HUD (funciona también sin GSAP)
  const sceneLabel = $("#hud-scene");
  if (sceneLabel && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) sceneLabel.textContent = en.target.dataset.scene; });
    }, { rootMargin: "-45% 0px -45% 0px" });
    $$("[data-scene]").forEach((s) => io.observe(s));
  }

  /* ================= CINE ================= */

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  if (reduce || !gsap || !ST) {
    root.classList.remove("cine");
    return;
  }

  root.classList.add("cine");
  gsap.registerPlugin(ST);

  // Scroll suave
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    window.__lenis = lenis;
    lenis.on("scroll", (e) => { ST.update(); onScroll(e.scroll); });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Enlaces internos con desplazamiento suave
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 && $(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      else target.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", id);
    });
  });


  /* ---------- Apertura ---------- */
  const intro = $("#intro");
  const heroImg = $(".hero__media img");
  const heroLines = $$(".hero__title .line__in");
  const heroIn = $$("[data-hero-in]");
  let seen = false;
  try { seen = sessionStorage.getItem("sp-intro") === "1"; } catch (e) {}

  gsap.set(heroLines, { yPercent: 110 });
  gsap.set(heroIn, { autoAlpha: 0, y: 24 });
  gsap.set(heroImg, { scale: 1.3 });
  const heroPortrait = $("[data-hero-portrait]");
  if (heroPortrait) gsap.set(heroPortrait, { clipPath: "inset(100% 0% 0% 0%)", y: 40 });
  const playIntro = !!intro && !seen;
  if (lenis && playIntro) lenis.stop();

  const open = gsap.timeline({
    defaults: { ease: "expo.out" },
    onComplete: () => {
      if (intro) intro.remove();
      try { sessionStorage.setItem("sp-intro", "1"); } catch (e) {}
    },
  });

  if (playIntro) {
    open
      .from(".intro__title", { autoAlpha: 0, y: 20, filter: "blur(8px)", duration: 1.2 })
      .from(".intro__kicker", { autoAlpha: 0, y: 10, duration: 0.8 }, "<0.3")
      .fromTo("#intro-progress", { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: "power2.inOut" }, "<")
      .to(".intro__card", { autoAlpha: 0, scale: 0.96, filter: "blur(6px)", duration: 0.6, ease: "power2.in" }, "+=0.15")
      .set(root, { "--lb": "50vh" })
      .set(intro, { background: "transparent", pointerEvents: "none" })
      .call(() => { if (lenis) lenis.start(); })
      .to(root, { "--lb": "0px", duration: 1.6, ease: "expo.inOut" });
    intro.addEventListener("click", () => open.progress(1));
  } else {
    if (intro) intro.remove();
  }

  open
    .to(heroImg, { scale: 1.08, duration: 3, ease: "power2.out" }, playIntro ? "<" : 0)
    .to(heroLines, { yPercent: 0, duration: 1.4, stagger: 0.12 }, "<0.5")
    .to(heroIn, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 }, "<0.4");
  if (heroPortrait) open.to(heroPortrait, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.6, ease: "expo.inOut" }, "<-0.6");

  /* ---------- Escena 01: salir del hero ---------- */
  gsap.to(heroImg, { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  if (heroPortrait) gsap.to(heroPortrait, { yPercent: -25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__content, .hero__foot", { autoAlpha: 0, y: -60, ease: "none", scrollTrigger: { trigger: ".hero", start: "20% top", end: "80% top", scrub: true } });

  /* ---------- Escena 02: manifiesto palabra a palabra ---------- */
  const mText = $("#manifesto-text");
  if (mText) {
    const words = mText.textContent.trim().split(/\s+/);
    mText.setAttribute("aria-label", mText.textContent.trim());
    mText.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(" ");
    gsap.fromTo($$(".w", mText), { opacity: 0.12 }, {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: ".manifesto__pin", start: "top top", end: "+=160%", scrub: 0.6, pin: true },
    });
  }

  /* ---------- Escena 03 y otras que dependen del tamaño ---------- */
  const mm = gsap.matchMedia();

  mm.add("(min-width: 900px)", () => {
    const track = $(".strip__track");
    const dist = () => track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft);
    const stripTween = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".strip__pin", start: "top top", end: () => "+=" + dist(), scrub: 0.8, pin: true, invalidateOnRefresh: true },
    });
  });

  mm.add("(max-width: 899px)", () => {
    $$(".frame").forEach((f) => gsap.from(f, { y: 50, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: f, start: "top 85%" } }));
  });

  /* ---------- Apariciones genéricas ---------- */
  $$(".section-head, .strip__head, .case__intro, .director__text").forEach((g) => {
    const items = g.querySelectorAll(".kicker, .display, [data-rise], .lead, .case__role");
    gsap.from(items, { y: 50, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: g, start: "top 80%" } });
  });

  // Parallax suave
  $$("[data-parallax]").forEach((el) => {
    const amt = parseFloat(el.dataset.parallax) || 10;
    const target = el.querySelector("img") || el;
    gsap.fromTo(target, { yPercent: -amt / 2 }, { yPercent: amt / 2, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- Escena 04.2: travelling hacia la web de Jonathan ---------- */
  const browser = $("#browser");
  if (browser) {
    gsap.set(".dolly__pin", { perspective: 1400 });
    // 1) El navegador se acerca mientras entra en pantalla (sin huecos vacíos)
    gsap.fromTo(browser, { scale: 0.62, rotateX: 18, y: 40 }, {
      scale: 1, rotateX: 0, y: 0, ease: "none",
      scrollTrigger: { trigger: ".dolly", start: "top bottom", end: "top top", scrub: 0.6 },
    });
    gsap.fromTo(browser.querySelector("img"), { scale: 1.15 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: ".dolly", start: "top bottom", end: "top top", scrub: 0.6 },
    });
    // 2) Pausa breve con la web a pantalla y aparece el rótulo
    gsap.timeline({ scrollTrigger: { trigger: ".dolly__pin", start: "top top", end: "+=70%", scrub: 0.6, pin: true } })
      .from(".dolly__caption", { autoAlpha: 0, y: 30, duration: 0.4 })
      .to({}, { duration: 0.6 });
  }

  /* ---------- Escena 04.3: capítulos con pantalla fija ---------- */
  const shots = $$(".screen__shot");
  $$(".chapter").forEach((ch) => {
    const i = Number(ch.dataset.shot);
    ST.create({
      trigger: ch, start: "top 55%", end: "bottom 55%",
      onToggle: (self) => { if (self.isActive) shots.forEach((s, j) => s.classList.toggle("is-active", j === i)); },
    });
    gsap.from(ch.children, { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ch, start: "top 70%" } });
  });

  /* ---------- Escena 04.4: contadores ---------- */
  $$("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    const o = { v: 0 };
    el.textContent = "0";
    gsap.to(o, {
      v: end, duration: 2.2, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
      onUpdate: () => { el.textContent = Math.round(o.v); },
    });
  });
  gsap.from(".figure", { y: 60, autoAlpha: 0, duration: 1.2, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".figures", start: "top 75%" } });

  /* ---------- Escena 04.5: entregables ---------- */
  gsap.from(".deliver__text > *, .deliver__list li", { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: ".deliver", start: "top 70%" } });
  gsap.from(".phone", { y: 120, rotate: -6, autoAlpha: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".deliver", start: "top 75%" } });

  /* ---------- Escena 05: actos ---------- */
  $$(".act").forEach((act) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: act, start: "top 75%" } });
    tl.from(act.querySelector(".act__no"), { xPercent: -40, autoAlpha: 0, duration: 1.2, ease: "expo.out" })
      .from(act.querySelectorAll(".act__body > *"), { y: 40, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "expo.out" }, "<0.1");
    const media = act.querySelector(".act__media");
    if (media) {
      tl.from(media, { clipPath: "inset(100% 0 0 0)", duration: 1.4, ease: "expo.inOut" }, "<");
      gsap.fromTo(media.querySelector("img"), { yPercent: -10 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: media, start: "top bottom", end: "bottom top", scrub: true } });
    }
    const bubbles = act.querySelectorAll(".bubble");
    if (bubbles.length) tl.from(bubbles, { y: 16, scale: 0.92, autoAlpha: 0, duration: 0.5, stagger: 0.7, ease: "back.out(1.6)", transformOrigin: "bottom" }, "<0.3");
  });

  /* ---------- Sobre mí ---------- */
  gsap.from(".roles li", { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".roles", start: "top 85%" } });

  /* ---------- Consultoría: la escena principal ---------- */
  const cTitle = $$(".consult__title .line__in");
  if (cTitle.length) {
    const ctl = gsap.timeline({ scrollTrigger: { trigger: ".consult__hero", start: "top 75%" } });
    ctl.from(".consult__badge", { autoAlpha: 0, y: 20, duration: 0.8, ease: "power3.out" })
      .from(cTitle, { yPercent: 110, duration: 1.5, stagger: 0.14, ease: "expo.out" }, "<0.1")
      .from(".consult__lead", { autoAlpha: 0, y: 30, duration: 1.2, ease: "expo.out" }, "<0.5");
    gsap.from(".consult__side > *, .consult__gets li", { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: ".consult__body", start: "top 75%" } });
  }
  // Las tarjetas de pasos se apilan: la anterior se aleja cuando llega la siguiente
  const steps = $$(".step");
  if (matchMedia("(min-width: 1001px)").matches) steps.forEach((st, k) => {
    const next = steps[k + 1];
    if (next) {
      gsap.to(st, {
        scale: 0.95, filter: "brightness(0.7)", ease: "none",
        scrollTrigger: { trigger: next, start: "top 70%", end: () => "top " + (110 + (k + 1) * 28) + "px", scrub: true },
      });
    }
  });

  /* ---------- Escena 07: preguntas ---------- */
  gsap.from(".faq details", { y: 30, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: ".faq__list", start: "top 80%" } });

  /* ---------- Escena 08: créditos ---------- */
  $$(".credits__roll p").forEach((p) => {
    gsap.fromTo(p, { y: 80, autoAlpha: 0 }, { y: -40, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "top 45%", scrub: true } });
  });
  gsap.from(".contact > *", { y: 50, autoAlpha: 0, duration: 1.2, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".contact", start: "top 75%" } });

  /* ---------- Cursor ---------- */
  const cursor = $(".cursor");
  if (cursor && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const label = cursor.querySelector(".cursor__label");
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    addEventListener("pointermove", (e) => { cursor.classList.add("is-on"); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
    $$("[data-cursor]").forEach((el) => {
      el.addEventListener("pointerenter", () => { label.textContent = el.dataset.cursor; cursor.classList.add("is-big"); });
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-big"));
    });
  }

  // Recalcular cuando cargan imágenes y fuentes
  ST.sort();
  addEventListener("load", () => { ST.sort(); ST.refresh(); });
  if (document.fonts) document.fonts.ready.then(() => ST.refresh());
})();
