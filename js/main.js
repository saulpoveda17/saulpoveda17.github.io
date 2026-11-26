/* Saúl Poveda · interacciones de la página (sin dependencias) */
(function () {
  "use strict";

  /* ----- Año del pie ----- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ----- Menú móvil ----- */
  const menu = document.getElementById("menu-movil");
  const menuBtn = document.getElementById("menu-btn");

  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      const first = menu.querySelector("a");
      if (first) first.focus();
    } else {
      menuBtn.focus();
    }
  }

  function toggleMenu() {
    setMenu(menu ? menu.hidden : false);
  }
  window.toggleMenu = toggleMenu;

  if (menu && menuBtn) {
    menuBtn.addEventListener("click", toggleMenu);
    menu.querySelectorAll("a, [data-menu-close]").forEach((el) =>
      el.addEventListener("click", () => setMenu(false))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) setMenu(false);
    });
  }

  /* ----- Antes / Después: comparador deslizante ----- */
  const compare = document.getElementById("demo-viewport");
  const range = document.querySelector(".compare__range");
  if (compare && range) {
    const set = (v) => {
      const pos = Math.max(0, Math.min(100, v));
      compare.style.setProperty("--pos", pos + "%");
      range.value = String(Math.round(pos));
    };
    range.addEventListener("input", () => set(Number(range.value)));
    let dragging = false;
    const fromPointer = (e) => {
      const r = compare.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    };
    compare.addEventListener("pointerdown", (e) => {
      dragging = true;
      compare.setPointerCapture(e.pointerId);
      fromPointer(e);
    });
    compare.addEventListener("pointermove", (e) => { if (dragging) fromPointer(e); });
    ["pointerup", "pointercancel"].forEach((t) => compare.addEventListener(t, () => { dragging = false; }));
    compare.style.cursor = "ew-resize";
  }

  /* ----- Formulario con Formspree ----- */
  const form = document.getElementById("formulario-contacto");
  if (form) {
    const status = document.getElementById("form-status");
    const btn = form.querySelector(".btn-enviar");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fields = Array.from(form.querySelectorAll("input, select, textarea"));
      let firstInvalid = null;
      fields.forEach((f) => {
        const ok = f.checkValidity();
        f.setAttribute("aria-invalid", String(!ok));
        if (!ok && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) {
        status.textContent =
          firstInvalid.type === "email"
            ? "Revisa el email: escríbelo como nombre@dominio.com."
            : "Falta tu nombre o tu email.";
        firstInvalid.focus();
        return;
      }

      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      status.textContent = "Enviando…";

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("envío fallido");
        form.reset();
        fields.forEach((f) => f.removeAttribute("aria-invalid"));
        status.textContent = "Mensaje recibido. Te respondo en menos de 24 h.";
      } catch (err) {
        status.textContent =
          "No se ha podido enviar. Prueba de nuevo o escríbeme por WhatsApp.";
      } finally {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
      }
    });
  }
})();
