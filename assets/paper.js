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
