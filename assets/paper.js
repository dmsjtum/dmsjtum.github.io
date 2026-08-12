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

  /* ---- dollar, the site assistant ------------------------------------- */
  /* Talks to a Cloudflare Worker that holds the DeepSeek key. Nothing secret
     is ever in this file — the site is static and public, so anything shipped
     here is shipped to everyone. See Info/assistant/worker.js. */
  (function assistant() {

    /* On localhost this points at Info/assistant/dev-server.js, which runs the
       very same worker code against a key from the environment. In production
       it is the deployed Worker. While that string is empty the widget does
       not render at all: a chat box that fails on every message is worse than
       no chat box, so it stays off until there is something to talk to. */
    var API = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
      ? "http://localhost:8787"
      : "https://dai-assistant.j2dkm6dkmk.workers.dev";

    if (!API) return;

    var zh = function () { return root.getAttribute("data-lang") === "zh"; };
    var t = function (en, cn) { return zh() ? cn : en; };

    var CHIPS = [
      ["What is HOP, in one paragraph?", "HOP 用一段话讲是什么？"],
      ["How does AL-HOP compare to ALTRO?", "AL-HOP 和 ALTRO 比结果如何？"],
      ["What is Touch Without Touch?", "Touch Without Touch 在做什么？"],
      ["What robot learning experience?", "有哪些 robot learning 经历？"]
    ];

    /* --- build ------------------------------------------------------- */
    var wrap = document.createElement("div");
    wrap.className = "dollar";
    wrap.innerHTML =
      '<button class="dollar__hint" type="button"></button>' +
      '<button class="dollar__btn" type="button">' +
        '<img src="assets/dollar-hello.png" alt="" draggable="false">' +
      '</button>';

    var panel = document.createElement("div");
    panel.className = "chat";
    panel.innerHTML =
      '<div class="chat__head">' +
        '<p class="chat__title"></p>' +
        '<button class="chat__close" type="button" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="chat__log" role="log" aria-live="polite"></div>' +
      '<div class="chat__chips"></div>' +
      '<form class="chat__form">' +
        '<input class="chat__input" type="text" autocomplete="off">' +
        '<button class="chat__send" type="submit"></button>' +
      '</form>' +
      '<p class="chat__note"></p>';

    document.body.appendChild(wrap);
    document.body.appendChild(panel);

    var btn = wrap.querySelector(".dollar__btn");
    var hint = wrap.querySelector(".dollar__hint");
    var img = btn.querySelector("img");
    /* She changes pose when you click her, rather than looping on a timer —
       a cat cycling by herself in the corner of the page is just motion, but
       reacting to a click is her answering you. All poses are cropped from
       one box, so only her expression changes; she never shifts position. */
    var POSES = ["dollar-hello", "dollar-wink", "dollar-curious", "dollar-excited"];
    var pose = 0;
    var wearPose = function () { img.src = "assets/" + POSES[pose] + ".png"; };
    var nextPose = function () {
      pose = (pose + 1) % POSES.length;
      if (!busy) wearPose();          // thinking pose outranks it
    };
    POSES.concat("dollar-think").forEach(function (n) {
      var pre = new Image();          // decode up front, or the first swap flickers
      pre.src = "assets/" + n + ".png";
    });

    var log = panel.querySelector(".chat__log");
    var chips = panel.querySelector(".chat__chips");
    var form = panel.querySelector(".chat__form");
    var input = panel.querySelector(".chat__input");
    var send = panel.querySelector(".chat__send");

    /* Every visible string is rebuilt on a language toggle rather than
       duplicated into .lang-en/.lang-zh spans — this markup is generated, so
       there is no author-facing benefit to the span mechanism here. */
    var label = function () {
      hint.innerHTML = "";
      hint.appendChild(document.createTextNode(
        t("I'm dollar, Miaomiao's cat.", "我是 dollar，淼淼养的猫。")));
      hint.appendChild(document.createElement("br"));
      hint.appendChild(document.createTextNode(
        t("Running DeepSeek V4 Flash — ask me about their work.",
          "接入了 DeepSeek V4 Flash，问我关于淼淼的事。")));
      btn.setAttribute("aria-label", t("Open the assistant", "打开小助手"));
      panel.querySelector(".chat__title").textContent =
        t("dollar · Miaomiao's cat", "dollar · 淼淼养的猫");
      input.placeholder = t("Ask about the research…", "问问研究相关的…");
      send.textContent = t("Send", "发送");
      panel.querySelector(".chat__note").textContent =
        t("AI answers from Miaomiao's CV and papers. It can be wrong — email to confirm.",
          "AI 依据淼淼的简历与论文作答，可能出错，重要信息请邮件核实。");
      chips.innerHTML = "";
      CHIPS.forEach(function (pair) {
        var c = document.createElement("button");
        c.type = "button";
        c.className = "chat__chip";
        c.textContent = t(pair[0], pair[1]);
        c.addEventListener("click", function () { ask(c.textContent); });
        chips.appendChild(c);
      });
    };
    label();
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-lang-toggle]")) setTimeout(label, 0);
    });

    /* --- dragging ------------------------------------------------------
       She starts in the top-right corner and can be dragged anywhere. Once
       moved she is positioned with inline left/top, which beats the CSS
       corner. Pointer events cover mouse and touch with one code path.
       -------------------------------------------------------------------- */
    var PAD = 8;                        // keep this much of her on screen
    var KEY = "dollar-pos";

    var clamp = function (x, y) {
      var w = wrap.offsetWidth || 104, h = wrap.offsetHeight || 104;
      return [Math.min(Math.max(x, PAD), Math.max(PAD, innerWidth - w - PAD)),
              Math.min(Math.max(y, PAD), Math.max(PAD, innerHeight - h - PAD))];
    };

    /* The hint flips under her near the top of the window, and the chat panel
       opens on whichever side of her there is room for. Both are recomputed
       rather than pinned to a corner, because she is no longer in one. */
    var place = function () {
      var r = wrap.getBoundingClientRect();
      wrap.classList.toggle("dollar--top", r.top < 150);
      var pw = Math.min(372, innerWidth - 32);
      var left = Math.min(Math.max(r.right - pw, 16), innerWidth - pw - 16);
      panel.style.left = left + "px";
      panel.style.right = "auto";
      var below = r.bottom + 12;
      var ph = panel.offsetHeight || 420;
      if (below + ph <= innerHeight - 16) {
        panel.style.top = below + "px";
        panel.style.bottom = "auto";
      } else {
        panel.style.top = "auto";
        panel.style.bottom = Math.max(16, innerHeight - r.top + 12) + "px";
      }
    };

    var moveTo = function (x, y) {
      var p = clamp(x, y);
      wrap.style.left = p[0] + "px";
      wrap.style.top = p[1] + "px";
      wrap.style.right = "auto";
      wrap.style.bottom = "auto";
      place();
    };

    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && typeof saved.x === "number") moveTo(saved.x, saved.y);
    } catch (e) { /* private mode, or someone put junk in there */ }

    /* Smoothness comes from doing no layout work while the pointer moves.
       Everything the drag needs — her size, the viewport — is measured once
       on pointerdown; each move only does arithmetic, and the result is
       painted as a transform (compositor only, no reflow) at most once per
       frame via rAF. On release the transform is folded back into left/top so
       the rest of the code keeps dealing in ordinary coordinates. */
    var drag = null, dragged = false, suppressClick = false;
    var suppressTimer = 0, raf = 0;

    var paint = function () {
      raf = 0;
      if (!drag) return;
      wrap.style.transform = "translate3d(" + drag.tx + "px," + drag.ty + "px,0)";
      // cheap: derived from cached numbers, not from the DOM
      wrap.classList.toggle("dollar--top", drag.oy + drag.ty < 150);
    };

    btn.addEventListener("pointerdown", function (e) {
      // Keep one primary pointer in charge. A second finger must not replace
      // the origin of a drag that is already under way.
      if (drag || e.isPrimary === false || e.button !== 0) return;
      var r = wrap.getBoundingClientRect();
      // pin her to left/top first: she may still be sitting on the CSS
      // right-corner rule, which a transform would slide relative to
      wrap.style.left = r.left + "px";
      wrap.style.top = r.top + "px";
      wrap.style.right = "auto";
      wrap.style.bottom = "auto";
      drag = { pointerId: e.pointerId,
               ox: r.left, oy: r.top, sx: e.clientX, sy: e.clientY,
               w: r.width, h: r.height, vw: innerWidth, vh: innerHeight, tx: 0, ty: 0 };
      dragged = false;
      suppressClick = false;
      if (suppressTimer) { clearTimeout(suppressTimer); suppressTimer = 0; }
      // Promote the wrapper and freeze the cat's decorative motion before
      // the first moving frame, rather than doing both as she starts to move.
      wrap.classList.add("is-dragging");
      btn.setPointerCapture(e.pointerId);
    });

    var trackPointer = function (e) {
      if (!drag || e.pointerId !== drag.pointerId) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!dragged) {
        if (dx * dx + dy * dy < 16) return;       // still a click
        dragged = true;
      }
      var x = Math.min(Math.max(drag.ox + dx, PAD), Math.max(PAD, drag.vw - drag.w - PAD));
      var y = Math.min(Math.max(drag.oy + dy, PAD), Math.max(PAD, drag.vh - drag.h - PAD));
      drag.tx = x - drag.ox;
      drag.ty = y - drag.oy;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    btn.addEventListener("pointermove", function (e) {
      trackPointer(e);
    });

    var endDrag = function (e, cancelled) {
      if (!drag || (e && e.pointerId !== drag.pointerId)) return;
      // A pointerup can carry a newer sample than the last pointermove. Fold
      // it in so a quick release never lands at the previous frame's point.
      if (!cancelled) trackPointer(e);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      var d = drag;
      var wasDragged = dragged;
      drag = null;
      dragged = false;
      wrap.classList.remove("is-dragging");
      if (e && btn.hasPointerCapture && btn.hasPointerCapture(e.pointerId)) {
        btn.releasePointerCapture(e.pointerId);
      }
      wrap.style.transform = "";
      if (!wasDragged) return;
      wrap.style.left = (d.ox + d.tx) + "px";
      wrap.style.top = (d.oy + d.ty) + "px";
      place();
      try {
        localStorage.setItem(KEY, JSON.stringify({ x: d.ox + d.tx, y: d.oy + d.ty }));
      } catch (e2) {}
      // pointerup is followed by click in the same task. Swallow only that
      // click. The short fallback window covers touch browsers that dispatch
      // their compatibility click just after the pointer event task.
      if (!cancelled) {
        suppressClick = true;
        if (suppressTimer) clearTimeout(suppressTimer);
        suppressTimer = setTimeout(function () {
          suppressClick = false;
          suppressTimer = 0;
        }, 400);
      }
    };
    btn.addEventListener("pointerup", function (e) { endDrag(e, false); });
    btn.addEventListener("pointercancel", function (e) { endDrag(e, true); });
    btn.addEventListener("lostpointercapture", function (e) { endDrag(e, true); });

    /* A drag ends with a click event on the button; swallow that one so
       letting go of her does not also open the chat and change her pose. */
    btn.addEventListener("click", function (e) {
      if (suppressClick && e.detail !== 0) {
        e.stopImmediatePropagation();
        e.preventDefault();
        suppressClick = false;
        if (suppressTimer) { clearTimeout(suppressTimer); suppressTimer = 0; }
      }
    }, true);

    addEventListener("resize", function () {
      var r = wrap.getBoundingClientRect();
      if (wrap.style.left) moveTo(r.left, r.top);   // pull her back on screen
      else place();
    });
    place();

    /* --- open / close ------------------------------------------------ */
    var open = function (yes) {
      panel.setAttribute("data-open", yes ? "1" : "0");
      wrap.setAttribute("data-open", yes ? "1" : "0");
      if (yes) {
        place();            // she may have been dragged since it last opened
        wrap.classList.add("is-hushed");
        input.focus();
        if (!log.children.length) {
          say("cat", t("Hi — I'm dollar, the cat Miaomiao keeps, running on DeepSeek V4 Flash. " +
                       "Ask me anything about their research, papers, or background, and I'll answer from the CV and the papers themselves. " +
                       "You can drag me anywhere on the page, and click me to change my face.",
                       "你好，我是 dollar，淼淼养的猫，接入了 DeepSeek V4 Flash。" +
                       "关于淼淼的研究、论文、经历都可以随便问，我依据简历和论文原文来答。" +
                       "你可以把我拖到页面上任何地方，点我一下我会换个表情。"));
        }
      }
    };
    btn.addEventListener("click", function () {
      nextPose();
      open(panel.getAttribute("data-open") !== "1");
    });
    hint.addEventListener("click", function () { nextPose(); open(true); });
    panel.querySelector(".chat__close").addEventListener("click", function () { open(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.getAttribute("data-open") === "1") open(false);
    });

    /* --- messages ----------------------------------------------------- */
    var esc = function (s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    var say = function (who, text) {
      var el = document.createElement("div");
      el.className = "chat__msg chat__msg--" + who;
      /* Escape first, then re-introduce the one bit of markdown the model
         reliably emits. Order matters: the other way round is an injection. */
      el.innerHTML = esc(text).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return el;
    };

    var history = [];
    var busy = false;

    var ask = function (text) {
      text = (text || "").trim();
      if (!text || busy) return;
      busy = true;
      send.disabled = true;
      chips.style.display = "none";
      input.value = "";
      say("me", text);
      history.push({ role: "user", content: text });

      var dots = document.createElement("div");
      dots.className = "chat__msg chat__msg--cat chat__dots";
      dots.innerHTML = "<span></span><span></span><span></span>";
      log.appendChild(dots);
      log.scrollTop = log.scrollHeight;
      btn.classList.add("is-busy");
      img.src = "assets/dollar-think.png";

      var done = function () {
        busy = false;
        send.disabled = false;
        dots.remove();
        btn.classList.remove("is-busy");
        wearPose();   // back to whichever pose your clicks left her in
      };

      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history })
      }).then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, d: d }; });
      }).then(function (res) {
        done();
        if (!res.ok || !res.d.reply) {
          say("err", t("Sorry — I could not reach the model. Email dmmsjtu@umich.edu and Miaomiao will answer directly.",
                       "抱歉，模型没连上。可以邮件 dmmsjtu@umich.edu，淼淼会直接回你。"));
          history.pop();
          return;
        }
        say("cat", res.d.reply);
        history.push({ role: "assistant", content: res.d.reply });
      }).catch(function () {
        done();
        history.pop();
        say("err", t("Sorry — something went wrong. Email dmmsjtu@umich.edu instead.",
                     "抱歉，出了点问题。可以直接邮件 dmmsjtu@umich.edu。"));
      });
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      ask(input.value);
    });
  })();

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
