/* ==========================================================================
   Agrofutura — main.js
   Smooth scroll (Lenis) + animações de entrada (reveal).
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis: smooth scroll ---------- */
  var lenis = null;
  if (!reduceMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Âncoras internas usam o scroll do Lenis.
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
    });
  }

  /* ---------- Reveal: animações de entrada ---------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Header: fundo ao rolar + botão de scroll do hero ---------- */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    var heroScroll = document.querySelector(".hero__scroll");
    var hero = document.querySelector(".hero");
    if (!header && !heroScroll) return;
    var onScroll = function () {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
      if (heroScroll) {
        // Esconde bem cedo: logo nos primeiros ~10% da altura da hero.
        var limit = (hero ? hero.offsetHeight : window.innerHeight) * 0.1;
        heroScroll.classList.toggle("is-hidden", window.scrollY > limit);
      }
    };
    if (lenis) {
      lenis.on("scroll", onScroll);
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    onScroll();
  }

  /* ---------- Rotador de imagens (unidades) ---------- */
  function initRotator() {
    var root = document.querySelector("[data-rotator]");
    if (!root) return;
    var slides = root.querySelectorAll("[data-rotator-slide]");
    var dots = root.querySelectorAll("[data-rotator-dot]");
    if (slides.length < 2) return;

    var current = 0;
    var timer = null;
    var DELAY = 3500;

    function go(n) {
      slides[current].classList.remove("is-active");
      if (dots[current]) dots[current].classList.remove("is-active");
      current = (n + slides.length) % slides.length;
      slides[current].classList.add("is-active");
      if (dots[current]) dots[current].classList.add("is-active");
    }
    function next() { go(current + 1); }
    function start() { if (!reduceMotion) timer = setInterval(next, DELAY); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        stop();
        go(parseInt(dot.getAttribute("data-rotator-dot"), 10));
        start();
      });
    });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    start();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initHeader();
    initRotator();
  });
})();
