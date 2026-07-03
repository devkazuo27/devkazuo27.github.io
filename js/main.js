// Portafolio v3 — preloader, Lenis, cursor custom, splits, previews.
// Regla de robustez: los estados "ocultos" de animación solo se aplican
// desde JS. Sin GSAP/Lenis (CDN caído), sin JS o con reduced-motion,
// el sitio queda completo y usable.
"use strict";

const docEl = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const hasGsap = typeof window.gsap !== "undefined";
const animOK = hasGsap && !reduceMotion;

/* ============ Utilidades básicas (siempre) ============ */

// Reloj GMT-6 y año
const clockEl = document.getElementById("clock");
function tick() {
  clockEl.textContent = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Mexico_City",
  }).format(new Date());
}
tick();
setInterval(tick, 30_000);

document.getElementById("year").textContent = new Date().getFullYear();

// Copiar correo
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

// Header (se oculta al bajar) + línea de progreso de lectura
const header = document.getElementById("header");
const progress = document.getElementById("scroll-progress");
let lastY = window.scrollY;
function onScroll() {
  const y = window.scrollY;
  header.classList.toggle("is-hidden", y > lastY && y > 140);
  lastY = y;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ============ Preloader ============ */

const preloader = document.getElementById("preloader");
function killPreloader() {
  docEl.classList.add("pre-done");
}
// Pase lo que pase, el preloader nunca se queda pegado.
setTimeout(killPreloader, 5000);

const seen = sessionStorage.getItem("nv-seen") === "1";
try { sessionStorage.setItem("nv-seen", "1"); } catch {}

/* ============ Anclas internas (scroll nativo, siempre fiable) ============ */

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    history.replaceState(null, "", id);
  });
});

/* ============ Split de caracteres ============ */

function splitChars(root) {
  const label = root.textContent.replace(/\s+/g, " ").trim();
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const ch of child.textContent) {
          const s = document.createElement("span");
          s.className = "char";
          s.setAttribute("aria-hidden", "true");
          s.textContent = ch === " " ? " " : ch;
          frag.appendChild(s);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
        walk(child);
      }
    });
  };
  root.setAttribute("aria-label", label);
  walk(root);
  return root.querySelectorAll(".char");
}

/* ============ Animaciones (solo con GSAP y sin reduced-motion) ============ */

if (animOK) {
  gsap.registerPlugin(ScrollTrigger);

  // --- Entrada del hero ---
  const heroTitleChars = [];
  document.querySelectorAll(".hero-title [data-split]").forEach((el) => {
    heroTitleChars.push(...splitChars(el));
  });

  function heroIntro(fast) {
    const k = fast ? 0.6 : 1;
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".hero-kicker .mask-inner", { yPercent: 120, duration: 0.9 * k })
      .from(heroTitleChars, {
        yPercent: 122, rotate: 5, duration: 1.15 * k, stagger: 0.032 * k,
      }, "-=0.55")
      .from(".hero-tagline, .hero-side", { y: 34, opacity: 0, duration: 0.9 * k, stagger: 0.1 }, "-=0.6")
      .from("#header", { y: -24, opacity: 0, duration: 0.7 * k }, "-=0.6")
      .from(".marquee", { opacity: 0, duration: 0.7 * k }, "-=0.4");
  }

  if (seen) {
    // visita repetida en la sesión: sin contador, entrada directa
    killPreloader();
    heroIntro(true);
  } else {
    const count = document.getElementById("pre-count");
    const fill = document.getElementById("pre-fill");
    const state = { v: 0 };
    gsap.timeline()
      .to(state, {
        v: 100, duration: 1.5, ease: "power2.inOut",
        onUpdate() {
          count.textContent = Math.round(state.v);
          fill.style.transform = `scaleX(${state.v / 100})`;
        },
      })
      .to(preloader, { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, "+=0.15")
      .add(() => heroIntro(false), "<+=0.3")
      .add(killPreloader);
  }

  // --- Reveals al hacer scroll ---
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    // los section-head con título split animan solo su índice; el h2 va por chars
    if (el.querySelector("[data-split-scroll]")) {
      const idx = el.querySelector(".section-index");
      if (idx) {
        gsap.from(idx, {
          y: 30, opacity: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      }
      return;
    }
    gsap.from(el, {
      y: 44, opacity: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // --- Títulos de sección letra a letra ---
  document.querySelectorAll("[data-split-scroll]").forEach((el) => {
    const chars = splitChars(el);
    gsap.from(chars, {
      yPercent: 120, opacity: 0, rotate: 4, duration: 0.85, ease: "power3.out", stagger: 0.024,
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });

  // --- Botones magnéticos ---
  if (finePointer) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.32);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }

  // --- Cursor personalizado ---
  if (finePointer) {
    docEl.classList.add("cursor-on");
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    const ringLabel = document.getElementById("cursor-label");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power2.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.38, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.38, ease: "power3.out" });
    window.addEventListener("mousemove", (e) => {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    }, { passive: true });
    document.addEventListener("mouseover", (e) => {
      const labelTarget = e.target.closest('[data-cursor="ver"]');
      const interactive = e.target.closest("a, button");
      ring.classList.toggle("is-label", !!labelTarget);
      ring.classList.toggle("is-hover", !!interactive && !labelTarget);
      ringLabel.textContent = labelTarget ? "VER ↗" : "";
    });
  }

  // --- Preview flotante en la lista de trabajo ---
  if (finePointer) {
    const preview = document.getElementById("work-preview");
    const list = document.getElementById("work-list");
    const imgs = preview.querySelectorAll("img");
    gsap.set(preview, { xPercent: 6, yPercent: -50, scale: 0.9, autoAlpha: 0 });
    const pX = gsap.quickTo(preview, "x", { duration: 0.55, ease: "power3.out" });
    const pY = gsap.quickTo(preview, "y", { duration: 0.55, ease: "power3.out" });
    list.addEventListener("mousemove", (e) => {
      pX(Math.min(e.clientX, window.innerWidth - 460));
      pY(e.clientY);
    }, { passive: true });
    list.querySelectorAll(".work-row").forEach((row) => {
      row.addEventListener("mouseenter", () => {
        const key = row.dataset.preview;
        imgs.forEach((im) => im.classList.toggle("on", im.dataset.key === key));
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power3.out" });
      });
    });
    list.addEventListener("mouseleave", () => {
      gsap.to(preview, { autoAlpha: 0, scale: 0.9, duration: 0.35, ease: "power2.in" });
    });
  }
} else {
  // sin animaciones: fuera preloader, contenido tal cual
  killPreloader();
}

/* ============ Scramble en links mono (independiente de GSAP) ============ */

if (!reduceMotion) {
  const GLYPHS = "abcdefghjkmnpqrstuvwxyz0123456789·/—#*";
  document.querySelectorAll("[data-scramble]").forEach((el) => {
    if (el.children.length) return; // solo texto plano
    let running = false;
    el.addEventListener("mouseenter", () => {
      if (running) return;
      running = true;
      const text = el.dataset.orig || (el.dataset.orig = el.textContent);
      const total = 14;
      let frame = 0;
      const iv = setInterval(() => {
        frame++;
        el.textContent = [...text].map((ch, i) => {
          if (ch === " ") return " ";
          return frame > (i / text.length) * total * 0.75 + 4
            ? ch
            : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }).join("");
        if (frame >= total) {
          clearInterval(iv);
          el.textContent = text;
          running = false;
        }
      }, 32);
    });
  });
}
