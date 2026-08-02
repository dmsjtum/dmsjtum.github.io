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
