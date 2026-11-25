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
    clinica: {
      label: "Clínica o centro de salud", noun: "tu clínica", nounCap: "Tu clínica", sign: "CLÍNICA", chart: "Citas por semana",
      t: "Una agenda que se llena sola", d: "Reserva online con recordatorios automáticos para llenar huecos y reducir ausencias.",
      notes: [["Nueva cita reservada", "Jueves · 18:15 · desde la web"], ["Recordatorios enviados", "12 pacientes de mañana, sin llamar a nadie"], ["Nueva reseña ★★★★★", "«Reservé en un minuto»"]]
    },
    hosteleria: {
      label: "Restaurante, bar o cafetería", noun: "tu local", nounCap: "Tu local", sign: "RESTAURANTE", chart: "Reservas por semana",
      t: "No perder mesas en pleno servicio", d: "Reservas y respuestas automáticas en WhatsApp e Instagram mientras tú estás en sala.",
      notes: [["Nueva reserva", "Mesa para 4 · sábado 21:30"], ["Respondido por la IA", "«¿Tenéis opciones sin gluten?»"], ["Nueva reseña ★★★★★", "«Volveremos seguro»"]]
    },
    gimnasio: {
      label: "Gimnasio o centro deportivo", noun: "tu centro", nounCap: "Tu centro", sign: "GIMNASIO", chart: "Altas por semana",
      t: "Altas y retención en piloto automático", d: "Clase de prueba con reserva online y avisos automáticos a quien deja de venir.",
      notes: [["Nueva alta", "Plan trimestral · desde la web"], ["Clase de prueba reservada", "Lunes · 19:00"], ["Aviso automático enviado", "8 socios que llevan dos semanas sin venir"]]
    },
    comercio: {
      label: "Tienda o comercio", noun: "tu tienda", nounCap: "Tu tienda", sign: "TIENDA", chart: "Pedidos por semana",
      t: "Que te encuentren y te compren sin llamar", d: "Ficha de Google cuidada, catálogo claro y pedidos por WhatsApp.",
      notes: [["Pedido por WhatsApp", "Recoger hoy a las 17:00"], ["Nueva visita desde el mapa", "«Cómo llegar» · hace 3 min"], ["Nueva reseña ★★★★★", "«Trato de diez»"]]
    },
    servicios: {
      label: "Servicios profesionales", noun: "tu despacho", nounCap: "Tu despacho", sign: "ESTUDIO", chart: "Contactos por semana",
      t: "Que lleguen clientes que encajan", d: "Una web que explica lo que haces, filtra y agenda la llamada sin ir y venir de correos.",
      notes: [["Llamada agendada", "Cliente potencial · martes 10:30"], ["Presupuesto solicitado", "Desde el formulario de la web"], ["Seguimiento enviado", "Propuesta reenviada automáticamente"]]
    },
    otro: {
      label: "Otro tipo de negocio", noun: "tu negocio", nounCap: "Tu negocio", sign: "TU NEGOCIO", chart: "Contactos por semana",
      t: "Ordenar el camino del cliente", d: "Cómo te encuentran, cómo te contactan y cómo respondes. En ese orden.",
      notes: [["Nuevo contacto", "Desde la web · hace 2 min"], ["Respondido al momento", "Pregunta frecuente resuelta por la IA"], ["Nueva reseña ★★★★★", "«Rápidos y claros»"]]
    }
  };
  var PAIN = {
    clientes: { label: "Entran pocos clientes nuevos", leak: "te cuesta que te encuentren y te elijan.", t: "Entender de dónde viene cada cliente", d: "Revisar por qué canal llega hoy cada cliente y reforzar el que ya funciona antes de abrir otros.", svc: "Consultoría estratégica" },
    tiempo: { label: "Se me van las horas en mensajes y tareas repetidas", leak: "tu tiempo se va en tareas que se pueden automatizar.", t: "Recuperar horas cada semana", d: "Apuntar las preguntas y tareas que repites y automatizar con IA las que más horas te quitan.", svc: "Implementación de IA" },
    web: { label: "Mi web no me trae clientes (o no tengo)", leak: "quien te busca no encuentra motivos para elegirte.", t: "Una web con un solo objetivo", d: "Rápida, pensada para el móvil y construida para que te contacten o reserven, no para decorar.", svc: "Página web profesional" },
    rumbo: { label: "Hago muchas cosas y no sé qué funciona", leak: "falta un plan con números detrás.", t: "Decidir con datos", d: "Medir lo que ya haces para dejar lo que no funciona y priorizar lo que sí.", svc: "Consultoría estratégica" }
  };
  var GOAL = {
    reservas: { label: "Más reservas y ventas", t: "Medir cada semana", d: "Contactos, reservas y ventas en un panel sencillo para saber qué acción trae resultados.", sub: "Las reservas entran mientras atiendes." },
    tiempo: { label: "Recuperar mi tiempo", t: "Sacar lo repetitivo de tus manos", d: "Dejar en automático lo que no necesita tu criterio para que vuelvas a lo que solo puedes hacer tú.", sub: "Lo repetitivo ya no pasa por tus manos." },
    crecer: { label: "Crecer con orden", t: "Hoja de ruta por trimestres", d: "Prioridades, plazos y presupuesto cerrado para crecer sin improvisar.", sub: "Cada decisión tiene un dato detrás." }
  };
  var SETS = { biz: BIZ, pain: PAIN, goal: GOAL };

  /* ---------------------------------------------------------
     Estado (se recuerda en este navegador)
     --------------------------------------------------------- */
  var KEY = "sp-diagnostico-v1";
  var state = { biz: null, pain: null, goal: null };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") ["biz", "pain", "goal"].forEach(function (k) { if (SETS[k][saved[k]]) state[k] = saved[k]; });
  } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function complete() { return !!(state.biz && state.pain && state.goal); }

  /* ---------------------------------------------------------
     Escena 5: copia de la fachada, que pasará a ser de día
     --------------------------------------------------------- */
  var cam5 = $("#cam5");
  var shop5 = null;
  (function cloneShop() {
    var src = $("#shop");
    if (!src || !cam5) return;
    var html = src.outerHTML
      .replace(/id="([\w-]+)"/g, 'id="$1-b"')
      .replace(/url\(#([\w-]+)\)/g, "url(#$1-b)");
    cam5.innerHTML = '<div class="cam-day"></div>' + html;
    shop5 = cam5.querySelector("svg");
    shop5.setAttribute("aria-label", "La misma fachada, de día y con la persiana subida. Entran clientes y llegan reservas al móvil.");
    var t1 = shop5.querySelector(".door-t");
    var t2 = t1.cloneNode(true);
    t2.textContent = "ABIERTO";
    t2.setAttribute("fill", "#2f9e6c");
    t2.setAttribute("opacity", "0");
    t2.classList.remove("door-t");
    t2.classList.add("door-t2");
    t1.parentNode.appendChild(t2);
  })();

  var DAY = {
    ".city": { fill: "#8399b1" }, ".facade": { fill: "#d6c4a6" }, ".cornice": { fill: "#b09f80" }, ".uw": { fill: "#a5bccd", opacity: 1 },
    ".band": { fill: "#20262e" }, ".sign": { fill: "#f4efe6" }, ".walk": { fill: "#c2b394" }, ".curb": { fill: "#9d8f74" }, ".road": { fill: "#55585e" },
    ".shutter-box": { fill: "#8b8f96" }, ".lamp rect": { fill: "#2d3138" }, ".lamp path:not(.cone)": { stroke: "#2d3138" }
  };
  function setDayStatic(svg) {
    if (!svg) return;
    Object.keys(DAY).forEach(function (sel) {
      $$(sel, svg).forEach(function (el) { Object.keys(DAY[sel]).forEach(function (p) { el.setAttribute(p, DAY[sel][p]); }); });
    });
    [".sky-d", ".sun", ".crowd", ".clients", ".door-t2"].forEach(function (s) { $$(s, svg).forEach(function (e) { e.setAttribute("opacity", 1); }); });
    [".stars", ".moon", ".city-win", ".wet", ".refl", ".cone", ".lamp-glow", ".ph-glow", ".door-t"].forEach(function (s) { $$(s, svg).forEach(function (e) { e.setAttribute("opacity", 0); }); });
    var sh = $(".shutter", svg); if (sh) sh.setAttribute("transform", "translate(0 -370)");
    var pos = [1205, 700, 1420];
    $$(".walker", svg).forEach(function (w, i) { w.setAttribute("transform", "translate(" + pos[i] + " 0)"); });
  }

  /* ---------------------------------------------------------
     Personalización (lo que la web "sabe" del cliente)
     --------------------------------------------------------- */
  function apply() {
    var b = BIZ[state.biz] || BIZ.otro;
    var g = GOAL[state.goal];
    $$('[data-f="noun"]').forEach(function (e) { e.textContent = b.noun; });
    $$('[data-f="nounCap"]').forEach(function (e) { e.textContent = b.nounCap; });
    $$('[data-f="chart"]').forEach(function (e) { e.textContent = b.chart; });
    $$('[data-f="goalSub"]').forEach(function (e) { e.textContent = g ? g.sub : "Las reservas entran mientras atiendes."; });
    if (shop5) {
      var sign = $(".sign", shop5);
      sign.textContent = b.sign;
      var long = b.sign.length > 9;
      sign.setAttribute("font-size", long ? 30 : 36);
      sign.setAttribute("letter-spacing", long ? 9 : 14);
    }
    $$(".notes .note").forEach(function (n, i) {
      var d = b.notes[i];
      if (!d) return;
      $("b", n).textContent = d[0];
      $("span", n).textContent = d[1];
    });
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

  // Encuadre de la fachada en pantallas verticales
  function portrait() { return window.innerWidth / window.innerHeight < 0.8; }
  function frameShops() {
    var a = window.innerWidth / window.innerHeight;
    var vb = "0 0 1600 900", par = "xMidYMid slice";
    if (a < 0.8) { vb = "420 120 760 700"; par = "xMidYMid meet"; }
    else if (a < 1.2) { var w = 900 * a * 1.15; vb = (800 - w / 2).toFixed(0) + " 0 " + w.toFixed(0) + " 900"; }
    $$("svg.shop").forEach(function (s) { s.setAttribute("viewBox", vb); s.setAttribute("preserveAspectRatio", par); });
  }
  frameShops();
  window.addEventListener("resize", frameShops);

  /* ---------------------------------------------------------
     Sin animación: estado de póster
     --------------------------------------------------------- */
  if (!CINE) {
    setDayStatic(shop5);
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

  /* ---------- ESCENA 1 · El cierre ---------- */
  (function () {
    var s = scene("#esc1", 380), tl = s.tl, svg = $("#shop");
    var cam = $("#cam1");
    tl.fromTo(cam, { scale: 1.02 }, { scale: function () { return portrait() ? 1.1 : 1.26; }, transformOrigin: "50% 66%", duration: 1, ease: "power1.inOut" }, 0);
    tl.fromTo($(".shutter", svg), { y: -370 }, { y: -262, duration: 0.42, ease: "power2.inOut" }, 0.12);
    tl.to($(".uw--lit", svg), { opacity: 0, duration: 0.02 }, 0.3);
    tl.to($$(".lamp-in", svg), { opacity: 0.25, duration: 0.04 }, 0.5);
    tl.to($(".ph-glow", svg), { opacity: 1, attr: { r: 70 }, duration: 0.3 }, 0.55);
    tl.fromTo(".ticket", { y: 0, yPercent: 140, rotate: 4 }, { y: 0, yPercent: 0, rotate: -3, duration: 0.2, ease: "power3.out" }, 0.38);
    tl.to(".ticket", { yPercent: -20, autoAlpha: 0, duration: 0.1 }, 0.72);
    subs(tl, s.el, 0.03, 0.9);
    tl.to("#esc1 .stage", { autoAlpha: 0, duration: 0.06 }, 0.94);

    // Lluvia
    var cv = $("#rain"), ctx = cv.getContext("2d"), drops = [], raf = 0, on = false;
    function size() {
      var d = Math.min(2, window.devicePixelRatio || 1);
      cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      drops = [];
      var n = Math.round((cv.clientWidth * cv.clientHeight) / 9000);
      for (var i = 0; i < n; i++) drops.push({ x: Math.random() * cv.clientWidth, y: Math.random() * cv.clientHeight, l: 10 + Math.random() * 18, v: 9 + Math.random() * 8, a: 0.08 + Math.random() * 0.22 });
    }
    function draw() {
      ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
      ctx.lineWidth = 1;
      for (var i = 0; i < drops.length; i++) {
        var p = drops[i];
        ctx.strokeStyle = "rgba(200,220,255," + p.a + ")";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 2, p.y + p.l); ctx.stroke();
        p.y += p.v; p.x -= 0.6;
        if (p.y > cv.clientHeight) { p.y = -p.l; p.x = Math.random() * (cv.clientWidth + 40); }
      }
      if (on) raf = requestAnimationFrame(draw);
    }
    size();
    window.addEventListener("resize", size);
    ScrollTrigger.create({
      trigger: s.el, start: "top bottom", end: "bottom top",
      onToggle: function (self) { on = self.isActive; cancelAnimationFrame(raf); if (on) draw(); }
    });
  })();

  /* ---------- ESCENA 2 · El vídeo ---------- */
  (function () {
    var s = scene("#esc2", 420), tl = s.tl;
    var feed = $("#esc2 .feed"), screen = $("#esc2 .screen"), t = $("#esc2 .tap");
    function far(f) { return function () { var me = $("#esc2 .post--me"); return -(me.offsetTop + me.offsetHeight / 2 - screen.clientHeight * 0.4) * f; }; }
    tl.fromTo("#esc2 .phone-wrap", { scale: 0.88, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 0.12, ease: "power2.out" }, 0);
    tl.fromTo(".bigtime", { scale: 0.9 }, { scale: 1.12, duration: 1 }, 0);
    tl.fromTo(feed, { y: 0 }, { y: far(0.24), duration: 0.08, ease: "power3.out" }, 0.05);
    tl.to(feed, { y: far(0.5), duration: 0.08, ease: "power3.out" }, 0.15);
    tl.to(feed, { y: far(0.78), duration: 0.08, ease: "power3.out" }, 0.25);
    tl.to(feed, { y: far(1), duration: 0.1, ease: "power4.out" }, 0.34);
    tap(tl, t, "50%", "62%", 0.45);
    tl.fromTo("#esc2 .reel", { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.04, ease: "power2.out" }, 0.46);
    tl.fromTo("#esc2 .reel img", { scale: 1.15 }, { scale: 1, duration: 0.3 }, 0.46);
    tl.fromTo("#esc2 .reel__bar i", { scaleX: 0 }, { scaleX: 1, duration: 0.26 }, 0.47);
    tl.fromTo("#esc2 .reel__copy > *", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.03, stagger: 0.025, ease: "power2.out" }, 0.5);
    tl.fromTo("#esc2 .heart-pop", { scale: 0, autoAlpha: 1 }, { scale: 1.15, duration: 0.03, ease: "back.out(3)" }, 0.64);
    tl.to("#esc2 .heart-pop", { scale: 1.4, autoAlpha: 0, duration: 0.03 }, 0.68);
    tl.to("#esc2 .ic-heart path", { fill: "#ff4d6a", stroke: "#ff4d6a", duration: 0.01 }, 0.65);
    tl.to("#esc2 .ic-save path", { fill: "#ffffff", duration: 0.01 }, 0.7);
    tap(tl, t, "24%", "86%", 0.74);
    tl.fromTo("#esc2 .profile", { x: 0, xPercent: 105 }, { x: 0, xPercent: 0, duration: 0.05, ease: "power3.out" }, 0.75);
    tap(tl, t, "38%", "40%", 0.86);
    tl.to("#esc2 .profile__link", { backgroundColor: "rgba(159,216,255,.22)", duration: 0.02 }, 0.86);
    tl.to("#esc2 .phone-wrap", { scale: 1.12, duration: 0.08, ease: "power2.in" }, 0.9);
    subs(tl, s.el, 0.02, 0.9);
    tl.to("#esc2 .stage", { autoAlpha: 0, duration: 0.05 }, 0.95);
  })();

  /* ---------- ESCENA 3 · La búsqueda ---------- */
  (function () {
    var s = scene("#esc3", 480), tl = s.tl;
    var lap = $("#esc3 .laptop"), ls = $("#esc3 .lscreen"), stage = $("#esc3 .stage");
    var q = $("#esc3 .q"), url = $("#esc3 .url__t"), me = $("#esc3 .res--me"), ptr = $("#esc3 .pointer"), clk = $("#esc3 .click");
    var QUERY = "consultoría para mejorar mi negocio";
    url.innerHTML = '<span class="u1">buscar</span><span class="u2" style="display:none">saulpoveda.com</span>';
    var typing = { n: 0 };

    function target() {
      var o = offsetIn(me, ls);
      return { x: o.x + me.offsetWidth * 0.32, y: o.y + me.offsetHeight * 0.48 };
    }
    function zoom() {
      var o = offsetIn(ls, lap);
      var cx = o.x + ls.offsetWidth / 2, cy = o.y + ls.offsetHeight / 2;
      var sw = stage.clientWidth, sh = stage.clientHeight;
      var k = Math.max(sw / ls.offsetWidth, sh / ls.offsetHeight) * 1.04;
      return { cx: cx, cy: cy, k: k, x: sw / 2 - (lap.offsetLeft + cx), y: sh / 2 - (lap.offsetTop + cy) };
    }

    tl.fromTo("#esc3 .room", { filter: "brightness(.35)" }, { filter: "brightness(1)", duration: 0.3 }, 0);
    tl.fromTo("#esc3 .beam, #esc3 .dust", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.02);
    tl.fromTo("#esc3 .desk", { filter: "brightness(.4)" }, { filter: "brightness(1)", duration: 0.3 }, 0);
    tl.fromTo(lap, { yPercent: 6 }, { yPercent: 0, duration: 0.2, ease: "power2.out" }, 0);
    tl.fromTo("#esc3 .lid", { rotationX: -90 }, { rotationX: -3, duration: 0.18, ease: "power2.out" }, 0.05);
    tl.fromTo("#esc3 .boot", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.02 }, 0.23);
    tl.fromTo("#esc3 .browser", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.23);
    tl.fromTo(typing, { n: 0 }, { n: QUERY.length, duration: 0.18, ease: "none" }, 0.28);
    var shown = -1;
    gsap.ticker.add(function () {
      var k = Math.round(typing.n);
      if (k !== shown) { shown = k; q.textContent = QUERY.slice(0, k); }
    });
    tl.fromTo("#esc3 .results", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: "power2.out" }, 0.48);
    tl.fromTo(ptr, { left: "72%", top: "86%" }, {
      left: function () { return target().x; }, top: function () { return target().y; }, duration: 0.08, ease: "power2.inOut"
    }, 0.54);
    tl.set(clk, { left: function () { return target().x; }, top: function () { return target().y; } }, 0.63);
    tl.fromTo(clk, { scale: 0.3, autoAlpha: 1 }, { scale: 1.6, autoAlpha: 0, duration: 0.03 }, 0.63);
    tl.to(me, { backgroundColor: "rgba(255,201,120,.45)", duration: 0.01 }, 0.63);
    tl.set("#esc3 .u1", { display: "none" }, 0.64);
    tl.set("#esc3 .u2", { display: "inline" }, 0.64);
    tl.fromTo("#esc3 .chrome__load", { scaleX: 0 }, { scaleX: 1, duration: 0.05 }, 0.64);
    tl.fromTo("#esc3 .mini", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.69);
    tl.fromTo("#esc3 .mini > *", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.03, stagger: 0.015 }, 0.7);
    tl.to(ptr, { autoAlpha: 0, duration: 0.02 }, 0.72);
    tl.to("#esc3 .room, #esc3 .desk, #esc3 .mug, #esc3 .notebook, #esc3 .slate", { autoAlpha: 0, duration: 0.1 }, 0.8);
    tl.to("#esc3 .lid", { rotationX: 0, duration: 0.04 }, 0.78);
    tl.to(lap, {
      scale: function () { return zoom().k; },
      x: function () { return zoom().x; },
      y: function () { return zoom().y; },
      transformOrigin: function () { var z = zoom(); return z.cx + "px " + z.cy + "px"; },
      duration: 0.16, ease: "power3.in"
    }, 0.78);
    tl.to("#esc3 .whiteout", { autoAlpha: 1, duration: 0.05 }, 0.93);
    subs(tl, s.el, 0.01, 0.86);
  })();

  /* ---------- ESCENA 5 · Tres meses después ---------- */
  (function () {
    if (!shop5) return;
    var s = scene("#esc5", 400), tl = s.tl, svg = shop5;
    tl.fromTo("#esc5 .card3", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.06 }, 0.08);
    tl.fromTo("#cam5 .cam-day", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.26 }, 0.16);
    tl.fromTo("#cam5", { scale: 1.12 }, { scale: 1.02, transformOrigin: "50% 60%", duration: 1, ease: "power1.out" }, 0);
    tl.fromTo($(".shutter", svg), { y: -262 }, { y: -370, duration: 0.2, ease: "power2.inOut" }, 0.14);
    var d0 = 0.16, dl = 0.26;
    tl.to($(".sky-d", svg), { opacity: 1, duration: dl }, d0);
    tl.to($$(".stars, .city-win, .wet, .refl, .cone, .lamp-glow, .ph-glow", svg), { opacity: 0, duration: dl * 0.6 }, d0);
    tl.to($(".moon", svg), { attr: { cy: 420 }, opacity: 0, duration: dl }, d0);
    tl.fromTo($(".sun", svg), { attr: { cy: 360 }, opacity: 0 }, { attr: { cy: 150 }, opacity: 1, duration: dl }, d0 + 0.04);
    Object.keys(DAY).forEach(function (sel) {
      var els = $$(sel, svg);
      if (!els.length) return;
      var v = DAY[sel], to = { duration: dl };
      if (v.fill) to.fill = v.fill;
      if (v.stroke) to.stroke = v.stroke;
      if (v.opacity !== undefined) to.opacity = v.opacity;
      tl.to(els, to, d0);
    });
    tl.to($$(".lamp-in", svg), { opacity: 0.8, duration: 0.05 }, d0);
    tl.to($(".door-t", svg), { opacity: 0, duration: 0.02 }, 0.34);
    tl.to($(".door-t2", svg), { opacity: 1, duration: 0.02 }, 0.35);
    tl.to($(".crowd", svg), { opacity: 1, duration: 0.02 }, 0.36);
    var w = $$(".walker", svg);
    tl.fromTo(w[0], { x: 1720 }, { x: 1205, duration: 0.3, ease: "power1.out" }, 0.36);
    tl.fromTo(w[1], { x: -120 }, { x: 700, duration: 0.34, ease: "power1.out" }, 0.4);
    tl.fromTo(w[2], { x: 1900 }, { x: 1420, duration: 0.3, ease: "power1.out" }, 0.46);
    tl.to($(".clients", svg), { opacity: 1, duration: 0.06 }, 0.42);
    tl.fromTo("#esc5 .note", { autoAlpha: 0, y: -18, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.05, stagger: 0.07, ease: "back.out(1.6)" }, 0.5);
    tl.fromTo("#esc5 .chart", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.7);
    var line = $("#esc5 .chart__line");
    var L = 420;
    line.style.strokeDasharray = L;
    tl.fromTo(line, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.14 }, 0.72);
    tl.fromTo("#esc5 .chart__area", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.78);
    subs(tl, s.el, 0.02, 0.92);
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
