(function () {
        const reducido = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        function alFinPreloader(cb) {
          let hecho = false;
          const run = () => {
            if (hecho) return;
            hecho = true;
            cb();
          };
          const pre = document.getElementById("preloader");
          if (!pre || pre.style.display === "none" || reducido) {
            run();
            return;
          }
          document.addEventListener("preloader-fin", run, { once: true });
          setTimeout(run, 3200);
        }

        function introBasica() {
          document
            .querySelectorAll(".hero-palabra-inner")
            .forEach((el, i) =>
              setTimeout(() => el.classList.add("visible"), 60 + i * 50),
            );
          document.body.classList.add("hero-stage", "hero-ready");
        }

        if (
          typeof gsap === "undefined" ||
          typeof ScrollTrigger === "undefined"
        ) {
          alFinPreloader(introBasica);
          return;
        }

        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();

        /* Bloque: aparece → se sostiene → desaparece (scrub) */
        function cineBloque(sec, target, intense) {
          if (!sec || !target) return;
          target.classList.add("bloque-cine");

          const yIn = intense ? 120 : 64;
          const yOut = intense ? -100 : -52;
          const scaleIn = intense ? 0.86 : 0.95;
          const blurIn = intense ? 16 : 8;

          gsap.set(target, {
            opacity: 0,
            y: yIn,
            scale: scaleIn,
            filter: "blur(" + blurIn + "px)",
            transformOrigin: "50% 40%",
          });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sec,
              start: "top 95%",
              end: "bottom 5%",
              scrub: intense ? 0.8 : 0.55,
              invalidateOnRefresh: true,
            },
          });

          tl.to(target, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            ease: "none",
            duration: 0.2,
          });
          tl.to(target, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            ease: "none",
            duration: 0.48,
          });
          tl.to(target, {
            opacity: 0,
            y: yOut,
            scale: scaleIn,
            filter: "blur(" + blurIn + "px)",
            ease: "none",
            duration: 0.32,
          });
        }

        /* Piezas internas con ciclo propio */
        function cinePiezas(sec, selector, intense) {
          if (!sec) return;
          const piezas = sec.querySelectorAll(selector);
          piezas.forEach((el, i) => {
            const delay = Math.min(i * 0.035, 0.14);
            gsap.set(el, {
              opacity: 0,
              y: intense ? 72 : 36,
            });
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: el,
                start: "top 96%",
                end: "bottom 8%",
                scrub: intense ? 0.75 : 0.5,
              },
            });
            tl.to(
              el,
              { opacity: 1, y: 0, ease: "none", duration: 0.22 },
              delay,
            )
              .to(el, { opacity: 1, duration: 0.42, ease: "none" })
              .to(el, {
                opacity: 0,
                y: intense ? -56 : -30,
                ease: "none",
                duration: 0.28,
              });
          });
        }

        /* HERO PIN — H1 centrado → composición (desktop) */
        function montarHeroPin() {
          return new Promise((resolve) => {
            const titulo = document.querySelector(".hero-titulo");
            const heroSec = document.getElementById("inicio");
            if (!titulo || !heroSec) {
              resolve();
              return;
            }

            document.body.classList.add("hero-stage", "cine");

            const inners = gsap.utils.toArray(".hero-palabra-inner");
            const visual = document.querySelector(".hero-visual");
            const cue = document.querySelector(".scroll-cue");

            gsap.set(
              [
                ".hero-badge",
                ".hero-descripcion",
                ".hero-credencial",
                ".hero-botones",
              ],
              { opacity: 0, y: 44, filter: "blur(10px)" },
            );
            if (visual) {
              gsap.set(visual, {
                opacity: 0,
                clipPath: "inset(0% 0% 0% 100%)",
                filter: "blur(12px)",
              });
            }
            if (cue) gsap.set(cue, { opacity: 0 });

            const centerTitle = () => {
              const r = titulo.getBoundingClientRect();
              return {
                x: window.innerWidth / 2 - (r.left + r.width / 2),
                y: window.innerHeight / 2 - (r.top + r.height / 2) - 24,
                scale: 1.14,
              };
            };

            /* Medir en layout, luego centrar */
            gsap.set(titulo, { opacity: 1, x: 0, y: 0, scale: 1 });
            if (inners.length) gsap.set(inners, { yPercent: 0, opacity: 0 });
            const c0 = centerTitle();
            gsap.set(titulo, { x: c0.x, y: c0.y, scale: c0.scale });

            const crearPin = () => {
              /* Recalcular centro con el H1 ya tipografiado */
              gsap.set(titulo, { x: 0, y: 0, scale: 1, clearProps: "" });
              const c = centerTitle();
              gsap.set(titulo, { x: c.x, y: c.y, scale: 1.14 });

              const heroTl = gsap.timeline({
                scrollTrigger: {
                  trigger: "#inicio",
                  start: "top top",
                  end: "+=240%",
                  pin: true,
                  scrub: 0.75,
                  anticipatePin: 1,
                },
              });

              heroTl.fromTo(
                titulo,
                { x: c.x, y: c.y, scale: 1.14 },
                {
                  x: 0,
                  y: 0,
                  scale: 1,
                  ease: "power2.inOut",
                  duration: 0.4,
                },
                0,
              );

              if (cue) heroTl.to(cue, { opacity: 0, duration: 0.06 }, 0);

              heroTl.to(
                ".hero-badge",
                {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  duration: 0.1,
                  ease: "none",
                },
                0.38,
              );
              heroTl.to(
                ".hero-descripcion",
                {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  duration: 0.1,
                  ease: "none",
                },
                0.46,
              );
              heroTl.to(
                ".hero-credencial",
                {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  duration: 0.1,
                  ease: "none",
                },
                0.54,
              );
              heroTl.to(
                ".hero-botones",
                {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  duration: 0.1,
                  ease: "none",
                },
                0.62,
              );

              if (visual) {
                heroTl.to(
                  visual,
                  {
                    opacity: 1,
                    clipPath: "inset(0% 0% 0% 0%)",
                    filter: "blur(0px)",
                    duration: 0.38,
                    ease: "power2.out",
                  },
                  0.42,
                );
              }

              if (cue) heroTl.to(cue, { opacity: 1, duration: 0.08 }, 0.78);

              heroTl.to(
                ".hero-contenido",
                {
                  opacity: 0,
                  y: -70,
                  scale: 0.94,
                  filter: "blur(14px)",
                  duration: 0.22,
                  ease: "none",
                },
                0.88,
              );

              resolve();
            };

            /* Palabras primero; pin después (evita H1 invisible) */
            if (inners.length) {
              gsap.set(inners, { yPercent: 120, opacity: 0, force3D: true });
              gsap.to(inners, {
                yPercent: 0,
                opacity: 1,
                duration: 0.9,
                stagger: 0.05,
                ease: "power4.out",
                onComplete: () => {
                  inners.forEach((el) => {
                    el.classList.add("visible");
                    gsap.set(el, { clearProps: "transform" });
                  });
                  document.body.classList.add("hero-ready");
                  crearPin();
                },
              });
            } else {
              document.body.classList.add("hero-ready");
              crearPin();
            }
          });
        }

        /* HERO móvil */
        function montarHeroMobile() {
          document.body.classList.add("hero-stage", "cine");
          const inners = gsap.utils.toArray(".hero-palabra-inner");
          const visual = document.querySelector(".hero-visual");

          gsap.set(
            [
              ".hero-badge",
              ".hero-descripcion",
              ".hero-credencial",
              ".hero-botones",
              ".hero-visual",
            ],
            { opacity: 0, y: 30 },
          );
          gsap.set(".hero-titulo", { opacity: 1 });

          const tl = gsap.timeline({
            onComplete: () => document.body.classList.add("hero-ready"),
          });

          if (inners.length) {
            gsap.set(inners, { yPercent: 110, opacity: 0 });
            tl.to(inners, {
              yPercent: 0,
              opacity: 1,
              stagger: 0.045,
              duration: 0.7,
              ease: "power4.out",
              onComplete: () =>
                inners.forEach((el) => el.classList.add("visible")),
            });
          }

          tl.to(
            [
              ".hero-badge",
              ".hero-descripcion",
              ".hero-credencial",
              ".hero-botones",
            ],
            { opacity: 1, y: 0, duration: 0.45, stagger: 0.07 },
            "-=0.25",
          );
          if (visual) {
            tl.to(visual, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3");
          }

          /* Solo salida al scrollear (no resetear opacity a 0 tras la intro) */
          const heroCont = document.querySelector(".hero-contenido");
          if (heroCont) {
            gsap.to(heroCont, {
              opacity: 0,
              y: -48,
              scale: 0.96,
              filter: "blur(10px)",
              ease: "none",
              scrollTrigger: {
                trigger: "#inicio",
                start: "center top",
                end: "bottom top",
                scrub: 0.55,
              },
            });
          }
        }

        /* Mundo: todos los bloques + ideas nuevas */
        function montarMundo(intense) {
          [
            [".franja-experiencia", ".franja-experiencia-inner"],
            ["#problema", ".contenedor"],
            ["#contraste", ".contenedor"],
            ["#trayectoria", ".contenedor"],
            ["#demo", ".contenedor"],
            ["#servicios", ".contenedor"],
            ["#proceso", ".contenedor"],
            ["#faq", ".contenedor"],
            ["#contacto", ".contenedor"],
            ["#cta-final", ".contenedor"],
          ].forEach(([selSec, selInner]) => {
            const sec = document.querySelector(selSec);
            if (!sec) return;
            cineBloque(sec, sec.querySelector(selInner) || sec, intense);
          });

          [
            ["#exp-wrap", ".exp-inner"],
            ["#sobre-mi-wrap", ".sobre-mi-inner"],
          ].forEach(([selWrap, selInner]) => {
            const wrap = document.querySelector(selWrap);
            const inner = wrap && wrap.querySelector(selInner);
            if (wrap && inner) cineBloque(wrap, inner, intense);
          });

          cinePiezas(document.getElementById("problema"), ".problema-item", intense);
          cinePiezas(document.getElementById("servicios"), ".servicio-card", intense);
          cinePiezas(document.getElementById("proceso"), ".proceso-step", intense);
          cinePiezas(document.getElementById("contraste"), ".contraste-col", intense);
          cinePiezas(document.getElementById("faq"), ".faq-item", intense);
          cinePiezas(document.getElementById("trayectoria"), ".timeline-item", intense);

          /* Títulos: máscara de entrada (sin salida agresiva) */
          document.querySelectorAll(".titulo-seccion, .cta-titulo").forEach((h) => {
            gsap.fromTo(
              h,
              { clipPath: "inset(100% 0 0 0)", y: 28, opacity: 0.4 },
              {
                clipPath: "inset(0% 0 0 0)",
                y: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: h,
                  start: "top 90%",
                  end: "top 55%",
                  scrub: true,
                },
              },
            );
          });

          /* Números parallax */
          document.querySelectorAll(".problema-item-num").forEach((num) => {
            gsap.fromTo(
              num,
              { y: 60, opacity: 0.06 },
              {
                y: -48,
                opacity: 0.6,
                ease: "none",
                scrollTrigger: {
                  trigger: num.closest(".problema-item") || num,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
          });

          /* CTA imagen Ken Burns */
          const ctaImg = document.querySelector(".cta-imagen-fondo img");
          if (ctaImg) {
            gsap.fromTo(
              ctaImg,
              { scale: 1.25, filter: "brightness(0.55)" },
              {
                scale: 1,
                filter: "brightness(1)",
                ease: "none",
                scrollTrigger: {
                  trigger: "#cta-final",
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
          }

          /* Wipe por velocidad de scroll */
          const wipe = document.getElementById("cine-wipe");
          if (wipe) {
            ScrollTrigger.create({
              start: 0,
              end: "max",
              onUpdate: (self) => {
                const v = Math.min(Math.abs(self.getVelocity()) / 2800, 1);
                gsap.to(wipe, {
                  opacity: v * 0.4,
                  scaleY: 0.04 + v * 0.2,
                  duration: 0.18,
                  overwrite: true,
                });
              },
            });
          }

          /* Marquee reactivo al scroll */
          const track = document.querySelector(".marquee-track");
          if (track && intense) {
            ScrollTrigger.create({
              start: 0,
              end: "max",
              onUpdate: (self) => {
                const speed =
                  30 - Math.min(Math.abs(self.getVelocity()) / 180, 20);
                track.style.animationDuration = speed + "s";
                track.style.animationDirection =
                  self.direction === 1 ? "normal" : "reverse";
              },
            });
          }

          /* Viñeta respira con el scroll */
          const vig = document.querySelector(".cine-vignette");
          if (vig && intense) {
            gsap.to(vig, {
              opacity: 0.75,
              ease: "none",
              scrollTrigger: {
                trigger: document.body,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
              },
            });
          }
        }

        /* MatchMedia */
        mm.add(
          "(prefers-reduced-motion: no-preference) and (min-width: 769px)",
          () => {
            alFinPreloader(() => {
              montarHeroPin().then(() => {
                montarMundo(true);
                requestAnimationFrame(() => ScrollTrigger.refresh());
              });
            });
            return () => ScrollTrigger.getAll().forEach((st) => st.kill());
          },
        );

        mm.add(
          "(prefers-reduced-motion: no-preference) and (max-width: 768px)",
          () => {
            alFinPreloader(() => {
              montarHeroMobile();
              montarMundo(false);
              requestAnimationFrame(() => ScrollTrigger.refresh());
            });
            return () => ScrollTrigger.getAll().forEach((st) => st.kill());
          },
        );

        if (reducido) {
          alFinPreloader(introBasica);
        }

        document.addEventListener("preloader-fin", () =>
          ScrollTrigger.refresh(),
        );
        window.addEventListener("load", () => ScrollTrigger.refresh());
      })();
