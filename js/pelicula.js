/* =========================================================
   La llamada · Saúl Poveda
   Motor de la película: escenas con scroll, diagnóstico,
   reserva de llamada y reproductor.
   ========================================================= */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var body = document.body;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (!hasGsap) root.classList.remove("cine");
  var CINE = root.classList.contains("cine");
  var WA = "34640621294";

  /* ---------------------------------------------------------
     Datos del diagnóstico
     --------------------------------------------------------- */
  var BIZ = {
    ecommerce: {
      label: "Tienda online (e-commerce)", noun: "tu tienda online", nounCap: "Tu tienda online",
      t: "Rentabilidad por producto y por canal", d: "Saber qué productos y qué campañas dejan margen de verdad, y recuperar los carritos abandonados."
    },
    formacion: {
      label: "Formación, cursos o infoproductos", noun: "tu negocio de formación", nounCap: "Tu negocio de formación",
      t: "Un embudo que convierte", d: "Del primer contenido a la venta: captación, seguimiento y lanzamientos medidos paso a paso."
    },
    saas: {
      label: "Software, app o SaaS", noun: "tu producto", nounCap: "Tu producto",
      t: "Captar al cliente que se queda", d: "Medir coste de adquisición, activación y bajas para invertir solo en los canales que traen clientes rentables."
    },
    servicios: {
      label: "Agencia o servicios profesionales", noun: "tu negocio", nounCap: "Tu negocio",
      t: "Clientes que llegan sin depender del boca a boca", d: "Una oferta clara, una vía de captación medible y un seguimiento que convierte contactos en ventas."
    },
    local: {
      label: "Negocio local que quiere vender más online", noun: "tu negocio", nounCap: "Tu negocio",
      t: "Que te encuentren y te elijan en internet", d: "Ficha de Google, campañas locales y una medición sencilla para saber cuántos clientes llegan desde internet."
    },
    otro: {
      label: "Otro tipo de negocio", noun: "tu negocio", nounCap: "Tu negocio",
      t: "Ordenar el camino del cliente", d: "Cómo te encuentran, por qué te compran y dónde se pierden por el camino. En ese orden."
    }
  };
  var PAIN = {
    ads: { label: "Invierto en publicidad y no sale rentable", leak: "la publicidad gasta más de lo que devuelve.", t: "Auditar las campañas", d: "Revisar qué anuncios, públicos y productos venden de verdad, apagar lo que pierde dinero y reforzar lo que funciona.", svc: "Publicidad digital" },
    datos: { label: "No sé qué funciona: me faltan datos claros", leak: "decides sin saber qué te trae las ventas.", t: "Medir lo que importa", d: "Montar la analítica bien y un panel sencillo con ventas, coste por cliente y retorno de cada canal.", svc: "Analítica y medición" },
    estanco: { label: "La facturación lleva meses estancada", leak: "el negocio ha tocado techo con lo que hace hoy.", t: "Encontrar la palanca de crecimiento", d: "Revisar oferta, precios, canales y recurrencia para decidir qué mover primero y con qué objetivo.", svc: "Consultoría estratégica" },
    conversion: { label: "Tengo visitas pero pocas ventas", leak: "las visitas se pierden antes de comprar.", t: "Arreglar el embudo", d: "Detectar en qué paso se va la gente (oferta, web, pago o seguimiento) y corregirlo por orden de impacto.", svc: "Estrategia digital" }
  };
  var GOAL = {
    facturar: { label: "Facturar más", t: "Un objetivo de facturación a 90 días", d: "Cifra, plazo y las tres acciones que más acercan a ella, revisadas cada semana." },
    rentable: { label: "Que la publicidad sea rentable", t: "Retorno por encima del coste", d: "Fijar el coste máximo por venta y optimizar las campañas por ventas, no por clics." },
    datos: { label: "Decidir con datos", t: "Un panel que se entiende", d: "Las cinco cifras que importan, en un solo sitio y actualizadas, para decidir en minutos." }
  };
  var SETS = { biz: BIZ, pain: PAIN, goal: GOAL };

  /* ---------------------------------------------------------
     Estado (se recuerda en este navegador)
     --------------------------------------------------------- */
  var KEY = "sp-diagnostico-v2";
  var state = { biz: null, pain: null, goal: null };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") ["biz", "pain", "goal"].forEach(function (k) { if (SETS[k][saved[k]]) state[k] = saved[k]; });
  } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function complete() { return !!(state.biz && state.pain && state.goal); }

  /* ---------------------------------------------------------
     Vídeos reales: se cargan al acercarse a cada escena.
     En pantallas verticales se usa la versión vertical si existe.
     --------------------------------------------------------- */
  var REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PORTRAIT = matchMedia("(max-aspect-ratio: 4/5)").matches;
  var unlocked = false;
  $$("video[data-poster-v]").forEach(function (v) { if (PORTRAIT) v.poster = v.dataset.posterV; });
  function prime(v) {
    // iOS: un vídeo solo se deja mover con el scroll después de un play() iniciado por el usuario
    if (!unlocked || "loop" in v.dataset) return;
    var pr = v.play(); if (pr && pr.then) pr.then(function () { v.pause(); }).catch(function () {});
  }
  function loadVid(v) {
    if (!v || v.dataset.ok) return;
    var s = (PORTRAIT && v.dataset.srcV) || v.dataset.src;
    if (!s) return;
    v.dataset.ok = "1";
    v.preload = "auto";
    v.src = s;
    try { v.load(); } catch (e) {}
    prime(v);
  }
  function unlock() {
    if (unlocked) return; unlocked = true;
    $$("video[data-ok]:not([data-loop])").forEach(prime);
  }
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });

  if (!REDUCE) {
    $$("video[data-eager]").forEach(loadVid);
    if ("IntersectionObserver" in window) {
      // Precarga: una pantalla y media antes de llegar a la escena
      var near = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { $$("video[data-src]", e.target).forEach(loadVid); near.unobserve(e.target); } });
      }, { rootMargin: "150% 0px" });
      $$(".scene").forEach(function (s) { near.observe(s); });
      // Los vídeos en bucle solo se reproducen cuando están en pantalla
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) {
            if (v.dataset.src) loadVid(v); else if (v.preload === "none") v.preload = "auto";
            var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
          } else v.pause();
        });
      }, { rootMargin: "200px 0px" });
      $$("video[data-loop]").forEach(function (v) { io.observe(v); });
    } else {
      $$("video[data-src]").forEach(loadVid);
    }
  }

  /* ---------------------------------------------------------
     Personalización (lo que la web "sabe" del cliente)
     --------------------------------------------------------- */
  function apply() {
    var b = BIZ[state.biz] || BIZ.otro;
    $$('[data-f="noun"]').forEach(function (e) { e.textContent = b.noun; });
    $$('[data-f="nounCap"]').forEach(function (e) { e.textContent = b.nounCap; });
    var neg = $('input[name="negocio"]');
    if (neg && state.biz && !neg.dataset.touched) neg.value = state.biz === "otro" ? "" : b.label;
    var li = $("#call-diag-li");
    if (li) li.hidden = !complete();
    var hd = $("#book-diag");
    if (hd) hd.value = complete() ? summary() : "";
  }
  function summary() {
    return "Negocio: " + BIZ[state.biz].label + " · Freno: " + PAIN[state.pain].label + " · Objetivo: " + GOAL[state.goal].label;
  }
  function service() {
    var s = PAIN[state.pain].svc;
    return s === "Consultoría estratégica" ? s : "Consultoría estratégica + " + s.charAt(0).toLowerCase() + s.slice(1);
  }

  /* ---------------------------------------------------------
     Diagnóstico interactivo
     --------------------------------------------------------- */
  var quiz = $("#quiz"), scan = $("#scan"), diag = $("#diag"), scanLog = $("#scan-log");
  var scanning = false;

  $$(".chips", quiz).forEach(function (box) {
    var k = box.dataset.key;
    Object.keys(SETS[k]).forEach(function (v) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.dataset.v = v;
      b.setAttribute("aria-pressed", state[k] === v ? "true" : "false");
      b.textContent = SETS[k][v].label;
      b.addEventListener("click", function () { choose(k, v); });
      box.appendChild(b);
    });
  });

  function step(k) { return $('.q-step[data-step="' + k + '"]', quiz); }
  function reveal(el, focus) {
    if (!el || !el.hidden) return;
    el.hidden = false;
    refresh();
    if (focus) setTimeout(function () { smoothTo(el, "center"); }, 60);
  }

  function choose(k, v) {
    state[k] = v;
    $$('.chips[data-key="' + k + '"] .chip', quiz).forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.v === v ? "true" : "false"); });
    step(k).classList.add("is-done");
    save();
    apply();
    if (k === "biz") reveal(step("pain"), true);
    else if (k === "pain") reveal(step("goal"), true);
    if (complete()) {
      if (!diag.hidden) renderDiag();
      else if (!scanning) runScan();
    }
  }

  function runScan() {
    scanning = true;
    scan.hidden = false;
    scanLog.innerHTML = "";
    refresh();
    smoothTo(scan, "center");
    var lines = [
      "Negocio: " + BIZ[state.biz].label,
      "Freno principal: " + PAIN[state.pain].label.toLowerCase(),
      "Objetivo a 90 días: " + GOAL[state.goal].label.toLowerCase(),
      "Ordenando acciones por impacto y esfuerzo"
    ];
    var reduce = !CINE;
    lines.forEach(function (l, i) {
      setTimeout(function () {
        var li = document.createElement("li");
        li.innerHTML = "<b>✓</b>";
        li.appendChild(document.createTextNode(l));
        scanLog.appendChild(li);
      }, reduce ? 0 : 380 * (i + 1));
    });
    setTimeout(function () {
      scanning = false;
      scan.hidden = true;
      renderDiag();
      diag.hidden = false;
      refresh();
      smoothTo(diag, "start");
    }, reduce ? 50 : 380 * (lines.length + 1) + 200);
  }

  function renderDiag() {
    var b = BIZ[state.biz], p = PAIN[state.pain], g = GOAL[state.goal];
    $("#diag-date").textContent = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    var leak = $("#diag-leak");
    leak.innerHTML = "<b>Fuga principal:</b> ";
    leak.appendChild(document.createTextNode(p.leak));
    var ol = $("#diag-steps");
    ol.innerHTML = "";
    [[p.t, p.d], [b.t, b.d], [g.t, g.d]].forEach(function (s) {
      var li = document.createElement("li");
      var d = document.createElement("div");
      var t = document.createElement("b");
      var x = document.createElement("span");
      t.textContent = s[0];
      x.textContent = s[1];
      d.appendChild(t); d.appendChild(x); li.appendChild(d); ol.appendChild(li);
    });
    $("#diag-svc").textContent = service();
    apply();
  }

  $("#quiz-reset").addEventListener("click", function () {
    state = { biz: null, pain: null, goal: null };
    save();
    $$(".chip", quiz).forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
    $$(".q-step", quiz).forEach(function (s, i) { s.classList.remove("is-done"); if (i) s.hidden = true; });
    diag.hidden = true;
    apply();
    refresh();
    smoothTo(quiz, "center");
    var first = $(".chip", quiz);
    if (first) first.focus({ preventScroll: true });
  });

  // Restaurar visita anterior
  if (state.biz) { step("biz").classList.add("is-done"); step("pain").hidden = false; }
  if (state.pain) { step("pain").classList.add("is-done"); step("goal").hidden = false; }
  if (complete()) { step("goal").classList.add("is-done"); renderDiag(); diag.hidden = false; }
  apply();

  /* ---------------------------------------------------------
     Reserva de la llamada
     --------------------------------------------------------- */
  var form = $("#book"), msg = $("#book-msg");
  (function buildCalendar() {
    var days = $("#days"), slots = $("#slots");
    days.innerHTML = "";
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    var n = 0;
    while (n < 10) {
      d.setDate(d.getDate() + 1);
      var wd = d.getDay();
      if (wd === 0 || wd === 6) continue;
      var long = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
      var lab = document.createElement("label");
      lab.className = "day";
      lab.innerHTML = '<input type="radio" name="dia" required /><span><small></small><b></b><small></small></span>';
      var inp = lab.querySelector("input");
      inp.value = long;
      var sm = lab.querySelectorAll("small");
      sm[0].textContent = d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
      lab.querySelector("b").textContent = d.getDate();
      sm[1].textContent = d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
      lab.setAttribute("aria-label", long);
      days.appendChild(lab);
      n++;
    }
    ["10:00", "11:30", "13:00", "16:30", "18:00"].forEach(function (h) {
      var lab = document.createElement("label");
      lab.className = "slot";
      lab.innerHTML = '<input type="radio" name="hora" required /><span></span>';
      lab.querySelector("input").value = h;
      lab.querySelector("span").textContent = h;
      slots.appendChild(lab);
    });
  })();

  var neg = $('input[name="negocio"]');
  if (neg) neg.addEventListener("input", function () { neg.dataset.touched = "1"; });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var via = (e.submitter && e.submitter.dataset.via) || "wa";
    var fd = new FormData(form);
    var nombre = (fd.get("nombre") || "").toString().trim();
    var dia = fd.get("dia"), hora = fd.get("hora");
    msg.className = "book__msg";
    if (!dia || !hora) { msg.textContent = "Elige un día y una hora para la llamada."; msg.classList.add("is-err"); return; }
    if (!nombre) { msg.textContent = "Dime tu nombre para saber con quién hablo."; msg.classList.add("is-err"); form.nombre.focus(); return; }
    var negocio = (fd.get("negocio") || "").toString().trim();

    if (via === "wa") {
      var t = "Hola Saúl, soy " + nombre + (negocio ? " (" + negocio + ")" : "") + ". He visto tu web y quiero reservar la llamada de diagnóstico.\n\n" +
        "Día: " + dia + "\nHora: " + hora;
      if (complete()) t += "\n\nMi diagnóstico previo:\n· Freno: " + PAIN[state.pain].label + "\n· Objetivo: " + GOAL[state.goal].label;
      window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(t), "_blank", "noopener");
      msg.textContent = "Se ha abierto WhatsApp con tu reserva. Solo te queda pulsar enviar.";
      msg.classList.add("is-ok");
      return;
    }
    var contacto = (fd.get("contacto") || "").toString().trim();
    if (!contacto) { msg.textContent = "Déjame un email o teléfono para confirmarte la llamada."; msg.classList.add("is-err"); form.contacto.focus(); return; }
    msg.textContent = "Enviando…";
    fetch(form.action, { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error();
        msg.textContent = "Reserva recibida. Te escribo en menos de 24 horas para confirmarla.";
        msg.classList.add("is-ok");
        form.reset();
        apply();
      })
      .catch(function () {
        msg.textContent = "No se ha podido enviar. Prueba por WhatsApp o escríbeme a saulpoveda.marketing@gmail.com.";
        msg.classList.add("is-err");
      });
  });

  var yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Utilidades de scroll
     --------------------------------------------------------- */
  function refresh() { if (CINE && hasGsap) ScrollTrigger.refresh(); }
  function absTop(el) { return el.getBoundingClientRect().top + window.pageYOffset; }
  function smoothTo(el, where) {
    var r = el.getBoundingClientRect();
    var y = window.pageYOffset + r.top;
    if (where === "center") y -= Math.max(80, (window.innerHeight - r.height) / 2);
    else y -= parseFloat(getComputedStyle(root).getPropertyValue("--bar")) + 24 || 80;
    window.scrollTo({ top: Math.max(0, y), behavior: CINE ? "smooth" : "auto" });
  }
  function sectionStart(el) {
    var p = el.parentNode;
    return absTop(p && p.classList && p.classList.contains("pin-spacer") ? p : el);
  }

  /* ---------------------------------------------------------
     HUD, barras de cine y reproductor
     --------------------------------------------------------- */
  var chapters = $$("main > section[data-sc]");
  var hudSc = $("#hud-sc"), hudLb = $("#hud-lb"), player = $("#player"), fill = $("#fill"), tc = $("#tc"), plb = $("#player-lb"), marks = $("#marks"), track = $("#track");
  var TOTAL = 360; // duración ficticia: 06:00
  var current = null;

  function fmt(s) { s = Math.max(0, Math.round(s)); return (s / 60 < 10 ? "0" : "") + Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
  function maxScroll() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }

  function buildMarks() {
    marks.innerHTML = "";
    var m = maxScroll();
    chapters.forEach(function (sec) {
      var b = document.createElement("button");
      b.type = "button";
      var pos = Math.min(1, sectionStart(sec) / m);
      b.style.left = (pos * 100).toFixed(2) + "%";
      b.setAttribute("aria-label", "Ir a " + sec.dataset.lb);
      b.title = sec.dataset.lb;
      b.addEventListener("click", function (e) { e.stopPropagation(); stop(); jump(sectionStart(sec)); });
      marks.appendChild(b);
    });
  }
  function jump(y) { window.scrollTo({ top: y, behavior: CINE ? "smooth" : "auto" }); }
  track.addEventListener("click", function (e) {
    var r = track.getBoundingClientRect();
    stop();
    jump(((e.clientX - r.left) / r.width) * maxScroll());
  });

  function onScroll() {
    var y = window.pageYOffset, p = y / maxScroll(), mid = window.innerHeight * 0.5, found = null;
    fill.style.transform = "scaleX(" + Math.min(1, p).toFixed(4) + ")";
    tc.textContent = fmt(p * TOTAL);
    for (var i = 0; i < chapters.length; i++) {
      var r = chapters[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { found = chapters[i]; break; }
    }
    if (!found) {
      var credits = $("#creditos").getBoundingClientRect();
      if (credits.top < mid) found = { dataset: { sc: "FIN", lb: "Créditos" }, film: true };
    }
    if (found && found !== current) {
      current = found;
      hudSc.textContent = found.dataset.sc;
      hudLb.textContent = found.dataset.lb;
      plb.textContent = found.dataset.lb;
      var film = found.film || (found.hasAttribute && found.hasAttribute("data-film"));
      body.classList.toggle("is-web", !film);
    }
    if (!found && current !== "x") {
      // Zonas sin capítulo (tira de rodaje, preguntas): modo web
      current = "x";
      body.classList.add("is-web");
    }
    checkStops(y);
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); }
  }, { passive: true });
  window.addEventListener("resize", function () { buildMarks(); onScroll(); });

  /* ---------- Reproducir: la película avanza sola ---------- */
  var playing = false, last = 0, carry = 0, stopsPassed = {};
  function speed() { return window.innerHeight * 0.42; }
  function frame(t) {
    if (!playing) return;
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    carry += speed() * dt;
    var px = Math.floor(carry);
    if (px >= 1) { carry -= px; window.scrollBy(0, px); }
    if (window.pageYOffset >= maxScroll() - 2) { stop(); return; }
    requestAnimationFrame(frame);
  }
  function play() {
    if (playing) return;
    if (window.pageYOffset >= maxScroll() - 2) window.scrollTo(0, 0);
    playing = true;
    player.classList.add("is-playing");
    $$("[data-play]").forEach(function (b) { b.setAttribute("aria-label", "Pausar la película"); });
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() {
    if (!playing) return;
    playing = false;
    player.classList.remove("is-playing");
    $$("[data-play]").forEach(function (b) { b.setAttribute("aria-label", "Reproducir la película"); });
  }
  function checkStops(y) {
    if (!playing) return;
    var web = $("#web"), call = $("#llamada");
    if (!stopsPassed.web && !complete() && y >= absTop(web) - 2) {
      stopsPassed.web = true;
      stop();
      window.scrollTo(0, absTop(web));
      var c = $(".chip", quiz);
      if (c) c.focus({ preventScroll: true });
    } else if (!stopsPassed.call && y >= absTop(call) - 2) {
      stopsPassed.call = true;
      stop();
    }
  }
  $$("[data-play]").forEach(function (b) {
    b.addEventListener("click", function () { if (playing) stop(); else play(); });
  });
  ["wheel", "touchstart", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (!playing) return;
      if (ev === "keydown" && !/^(Arrow|Page|Home|End| $)/.test(e.key)) return;
      stop();
    }, { passive: true });
  });
  $$('a[href^="#"]').forEach(function (a) { a.addEventListener("click", stop); });


  /* ---------------------------------------------------------
     Sin animación: estado de póster
     --------------------------------------------------------- */
  if (!CINE) {
    body.classList.add("is-film");
    buildMarks();
    onScroll();
    return;
  }

  /* =========================================================
     LA PELÍCULA (GSAP + ScrollTrigger)
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "none" });
  ScrollTrigger.config({ ignoreMobileResize: true });


  // Subtítulos repartidos a lo largo de una escena
  function subs(tl, scene, from, to) {
    var ps = $$(".subs p", scene), seg = (to - from) / ps.length;
    ps.forEach(function (p, i) {
      var s = from + i * seg;
      tl.fromTo(p, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: seg * 0.22, ease: "power2.out" }, s);
      tl.to(p, { autoAlpha: 0, y: -10, duration: seg * 0.16, ease: "power1.in" }, s + seg * 0.82);
    });
  }
  function scene(id, len) {
    var el = $(id);
    var tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: "top top", end: "+=" + len + "%", pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true }
    });
    tl.set({}, {}, 1); // la línea de tiempo dura 1
    return { el: el, tl: tl };
  }
  function tap(tl, el, x, y, at) {
    tl.set(el, { left: x, top: y }, at);
    tl.fromTo(el, { scale: 0.4, autoAlpha: 0.95 }, { scale: 1.5, autoAlpha: 0, duration: 0.035, ease: "power2.out" }, at);
  }
  function spark(tl, sc, at) {
    var line = $(sc + " .kpi__line"), L = 260;
    line.style.strokeDasharray = L;
    tl.fromTo(line, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.12, ease: "power1.out" }, at);
    tl.fromTo(sc + " .kpi__area", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, at + 0.06);
  }
  function offsetIn(el, anc) {
    var x = 0, y = 0;
    while (el && el !== anc) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: x, y: y };
  }

  /* ---------- Precarga + título ---------- */
  var pre = $("#preload");
  var skipIntro = location.hash && location.hash.length > 1;
  var intro = gsap.timeline({ paused: true });
  intro.from("[data-in]", { autoAlpha: 0, y: 28, duration: 1.1, stagger: 0.12, ease: "power3.out" });
  intro.from(".title__credits span", { autoAlpha: 0, duration: 1, stagger: 0.15 }, "-=0.6");

  if (skipIntro) {
    pre.remove();
    intro.progress(1);
  } else {
    body.style.overflow = "hidden";
    var c = { v: 0 };
    var ready = Promise.all([
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      new Promise(function (r) { setTimeout(r, 1500); })
    ]);
    gsap.to(c, {
      v: 100, duration: 1.6, ease: "power2.inOut",
      onUpdate: function () {
        $("#preload-n").textContent = Math.round(c.v);
        $("#preload-bar").style.width = c.v + "%";
      }
    });
    ready.then(function () {
      gsap.timeline()
        .to(".preload__k, .preload__n, .preload__bar", { autoAlpha: 0, duration: 0.4, delay: 0.2 })
        .to(pre, { yPercent: -100, duration: 0.9, ease: "power4.inOut" })
        .add(function () { pre.remove(); body.style.overflow = ""; intro.play(); refresh(); }, "-=0.35");
    });
  }

  // El título se aleja al empezar el scroll
  gsap.to(".title__inner", { yPercent: -18, autoAlpha: 0, scrollTrigger: { trigger: "#inicio", start: "top top", end: "bottom 20%", scrub: true } });

  /* ---------- Vídeo controlado por el scroll ---------- */
  var scrubs = [];
  function scrub(tl, video, at, dur, from, to) {
    if (!video) return;
    var o = { p: from || 0 };
    tl.fromTo(o, { p: from || 0 }, { p: to === undefined ? 1 : to, duration: dur, ease: "none" }, at);
    scrubs.push({ v: video, o: o });
  }
  gsap.ticker.add(function () {
    for (var i = 0; i < scrubs.length; i++) {
      var v = scrubs[i].v, d = v.duration;
      if (!d || v.readyState < 1 || v.seeking) continue;
      var t = Math.min(d - 0.04, Math.max(0, scrubs[i].o.p * d));
      if (Math.abs(v.currentTime - t) > 0.02) { try { v.currentTime = t; } catch (e) {} }
    }
  });

  /* ---------- ESCENA 1 · El cierre ---------- */
  (function () {
    var s = scene("#esc1", 420), tl = s.tl;
    tl.fromTo("#cam1", { scale: 1 }, { scale: 1.08, transformOrigin: "50% 50%", duration: 1, ease: "power1.inOut" }, 0);
    scrub(tl, $("#v-salon"), 0, 0.46);
    tl.fromTo("#v-cama", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.07, ease: "power1.inOut" }, 0.4);
    scrub(tl, $("#v-cama"), 0.4, 0.55);
    tl.fromTo("#esc1 .kpi", { autoAlpha: 1, yPercent: 0, y: function () { return window.innerHeight; }, rotate: 3 }, { autoAlpha: 1, yPercent: 0, y: 0, rotate: 0, duration: 0.16, ease: "power3.out" }, 0.56);
    spark(tl, "#esc1", 0.62);
    tl.to("#esc1 .kpi", { yPercent: -16, autoAlpha: 0, duration: 0.07 }, 0.86);
    subs(tl, s.el, 0.03, 0.92);
    tl.to("#esc1 .stage", { autoAlpha: 0, duration: 0.05 }, 0.95);
  })();

  /* ---------- ESCENA 2 · El vídeo ---------- */
  (function () {
    var s = scene("#esc2", 470), tl = s.tl;
    var screen = $("#esc2 .screen"), feed = $("#esc2 .feed"), me = $("#esc2 .post--me"), media = $(".media", me), t = $("#esc2 .tap");
    // Desplazamiento del feed: f = 1 deja el reel de saul.marketing en el centro de la pantalla
    function far(f) { return function () { var o = offsetIn(media, feed); return -(feed.offsetTop + o.y + media.offsetHeight / 2 - screen.clientHeight * 0.47) * f; }; }
    function at(el, fx, fy) {
      return {
        x: function () { var o = offsetIn(el, screen); return o.x + el.offsetWidth * (fx === undefined ? 0.5 : fx); },
        y: function () { var o = offsetIn(el, screen); return o.y + el.offsetHeight * (fy === undefined ? 0.5 : fy); }
      };
    }
    // El móvil sube como si alguien lo cogiera de la mesa
    tl.fromTo("#cam2", { scale: 1.08 }, { scale: 1, transformOrigin: "50% 50%", duration: 1, ease: "power1.out" }, 0);
    scrub(tl, $("#v-movil"), 0, 0.2);
    tl.fromTo("#v-noche", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.07 }, 0.1);
    tl.fromTo("#esc2 .phone-glow", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.1);
    tl.fromTo("#esc2 .phone-wrap", { y: 0, yPercent: 115 }, { y: 0, yPercent: 0, duration: 0.12, ease: "power3.out" }, 0.1);
    tl.fromTo("#esc2 .phone", { rotateX: 32, rotateY: -16, rotateZ: 7, scale: 0.92 }, { rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, duration: 0.14, ease: "power2.out" }, 0.1);

    // Lo que pasa dentro de la pantalla
    var p = gsap.timeline();
    p.set({}, {}, 1);
    p.fromTo(feed, { y: 0 }, { y: far(0.22), duration: 0.08, ease: "power3.out" }, 0.04);
    p.to(feed, { y: far(0.47), duration: 0.08, ease: "power3.out" }, 0.14);
    p.to(feed, { y: far(0.74), duration: 0.08, ease: "power3.out" }, 0.24);
    p.to(feed, { y: far(1), duration: 0.1, ease: "power4.out" }, 0.33);
    var hit = { x: function () { return screen.clientWidth / 2; }, y: function () { return screen.clientHeight * 0.47; } };
    tap(p, t, hit.x, hit.y, 0.45);
    p.fromTo("#esc2 .reel", { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.04, ease: "power2.out" }, 0.46);
    p.fromTo("#esc2 .reel img", { scale: 1.16 }, { scale: 1, duration: 0.3 }, 0.46);
    p.fromTo("#esc2 .reel__bar i", { scaleX: 0 }, { scaleX: 1, duration: 0.27 }, 0.47);
    p.fromTo("#esc2 .reel__copy > *", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.03, stagger: 0.025, ease: "power2.out" }, 0.5);
    p.fromTo("#esc2 .heart-pop", { scale: 0, autoAlpha: 1 }, { scale: 1.15, duration: 0.03, ease: "back.out(3)" }, 0.64);
    p.to("#esc2 .heart-pop", { scale: 1.4, autoAlpha: 0, duration: 0.03 }, 0.68);
    p.fromTo("#esc2 .ic-heart", { "--fill": "rgba(255,59,92,0)", color: "#ffffff" }, { "--fill": "#ff3b5c", color: "#ff3b5c", duration: 0.01 }, 0.65);
    p.fromTo("#esc2 .ic-save", { "--fill": "rgba(255,255,255,0)" }, { "--fill": "#ffffff", duration: 0.01 }, 0.7);
    var nm = at($("#esc2 .reel__meta b"));
    tap(p, t, nm.x, nm.y, 0.74);
    p.fromTo("#esc2 .profile", { x: 0, xPercent: 105 }, { x: 0, xPercent: 0, duration: 0.05, ease: "power3.out" }, 0.75);
    var lk = at($("#esc2 .profile__link"), 0.55);
    tap(p, t, lk.x, lk.y, 0.86);
    p.fromTo("#esc2 .profile__link", { backgroundColor: "rgba(159,216,255,0)" }, { backgroundColor: "rgba(159,216,255,.24)", duration: 0.02 }, 0.86);
    p.to("#esc2 .phone-wrap", { scale: 1.1, duration: 0.08, ease: "power2.in" }, 0.91);
    p.duration(0.72);
    tl.add(p, 0.22);
    subs(tl, s.el, 0.02, 0.92);
    tl.to("#esc2 .stage", { autoAlpha: 0, duration: 0.04 }, 0.96);
  })();

  /* ---------- ESCENA 3 · La búsqueda ---------- */
  (function () {
    var s = scene("#esc3", 480), tl = s.tl;
    var sc = $("#esc3 .screen3"), ls = $("#esc3 .lscreen"), q = $("#esc3 .q"), url = $("#esc3 .url__t"), me = $("#esc3 .res--me"), ptr = $("#esc3 .pointer"), clk = $("#esc3 .click");
    var QUERY = "consultoría para facturar más online";
    url.innerHTML = '<span class="u1">buscar</span><span class="u2" style="display:none">saulpoveda.com</span>';
    var typing = { n: 0 }, shown = -1;
    gsap.ticker.add(function () { var k = Math.round(typing.n); if (k !== shown) { shown = k; q.textContent = QUERY.slice(0, k); } });
    function target() { var o = offsetIn(me, ls); return { x: o.x + me.offsetWidth * 0.32, y: o.y + me.offsetHeight * 0.48 }; }

    // Plano real: café y portátil a primera hora
    tl.fromTo("#cam3", { scale: 1 }, { scale: 1.06, transformOrigin: "50% 50%", duration: 0.5, ease: "power1.out" }, 0);
    scrub(tl, $("#v-cafe"), 0, 0.32);
    tl.fromTo("#v-cafeblur", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.07 }, 0.27);
    // La pantalla del portátil
    gsap.set(sc, { xPercent: -50, yPercent: -50 });
    tl.fromTo(sc, { autoAlpha: 0, scale: 0.82, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.09, ease: "power3.out" }, 0.3);
    tl.fromTo("#esc3 .browser", { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.01 }, 0.3);
    tl.fromTo(typing, { n: 0 }, { n: QUERY.length, duration: 0.15, ease: "none" }, 0.39);
    tl.fromTo("#esc3 .results", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "power2.out" }, 0.55);
    tl.fromTo(ptr, { left: "72%", top: "86%" }, { left: function () { return target().x; }, top: function () { return target().y; }, duration: 0.08, ease: "power2.inOut" }, 0.6);
    tl.set(clk, { left: function () { return target().x; }, top: function () { return target().y; } }, 0.69);
    tl.fromTo(clk, { scale: 0.3, autoAlpha: 1 }, { scale: 1.6, autoAlpha: 0, duration: 0.03 }, 0.69);
    tl.fromTo(me, { backgroundColor: "rgba(255,201,120,.2)" }, { backgroundColor: "rgba(255,201,120,.45)", duration: 0.01 }, 0.69);
    tl.set("#esc3 .u1", { display: "none" }, 0.7);
    tl.set("#esc3 .u2", { display: "inline" }, 0.7);
    tl.fromTo("#esc3 .chrome__load", { scaleX: 0 }, { scaleX: 1, duration: 0.05 }, 0.7);
    tl.to(ptr, { autoAlpha: 0, duration: 0.02 }, 0.78);

    /* La web aparece DENTRO del portátil y la cámara entra en la pantalla.
       La capa "ghost" es una copia exacta del principio de la sección #web:
       al terminar el zoom ocupa toda la pantalla y la web real, que está justo
       debajo, toma el relevo sin que se note el cambio. */
    var web = $("#web"), chrome = $("#esc3 .chrome");
    var ghost = document.createElement("div");
    ghost.className = "web web--ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    function fillGhost() {
      var c = $(".web__in", web).cloneNode(true);
      $$("[id]", c).forEach(function (n) { n.removeAttribute("id"); });
      ghost.innerHTML = "";
      ghost.appendChild(c);
    }
    fillGhost();
    s.el.querySelector(".stage").insertBefore(ghost, $("#esc3 .slate"));
    // Rectángulo de la web dentro del portátil (sin transformaciones)
    function R() {
      return {
        x: sc.offsetLeft - sc.offsetWidth / 2 + ls.offsetLeft,
        y: sc.offsetTop - sc.offsetHeight / 2 + ls.offsetTop + chrome.offsetHeight,
        w: ls.offsetWidth,
        h: ls.offsetHeight - chrome.offsetHeight,
        ox: ls.offsetLeft, oy: ls.offsetTop + chrome.offsetHeight
      };
    }
    var zoom = { t: 0 }, lastT = -1, vis = { a: 0 }, lastA = -1, zoomed = false;
    function render(force) {
      if (!force && zoom.t === lastT && vis.a === lastA) return;
      lastT = zoom.t; lastA = vis.a;
      var r = R(), W = s.el.clientWidth, H = s.el.clientHeight, e = zoom.t;
      var K = W / r.w;                       // al final, la pantalla ocupa todo el ancho
      var k = 1 + (K - 1) * e;
      var x = r.x * (1 - e), y = r.y * (1 - e);
      var gs = (r.w * k) / W;                // escala de la capa
      var visH = r.h * k + Math.max(0, H - r.h * K) * e;
      var clipB = Math.max(0, H - visH / gs);
      gsap.set(ghost, { x: x, y: y, scale: gs, clipPath: "inset(0px 0px " + clipB.toFixed(1) + "px 0px)", autoAlpha: vis.a });
      if (e > 0) { zoomed = true; gsap.set(sc, { transformOrigin: r.ox + "px " + r.oy + "px", scale: k, x: x - r.x, y: y - r.y }); }
      else if (zoomed) { zoomed = false; gsap.set(sc, { transformOrigin: "50% 50%", scale: 1, x: 0, y: 0 }); }
    }
    gsap.ticker.add(function () { render(false); });
    ScrollTrigger.addEventListener("refresh", function () { fillGhost(); render(true); });
    tl.fromTo(vis, { a: 0 }, { a: 1, duration: 0.03 }, 0.73);
    // Debajo de la web solo queda su mismo fondo (sin buscador asomando)
    tl.fromTo("#esc3 .search", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01 }, 0.76);
    tl.fromTo("#esc3 .browser", { backgroundColor: "#f6f5f2" }, { backgroundColor: "#0d0f14", duration: 0.01 }, 0.76);
    tl.fromTo(zoom, { t: 0 }, { t: 1, duration: 0.15, ease: "power2.inOut" }, 0.8);
    tl.to("#esc3 .slate", { autoAlpha: 0, duration: 0.04 }, 0.8);

    // La sección #web se superpone al último plano de la escena 3 y solo se
    // muestra cuando la escena ha terminado: ahí las dos son idénticas.
    function overlap() { web.style.marginTop = -s.el.offsetHeight + "px"; }
    overlap();
    ScrollTrigger.addEventListener("refreshInit", overlap);
    var shownWeb = null;
    gsap.ticker.add(function () {
      var on = window.pageYOffset >= tl.scrollTrigger.end - 1;
      if (on !== shownWeb) { shownWeb = on; web.style.visibility = on ? "" : "hidden"; }
    });
    subs(tl, s.el, 0.01, 0.86);
  })();

  /* ---------- ESCENA 5 · Tres meses después ---------- */
  (function () {
    var s = scene("#esc5", 440), tl = s.tl;
    tl.fromTo("#esc5 .card3", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.07 }, 0.05);
    tl.fromTo("#cam5", { scale: 1.12 }, { scale: 1, transformOrigin: "50% 50%", duration: 1, ease: "power1.out" }, 0);
    scrub(tl, $("#v-cinta"), 0, 0.5);
    tl.fromTo("#esc5 .loc", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.12);
    tl.fromTo("#esc5 .note", { autoAlpha: 0, y: -18, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.04, stagger: 0.05, ease: "back.out(1.6)" }, 0.32);
    tl.to("#esc5 .note", { autoAlpha: 0, y: -10, duration: 0.03, stagger: 0.01 }, 0.5);
    tl.fromTo("#v-equipo", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06, ease: "power1.inOut" }, 0.46);
    scrub(tl, $("#v-equipo"), 0.46, 0.52);
    tl.fromTo("#esc5 .kpi", { autoAlpha: 1, yPercent: 0, y: function () { return window.innerHeight; }, rotate: 3 }, { autoAlpha: 1, yPercent: 0, y: 0, rotate: 0, duration: 0.14, ease: "power3.out" }, 0.54);
    spark(tl, "#esc5", 0.6);
    tl.to("#esc5 .kpi", { yPercent: -16, autoAlpha: 0, duration: 0.06 }, 0.76);
    subs(tl, s.el, 0.1, 0.94);
    tl.to("#esc5 .stage", { autoAlpha: 0, duration: 0.05 }, 0.95);
  })();


  /* ---------- Tira de rodaje horizontal ---------- */
  (function () {
    var strip = $("#rodaje"), list = $(".reel-strip", strip);
    function dist() { return Math.max(0, list.scrollWidth - window.innerWidth); }
    gsap.to(list, {
      x: function () { return -dist(); },
      scrollTrigger: { trigger: strip, start: "top top", end: function () { return "+=" + Math.max(1, dist()); }, pin: true, scrub: 0.8, invalidateOnRefresh: true }
    });
  })();

  /* ---------- Entradas de secciones normales ---------- */
  $$(".director__ph, .director__tx > *, .call__tx > *, .book, .faq__in > *, .credits__roll > *").forEach(function (el) {
    gsap.from(el, { autoAlpha: 0, y: 30, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });
  gsap.from(".director__ph img", { scale: 1.18, ease: "none", scrollTrigger: { trigger: ".director", start: "top bottom", end: "bottom top", scrub: true } });

  ScrollTrigger.addEventListener("refresh", function () { buildMarks(); onScroll(); });
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  ScrollTrigger.refresh();
  if (skipIntro) {
    var tgt = document.getElementById(location.hash.slice(1));
    if (tgt) setTimeout(function () { window.scrollTo(0, sectionStart(tgt)); }, 50);
  }
})();
