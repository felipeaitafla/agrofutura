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

  /* ---------- Filiais: troca o mapa ao selecionar uma unidade ---------- */
  function initFiliais() {
    var root = document.querySelector("[data-filiais]");
    if (!root) return;
    var frame = root.querySelector("[data-filiais-map]");
    var buttons = root.querySelectorAll("[data-filial]");
    if (!frame || !buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = btn.getAttribute("data-map");
        if (url) frame.setAttribute("src", url);
        buttons.forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
      });
    });
  }

  /* ---------- Trabalhe Conosco: dropzone de currículo ---------- */
  function initCareersUpload() {
    var drop = document.querySelector("[data-drop]");
    if (!drop) return;
    var input = drop.querySelector("[data-file]");
    var nameEl = drop.querySelector("[data-file-name]");
    if (!input) return;

    function showName() {
      if (nameEl) nameEl.textContent = input.files && input.files.length ? input.files[0].name : "";
    }
    input.addEventListener("change", showName);

    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.add("is-drag");
      });
    });
    ["dragleave", "dragend", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function () { drop.classList.remove("is-drag"); });
    });
    drop.addEventListener("drop", function (e) {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        showName();
      }
    });
  }

  /* ---------- Banner de cookies / LGPD ---------- */
  function initCookieBanner() {
    var banner = document.querySelector("[data-cookie-banner]");
    if (!banner) return;
    var KEY = "agro_cookie_consent";

    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    if (stored === "accepted" || stored === "declined") return;

    function save(value) {
      try { localStorage.setItem(KEY, value); } catch (e) {}
    }
    function hide() {
      banner.classList.remove("is-visible");
      window.setTimeout(function () { banner.hidden = true; }, 500);
    }

    banner.hidden = false;
    // Força reflow para a transição de entrada disparar.
    void banner.offsetWidth;
    requestAnimationFrame(function () { banner.classList.add("is-visible"); });

    var accept = banner.querySelector("[data-cookie-accept]");
    var decline = banner.querySelector("[data-cookie-decline]");
    if (accept) accept.addEventListener("click", function () { save("accepted"); hide(); });
    if (decline) decline.addEventListener("click", function () { save("declined"); hide(); });
  }

  /* ---------- Menu mobile (burger) ---------- */
  function initBurger() {
    var burger = document.querySelector("[data-burger]");
    var header = document.querySelector("[data-header]");
    if (!burger || !header) return;
    var nav = header.querySelector(".site-nav");

    function setOpen(open) {
      header.classList.toggle("nav-open", open);
      document.body.classList.toggle("nav-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    }

    burger.addEventListener("click", function () {
      setOpen(!header.classList.contains("nav-open"));
    });

    // Fecha ao clicar num link do menu.
    if (nav) {
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) setOpen(false);
      });
    }

    // Fecha com Esc.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initHeader();
    initRotator();
    initFiliais();
    initCareersUpload();
    initCookieBanner();
    initBurger();
  });
})();
