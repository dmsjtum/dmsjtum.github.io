/* PAPER — minimal progressive enhancement. No dependencies, no build step.
   Everything here is optional: the site works with JS disabled. */

(function () {
  "use strict";

  /* ---- Theme toggle -------------------------------------------------- */
  var KEY = "paper-theme";
  var root = document.documentElement;

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var isDark = root.getAttribute("data-theme") === "dark" ||
      (!root.hasAttribute("data-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    var next = isDark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch (e2) { /* ignore */ }
    btn.textContent = next === "dark" ? "Light" : "Dark";
  });

  /* ---- Language (EN / 中文) ------------------------------------------- */
  /* English is the markup default, so the page is correct before this runs.
     We only ever ADD data-lang="zh"; removing it returns to English. */
  var LKEY = "paper-lang";

  var setLang = function (lang, remember) {
    if (lang === "zh") {
      root.setAttribute("data-lang", "zh");
      root.setAttribute("lang", "zh-Hans");
    } else {
      root.removeAttribute("data-lang");
      root.setAttribute("lang", "en");
    }
    /* The English UI stays Latin-only, so the toggle reads "ZH" rather than
       中 when English is active. */
    document.querySelectorAll("[data-lang-toggle]").forEach(function (b) {
      b.innerHTML = lang === "zh" ? '<b>中文</b> / EN' : '<b>EN</b> / ZH';
      b.setAttribute("aria-label",
        lang === "zh" ? "Switch to English" : "切换到中文");
    });

    /* The <title> is outside the .lang-* mechanism, so swap it by hand. */
    document.title = "Miaomiao Dai 代淼淼";   /* name shown in both */
    if (remember) { try { localStorage.setItem(LKEY, lang); } catch (e) {} }
  };

  var savedLang = null;
  try { savedLang = localStorage.getItem(LKEY); } catch (e) {}
  /* English is the default for every first visit — deliberately NOT
     browser-detected, since the audience is international. Only a returning
     visitor who chose 中文 gets it back. */
  setLang(savedLang === "zh" ? "zh" : "en", false);

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lang-toggle]");
    if (!btn) return;
    setLang(root.getAttribute("data-lang") === "zh" ? "en" : "zh", true);
  });

  /* ---- Filter pills --------------------------------------------------- */
  /* Markup contract:
       <button class="pill" data-filter="all|<tag>" aria-pressed="true">
       <li data-tags="robotics thermal">                                  */
  var pills = document.querySelectorAll("[data-filter]");
  if (pills.length) {
    var items = document.querySelectorAll("[data-tags]");

    var apply = function (tag) {
      items.forEach(function (li) {
        var tags = (li.getAttribute("data-tags") || "").split(/\s+/);
        li.classList.toggle("hidden", tag !== "all" && tags.indexOf(tag) === -1);
      });
      pills.forEach(function (p) {
        p.setAttribute("aria-pressed", String(p.getAttribute("data-filter") === tag));
      });
      var url = new URL(window.location.href);
      if (tag === "all") url.searchParams.delete("filter");
      else url.searchParams.set("filter", tag);
      history.replaceState(null, "", url);
    };

    pills.forEach(function (p) {
      p.addEventListener("click", function () { apply(p.getAttribute("data-filter")); });
    });

    /* Honor ?filter=highlight on load — same URL contract as the reference site. */
    var initial = new URL(window.location.href).searchParams.get("filter");
    if (initial) apply(initial);
  }

  /* ---- Reduced motion, for the SVG drawing ---------------------------- */
  /* paper.css hides the <animate> elements with display:none, which is the
     usual recipe and which Chrome ignores outright — SMIL keeps running and
     the drawing keeps moving for someone who asked it not to. The CSS stays
     for engines that do honor it; this is what actually stops it. Freezing
     at t=0 rather than wherever it happens to be means the still is the
     composed first frame of the loop. */
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var applyMotion = function () {
    document.querySelectorAll("svg.sketch").forEach(function (svg) {
      if (typeof svg.pauseAnimations !== "function") return;
      if (motion.matches) { svg.setCurrentTime(0); svg.pauseAnimations(); }
      else { svg.unpauseAnimations(); }
    });
  };
  applyMotion();
  if (motion.addEventListener) motion.addEventListener("change", applyMotion);
  else if (motion.addListener) motion.addListener(applyMotion);   /* Safari <14 */

  /* ---- Entrance: the lede types itself, then the page unfolds --------- */
  /* Gated entirely on data-motion="on", which the inline <head> script sets
     before first paint and only when reduced motion is off. If we are not
     inside that gate, this whole block is a no-op and the page is the plain
     static document it was without it. */
  if (root.getAttribute("data-motion") === "on") {
    /* Tells the head script's failsafe that we made it, so it leaves the
       attribute — and therefore the hero's opacity:0 — alone. */
    window.__paperEntrance = true;

    var ease = function (el, delay) {
      el.style.transitionDelay = (delay || 0) + "ms";
      el.classList.add("is-in");
    };

    /* --- 1. The hero cascade ------------------------------------------ */
    /* Only the language currently on screen is touched. The other one never
       gets a hidden state, so switching reveals it whole rather than
       mid-animation. */
    var isZh = root.getAttribute("data-lang") === "zh";
    var block = document.querySelector(isZh ? ".bio__text.lang-zh"
                                            : ".bio__text.lang-en");
    var ledes = block ? block.querySelectorAll(".lede") : [];
    var rest = [];
    for (var r = 1; r < ledes.length; r++) rest.push(ledes[r]);
    var bioMeta = document.querySelector(".bio .meta");
    if (bioMeta) rest.push(bioMeta);
    var side = document.querySelector(".bio__side");

    /* The portrait is the largest thing on screen; making it wait out the
       typing would read as a loading failure, so it comes in at the top. */
    if (side) requestAnimationFrame(function () { ease(side, 120); });

    var unfoldRest = function () {
      rest.forEach(function (el, i) { ease(el, i * 140); });
    };

    /* --- 2. The typewriter -------------------------------------------- */
    var first = ledes[0];
    if (!first) {
      unfoldRest();
    } else {
      /* Source text is indented across several lines; collapsing the runs
         gives exactly what the browser would have rendered anyway, minus a
         first keystroke that types invisible whitespace. */
      var text = first.textContent.replace(/\s+/g, " ").trim();
      var chars = [];
      var frag = document.createDocumentFragment();
      for (var c = 0; c < text.length; c++) {
        var span = document.createElement("span");
        span.className = "type__ch";
        span.textContent = text.charAt(c);
        frag.appendChild(span);
        chars.push(span);
      }
      first.textContent = "";
      first.appendChild(frag);
      /* The paragraph box fades in as a whole; its characters are separately
         at opacity 0, so this reveals an empty line of the right height. */
      requestAnimationFrame(function () { ease(first, 220); });

      var at = 0, cursor = null, timer = null, ended = false;

      var finish = function () {
        if (ended) return;
        ended = true;
        clearTimeout(timer);
        chars.forEach(function (s) { s.classList.add("is-on"); });
        if (cursor) cursor.classList.remove("is-cursor");
        unfoldRest();
      };

      /* Punctuation is where a typist actually pauses; without these the
         effect reads as a progress bar rather than as writing. */
      var pause = function (ch) {
        if (".?!。？！".indexOf(ch) > -1) return 175;
        if (",;:—，；：、".indexOf(ch) > -1) return 55;
        if (ch === " ") return 5;
        return 7 + Math.random() * 5;
      };

      var step = function () {
        if (at >= chars.length) { finish(); return; }
        var s = chars[at++];
        s.classList.add("is-on");
        if (cursor) cursor.classList.remove("is-cursor");
        s.classList.add("is-cursor");
        cursor = s;
        timer = setTimeout(step, pause(s.textContent));
      };
      timer = setTimeout(step, 620);   /* let the portrait land first */

      /* Nobody should be held hostage by an animation. Any sign of intent —
         including a click on the language toggle — jumps to the end. */
      ["pointerdown", "keydown", "wheel", "touchmove"].forEach(function (evt) {
        window.addEventListener(evt, finish, { once: true, passive: true });
      });
      window.addEventListener("scroll", finish, { once: true, passive: true });
    }

    /* --- 3. The other language ---------------------------------------- */
    /* The stylesheet's hidden state covers both .bio__text blocks, because it
       has to be in place before paper.js knows which one is on screen. Only
       the active one is ever typed and revealed, so a visitor who switches
       language afterwards would meet an invisible bio. On any toggle, show
       them all: the entrance has had its turn by then, and pointerdown has
       already finished the typing. */
    document.addEventListener("click", function (e) {
      if (!e.target.closest("[data-lang-toggle]")) return;
      document.querySelectorAll(".bio__text .lede, .bio .meta, .bio__side")
        .forEach(function (el) {
          el.style.transitionDelay = "0ms";
          el.classList.add("is-in");
        });
    });

    /* --- 4. Everything below, on scroll ------------------------------- */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });

      /* Stagger restarts per group, so a section reached by an anchor link
         opens on the same short beat as one reached by scrolling. */
      var group = function (nodes, stagger) {
        Array.prototype.forEach.call(nodes, function (el, i) {
          el.classList.add("reveal");
          el.style.transitionDelay = (i * stagger) + "ms";
          io.observe(el);
        });
      };

      group(document.querySelectorAll(".timeline > li"), 70);
      group(document.querySelectorAll(".pub"), 90);
      document.querySelectorAll(".rows").forEach(function (list) {
        group(list.querySelectorAll(":scope > li"), 55);
      });
      group(document.querySelectorAll(".section .eyebrow"), 0);
      /* project.html: no bio, no rows — these are what it has. */
      group(document.querySelectorAll(".figure, .prose > h2, .codeblock"), 0);
    }
  }

  /* ---- Copy buttons (BibTeX, install commands, …) --------------------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".copy");
    if (!btn) return;
    var pre = btn.parentElement.querySelector("pre");
    if (!pre) return;
    navigator.clipboard.writeText(pre.innerText.trim()).then(function () {
      var was = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = was; }, 1400);
    }).catch(function () {
      btn.textContent = "Press ⌘C";
    });
  });
})();
