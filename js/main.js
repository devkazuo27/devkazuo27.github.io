// Portafolio — animaciones (GSAP + ScrollTrigger) y utilidades.
// Los estados iniciales de animación se ponen desde JS: si GSAP no carga
// o el usuario prefiere menos movimiento, el contenido queda visible.
"use strict";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = typeof window.gsap !== "undefined";

/* ---------- Reloj GMT-6 y año ---------- */
const clockEl = document.getElementById("clock");
function tick() {
  clockEl.textContent = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Mexico_City",
  }).format(new Date());
}
tick();
setInterval(tick, 30_000);

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Copiar correo ---------- */
const copyBtn = document.getElementById("copy-mail");
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("naren.sanchez.h@gmail.com");
    copyBtn.textContent = "[ copiado ✓ ]";
  } catch {
    copyBtn.textContent = "[ ctrl+c ]";
  }
  setTimeout(() => (copyBtn.textContent = "[ copiar ]"), 1800);
});

/* ---------- Header: se oculta al bajar, aparece al subir ---------- */
const header = document.getElementById("header");
let lastY = window.scrollY;
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  header.classList.toggle("is-hidden", y > lastY && y > 140);
  lastY = y;
}, { passive: true });

/* ---------- Animaciones ---------- */
if (hasGsap && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);

  // Entrada del hero: líneas enmascaradas en cascada
  gsap.timeline({ defaults: { ease: "power4.out" } })
    .from(".hero .mask-inner", { yPercent: 110, duration: 1.25, stagger: 0.09, delay: 0.15 })
    .from(".site-header", { y: -24, opacity: 0, duration: 0.8 }, "-=0.7")
    .from(".marquee", { opacity: 0, duration: 0.8 }, "-=0.5");

  // Reveals al hacer scroll
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 44,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // Los títulos gigantes de sección se desplazan sutilmente (parallax)
  gsap.utils.toArray(".section-head h2, .contact-title").forEach((el) => {
    gsap.from(el, {
      yPercent: 18,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "top 45%", scrub: 0.6 },
    });
  });
}
