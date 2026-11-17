/* Sfida a spicchi — gioco a quiz multigiocatore.
   Il master ospita la partita sul suo telefono; i giocatori si collegano col codice o il QR.
   Lo scambio dei dati usa un piccolo database in tempo reale (vedi tavolo-config.js).
   Nessun account, nessun cookie: nome e punteggi esistono solo finché il master non chiude la stanza. */
(function () {
  "use strict";
  var CATS = window.TAVOLO_CATS || [], BANK = window.TAVOLO_Q || {}, CFG = window.TAVOLO_CONFIG || {};
  var DB = (CFG.db || "").replace(/\/$/, "");
  var NOI = { id: "noi", name: "Su di noi", color: "#ffffff" };
  var root = document.getElementById("tv");
  if (!root) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function range(n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }
  function rid() { return Math.random().toString(36).slice(2, 10); }
  var CH = "ABCDEFGHJKMNPQRSTUVWXYZ";
  function randCode() { var s = ""; for (var i = 0; i < 4; i++) s += CH[rnd(CH.length)]; return s; }
  function catById(id) { return id === "noi" ? NOI : (CATS.filter(function (c) { return c.id === id; })[0] || { id: id, name: id, color: "#888" }); }

  /* ---------- database in tempo reale (REST + streaming, senza librerie) ---------- */
  function url(c, p) { return DB + "/rooms/" + c + (p || "") + ".json"; }
  function req(m, c, p, b) {
    return fetch(url(c, p), { method: m, body: b === undefined ? undefined : JSON.stringify(b) })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  function put(p, b) { return req("PUT", S.code, p, b).catch(netErr); }
  function del(p) { return req("DELETE", S.code, p).catch(netErr); }
  function netErr() { setNet(false); }

  /* ---------- stato locale ---------- */
  var S = { role: null, code: null, me: null, name: "", tree: {}, loaded: false, es: null, net: true, view: "home", sig: "", answered: null, hbN: 0, hb: null, wake: null, m: null, masterSeen: { n: -1, t: 0 } };
  function setAt(path, data) {
    var parts = path.split("/").filter(Boolean);
    if (!parts.length) { S.tree = data || {}; return; }
    var o = S.tree;
    for (var i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null || typeof o[parts[i]] !== "object") o[parts[i]] = {}; o = o[parts[i]]; }
    var k = parts[parts.length - 1];
    if (data === null) delete o[k]; else o[k] = data;
  }
  function listen() {
    S.tree = {}; S.loaded = false;
    if (S.es) S.es.close();
    S.es = new EventSource(url(S.code, ""));
    S.es.addEventListener("put", function (e) { var d = JSON.parse(e.data); setAt(d.path, d.data); S.loaded = true; changed(); });
    S.es.addEventListener("patch", function (e) { var d = JSON.parse(e.data); Object.keys(d.data || {}).forEach(function (k) { setAt((d.path === "/" ? "" : d.path) + "/" + k, d.data[k]); }); changed(); });
    S.es.onopen = function () { setNet(true); };
    S.es.onerror = function () { setNet(false); };
  }
  function setNet(v) { if (S.net === v) return; S.net = v; var b = $("#tv-banner"); if (b) b.hidden = v; if (v) S.sig = ""; }
  function wake() {
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { S.wake = w; }).catch(function () {}); } catch (e) {}
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && S.role && S.view !== "home") wake(); });

  /* ---------- struttura della pagina ---------- */
  function shell(inner) {
    root.innerHTML = '<div id="tv-banner" class="tv-banner" role="status" ' + (S.net ? "hidden" : "") + '>Connessione assente… riprovo.</div>' + inner;
  }
  function goHome() {
    cleanup(); S.view = "home";
    if (!DB) {
      shell('<div class="tv-card"><h2>Il tavolo di gioco non è ancora attivo.</h2><p class="tv-muted">Torna a trovarci tra poco.</p></div>');
      return;
    }
    var q = /[?&]c=([A-Za-z]{4})/.exec(location.search);
    if (q) { return joinForm(q[1].toUpperCase()); }
    shell(
      '<div class="tv-home">' +
      '<button class="tv-big" id="tv-new" type="button"><b>Crea una partita</b><span>Sei il master: scegli le regole e invita gli amici.</span></button>' +
      '<button class="tv-big alt" id="tv-join" type="button"><b>Entra con un codice</b><span>Hai ricevuto un codice o un QR? Entra qui.</span></button>' +
      '</div>');
    $("#tv-new").addEventListener("click", setup);
    $("#tv-join").addEventListener("click", function () { joinForm(""); });
  }
  function cleanup() {
    if (S.es) S.es.close(); S.es = null;
    clearInterval(S.hb); clearInterval(S.tick); if (S.m) clearTimeout(S.m.to);
    S.role = null; S.code = null; S.me = null; S.tree = {}; S.m = null; S.answered = null; S.sig = ""; S.loaded = false;
  }

  /* ---------- master: preparazione ---------- */
  var custom = [];
  function setup() {
    S.view = "setup";
    var cats = CATS.concat([NOI]);
    shell(
      '<form class="tv-card" id="tv-form" autocomplete="off">' +
      '<h2>Prepara la partita</h2>' +
      '<p class="tv-muted">Vince chi per primo ottiene uno spicchio in ogni categoria e poi risponde bene alla domanda decisiva.</p>' +
      '<p class="tv-label">Categorie in gioco</p><div class="tv-checks">' +
      cats.map(function (c) { return '<label class="tv-check" style="--cc:' + c.color + '"><input type="checkbox" name="cat" value="' + c.id + '"' + (c.id === "noi" ? " disabled" : " checked") + '><span>' + esc(c.name) + (c.id === "noi" ? ' <em id="tv-noi-n">(aggiungi domande tue)</em>' : "") + '</span></label>'; }).join("") +
      '</div>' +
      '<label class="tv-label" for="tv-secs">Tempo per rispondere</label>' +
      '<select id="tv-secs" class="tv-in"><option value="20">20 secondi</option><option value="30" selected>30 secondi</option><option value="45">45 secondi</option><option value="60">60 secondi</option><option value="0">Senza limite</option></select>' +
      '<label class="tv-check solo"><input type="checkbox" id="tv-hp" checked><span>Gioco anch’io, su questo dispositivo</span></label>' +
      '<input class="tv-in" id="tv-hname" maxlength="16" placeholder="Il tuo nome" aria-label="Il tuo nome">' +
      '<details class="tv-det"><summary>Aggiungi domande tue (categoria «Su di noi»)</summary>' +
      '<p class="tv-muted">Per feste e ricorrenze: scrivi la domanda, la risposta giusta e da 1 a 3 risposte sbagliate.</p>' +
      '<input class="tv-in" id="tv-cq" maxlength="140" placeholder="Domanda">' +
      '<input class="tv-in" id="tv-c0" maxlength="60" placeholder="Risposta giusta">' +
      '<input class="tv-in" id="tv-c1" maxlength="60" placeholder="Risposta sbagliata 1">' +
      '<input class="tv-in" id="tv-c2" maxlength="60" placeholder="Risposta sbagliata 2 (facoltativa)">' +
      '<input class="tv-in" id="tv-c3" maxlength="60" placeholder="Risposta sbagliata 3 (facoltativa)">' +
      '<button class="tv-btn ghost" id="tv-cadd" type="button">Aggiungi domanda</button><ul class="tv-clist" id="tv-clist"></ul></details>' +
      '<p class="tv-err" id="tv-err" role="alert"></p>' +
      '<div class="tv-row"><button class="tv-btn" type="submit">Crea partita</button><button class="tv-btn ghost" id="tv-back" type="button">Indietro</button></div>' +
      '</form>');
    function drawCustom() {
      var n = custom.length, box = $('input[value="noi"]');
      box.disabled = !n; if (!n) box.checked = false; else if (!box.dataset.t) { box.checked = true; box.dataset.t = "1"; }
      $("#tv-noi-n").textContent = n ? "(" + n + (n === 1 ? " domanda" : " domande") + ")" : "(aggiungi domande tue)";
      $("#tv-clist").innerHTML = custom.map(function (c, i) { return "<li>" + esc(c[0]) + ' <button type="button" class="tv-x" data-i="' + i + '" aria-label="Elimina">✕</button></li>'; }).join("");
    }
    drawCustom();
    $("#tv-clist").addEventListener("click", function (e) { var b = e.target.closest(".tv-x"); if (b) { custom.splice(+b.dataset.i, 1); drawCustom(); } });
    $("#tv-cadd").addEventListener("click", function () {
      var q = $("#tv-cq").value.trim(), r = $("#tv-c0").value.trim(), w = [1, 2, 3].map(function (i) { return $("#tv-c" + i).value.trim(); }).filter(Boolean);
      if (!q || !r || !w.length) { $("#tv-err").textContent = "Servono la domanda, la risposta giusta e almeno una sbagliata."; return; }
      $("#tv-err").textContent = ""; custom.push([q, r].concat(w)); ["cq", "c0", "c1", "c2", "c3"].forEach(function (k) { $("#tv-" + k).value = ""; }); drawCustom();
    });
    $("#tv-back").addEventListener("click", goHome);
    $("#tv-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var sel = $$('input[name="cat"]:checked').map(function (i) { return i.value; });
      if (!sel.length) { $("#tv-err").textContent = "Scegli almeno una categoria."; return; }
      var hp = $("#tv-hp").checked, hn = $("#tv-hname").value.trim();
      if (hp && !hn) { $("#tv-err").textContent = "Scrivi il tuo nome, oppure togli la spunta."; return; }
      createRoom({ cats: sel, secs: +$("#tv-secs").value, hostName: hp ? hn : "" });
    });
  }

  /* ---------- master: stanza ---------- */
  function createRoom(set) {
    var btn = $("#tv-form button[type=submit]"); if (btn) btn.disabled = true;
    (function attempt(n) {
      var c = randCode();
      req("GET", c, "/meta").then(function (ex) {
        if (ex && n < 8) return attempt(n + 1);
        S.code = c; S.role = "master"; S.me = set.hostName ? "host" : null; S.name = set.hostName;
        var room = { meta: { created: Date.now(), status: "lobby", secs: set.secs, cats: set.cats }, state: { phase: "lobby" }, hb: 0 };
        if (set.hostName) room.players = { host: { name: set.hostName, t: Date.now(), n: 0 } };
        return req("PUT", c, "", room).then(function () {
          S.m = { set: set, secs: set.secs, cats: set.cats.map(catById), custom: custom.slice(), seen: {}, off: [], wedges: {}, order: [], ti: 0, state: { phase: "lobby" } };
          S.view = "lobby"; listen(); wake();
          S.hb = setInterval(function () { put("/hb", ++S.hbN); }, 8000);
          S.tick = setInterval(masterTick, 5000);
        });
      }).catch(function () { if (btn) btn.disabled = false; var e = $("#tv-err"); if (e) e.textContent = "Non riesco a creare la partita. Controlla la connessione e riprova."; });
    })(0);
  }

  function pickQuestion(cat) {
    var m = S.m, p = m.pools[cat.id];
    var q = p.arr[p.idx[p.p % p.idx.length]]; p.p++;
    return q;
  }
  function publish(extra) {
    var m = S.m; m.state = Object.assign({}, m.state, extra);
    m.state.order = m.order; m.state.wedges = m.wedges; m.state.off = m.off.length ? m.off : null;
    put("/state", m.state);
  }
  function startGame() {
    var m = S.m, pl = S.tree.players || {};
    var ids = Object.keys(pl).sort(function (a, b) { return (pl[a].t || 0) - (pl[b].t || 0); });
    if (ids.length < 2) return;
    m.order = ids; m.ti = 0; m.wedges = {}; ids.forEach(function (i) { m.wedges[i] = []; });
    m.pools = {};
    m.cats.forEach(function (c) { var arr = c.id === "noi" ? m.custom : BANK[c.id]; m.pools[c.id] = { arr: arr, idx: shuffle(range(arr.length)), p: 0 }; });
    put("/meta/status", "playing");
    ask();
  }
  function ask() {
    var m = S.m, pid = m.order[m.ti], owned = m.wedges[pid] || [];
    var need = m.cats.filter(function (c) { return owned.indexOf(c.id) < 0; });
    var final = need.length === 0, cat = final ? m.cats[rnd(m.cats.length)] : need[rnd(need.length)];
    var q = pickQuestion(cat), opts = shuffle([q[1]].concat(q.slice(2).filter(Boolean)));
    m.cur = { qid: rid(), pid: pid, cat: cat.id, correct: opts.indexOf(q[1]), final: final, done: false };
    publish({ phase: "question", qid: m.cur.qid, turn: pid, cat: cat.id, final: final, q: { t: q[0], o: opts }, secs: m.secs, reveal: null, winner: null });
    clearTimeout(m.to);
    if (m.secs > 0) m.to = setTimeout(function () { resolve(-1); }, m.secs * 1000 + 2000);
  }
  function resolve(idx) {
    var m = S.m, c = m && m.cur; if (!c || c.done) return; c.done = true; clearTimeout(m.to);
    var ok = idx === c.correct, win = false; c.ok = ok;
    if (ok) { if (c.final) win = true; else if ((m.wedges[c.pid] || []).indexOf(c.cat) < 0) { m.wedges[c.pid] = (m.wedges[c.pid] || []).concat([c.cat]); } }
    publish({ phase: win ? "end" : "reveal", reveal: { correct: c.correct, picked: idx, ok: ok }, winner: win ? c.pid : null });
    if (win) { put("/meta/status", "ended"); return; }
    m.to = setTimeout(function () { next(ok); }, 5000);
  }
  function next(same) {
    var m = S.m; clearTimeout(m.to);
    if (!same) { var n = m.order.length, tries = 0; do { m.ti = (m.ti + 1) % n; tries++; } while (m.off.indexOf(m.order[m.ti]) >= 0 && tries < n); }
    ask();
  }
  function masterTick() {
    var m = S.m; if (!m) return;
    var now = Date.now(), pl = S.tree.players || {}, off = [];
    Object.keys(pl).forEach(function (id) {
      if (id === "host") return;
      var s = m.seen[id];
      if (!s || s.n !== pl[id].n) m.seen[id] = { n: pl[id].n, t: now };
      else if (now - s.t > 30000) off.push(id);
    });
    off.sort();
    if (JSON.stringify(off) !== JSON.stringify(m.off.slice().sort())) { m.off = off; if (m.state.phase !== "lobby") publish({}); else put("/state/off", off.length ? off : null); }
  }
  function processActions() {
    var a = S.tree.actions, m = S.m; if (!a || !m) return;
    Object.keys(a).forEach(function (k) {
      var x = a[k]; delete a[k]; del("/actions/" + k);
      if (m.cur && !m.cur.done && x && x.pid === m.cur.pid && x.qid === m.cur.qid) resolve(+x.idx);
    });
  }
  function newGame() {
    var m = S.m; clearTimeout(m.to); m.cur = null; m.wedges = {}; m.order = [];
    m.state = { phase: "lobby" }; put("/state", { phase: "lobby" }); put("/meta/status", "lobby");
  }
  function closeRoom() {
    var m = S.m; if (m) clearTimeout(m.to);
    var c = S.code; req("DELETE", c, "").catch(function () {}).then(function () { goHome(); });
  }

  /* ---------- giocatore ---------- */
  function joinForm(code) {
    S.view = "join";
    shell(
      '<form class="tv-card" id="tv-jf" autocomplete="off"><h2>Entra in partita</h2>' +
      '<label class="tv-label" for="tv-jc">Codice della stanza</label><input class="tv-in code" id="tv-jc" maxlength="4" value="' + esc(code) + '" placeholder="ABCD" autocapitalize="characters" inputmode="text">' +
      '<label class="tv-label" for="tv-jn">Il tuo nome</label><input class="tv-in" id="tv-jn" maxlength="16" placeholder="Come ti chiami?">' +
      '<p class="tv-err" id="tv-err" role="alert"></p>' +
      '<div class="tv-row"><button class="tv-btn" type="submit">Entra</button><button class="tv-btn ghost" id="tv-back" type="button">Indietro</button></div></form>');
    $("#tv-back").addEventListener("click", function () { history.replaceState(null, "", location.pathname); goHome(); });
    if (code) $("#tv-jn").focus(); else $("#tv-jc").focus();
    $("#tv-jf").addEventListener("submit", function (e) {
      e.preventDefault();
      var c = $("#tv-jc").value.trim().toUpperCase(), n = $("#tv-jn").value.trim(), err = $("#tv-err");
      if (!/^[A-Z]{4}$/.test(c)) { err.textContent = "Il codice ha 4 lettere."; return; }
      if (!n) { err.textContent = "Scrivi il tuo nome."; return; }
      var b = $("#tv-jf button[type=submit]"); b.disabled = true;
      joinRoom(c, n).catch(function (ex) { b.disabled = false; err.textContent = ex && ex.message && ex.message.indexOf("HTTP") < 0 && ex.message !== "Failed to fetch" ? ex.message : "Non riesco a collegarmi. Riprova."; });
    });
  }
  function joinRoom(c, nm) {
    return Promise.all([req("GET", c, "/meta"), req("GET", c, "/players"), req("GET", c, "/state/phase")]).then(function (r) {
      var meta = r[0], pl = r[1] || {}, phase = r[2];
      if (!meta) throw new Error("Codice non trovato. Controlla le lettere.");
      var ids = Object.keys(pl), same = ids.filter(function (i) { return String(pl[i].name).toLowerCase() === nm.toLowerCase(); })[0];
      var pid;
      if (same) {
        if (phase === "lobby" || !phase) throw new Error("Questo nome è già in uso: scegline un altro.");
        pid = same;
      } else {
        if (phase && phase !== "lobby") throw new Error("La partita è già iniziata.");
        if (ids.length >= 8) throw new Error("La stanza è piena.");
        pid = rid();
      }
      S.code = c; S.role = "player"; S.me = pid; S.name = nm;
      return req("PUT", c, "/players/" + pid, { name: nm, t: same ? pl[same].t : Date.now(), n: 0 });
    }).then(function () {
      S.view = "lobby"; listen(); wake();
      S.hb = setInterval(function () { put("/players/" + S.me + "/n", ++S.hbN); }, 8000);
      S.tick = setInterval(render, 10000);
    });
  }

  /* ---------- schermate di gioco ---------- */
  function wedgeSVG(owned, size) {
    var cats = (S.m ? S.m.cats : (S.tree.meta && S.tree.meta.cats ? toArr(S.tree.meta.cats).map(catById) : CATS)), n = cats.length, r = size / 2, out = "";
    if (n === 1) return '<svg class="tv-pie" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '"><circle cx="' + r + '" cy="' + r + '" r="' + (r - 1) + '" fill="' + (owned.indexOf(cats[0].id) >= 0 ? cats[0].color : "rgba(255,255,255,.1)") + '" stroke="#10142e" stroke-width="2"/></svg>';
    for (var i = 0; i < n; i++) {
      var a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2, R = r - 1;
      var x0 = r + R * Math.cos(a0), y0 = r + R * Math.sin(a0), x1 = r + R * Math.cos(a1), y1 = r + R * Math.sin(a1);
      out += '<path d="M' + r + " " + r + " L" + x0.toFixed(2) + " " + y0.toFixed(2) + " A" + R + " " + R + " 0 " + (1 / n > 0.5 ? 1 : 0) + " 1 " + x1.toFixed(2) + " " + y1.toFixed(2) + ' Z" fill="' + (owned.indexOf(cats[i].id) >= 0 ? cats[i].color : "rgba(255,255,255,.1)") + '" stroke="#10142e" stroke-width="2"/>';
    }
    return '<svg class="tv-pie" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '" aria-hidden="true">' + out + "</svg>";
  }
  function toArr(o) { return Array.isArray(o) ? o : Object.keys(o || {}).map(function (k) { return o[k]; }); }
  function pname(id) { var p = (S.tree.players || {})[id]; return p ? p.name : "?"; }
  function scoreboard(st, withPies) {
    var order = toArr(st.order), pl = S.tree.players || {}, off = toArr(st.off), w = st.wedges || {};
    var ids = order.length ? order : Object.keys(pl).sort(function (a, b) { return (pl[a].t || 0) - (pl[b].t || 0); });
    return '<ul class="tv-score">' + ids.map(function (id) {
      var owned = toArr(w[id]);
      return '<li class="' + (st.turn === id && (st.phase === "question" || st.phase === "reveal") ? "turn " : "") + (off.indexOf(id) >= 0 ? "off" : "") + '">' +
        (withPies ? wedgeSVG(owned, 40) : "") + '<span class="tv-pn">' + esc(pname(id)) + (id === S.me ? " (tu)" : "") + (off.indexOf(id) >= 0 ? " · offline" : "") + "</span>" +
        (withPies ? '<span class="tv-pc">' + owned.length + "/" + (S.m ? S.m.cats.length : toArr((S.tree.meta || {}).cats).length) + "</span>" : "") + "</li>";
    }).join("") + "</ul>";
  }

  function lobbyView() {
    var pl = S.tree.players || {}, ids = Object.keys(pl).sort(function (a, b) { return (pl[a].t || 0) - (pl[b].t || 0); });
    var meta = S.tree.meta || {}, cats = toArr(meta.cats).map(catById);
    var link = location.origin + location.pathname + "?c=" + S.code;
    var html = '';
    if (S.role === "master") {
      var qr = ""; try { qr = window.tavoloQR(link); } catch (e) {}
      html += '<div class="tv-card tv-lobby"><p class="tv-label">Codice della stanza</p><div class="tv-code" aria-label="Codice ' + S.code.split("").join(" ") + '">' + S.code + '</div>' +
        '<div class="tv-qr">' + qr + '</div><p class="tv-muted">Gli amici aprono <b>' + esc(location.host) + '</b>, scelgono «Entra con un codice» oppure inquadrano il QR.</p>' +
        '<div class="tv-row"><button class="tv-btn ghost" id="tv-copy" type="button">Copia il link</button>' + (navigator.share ? '<button class="tv-btn ghost" id="tv-share" type="button">Condividi</button>' : "") + '</div></div>';
    } else {
      html += '<div class="tv-card tv-lobby"><p class="tv-label">Sei nella stanza</p><div class="tv-code">' + S.code + '</div><p class="tv-muted">Aspetta che il master avvii la partita.</p></div>';
    }
    html += '<div class="tv-card"><p class="tv-label">Giocatori (' + ids.length + ')</p><ul class="tv-score">' + ids.map(function (i) { return "<li><span class=\"tv-pn\">" + esc(pl[i].name) + (i === S.me ? " (tu)" : "") + (i === "host" ? " · master" : "") + "</span></li>"; }).join("") + '</ul>' +
      '<p class="tv-muted">Categorie: ' + cats.map(function (c) { return '<span class="tv-dot" style="--cc:' + c.color + '"></span>' + esc(c.name); }).join(" &nbsp; ") + '</p></div>';
    if (S.role === "master") html += '<div class="tv-row"><button class="tv-btn" id="tv-start" type="button"' + (ids.length < 2 ? " disabled" : "") + '>Avvia la partita</button><button class="tv-btn ghost" id="tv-close" type="button">Annulla</button></div>' + (ids.length < 2 ? '<p class="tv-muted">Servono almeno 2 giocatori.</p>' : "");
    return html;
  }

  function gameView(st) {
    var cat = catById(st.cat), mine = st.turn === S.me, reveal = st.phase === "reveal" && st.reveal, qo = toArr(st.q && st.q.o);
    var msg = "";
    if (reveal) {
      if (st.reveal.picked === -1) msg = "Tempo scaduto! ";
      msg += st.reveal.ok ? (mine ? "Corretto! " + (st.final ? "" : "Hai conquistato lo spicchio «" + cat.name + "».") : pname(st.turn) + " ha risposto bene!") : "Risposta sbagliata. Tocca a " + pname(nextOf(st)) + ".";
    }
    var opts = qo.map(function (t, i) {
      var cls = "tv-opt", dis = "";
      if (reveal) { dis = " disabled"; if (i === st.reveal.correct) cls += " ok"; else if (i === st.reveal.picked) cls += " no"; }
      else if (!mine || S.answered === st.qid) { dis = " disabled"; if (S.answered === st.qid && S.pick === i) cls += " pick"; }
      return '<button type="button" class="' + cls + '" data-i="' + i + '"' + dis + '><b>' + "ABCD"[i] + '</b><span>' + esc(t) + "</span></button>";
    }).join("");
    var myTurn = mine && st.phase === "question";
    var bar = st.phase === "question"
      ? (mine ? '<div class="tv-turnbar me">TOCCA A TE!</div>' : '<div class="tv-turnbar watch">Tocca a <b>' + esc(pname(st.turn)) + "</b></div>")
      : '<div class="tv-turnbar ' + (st.reveal && st.reveal.ok ? "good" : "bad") + '">' + (st.reveal && st.reveal.ok ? "Risposta giusta!" : (st.reveal && st.reveal.picked === -1 ? "Tempo scaduto" : "Risposta sbagliata")) + "</div>";
    if (myTurn && S.buzz !== st.qid) { S.buzz = st.qid; try { if (navigator.vibrate) navigator.vibrate([220, 110, 220]); } catch (e) {} }
    var html = '<div class="tv-card tv-q' + (myTurn ? " mine" : (st.phase === "question" ? " watch" : "")) + '" style="--cc:' + cat.color + '">' + bar + '<div class="tv-qhead"><span class="tv-chip">' + esc(cat.name) + "</span>" +
      (st.final ? '<span class="tv-turn"><b>Domanda decisiva</b></span>' : "") + "</div>" +
      '<h2 class="tv-qt">' + esc(st.q && st.q.t) + "</h2>" +
      (st.phase === "question" && st.secs > 0 ? '<div class="tv-timer"><i style="animation-duration:' + st.secs + "s;animation-delay:-" + qElapsed(st.qid).toFixed(1) + 's"></i></div>' : "") +
      '<div class="tv-opts">' + opts + "</div>" +
      (msg ? '<p class="tv-msg" role="status">' + esc(msg) + "</p>" : (!mine && st.phase === "question" ? '<p class="tv-muted">Guarda le risposte e fai il tifo!</p>' : "")) + "</div>";
    if (S.role === "master") html += '<div class="tv-row">' + (st.phase === "reveal" ? '<button class="tv-btn" id="tv-skip" type="button">Continua</button>' : '<button class="tv-btn ghost" id="tv-skipq" type="button">Salta il turno</button>') + '<button class="tv-btn ghost" id="tv-stop" type="button">Termina partita</button></div>';
    return html + '<div class="tv-card"><p class="tv-label">Classifica spicchi</p>' + scoreboard(st, true) + "</div>";
  }
  var qSeen = {};
  function qElapsed(qid) { if (!qSeen[qid]) qSeen[qid] = Date.now(); return (Date.now() - qSeen[qid]) / 1000; }
  function nextOf(st) {
    var order = toArr(st.order), off = toArr(st.off), i = order.indexOf(st.turn), n = order.length;
    for (var k = 1; k <= n; k++) { var id = order[(i + k) % n]; if (off.indexOf(id) < 0) return id; }
    return st.turn;
  }
  function endView(st) {
    var html = '<div class="tv-card tv-end"><p class="tv-label">Partita finita</p><h2>Vince ' + esc(pname(st.winner)) + '!</h2><p class="tv-muted">Ha conquistato tutti gli spicchi e risposto alla domanda decisiva.</p></div>' +
      '<div class="tv-card">' + scoreboard(st, true) + "</div>";
    if (S.role === "master") html += '<div class="tv-row"><button class="tv-btn" id="tv-again" type="button">Nuova partita</button><button class="tv-btn ghost" id="tv-close" type="button">Chiudi la stanza</button></div>';
    else html += '<p class="tv-muted">Il master può avviare una nuova partita.</p>';
    return html;
  }
  function closedView() {
    shell('<div class="tv-card"><h2>La partita è terminata.</h2><p class="tv-muted">Il master ha chiuso la stanza.</p><button class="tv-btn" id="tv-home" type="button">Torna all’inizio</button></div>');
    $("#tv-home").addEventListener("click", function () { history.replaceState(null, "", location.pathname); goHome(); });
  }

  function changed() {
    if (S.role === "master") processActions();
    if (!S.role) return;
    if (S.loaded && !S.tree.meta) { var wasRole = S.role; cleanup(); if (wasRole === "player") closedView(); else goHome(); return; }
    render();
  }
  function render() {
    var st = S.tree.state || { phase: "lobby" }, pl = S.tree.players || {};
    var masterOff = false;
    if (S.role === "player") {
      var h = S.tree.hb, ms = S.masterSeen, now = Date.now();
      if (ms.n !== h) { S.masterSeen = { n: h, t: now }; } else if (now - ms.t > 40000) masterOff = true;
    }
    var sig = JSON.stringify([st, Object.keys(pl).map(function (i) { return [i, pl[i].name]; }), S.answered, S.net, masterOff, S.tree.meta && S.tree.meta.cats]);
    if (sig === S.sig) return; S.sig = sig;
    var body = st.phase === "question" || st.phase === "reveal" ? gameView(st) : st.phase === "end" ? endView(st) : lobbyView();
    S.view = st.phase === "lobby" ? "lobby" : "game";
    shell((masterOff ? '<div class="tv-banner warn">Il master sembra offline: aspetta qualche istante.</div>' : "") + body);
    bind(st);
  }
  function bind(st) {
    var g = function (id, fn) { var e = $(id); if (e) e.addEventListener("click", fn); };
    g("#tv-start", startGame); g("#tv-again", newGame); g("#tv-close", closeRoom);
    g("#tv-stop", function () { if (confirm("Terminare la partita e chiudere la stanza?")) closeRoom(); });
    g("#tv-skip", function () { next(S.m.cur && S.m.cur.ok); });
    g("#tv-skipq", function () { resolve(-1); });
    g("#tv-copy", function () { var l = location.origin + location.pathname + "?c=" + S.code; (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(function () { $("#tv-copy").textContent = "Link copiato"; }).catch(function () { prompt("Copia questo link:", l); }); });
    g("#tv-share", function () { navigator.share({ title: "Sfida a spicchi", text: "Gioca con me! Codice: " + S.code, url: location.origin + location.pathname + "?c=" + S.code }).catch(function () {}); });
    $$(".tv-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        if (st.phase !== "question" || st.turn !== S.me || S.answered === st.qid) return;
        var i = +b.dataset.i; S.answered = st.qid; S.pick = i;
        if (S.role === "master") resolve(i);
        else put("/actions/" + rid(), { pid: S.me, qid: st.qid, idx: i });
        S.sig = ""; render();
      });
    });
  }
  window.addEventListener("beforeunload", function () { if (S.es) S.es.close(); });
  goHome();
})();
