/* Giochi formativi — motore. Nessun dato viene salvato né inviato: tutto resta in memoria nella pagina. */
(function () {
  "use strict";
  var G = window.GAMES || [], S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var last = {};            // ultima variante uscita per slot (solo in memoria)
  var run = null;           // partita in corso
  var tick = null, breathT = null;

  function fmt(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function find(id) { for (var i = 0; i < G.length; i++) if (G[i].id === id) return G[i]; }
  function bookUrl(g) {
    var bs = S.books || [], k = g.book.toLowerCase();
    for (var i = 0; i < bs.length; i++) if (bs[i].title && k.indexOf(bs[i].title.toLowerCase().replace(/^il |^la |^i /, "")) !== -1 && bs[i].amazon) return bs[i].amazon;
    return "";
  }

  /* pesca una variante per slot, evitando di ripetere quella dell'ultima partita */
  function build(g) {
    last[g.id] = last[g.id] || [];
    return g.slots.map(function (pool, si) {
      var idx = rnd(pool.length);
      if (pool.length > 1 && idx === last[g.id][si]) idx = (idx + 1 + rnd(pool.length - 1)) % pool.length;
      last[g.id][si] = idx;
      var st = JSON.parse(JSON.stringify(pool[idx]));
      if (st.type === "choice") st.options = shuffle(st.options);
      return st;
    });
  }
  function estimate(steps) {
    var s = 0; steps.forEach(function (x) { s += x.type === "timer" ? x.seconds + 10 : 25; });
    return Math.max(3, Math.round(s / 60));
  }

  /* ---------- schede dei giochi ---------- */
  function renderGrid() {
    var box = $("#game-grid"); if (!box) return;
    box.innerHTML = G.map(function (g) {
      return '<article class="gcard" style="--gc:' + g.color + '">' +
        '<p class="gcard-book">' + esc(g.book) + '</p>' +
        '<h3>' + esc(g.title) + '</h3>' +
        '<p class="gcard-skill">' + esc(g.skill) + '</p>' +
        '<p>' + esc(g.blurb) + '</p>' +
        '<div class="gcard-foot"><span class="gcard-time">≈ 5 min</span>' +
        '<button class="btn" type="button" data-play="' + g.id + '" aria-label="Gioca: ' + esc(g.title) + '">Gioca</button></div></article>';
    }).join("");
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-play]"); if (b) start(b.getAttribute("data-play"), b);
    });
  }

  /* ---------- finestra di gioco ---------- */
  var overlay, body, opener;
  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "gm"; overlay.hidden = true;
    overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", "Gioco formativo");
    overlay.innerHTML = '<div class="gm-box"><div class="gm-top"><span class="gm-title"></span><button type="button" class="gm-close" aria-label="Chiudi il gioco">✕</button></div><div class="gm-bar"><i></i></div><div class="gm-body" tabindex="-1"></div></div>';
    document.body.appendChild(overlay);
    body = $(".gm-body", overlay);
    $(".gm-close", overlay).addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !overlay.hidden) close(); });
  }
  function clearTimers() { clearInterval(tick); clearTimeout(breathT); tick = breathT = null; }
  function close() {
    clearTimers(); if (!overlay) return;
    overlay.hidden = true; document.body.classList.remove("gm-lock"); run = null;
    if (opener && opener.focus) opener.focus();
  }
  function start(id, from) {
    var g = find(id); if (!g) return;
    ensureOverlay(); opener = from || null;
    run = { g: g, steps: build(g), i: 0, ans: {}, right: 0, quiz: 0, notes: [], go: null };
    $(".gm-title", overlay).textContent = g.title;
    overlay.style.setProperty("--gc", g.color);
    overlay.hidden = false; document.body.classList.add("gm-lock");
    intro();
  }
  function frame(html) { clearTimers(); body.innerHTML = html; body.scrollTop = 0; body.focus({ preventScroll: true }); }
  function bar(p) { $(".gm-bar i", overlay).style.width = Math.round(p * 100) + "%"; }

  function intro() {
    var g = run.g; bar(0);
    frame('<p class="gm-kicker">' + esc(g.book) + '</p><h2>' + esc(g.title) + '</h2><p class="gm-lead">' + esc(g.blurb) + '</p>' +
      '<p class="gm-meta">' + run.steps.length + ' passi · circa ' + estimate(run.steps) + ' minuti · ogni partita è diversa</p>' +
      '<div class="gm-actions"><button class="btn" type="button" data-a="go">Si parte</button></div>' +
      '<p class="gm-note">Le risposte restano solo su questo schermo: non vengono salvate né inviate.</p>');
    $('[data-a="go"]', body).addEventListener("click", step);
  }

  function next() { run.i++; step(); }
  function step() {
    if (run.i >= run.steps.length) return end();
    var s = run.steps[run.i]; bar(run.i / run.steps.length);
    var head = '<p class="gm-kicker">Passo ' + (run.i + 1) + ' di ' + run.steps.length + '</p><h2>' + esc(s.title) + '</h2>';
    var fn = { timer: stTimer, read: stRead, choice: stChoice, reflect: stReflect, rate: stRate, pick: stPick }[s.type];
    fn(s, head);
  }

  function stRead(s, head) {
    frame(head + '<p class="gm-lead">' + esc(s.text) + '</p><div class="gm-actions"><button class="btn" type="button" data-a="n">Avanti</button></div>');
    $('[data-a="n"]', body).addEventListener("click", next);
  }

  function stTimer(s, head) {
    frame(head + '<p class="gm-lead">' + esc(s.text) + '</p>' +
      (s.breath ? '<div class="breath" aria-hidden="true"><div class="breath-dot"></div><span class="breath-label">Pronto?</span></div>' : '') +
      '<div class="gm-clock" role="timer" aria-live="off">' + fmt(s.seconds) + '</div>' +
      '<div class="gm-actions"><button class="btn" type="button" data-a="s">Avvia</button><button class="btn ghost" type="button" data-a="skip">Salta</button></div>');
    var left = s.seconds, clock = $(".gm-clock", body), btn = $('[data-a="s"]', body), running = false;
    $('[data-a="skip"]', body).addEventListener("click", next);
    function breathe(k) {
      if (!s.breath || !running) return;
      var ph = s.breath[k % s.breath.length], dot = $(".breath-dot", body), lab = $(".breath-label", body);
      if (!dot) return;
      lab.textContent = ph[0];
      var to = /^(inspira|piccolo)/i.test(ph[0]) ? 1 : /^(espira|sospira)/i.test(ph[0]) ? 0.55 : null;
      dot.style.transitionDuration = ph[1] + "s";
      if (to !== null) dot.style.transform = "scale(" + to + ")";
      breathT = setTimeout(function () { breathe(k + 1); }, ph[1] * 1000);
    }
    btn.addEventListener("click", function () {
      if (running) return;
      running = true; btn.disabled = true; btn.textContent = "In corso…";
      breathe(0);
      tick = setInterval(function () {
        left--; clock.textContent = fmt(Math.max(left, 0));
        if (left <= 0) {
          clearTimers();
          if (s.breath) { $(".breath-label", body).textContent = "Ben fatto"; }
          clock.textContent = "Fatto ✓";
          btn.textContent = "Avanti"; btn.disabled = false;
          btn.onclick = next; $('[data-a="skip"]', body).hidden = true; btn.focus();
          if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) {}
        }
      }, 1000);
    });
  }

  function stChoice(s, head) {
    run.quiz++;
    frame(head + '<p class="gm-lead">' + esc(s.q) + '</p><div class="gm-opts">' +
      s.options.map(function (o, i) { return '<button type="button" class="gm-opt" data-i="' + i + '">' + esc(o.t) + '</button>'; }).join("") +
      '</div><div class="gm-fb" aria-live="polite"></div>');
    var done = false;
    $(".gm-opts", body).addEventListener("click", function (e) {
      var b = e.target.closest(".gm-opt"); if (!b || done) return; done = true;
      var o = s.options[+b.getAttribute("data-i")];
      if (o.ok) run.right++;
      var all = body.querySelectorAll(".gm-opt");
      all.forEach(function (x, i) { x.disabled = true; if (s.options[i].ok) x.classList.add("ok"); });
      if (!o.ok) b.classList.add("no");
      $(".gm-fb", body).innerHTML = '<p><strong>' + (o.ok ? "Giusto. " : "Non proprio. ") + '</strong>' + esc(o.fb) + '</p><div class="gm-actions"><button class="btn" type="button" data-a="n">Avanti</button></div>';
      $('[data-a="n"]', body).addEventListener("click", next); $('[data-a="n"]', body).focus();
    });
  }

  function stReflect(s, head) {
    frame(head + '<p class="gm-lead">' + esc(s.text) + '</p><label class="sr" for="gm-ta">La tua risposta</label><textarea id="gm-ta" class="gm-ta" rows="3" placeholder="' + esc(s.ph || "") + '"></textarea>' +
      '<div class="gm-actions"><button class="btn" type="button" data-a="n">Avanti</button></div>');
    $('[data-a="n"]', body).addEventListener("click", function () {
      var v = $("#gm-ta", body).value.trim(); if (v) run.notes.push({ t: s.title, v: v }); next();
    });
  }

  function stRate(s, head) {
    frame(head + '<p class="gm-lead">' + esc(s.text) + '</p><div class="gm-scale">' +
      [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" class="gm-n" data-n="' + n + '">' + n + '</button>'; }).join("") + '</div>');
    $(".gm-scale", body).addEventListener("click", function (e) {
      var b = e.target.closest(".gm-n"); if (!b) return;
      run.ans[s.key] = +b.getAttribute("data-n"); next();
    });
  }

  function stPick(s, head) {
    frame(head + '<p class="gm-lead">' + esc(s.text) + '</p><div class="gm-opts">' +
      s.options.map(function (o, i) { return '<button type="button" class="gm-opt" data-i="' + i + '">' + esc(o.t) + '</button>'; }).join("") + '</div>');
    $(".gm-opts", body).addEventListener("click", function (e) {
      var b = e.target.closest(".gm-opt"); if (!b) return;
      var o = s.options[+b.getAttribute("data-i")];
      if (o.go) run.go = o.go; else run.notes.push({ t: "La tua sfida", v: o.t });
      next();
    });
  }

  /* ---------- chiusura ---------- */
  function end() {
    var g = run.g, a = run.ans, parts = "";
    bar(1);
    if (a.prima && a.dopo) {
      var d = a.prima - a.dopo;
      parts += '<p class="gm-res">Tensione: da <strong>' + a.prima + '</strong> a <strong>' + a.dopo + '</strong>. ' + (d > 0 ? "Ottimo: il corpo ha risposto." : d === 0 ? "Se non cambia, ripeti: spesso l’effetto cresce con la pratica." : "Può succedere: ripeti domani, con più calma.") + '</p>';
    }
    if (a.energia && a.energia2) parts += '<p class="gm-res">Energia: da <strong>' + a.energia + '</strong> a <strong>' + a.energia2 + '</strong>.</p>';
    if (run.quiz) parts += '<p class="gm-res">Domande: <strong>' + run.right + ' su ' + run.quiz + '</strong> corrette.</p>';
    if (run.notes.length) parts += '<div class="gm-notes"><p class="gm-kicker">Il tuo impegno</p><ul>' + run.notes.map(function (n) { return '<li><strong>' + esc(n.t) + '.</strong> ' + esc(n.v) + '</li>'; }).join("") + '</ul></div>';
    var rec = run.go ? find(run.go) : null, url = bookUrl(g);
    if (rec) parts += '<p class="gm-res">Ti consiglio di provare ora: <strong>' + esc(rec.title) + '</strong>.</p>';
    frame('<p class="gm-kicker">Gioco completato</p><h2>Ben fatto.</h2><p class="gm-lead">' + esc(g.takeaway) + '</p>' + parts +
      '<div class="gm-actions">' +
      (rec ? '<button class="btn" type="button" data-a="rec">Gioca «' + esc(rec.title) + '»</button>' : '<button class="btn" type="button" data-a="again">Gioca ancora</button>') +
      (rec ? '<button class="btn ghost" type="button" data-a="again">Rigioca questo</button>' : '') +
      '<button class="btn ghost" type="button" data-a="x">Chiudi</button></div>' +
      (url ? '<p class="gm-note">Vuoi andare più a fondo? Questo gioco nasce dal libro <a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(g.book) + '</a>.</p>' : ''));
    $('[data-a="again"]', body).addEventListener("click", function () { start(g.id, opener); });
    $('[data-a="x"]', body).addEventListener("click", close);
    if (rec) $('[data-a="rec"]', body).addEventListener("click", function () { start(rec.id, opener); });
  }

  renderGrid();
  var q = /[?&]g=([a-z]+)/.exec(location.search);
  if (q && find(q[1])) start(q[1], null);
})();
