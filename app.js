/* Where You Were website interactions.
   Nothing moves on its own: every effect starts from a hover, focus or click.
   With "Reduce Motion" on, effects become simple color / size changes. */

/* ================= APP STORE ID: the only place to change =================
   While this is empty, the home page shows "Coming soon to the App Store".
   When the app is live, put its numeric App Store ID between the quotes,
   for example "1234567890" (the digits after "id" in the App Store link).
   Both buttons on the home page then become "Download on the App Store" links.
   Optional: save a QR code picture as images/app-store-qr.png and it appears
   next to each button. If that file is missing, no QR box is shown.
   ========================================================================== */
var APP_STORE_ID = "";

(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- tiny seeded random, so stamps look the same on every load ---------- */
  function rng(seed) {
    var a = (seed * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- a slightly irregular, hand-painted circle ---------- */
  function stampPath(rand, r) {
    var n = 80, pts = [], i;
    var a2 = 0.012 + rand() * 0.02, p2 = rand() * 6.28;
    var a3 = 0.008 + rand() * 0.016, p3 = rand() * 6.28;
    var a5 = rand() * 0.008, p5 = rand() * 6.28;
    var flatAt = rand() * 6.28, flat = 0.015 + rand() * 0.02;   // one soft flat-ish spot, like a worn stamp
    for (i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2;
      var d = Math.atan2(Math.sin(t - flatAt), Math.cos(t - flatAt));
      var k = 1 + a2 * Math.sin(2 * t + p2) + a3 * Math.sin(3 * t + p3) + a5 * Math.sin(5 * t + p5)
            - flat * Math.exp(-(d * d) / 0.12) + (rand() - 0.5) * 0.012;
      pts.push([50 + Math.cos(t) * r * k, 50 + Math.sin(t) * r * k]);
    }
    // smooth closed curve through midpoints
    var mid = function (p, q) { return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; };
    var m0 = mid(pts[n - 1], pts[0]);
    var dstr = "M" + m0[0].toFixed(2) + " " + m0[1].toFixed(2);
    for (i = 0; i < n; i++) {
      var p = pts[i], m = mid(p, pts[(i + 1) % n]);
      dstr += " Q" + p[0].toFixed(2) + " " + p[1].toFixed(2) + " " + m[0].toFixed(2) + " " + m[1].toFixed(2);
    }
    return dstr + "Z";
  }

  function makeStamp(ink, seed, r) {
    // Flat gouache dot: one solid, even, matte fill with a slightly hand-made edge. No texture or grain.
    var rand = rng(seed);
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var g = document.createElementNS(SVGNS, "g");
    var rot = (rand() - 0.5) * 16;                       // slight random turn, ±8°
    var dx = (rand() - 0.5) * 3, dy = (rand() - 0.5) * 3; // slightly off-centre, like a hand stamp
    g.setAttribute("transform", "translate(" + dx.toFixed(2) + " " + dy.toFixed(2) + ") rotate(" + rot.toFixed(1) + " 50 50)");
    var fill = document.createElementNS(SVGNS, "path");
    fill.setAttribute("d", stampPath(rand, r || 43));
    fill.setAttribute("fill", ink);
    g.appendChild(fill);
    svg.appendChild(g);
    return svg;
  }

  function fillStampIcons(root) {
    (root || document).querySelectorAll(".stamp-icon[data-ink]:not([data-done])").forEach(function (el) {
      el.appendChild(makeStamp(el.getAttribute("data-ink"), parseInt(el.getAttribute("data-seed") || "1", 10), 42));
      el.setAttribute("data-done", "1");
    });
  }

  /* ---------- 1. Nudge ---------- */
  function nudge(el) {
    if (reduceMotion) return;                              // CSS handles the color change instead
    var r = rng((Date.now() & 0xffff) + el.textContent.length)();
    var sign = r < 0.5 ? -1 : 1;
    el.style.setProperty("--nr", (sign * (3 + r * 4)).toFixed(1) + "deg");
    el.style.setProperty("--nx", (sign * (1 + r * 1.5)).toFixed(1) + "px");
    el.style.setProperty("--ny", (-1 - r).toFixed(1) + "px");
    el.classList.remove("nudging");
    void el.offsetWidth;                                   // restart the animation
    el.classList.add("nudging");
  }
  document.addEventListener("animationend", function (e) {
    if (e.animationName === "nudge") e.target.classList.remove("nudging");
  });
  document.querySelectorAll(".nudgeable").forEach(function (el) {
    el.addEventListener("pointerenter", function () { nudge(el); });
  });

  /* ---------- the pretend month on the home page ---------- */
  var MONTH = "March", DAYS = 31, START_DOW = 0, TODAY = 26;   // March 2026 starts on a Sunday
  var countries = [                                         // this year, in the order first visited
    { name: "Canada",   ink: "#8F9E7C", days: 20 },
    { name: "Portugal", ink: "#7E95AE", days: 41 },
    { name: "Mexico",   ink: "#C48470", days: 20 },
    { name: "Italy",    ink: "#A8889A", days: 4 }
  ];
  var baseTotals = countries.map(function (c) { return c.days; });
  var nextInks = [                                          // the rest of the ink order, for "Press to stamp"
    { name: "Japan",   ink: "#B8956A" },
    { name: "Greece",  ink: "#6E9E98" },
    { name: "Chile",   ink: "#C49298" },
    { name: "Ireland", ink: "#9E9A58" },
    { name: "Kenya",   ink: "#A3988C" }
  ];
  var nextIndex = 0;
  function countryForDay(d) {
    if (d <= 6) return "Canada";
    if (d <= 22) return "Portugal";
    if (d <= TODAY) return "Italy";
    return null;
  }
  function findCountry(name) { for (var i = 0; i < countries.length; i++) if (countries[i].name === name) return countries[i]; return null; }

  /* ---------- build the calendar ---------- */
  var cal = document.getElementById("cal");
  var totalsList = document.getElementById("totals-list");
  var appKey = document.getElementById("app-key");
  var monthList = document.getElementById("month-list");
  var totalDaysEl = document.getElementById("total-days");

  function stampDay(btn, name, ink, seed) {
    var mark = btn.querySelector(".mark");
    var old = mark.querySelector("svg");
    if (old) old.remove();
    mark.insertBefore(makeStamp(ink, seed, 43), mark.firstChild);
    btn.classList.remove("is-empty");
    btn.classList.add("is-stamped");
    btn.dataset.country = name;
    var d = btn.dataset.day;
    btn.querySelector(".tip").textContent = MONTH + " " + d + " \u00B7 " + name;
    btn.setAttribute("aria-label", MONTH + " " + d + ", " + name);
  }

  if (cal) {
    for (var i = 0; i < START_DOW; i++) cal.appendChild(document.createElement("span"));
    for (var d = 1; d <= DAYS; d++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day col-" + ((START_DOW + d - 1) % 7);
      btn.dataset.day = d;
      btn.innerHTML = '<span class="mark"><span class="num">' + d + '</span></span><span class="tip" aria-hidden="true"></span>';
      var c = countryForDay(d);
      if (c) {
        stampDay(btn, c, findCountry(c).ink, d * 7 + 3);
      } else {
        btn.classList.add("is-empty");
        btn.setAttribute("aria-label", MONTH + " " + d + ", not yet. Click to stamp it.");
      }
      if (d === TODAY) btn.classList.add("is-today");
      cal.appendChild(btn);
    }

    /* 1 + 2: hover on calendar stamps */
    cal.addEventListener("pointerover", function (e) {
      var b = e.target.closest(".day.is-stamped");
      if (!b || b.contains(e.relatedTarget)) return;
      if (cal.classList.contains("mode-nudge")) nudge(b.querySelector(".mark"));
      setRowHighlight(b.dataset.country);
    });
    cal.addEventListener("pointerout", function (e) {
      var b = e.target.closest(".day.is-stamped");
      if (!b || b.contains(e.relatedTarget)) return;
      setRowHighlight(null);
    });

    /* 3: press to stamp */
    cal.addEventListener("pointerdown", function (e) {
      var b = e.target.closest(".day.is-empty");
      if (b && !reduceMotion) b.classList.add("pressing");
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
      cal.addEventListener(ev, function () {
        cal.querySelectorAll(".pressing").forEach(function (b) { b.classList.remove("pressing"); });
      });
    });
    cal.addEventListener("click", function (e) {
      var b = e.target.closest(".day.is-empty");
      if (!b) return;
      b.classList.remove("pressing");
      var pick = nextInks[nextIndex % nextInks.length];
      nextIndex++;
      var seed = Math.floor(Math.random() * 100000) + 1;     // a fresh wobble every time
      stampDay(b, pick.name, pick.ink, seed);
      b.classList.add("is-new");
      var ctry = findCountry(pick.name);
      if (!ctry) { ctry = { name: pick.name, ink: pick.ink, days: 0, added: true }; countries.push(ctry); }
      ctry.days++;
      renderTotals();
      renderKey();
      renderMonthList();
      if (!reduceMotion) {
        b.classList.remove("just-stamped");
        void b.offsetWidth;
        b.classList.add("just-stamped");
        b.addEventListener("animationend", function h() { b.classList.remove("just-stamped"); b.removeEventListener("animationend", h); });
      }
    });
  }

  /* ---------- key + totals ---------- */
  function renderKey() {
    if (!appKey) return;
    var seen = [];
    cal.querySelectorAll(".day.is-stamped").forEach(function (b) {
      if (seen.indexOf(b.dataset.country) < 0) seen.push(b.dataset.country);
    });
    appKey.innerHTML = "";
    countries.forEach(function (c, i) {
      if (seen.indexOf(c.name) < 0) return;
      var li = document.createElement("li");
      li.innerHTML = '<span class="stamp-icon" data-ink="' + c.ink + '" data-seed="' + (40 + i) + '"></span><span>' + c.name + "</span>";
      appKey.appendChild(li);
    });
    fillStampIcons(appKey);
  }

  /* "This month" list inside the phone: days stamped this month, in first-visited order */
  function renderMonthList() {
    if (!monthList) return;
    var n = {};
    cal.querySelectorAll(".day.is-stamped").forEach(function (b) { n[b.dataset.country] = (n[b.dataset.country] || 0) + 1; });
    monthList.innerHTML = "";
    var list = countries.filter(function (c) { return n[c.name]; });
    var compact = list.length > 4;                         // long lists flow inline, numbers only
    list.forEach(function (c) {
      var i = countries.indexOf(c);
      var li = document.createElement("li");
      li.innerHTML = '<span class="stamp-icon" data-ink="' + c.ink + '" data-seed="' + (120 + i) + '"></span><span>' + c.name + '</span><span class="md">' + n[c.name] + (compact ? "" : (n[c.name] === 1 ? " day" : " days")) + "</span>";
      li.setAttribute("aria-label", c.name + ", " + n[c.name] + (n[c.name] === 1 ? " day" : " days"));
      monthList.appendChild(li);
    });
    monthList.parentNode.classList.toggle("compact", compact);
    fillStampIcons(monthList);
  }

  function renderTotals() {
    if (!totalsList) return;
    var total = countries.reduce(function (s, c) { return s + c.days; }, 0);
    var max = countries.reduce(function (m, c) { return Math.max(m, c.days); }, 1);
    if (totalDaysEl) totalDaysEl.textContent = total;
    totalsList.innerHTML = "";
    countries.forEach(function (c, i) {
      var li = document.createElement("li");
      li.innerHTML =
        '<button type="button" class="tot-row" data-country="' + c.name + '">' +
          '<span class="stamp-icon" data-ink="' + c.ink + '" data-seed="' + (60 + i) + '"></span>' +
          '<span class="tot-name">' + c.name + "</span>" +
          '<span class="tot-days">' + c.days + (c.days === 1 ? " day" : " days") + "</span>" +
          '<span class="tot-bar" aria-hidden="true"><span style="width:' + Math.max(3, (c.days / max) * 100).toFixed(1) + "%;background:" + c.ink + '"></span></span>' +
        "</button>";
      totalsList.appendChild(li);
    });
    fillStampIcons(totalsList);
  }

  /* 4: linked totals */
  function highlightCountry(name) {
    if (!cal) return;
    cal.querySelectorAll(".day.hl").forEach(function (b) { b.classList.remove("hl"); });
    if (!name) { cal.classList.remove("linking"); return; }
    cal.classList.add("linking");
    cal.querySelectorAll('.day.is-stamped[data-country="' + name + '"]').forEach(function (b) { b.classList.add("hl"); });
  }
  function setRowHighlight(name) {
    if (!totalsList) return;
    totalsList.querySelectorAll(".tot-row").forEach(function (r) {
      r.classList.toggle("hl", !!name && r.dataset.country === name);
    });
  }
  if (totalsList) {
    ["pointerover", "focusin"].forEach(function (ev) {
      totalsList.addEventListener(ev, function (e) {
        var r = e.target.closest(".tot-row");
        if (r) highlightCountry(r.dataset.country);
      });
    });
    ["pointerleave", "focusout"].forEach(function (ev) {
      totalsList.addEventListener(ev, function () { highlightCountry(null); });
    });
    totalsList.addEventListener("pointerout", function (e) {
      if (!e.relatedTarget || !totalsList.contains(e.relatedTarget)) highlightCountry(null);
    });
  }

  /* hover style switch (Grow + tell / Nudge) */
  document.querySelectorAll(".switch-btns button").forEach(function (b) {
    b.addEventListener("click", function () {
      var mode = b.dataset.mode;
      cal.classList.toggle("mode-grow", mode === "grow");
      cal.classList.toggle("mode-nudge", mode === "nudge");
      document.querySelectorAll(".switch-btns button").forEach(function (o) {
        o.setAttribute("aria-pressed", o === b ? "true" : "false");
      });
    });
  });

  /* reset my stamps */
  var reset = document.getElementById("reset-stamps");
  if (reset) reset.addEventListener("click", function () {
    cal.querySelectorAll(".day.is-new").forEach(function (b) {
      var svg = b.querySelector(".mark svg"); if (svg) svg.remove();
      b.classList.remove("is-stamped", "is-new", "hl");
      b.classList.add("is-empty");
      delete b.dataset.country;
      b.querySelector(".tip").textContent = "";
      b.setAttribute("aria-label", MONTH + " " + b.dataset.day + ", not yet. Click to stamp it.");
    });
    countries = countries.filter(function (c) { return !c.added; });
    countries.forEach(function (c, i) { c.days = baseTotals[i]; });
    nextIndex = 0;
    renderTotals(); renderKey(); renderMonthList();
  });

  /* privacy bullets get little stamps */
  var bulletInks = ["#8F9E7C", "#7E95AE", "#C48470", "#A8889A", "#B8956A", "#6E9E98"];
  document.querySelectorAll(".stamp-bullets li").forEach(function (li, i) {
    var s = document.createElement("span");
    s.className = "stamp-icon nudgeable";
    s.setAttribute("aria-hidden", "true");
    s.dataset.ink = bulletInks[i % bulletInks.length];
    s.dataset.seed = 80 + i;
    var text = document.createElement("span");
    while (li.firstChild) text.appendChild(li.firstChild);
    li.appendChild(s); li.appendChild(text);
    s.addEventListener("pointerenter", function () { nudge(s); });
  });

  /* App Store buttons: "Coming soon" until APP_STORE_ID (top of this file) is filled in */
  var storeId = String(APP_STORE_ID || "").replace(/\D/g, "");
  if (storeId) {
    var storeUrl = "https://apps.apple.com/app/id" + storeId;
    document.querySelectorAll("[data-store-btn]").forEach(function (el) {
      var a = document.createElement("a");
      a.className = "store-btn";
      a.href = storeUrl;
      a.innerHTML = "<small>Download on the</small>App Store";
      var row = el.parentNode;
      el.replaceWith(a);
      var qr = document.createElement("div");
      qr.className = "qr";
      var img = new Image(132, 132);
      img.className = "qr-img";
      img.alt = "QR code for Where You Were on the App Store";
      img.onerror = function () { qr.remove(); };
      img.src = "images/app-store-qr.png";
      var label = document.createElement("p");
      label.className = "qr-label";
      label.textContent = "Scan to get the app";
      qr.appendChild(img); qr.appendChild(label);
      row.appendChild(qr);
    });
  }

  fillStampIcons(document);
  renderTotals();
  renderKey();
  renderMonthList();
})();
