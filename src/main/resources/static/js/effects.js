/* =====================================================================
   SALES SAVVY — EFFECTS LAYER  (new file: /static/js/effects.js)
   Pure visual polish. It never calls your API and never changes your
   app logic, so you can delete this file + its <script> tag at any time
   and the site still works.

   Provides:  click ripple · spark burst · 3D card tilt · cursor spotlight
              animated particle background · page fade transitions
              toast notifications (replaces alert()) · confirm dialog
              show/hide password · button loading spinner · count-up
   Public API:  window.SS.toast(msg, type)   window.SS.confirm(msg, opts)
                window.SS.countUp(el, number, { prefix, final })
   ===================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- tiny helpers ---------- */
  function svg(inner) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + inner + "</svg>";
  }
  var ICON = {
    success: svg('<polyline points="20 6 9 17 4 12"/>'),
    error:   svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    info:    svg('<line x1="12" y1="8" x2="12" y2="8.01"/><line x1="12" y1="12" x2="12" y2="17"/>'),
    trash:   svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>'),
    help:    svg('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17.01"/>'),
    eye:     svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff:  svg('<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>')
  };

  var ERROR_RE = /(fail|error|denied|invalid|unable|cannot|can't|not found|not enough|expired|wrong|incorrect|insufficient|out of stock)/i;
  var OK_RE = /(success|added|updated|removed|deleted|sent|reset|completed|created|verified|paid|registered)/i;
  function detectType(msg) {
    msg = String(msg || "");
    if (ERROR_RE.test(msg)) return "error";
    if (OK_RE.test(msg)) return "success";
    return "info";
  }

  /* =================================================================
     1. TOASTS  (alert() is routed here so existing code just works)
     ================================================================= */
  var stack;
  function getStack() {
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("role", "status");
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(message, type, opts) {
    opts = opts || {};
    type = type || detectType(message);
    var dur = opts.duration || 3800;
    var stamp = Date.now();

    var el = document.createElement("div");
    el.className = "toast toast-" + type;
    el.innerHTML =
      '<span class="toast-icon">' + (ICON[type] || ICON.info) + "</span>" +
      '<div class="toast-text"></div><span class="toast-bar"></span>';
    el.querySelector(".toast-text").textContent = message; // textContent = XSS-safe
    el.style.setProperty("--dur", dur + "ms");
    getStack().appendChild(el);

    // If the page redirects right after alert(), replay the toast on the next page.
    if (opts.persist !== false) {
      try { sessionStorage.setItem("ss:toast", JSON.stringify({ msg: String(message), type: type, t: stamp, dur: dur })); } catch (e) {}
    }

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      el.classList.add("out");
      try {
        var d = JSON.parse(sessionStorage.getItem("ss:toast") || "null");
        if (d && d.t === stamp) sessionStorage.removeItem("ss:toast");
      } catch (e) {}
      setTimeout(function () { el.remove(); }, 350);
    }
    el.addEventListener("click", close);
    setTimeout(close, dur);
  }

  function replayToast() {
    try {
      var raw = sessionStorage.getItem("ss:toast");
      if (!raw) return;
      sessionStorage.removeItem("ss:toast");
      var d = JSON.parse(raw);
      var age = Date.now() - d.t;
      if (age < 3000) toast(d.msg, d.type, { persist: false, duration: Math.max(1500, d.dur - age) });
    } catch (e) {}
  }

  window.alert = function (msg) { toast(msg); };

  /* =================================================================
     2. CONFIRM DIALOG  (promise based, replaces confirm())
     ================================================================= */
  function confirmDialog(message, o) {
    o = o || {};
    return new Promise(function (resolve) {
      var bd = document.createElement("div");
      bd.className = "modal-backdrop";
      bd.innerHTML =
        '<div class="modal' + (o.danger ? " danger" : "") + '" role="dialog" aria-modal="true">' +
        '<div class="modal-icon">' + (o.danger ? ICON.trash : ICON.help) + "</div>" +
        "<h3></h3><p></p>" +
        '<div class="modal-actions">' +
        '<button type="button" class="btn-ghost" data-r="0"></button>' +
        '<button type="button" class="' + (o.danger ? "btn-danger" : "") + '" data-r="1"></button>' +
        "</div></div>";
      bd.querySelector("h3").textContent = o.title || "Are you sure?";
      bd.querySelector("p").textContent = message;
      bd.querySelector('[data-r="0"]').textContent = o.cancelText || "Cancel";
      var ok = bd.querySelector('[data-r="1"]');
      ok.textContent = o.confirmText || "Confirm";

      function close(v) {
        document.removeEventListener("keydown", onKey);
        bd.classList.add("out");
        setTimeout(function () { bd.remove(); }, 200);
        resolve(v);
      }
      function onKey(e) { if (e.key === "Escape") close(false); }
      bd.addEventListener("click", function (e) {
        if (e.target === bd) return close(false);
        var b = e.target.closest("[data-r]");
        if (b) close(b.getAttribute("data-r") === "1");
      });
      document.addEventListener("keydown", onKey);
      document.body.appendChild(bd);
      ok.focus();
    });
  }

  /* =================================================================
     3. CLICK EFFECTS — ripple + spark burst
     ================================================================= */
  var SPARK_COLORS = ["#ffffff", "#8db4ff", "#4f8cff", "#38d6ff", "#c3d8ff"];
  function burst(x, y) {
    if (reduce) return;
    for (var i = 0; i < 12; i++) {
      var s = document.createElement("span");
      s.className = "spark";
      s.style.left = x - 3 + "px";
      s.style.top = y - 3 + "px";
      s.style.background = SPARK_COLORS[i % SPARK_COLORS.length];
      s.style.boxShadow = "0 0 8px " + SPARK_COLORS[i % SPARK_COLORS.length];
      document.body.appendChild(s);
      var angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      var dist = 36 + Math.random() * 46;
      var anim = s.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: "translate(" + Math.cos(angle) * dist + "px," + Math.sin(angle) * dist + "px) scale(0)", opacity: 0 }
        ],
        { duration: 650 + Math.random() * 250, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(s);
    }
  }

  document.addEventListener("pointerdown", function (e) {
    var t = e.target.closest && e.target.closest("button, .btn, td a");
    if (!t || t.disabled) return;
    if (!reduce) {
      var r = t.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2;
      var rip = document.createElement("span");
      rip.className = "ripple";
      rip.style.width = rip.style.height = size + "px";
      rip.style.left = e.clientX - r.left - size / 2 + "px";
      rip.style.top = e.clientY - r.top - size / 2 + "px";
      t.appendChild(rip);
      setTimeout(function () { rip.remove(); }, 700);
    }
    if (t.hasAttribute("data-burst")) burst(e.clientX, e.clientY);
  });

  /* =================================================================
     4. HOVER EFFECTS — cursor spotlight + 3D tilt + page-wide glow
     ================================================================= */
  var glow, lastEvt, raf = 0;
  function frame() {
    raf = 0;
    if (!lastEvt) return;
    var e = lastEvt;
    if (glow) {
      glow.style.opacity = 1;
      glow.style.transform = "translate3d(" + (e.clientX - 240) + "px," + (e.clientY - 240) + "px,0)";
    }
    var t = e.target;
    if (!t || !t.closest) return;
    var card = t.closest(".product-card");
    var box = t.closest(".container");
    var el, r;
    if (box) {
      r = box.getBoundingClientRect();
      box.style.setProperty("--mx", e.clientX - r.left + "px");
      box.style.setProperty("--my", e.clientY - r.top + "px");
    }
    if (card) {
      r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", px * 100 + "%");
      card.style.setProperty("--my", py * 100 + "%");
      card.style.setProperty("--ry", (px - 0.5) * 12 + "deg");
      card.style.setProperty("--rx", (0.5 - py) * 10 + "deg");
    }
  }
  function initHover() {
    if (!canHover || reduce) return;
    glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      lastEvt = e;
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      var card = e.target.closest && e.target.closest(".product-card");
      if (card && !card.contains(e.relatedTarget)) {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      }
    });
  }

  /* =================================================================
     5. PAGE TRANSITIONS — fade out before following internal links
     ================================================================= */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    e.preventDefault();
    document.body.classList.add("page-leave");
    setTimeout(function () { location.href = a.href; }, reduce ? 0 : 240);
  });
  window.addEventListener("pageshow", function () { document.body.classList.remove("page-leave"); });

  /* =================================================================
     6. FORMS — loading spinner, message styling, show/hide password
     ================================================================= */
  var loadingBtn = null, loadingTimer;
  function stopLoading() {
    clearTimeout(loadingTimer);
    if (loadingBtn) { loadingBtn.classList.remove("is-loading"); loadingBtn = null; }
  }
  document.addEventListener("submit", function (e) {
    var b = e.target.querySelector && e.target.querySelector('button[type="submit"]');
    if (!b) return;
    stopLoading();
    b.classList.add("is-loading");
    loadingBtn = b;
    loadingTimer = setTimeout(stopLoading, 10000); // safety net
  }, true);

  function watchMessage() {
    var m = document.getElementById("message");
    if (!m || !window.MutationObserver) return;
    new MutationObserver(function () {
      var txt = m.textContent.trim();
      m.classList.remove("msg-success", "msg-error", "msg-info");
      if (!txt) return;
      void m.offsetWidth; // restart the CSS animation
      m.classList.add("msg-" + detectType(txt));
      stopLoading();
    }).observe(m, { childList: true, characterData: true, subtree: true });
  }

  function enhancePasswords() {
    var inputs = document.querySelectorAll('input[type="password"]');
    Array.prototype.forEach.call(inputs, function (inp) {
      if (inp.parentNode.classList.contains("field")) return;
      var wrap = document.createElement("div");
      wrap.className = "field";
      inp.parentNode.insertBefore(wrap, inp);
      wrap.appendChild(inp);
      var b = document.createElement("button");
      b.type = "button"; // never submits the form
      b.className = "pw-toggle";
      b.setAttribute("aria-label", "Show password");
      b.innerHTML = ICON.eye;
      b.addEventListener("click", function () {
        var show = inp.type === "password";
        inp.type = show ? "text" : "password";
        b.innerHTML = show ? ICON.eyeOff : ICON.eye;
        b.setAttribute("aria-label", show ? "Hide password" : "Show password");
        inp.focus();
      });
      wrap.appendChild(b);
    });
  }

  /* =================================================================
     7. COUNT-UP NUMBERS
     ================================================================= */
  function countUp(el, to, o) {
    o = o || {};
    to = Number(to);
    var finalText = o.final != null ? o.final : el.textContent;
    if (reduce || !isFinite(to)) { el.textContent = finalText; return; }
    var prefix = o.prefix || "";
    var decimals = (String(to).split(".")[1] || "").length;
    var t0 = performance.now(), dur = 850;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? prefix + (to * eased).toFixed(decimals) : finalText;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* =================================================================
     8. PARTICLE BACKGROUND (soft floating sapphire sparkles)
     ================================================================= */
  function initParticles() {
    if (reduce) return;
    var c = document.createElement("canvas");
    c.id = "fx-canvas";
    document.body.appendChild(c);
    var ctx = c.getContext("2d");
    if (!ctx) return;
    var w, h, dpr, pts = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.max(24, Math.min(70, Math.round((w * h) / 24000)));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.8 + Math.random() * 1.8,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -(0.08 + Math.random() * 0.3),
          a: 0.25 + Math.random() * 0.55,
          tw: Math.random() * Math.PI * 2
        });
      }
    }

    var running = true;
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var i, j, p, q, dx, dy, d;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.x += p.vx; p.y += p.vy; p.tw += 0.02;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        var alpha = p.a * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(160,200,255," + alpha + ")";
        ctx.fill();
        for (j = i + 1; j < pts.length; j++) {
          q = pts[j]; dx = p.x - q.x; dy = p.y - q.y; d = dx * dx + dy * dy;
          if (d < 14400) { // 120px
            ctx.strokeStyle = "rgba(100,150,255," + (0.14 * (1 - d / 14400)) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(draw);
    });
    window.addEventListener("resize", resize);
    resize();
    draw();
  }

  /* ---------- boot ---------- */
  function boot() {
    initParticles();
    initHover();
    watchMessage();
    enhancePasswords();
    replayToast();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.SS = { toast: toast, confirm: confirmDialog, countUp: countUp, burst: burst };
})();