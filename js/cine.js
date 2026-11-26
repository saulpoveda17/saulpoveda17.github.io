/* Saúl Poveda · capa cinematográfica
 * La apertura (bandas de cine, título, foto) y la coreografía de scroll viven en CSS.
 * Aquí solo va la aparición única de bloques; sin JavaScript la página ya está completa. */
(function () {
  "use strict";

  const items = document.querySelectorAll("[data-reveal]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }),
    { rootMargin: "0px 0px -10% 0px" }
  );

  items.forEach((el, i) => {
    el.style.setProperty("--i", String(i % 4));
    io.observe(el);
  });

  /* Pasos del proceso: sin scroll-timeline, aparecen una vez */
  if (!CSS.supports("animation-timeline: view()")) {
    document.querySelectorAll(".steps > li").forEach((li) => {
      li.setAttribute("data-reveal", "");
      io.observe(li);
    });
  }
})();
