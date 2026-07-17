// Año dinámico
      document.getElementById("year").textContent = new Date().getFullYear();

      /* ----- Cursor personalizado (desktop) ----- */
      const cursor = document.getElementById("cursor");
      const seguidor = document.getElementById("cursor-seguidor");
      const cursorLabel = document.getElementById("cursor-label");
      let mouseX = 0,
        mouseY = 0,
        segX = 0,
        segY = 0;

      const esTactil = window.matchMedia("(hover: none)").matches;
      if (esTactil) {
        if (cursor) cursor.style.display = "none";
        if (seguidor) seguidor.style.display = "none";
        if (cursorLabel) cursorLabel.style.display = "none";
      } else {
        document.addEventListener("mousemove", (e) => {
          mouseX = e.clientX;
          mouseY = e.clientY;
          cursor.style.left = mouseX + "px";
          cursor.style.top = mouseY + "px";
          if (cursorLabel) {
            cursorLabel.style.left = mouseX + "px";
            cursorLabel.style.top = mouseY + 26 + "px";
          }
        });

        function animarSeguidor() {
          segX += (mouseX - segX) * 0.14;
          segY += (mouseY - segY) * 0.14;
          seguidor.style.left = segX + "px";
          seguidor.style.top = segY + "px";
          requestAnimationFrame(animarSeguidor);
        }
        animarSeguidor();

        document.querySelectorAll("a, button, .servicio-card").forEach((el) => {
          el.addEventListener("mouseenter", () => {
            cursor.style.width = "16px";
            cursor.style.height = "16px";
            seguidor.style.width = "44px";
            seguidor.style.height = "44px";
          });
          el.addEventListener("mouseleave", () => {
            cursor.style.width = "10px";
            cursor.style.height = "10px";
            seguidor.style.width = "32px";
            seguidor.style.height = "32px";
          });
        });

        /* Etiqueta de cursor en elementos [data-cursor] */
        document.querySelectorAll("[data-cursor]").forEach((el) => {
          el.addEventListener("mouseenter", () => {
            if (cursorLabel) {
              cursorLabel.textContent = el.getAttribute("data-cursor");
              cursorLabel.classList.add("visible");
            }
            seguidor.style.width = "60px";
            seguidor.style.height = "60px";
            seguidor.style.opacity = "0.7";
          });
          el.addEventListener("mouseleave", () => {
            if (cursorLabel) cursorLabel.classList.remove("visible");
            seguidor.style.width = "32px";
            seguidor.style.height = "32px";
            seguidor.style.opacity = "";
          });
        });

        /* Imán en botones (desktop) */
        document
          .querySelectorAll(".btn-primario, .btn-secundario, .nav-cta")
          .forEach((btn) => {
            btn.addEventListener("mousemove", (e) => {
              const r = btn.getBoundingClientRect();
              const relX = e.clientX - (r.left + r.width / 2);
              const relY = e.clientY - (r.top + r.height / 2);
              const fuerza = 0.3;
              const max = 8;
              const tx = Math.max(-max, Math.min(max, relX * fuerza));
              const ty = Math.max(-max, Math.min(max, relY * fuerza));
              btn.style.transform = `translate(${tx}px, ${ty}px)`;
            });
            btn.addEventListener("mouseleave", () => {
              btn.style.transform = "";
            });
          });
      }

      /* ----- Barra de progreso + nav scroll ----- */
      const navbar = document.getElementById("navbar");
      const progresoBar = document.getElementById("progreso-scroll");
      window.addEventListener("scroll", () => {
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        const progreso = (scrollTop / scrollHeight) * 100;
        progresoBar.style.width = progreso + "%";

        if (scrollTop > 20) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      });

      /* ----- Animaciones on scroll (CSS) ----- */
      /* En modo cine, GSAP controla entrada/salida de bloques;
         solo mantenemos reveals de clip en títulos/foto */
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
        );
        const selector = document.body.classList.contains("cine")
          ? ".reveal-up, .reveal-left"
          : ".animar, .reveal-up, .reveal-left";
        document.querySelectorAll(selector).forEach((el) => io.observe(el));
        if (document.body.classList.contains("cine")) {
          document
            .querySelectorAll(".animar")
            .forEach((el) => el.classList.add("visible"));
        }
      } else {
        document
          .querySelectorAll(".animar, .reveal-up, .reveal-left")
          .forEach((el) => el.classList.add("visible"));
      }

      /* ----- FAQ acordeón ----- */
      document.querySelectorAll(".faq-question").forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = btn.closest(".faq-item");
          const answer = item.querySelector(".faq-answer");
          const isOpen = item.classList.contains("open");

          if (isOpen) {
            item.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
            answer.style.maxHeight = "0px";
          } else {
            item.classList.add("open");
            btn.setAttribute("aria-expanded", "true");
            answer.style.maxHeight = answer.scrollHeight + "px";
          }
        });
      });

      /* ----- Menú móvil ----- */
      function toggleMenu() {
        const menu = document.getElementById("menu-movil");
        const btn = document.getElementById("menu-btn");
        menu.classList.toggle("abierto");
        const spans = btn.querySelectorAll("span");
        if (menu.classList.contains("abierto")) {
          spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
          spans[1].style.opacity = "0";
          spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
        } else {
          spans[0].style.transform = "";
          spans[1].style.opacity = "";
          spans[2].style.transform = "";
        }
      }
      window.toggleMenu = toggleMenu;

      /* ----- Formulario con Formspree ----- */
      const formulario = document.getElementById("formulario-contacto");
      if (formulario) {
        formulario.addEventListener("submit", async function (e) {
          e.preventDefault();
          const btn = this.querySelector(".btn-enviar");
          const textoOriginal = btn.innerHTML;

          btn.innerHTML = "Enviando...";
          btn.disabled = true;

          try {
            const respuesta = await fetch(this.action, {
              method: "POST",
              body: new FormData(this),
              headers: { Accept: "application/json" },
            });

            if (respuesta.ok) {
              btn.innerHTML = "✓ Mensaje enviado correctamente";
              btn.style.background = "var(--success)";
              this.reset();
              setTimeout(() => {
                btn.innerHTML = textoOriginal;
                btn.style.background = "";
                btn.disabled = false;
              }, 4000);
            } else {
              throw new Error("Error en el envío");
            }
          } catch (error) {
            btn.innerHTML = "✗ Error al enviar. Inténtalo de nuevo";
            btn.style.background = "#ef4444";
            btn.disabled = false;
            setTimeout(() => {
              btn.innerHTML = textoOriginal;
              btn.style.background = "";
            }, 3000);
          }
        });
      }

      /* ----- Scroll suave en enlaces internos ----- */
      document.querySelectorAll('a[href^="#"]').forEach((enlace) => {
        enlace.addEventListener("click", function (e) {
          const href = this.getAttribute("href");
          if (href === "#") return;
          const destino = document.querySelector(href);
          if (destino) {
            e.preventDefault();
            destino.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });

      /* ----- Parallax hero glow (scroll + ratón) ----- */
      const heroGlow = document.querySelector(".hero-glow");
      const heroSeccion = document.getElementById("inicio");
      const reducidoMov = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (heroGlow) {
        let gScroll = 0,
          gmx = 0,
          gmy = 0,
          gmxTarget = 0,
          gmyTarget = 0,
          glowTicking = false;

        const aplicarGlow = () => {
          gmx += (gmxTarget - gmx) * 0.08;
          gmy += (gmyTarget - gmy) * 0.08;
          heroGlow.style.transform = `translate(${gmx}px, ${gScroll * 0.15 + gmy}px)`;
          if (
            Math.abs(gmxTarget - gmx) > 0.1 ||
            Math.abs(gmyTarget - gmy) > 0.1
          ) {
            requestAnimationFrame(aplicarGlow);
          } else {
            glowTicking = false;
          }
        };

        window.addEventListener(
          "scroll",
          () => {
            gScroll = window.scrollY;
            heroGlow.style.transform = `translate(${gmx}px, ${gScroll * 0.15 + gmy}px)`;
          },
          { passive: true },
        );

        if (!reducidoMov && !esTactil && heroSeccion) {
          heroSeccion.addEventListener("mousemove", (e) => {
            const r = heroSeccion.getBoundingClientRect();
            gmxTarget = ((e.clientX - r.width / 2) / r.width) * 40;
            gmyTarget = ((e.clientY - r.height / 2) / r.height) * 40;
            if (!glowTicking) {
              glowTicking = true;
              requestAnimationFrame(aplicarGlow);
            }
          });
        }
      }

      /* ----- Navegación lateral (dots) — sección activa ----- */
      (function () {
        const sideLinks = Array.from(document.querySelectorAll(".side-nav a"));
        if (!sideLinks.length || !("IntersectionObserver" in window)) return;
        const mapa = new Map();
        sideLinks.forEach((a) => {
          const sec = document.querySelector(a.getAttribute("href"));
          if (sec) mapa.set(sec, a);
        });
        const navIo = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                sideLinks.forEach((a) => a.classList.remove("active"));
                const activo = mapa.get(entry.target);
                if (activo) activo.classList.add("active");
              }
            });
          },
          { threshold: 0, rootMargin: "-45% 0px -45% 0px" },
        );
        mapa.forEach((_, sec) => navIo.observe(sec));
      })();

      /* ----- Experiencia: storytelling por scroll ----- */
      (function () {
        const wrap = document.getElementById("exp-wrap");
        if (!wrap) return;
        const titulos = wrap.querySelectorAll(".exp-title-item");
        const capitulos = wrap.querySelectorAll(".exp-chapter");
        const progreso = document.getElementById("exp-progress");
        const total = titulos.length;
        const esEscritorio = () => window.innerWidth > 768;

        const activar = (i) => {
          titulos.forEach((t, n) => t.classList.toggle("active", n === i));
          capitulos.forEach((c, n) => c.classList.toggle("active", n === i));
        };

        const onScroll = () => {
          if (!esEscritorio()) {
            if (progreso) progreso.style.width = "0%";
            return;
          }
          const rect = wrap.getBoundingClientRect();
          const vh = window.innerHeight;
          const recorrido = rect.height - vh;
          let p = (0 - rect.top) / recorrido;
          p = Math.max(0, Math.min(1, p));
          if (progreso) progreso.style.width = p * 100 + "%";
          let idx = Math.floor(p * total);
          if (idx >= total) idx = total - 1;
          activar(idx);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        onScroll();
      })();

      /* ----- Demo: toggle Antes / Después ----- */
      (function () {
        const viewport = document.getElementById("demo-viewport");
        const tabs = document.querySelectorAll(".demo-tab");
        if (!viewport || !tabs.length) return;

        const aplicarModo = (modo) => {
          viewport.classList.toggle("antes", modo === "antes");
          viewport.querySelectorAll("[data-antes]").forEach((el) => {
            const valor =
              modo === "antes"
                ? el.getAttribute("data-antes")
                : el.getAttribute("data-despues");
            if (valor != null) el.textContent = valor;
          });
          viewport.querySelectorAll("[data-antes-html]").forEach((el) => {
            const valor =
              modo === "antes"
                ? el.getAttribute("data-antes-html")
                : el.getAttribute("data-despues-html");
            if (valor != null) el.innerHTML = valor;
          });
        };

        tabs.forEach((tab) => {
          tab.addEventListener("click", () => {
            const modo = tab.getAttribute("data-demo");
            tabs.forEach((t) => {
              const activo = t === tab;
              t.classList.toggle("active", activo);
              t.setAttribute("aria-selected", activo ? "true" : "false");
            });
            aplicarModo(modo);
          });
        });
      })();

      /* ----- Proceso: micro-imán en hover (desktop) ----- */
      if (!esTactil && !reducidoMov) {
        document.querySelectorAll(".proceso-step").forEach((step) => {
          step.addEventListener("mousemove", (e) => {
            const r = step.getBoundingClientRect();
            const relX = (e.clientX - (r.left + r.width / 2)) / r.width;
            const relY = (e.clientY - (r.top + r.height / 2)) / r.height;
            step.style.transform = `translate(${relX * 6}px, ${relY * 6 - 2}px)`;
          });
          step.addEventListener("mouseleave", () => {
            step.style.transform = "";
          });
        });
      }

      /* ----- Sobre mí: sticky por capítulos ----- */
      (function () {
        const wrap = document.getElementById("sobre-mi-wrap");
        if (!wrap) return;
        const caps = wrap.querySelectorAll(".sobre-mi-cap");
        const progreso = document.getElementById("sobre-mi-progress");
        const total = caps.length;
        const esEscritorio = () => window.innerWidth > 768;

        const activar = (i) => {
          caps.forEach((c, n) => c.classList.toggle("activo", n === i));
        };

        const onScroll = () => {
          if (!esEscritorio()) {
            caps.forEach((c) => c.classList.add("activo"));
            if (progreso) progreso.style.width = "0%";
            return;
          }
          const rect = wrap.getBoundingClientRect();
          const vh = window.innerHeight;
          const recorrido = rect.height - vh;
          let p = (0 - rect.top) / recorrido;
          p = Math.max(0, Math.min(1, p));
          if (progreso) progreso.style.width = p * 100 + "%";
          let idx = Math.floor(p * total);
          if (idx >= total) idx = total - 1;
          activar(idx);
        };

        activar(0);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
      })();

      /* ----- Preloader cinematográfico ----- */
      (function () {
        const preloader = document.getElementById("preloader");
        const numEl = document.getElementById("preloader-num");
        if (!preloader || !numEl) return;

        const reducido = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (reducido) {
          preloader.style.display = "none";
          return;
        }

        // Bloquear scroll mientras carga
        document.body.style.overflow = "hidden";

        let valor = 0;
        const duracion = 1400;
        const inicio = performance.now();

        const actualizar = (ahora) => {
          const t = Math.min((ahora - inicio) / duracion, 1);
          // ease out cubic
          const ease = 1 - Math.pow(1 - t, 3);
          valor = Math.round(ease * 100);
          numEl.textContent = valor;

          if (t < 1) {
            requestAnimationFrame(actualizar);
          } else {
            // Pausa dramática, luego barre hacia arriba
            setTimeout(() => {
              preloader.classList.add("saliendo");
              preloader.addEventListener(
                "animationend",
                () => {
                  preloader.style.display = "none";
                  document.body.style.overflow = "";
                  document.dispatchEvent(new CustomEvent("preloader-fin"));
                },
                { once: true },
              );
            }, 280);
          }
        };

        requestAnimationFrame(actualizar);
      })();

      /* ----- Líneas de sección animadas ----- */
      (function () {
        const lineas = document.querySelectorAll(".linea-seccion");
        if (!lineas.length || !("IntersectionObserver" in window)) return;
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.5 },
        );
        lineas.forEach((l) => io.observe(l));
      })();

      /* ----- CTA final: cursor parpadeante + botón retrasado ----- */
      (function () {
        const ctaSection = document.getElementById("cta-final");
        const cursor = ctaSection
          ? ctaSection.querySelector(".cta-cursor-parpadeo")
          : null;
        const btn = document.getElementById("cta-btn");
        if (!ctaSection || !cursor || !btn) return;

        const io = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return;
            io.disconnect();
            // Cursor aparece con el título
            setTimeout(() => cursor.classList.add("visible"), 600);
            // Botón aparece 800ms después
            setTimeout(() => btn.classList.add("visible"), 1400);
          },
          { threshold: 0.4 },
        );
        io.observe(ctaSection);
      })();

      /* ----- Reveal palabra a palabra — hero h1 (espera preloader) ----- */
      (function () {
        const reducido = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const titulo = document.querySelector(".hero-titulo");
        if (!titulo) return;

        // Partir en palabras (preserva .acento)
        const nodos = Array.from(titulo.childNodes);
        titulo.innerHTML = "";

        nodos.forEach((nodo) => {
          if (nodo.nodeType === Node.TEXT_NODE) {
            const palabras = nodo.textContent.trim().split(/\s+/);
            palabras.forEach((palabra) => {
              if (!palabra) return;
              const wrap = document.createElement("span");
              wrap.className = "hero-palabra";
              const inner = document.createElement("span");
              inner.className = "hero-palabra-inner";
              inner.textContent = palabra;
              wrap.appendChild(inner);
              titulo.appendChild(wrap);
            });
          } else if (
            nodo.nodeType === Node.ELEMENT_NODE &&
            nodo.classList.contains("acento")
          ) {
            const texto = nodo.textContent.trim();
            const wrap = document.createElement("span");
            wrap.className = "hero-palabra";
            const inner = document.createElement("span");
            inner.className = "hero-palabra-inner acento";
            inner.textContent = texto;
            wrap.appendChild(inner);
            titulo.appendChild(wrap);
          }
        });

        // Si no hay animación, mostrar ya
        if (reducido) {
          titulo
            .querySelectorAll(".hero-palabra-inner")
            .forEach((el) => el.classList.add("visible"));
          document.body.classList.add("hero-ready");
          return;
        }

        // El motor GSAP (o fallback) dispara la intro tras preloader-fin
        window.__heroPalabrasListas = true;
      })();
