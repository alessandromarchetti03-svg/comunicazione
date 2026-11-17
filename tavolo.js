/* Sfida a spicchi — gioco a quiz multigiocatore.
   Il master ospita la partita sul suo telefono; i giocatori si collegano col codice o il QR.
   Lo scambio dei dati usa un piccolo database in tempo reale (vedi tavolo-config.js).
   Nessun account, nessun cookie: nome e punteggi esistono solo finché il master non chiude la stanza. */
(function () {
  "use strict";
  var CATS = window.TAVOLO_CATS || [], BANK = window.TAVOLO_Q || {}, CFG = window.TAVOLO_CONFIG || {};
  var DB = (CFG.db || "").replace(/\/$/, "");
  var MODE = window.TAVOLO_MODE === "bs" ? "bs" : window.TAVOLO_MODE === "bd" ? "bd" : window.TAVOLO_MODE === "cah" ? "cah" : "quiz";
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
  var BS = window.TAVOLO_BS || { cats: [], Q: {}, names: { f: [], m: [] } }, LOCALCN = null;
  var BD = window.TAVOLO_BD || { cats: [] }, CAH = window.TAVOLO_CAH || { black: [], white: [] };
  function bsCat(id) { return BS.cats.concat(BD.cats).filter(function (c) { return c.id === id; })[0]; }
  function catById(id) {
    var b = bsCat(id);
    if (b) { var cn = LOCALCN || (S.tree && S.tree.meta && S.tree.meta.cn) || {}; return { id: id, name: cn[id] || "Baby shower", color: b.color }; }
    var cn2 = LOCALCN || (S.tree && S.tree.meta && S.tree.meta.cn);
    if (cn2 && cn2[id]) return { id: id, name: cn2[id], color: { bda: "#fdc93c", bdb: "#e0527a", bdc: "#5aaee8", bdd: "#5fd08b", bde: "#a78bfa" }[id] || "#888" };
    return id === "noi" ? NOI : (CATS.filter(function (c) { return c.id === id; })[0] || { id: id, name: id, color: "#888" }); }

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
      '<button class="tv-big" id="tv-new" type="button"><b>' + (MODE === "bs" || MODE === "bd" ? "Crea la festa" : "Crea una partita") + '</b><span>' + (MODE === "bs" ? "Sei il master: scrivi i nomi, scegli le categorie e invita gli ospiti." : MODE === "bd" ? "Sei il master: imposta gli anni del festeggiato, le categorie e invita gli ospiti." : MODE === "cah" ? "Sei il master: scegli i giri e invita gli amici (servono almeno 3 giocatori)." : "Sei il master: scegli le regole e invita gli amici.") + '</span></button>' +
      '<button class="tv-big alt" id="tv-join" type="button"><b>Entra con un codice</b><span>Hai ricevuto un codice o un QR? Entra qui.</span></button>' +
      '</div>');
    $("#tv-new").addEventListener("click", MODE === "bs" ? setupBS : MODE === "bd" ? setupBD : MODE === "cah" ? setupCAH : setup);
    $("#tv-join").addEventListener("click", function () { joinForm(""); });
  }
  function cleanup() {
    if (S.es) S.es.close(); S.es = null;
    clearInterval(S.hb); clearInterval(S.tick); if (S.m) clearTimeout(S.m.to);
    LOCALCN = null; S.role = null; S.code = null; S.me = null; S.tree = {}; S.m = null; S.answered = null; S.sig = ""; S.loaded = false;
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

  /* ---------- master: baby shower ---------- */
  var customBS = [];
  function others(pool, not, k) { return shuffle(pool.filter(function (n) { return n.toLowerCase() !== String(not).toLowerCase(); })).slice(0, k); }
  function bsLabel(id, n) {
    return { bmam: "Su mamma " + (n.m || "…"), bpap: "Su papà " + (n.p || "…"), bbim: "Aspettando " + (n.b || "il bebè"), bgra: "Gravidanza e nascita", bneo: "Neonati e bebè" }[id];
  }
  function bsTemplated(n) {
    var out = [], of = n.b ? "di " + n.b : "del bebè";
    out.push(["Chi è la mamma " + of + "?", n.m].concat(others(BS.names.f, n.m, 3)));
    out.push(["Chi è il papà " + of + "?", n.p].concat(others(BS.names.m, n.p, 3)));
    if (n.b) out.push(["Come si chiamerà il bebè in arrivo?", n.b].concat(others(BS.names.f.slice(0, 7).concat(BS.names.m.slice(0, 7)), n.b, 3)));
    return out;
  }
  function setupBS() {
    S.view = "setup"; customBS = [];
    shell(
      '<form class="tv-card" id="tv-form" autocomplete="off">' +
      '<h2>Baby shower</h2>' +
      '<p class="tv-muted">Scrivi i nomi, scegli le categorie e aggiungi le tue domande. Gli ospiti entrano col codice dal loro telefono: tutti rispondono a tutto, senza limite di tempo, e a ogni domanda si vedono le percentuali dei voti. Vince chi fa più punti.</p>' +
      '<label class="tv-label" for="tv-bm">Nome della mamma</label><input class="tv-in" id="tv-bm" maxlength="16" placeholder="Es. Michela">' +
      '<label class="tv-label" for="tv-bp">Nome del papà</label><input class="tv-in" id="tv-bp" maxlength="16" placeholder="Es. Luca">' +
      '<label class="tv-label" for="tv-bb">Nome del bebè (facoltativo)</label><input class="tv-in" id="tv-bb" maxlength="16" placeholder="Se non lo sapete ancora, lascia vuoto">' +
      '<p class="tv-label">Categorie in gioco</p><div class="tv-checks">' +
      BS.cats.map(function (c) { return '<label class="tv-check" style="--cc:' + c.color + '"><input type="checkbox" name="cat" value="' + c.id + '" checked><span><span id="bl-' + c.id + '"></span> <em id="bn-' + c.id + '"></em></span></label>'; }).join("") +
      '</div>' +
      '<p class="tv-muted">«Su mamma» e «Su papà» si riempiono con le tue domande: scrivine almeno 3, meglio 7, perché in ogni partita si fanno 7 domande per categoria.</p>' +
      '<details class="tv-det" open><summary>Le tue domande</summary>' +
      '<label class="tv-label" for="tv-bc">Categoria</label><select class="tv-in" id="tv-bc"></select>' +
      '<input class="tv-in" id="tv-cq" maxlength="140" placeholder="Domanda">' +
      '<input class="tv-in" id="tv-c0" maxlength="60" placeholder="Risposta giusta">' +
      '<input class="tv-in" id="tv-c1" maxlength="60" placeholder="Risposta sbagliata 1">' +
      '<input class="tv-in" id="tv-c2" maxlength="60" placeholder="Risposta sbagliata 2 (facoltativa)">' +
      '<input class="tv-in" id="tv-c3" maxlength="60" placeholder="Risposta sbagliata 3 (facoltativa)">' +
      '<button class="tv-btn ghost" id="tv-cadd" type="button">Aggiungi domanda</button><ul class="tv-clist" id="tv-clist"></ul></details>' +
      '<label class="tv-label" for="tv-secs">Tempo per rispondere</label>' +
      '<select id="tv-secs" class="tv-in"><option value="20">20 secondi</option><option value="30" selected>30 secondi</option><option value="45">45 secondi</option><option value="60">60 secondi</option><option value="0">Senza limite</option></select>' +
      '<label class="tv-check solo"><input type="checkbox" id="tv-hp" checked><span>Gioco anch’io, su questo dispositivo</span></label>' +
      '<input class="tv-in" id="tv-hname" maxlength="16" placeholder="Il tuo nome" aria-label="Il tuo nome">' +
      '<p class="tv-err" id="tv-err" role="alert"></p>' +
      '<div class="tv-row"><button class="tv-btn" type="submit">Crea partita</button><button class="tv-btn ghost" id="tv-back" type="button">Indietro</button></div>' +
      '</form>');
    function nm() { return { m: $("#tv-bm").value.trim(), p: $("#tv-bp").value.trim(), b: $("#tv-bb").value.trim() }; }
    function count(id) { return customBS.filter(function (x) { return x.c === id; }).length; }
    function draw() {
      var n = nm(), sel = $("#tv-bc").value;
      $("#tv-bc").innerHTML = BS.cats.map(function (c) { return '<option value="' + c.id + '">' + esc(bsLabel(c.id, n)) + "</option>"; }).join("");
      if (sel) $("#tv-bc").value = sel;
      BS.cats.forEach(function (c) {
        var only = c.id === "bmam" || c.id === "bpap", k = count(c.id), box = $('input[value="' + c.id + '"]');
        $("#bl-" + c.id).textContent = bsLabel(c.id, n);
        $("#bn-" + c.id).textContent = only ? (k >= 3 ? "(" + k + " domande)" : "(" + k + "/3 domande)") : (k ? "(+" + k + " tue)" : "");
        if (only) { box.disabled = k < 3; if (k < 3) box.checked = false; else if (!box.dataset.t) { box.checked = true; box.dataset.t = "1"; } }
      });
      $("#tv-clist").innerHTML = customBS.map(function (x, i) { return "<li><b>" + esc(bsLabel(x.c, n)) + ":</b> " + esc(x.q[0]) + ' <button type="button" class="tv-x" data-i="' + i + '" aria-label="Elimina">✕</button></li>'; }).join("");
    }
    draw();
    ["tv-bm", "tv-bp", "tv-bb"].forEach(function (i) { $("#" + i).addEventListener("input", draw); });
    $("#tv-clist").addEventListener("click", function (e) { var b = e.target.closest(".tv-x"); if (b) { customBS.splice(+b.dataset.i, 1); draw(); } });
    $("#tv-cadd").addEventListener("click", function () {
      var q = $("#tv-cq").value.trim(), r = $("#tv-c0").value.trim(), w = [1, 2, 3].map(function (i) { return $("#tv-c" + i).value.trim(); }).filter(Boolean);
      if (!q || !r || !w.length) { $("#tv-err").textContent = "Servono la domanda, la risposta giusta e almeno una sbagliata."; return; }
      $("#tv-err").textContent = ""; customBS.push({ c: $("#tv-bc").value, q: [q, r].concat(w) });
      ["cq", "c0", "c1", "c2", "c3"].forEach(function (k) { $("#tv-" + k).value = ""; }); draw();
    });
    $("#tv-back").addEventListener("click", goHome);
    $("#tv-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var n = nm(), err = $("#tv-err");
      if (!n.m || !n.p) { err.textContent = "Scrivi il nome della mamma e quello del papà."; return; }
      var sel = $$('input[name="cat"]:checked').map(function (i) { return i.value; });
      if (!sel.length) { err.textContent = "Scegli almeno una categoria."; return; }
      var hp = $("#tv-hp").checked, hn = $("#tv-hname").value.trim();
      if (hp && !hn) { err.textContent = "Scrivi il tuo nome, oppure togli la spunta."; return; }
      var banks = {}, cn = {};
      sel.forEach(function (id) {
        banks[id] = (BS.Q[id] || []).concat(id === "bbim" ? bsTemplated(n) : [], customBS.filter(function (x) { return x.c === id; }).map(function (x) { return x.q; }));
        cn[id] = bsLabel(id, n);
      });
      createRoom({ cats: sel, secs: +$("#tv-secs").value, hostName: hp ? hn : "", cn: cn, banks: banks, bs: { m: n.m, p: n.p, b: n.b } });
    });
  }

  /* ---------- master: festa di compleanno ---------- */
  function bdParse(str, age, fname) {
    var m = /^(?:(\d+)-(\d+)>)?(=)?([\s\S]*)$/.exec(str), p = m[4].split("|").map(function (x) { return x.replace(/\{n\}/g, fname).replace(/\{a\}/g, age).trim(); });
    if (m[1] && (age < +m[1] || age > +m[2])) return null;
    return m[3] ? { t: p[0], r: p[1], o: p.slice(1).filter(Boolean) } : { t: p[0], r: null, o: p.slice(1).filter(Boolean) };
  }
  function bdBanks(m, fname) {
    var age = m.bd.age, year = new Date().getFullYear(), out = {};
    var src = { bda: BD.A || [], bdb: BD.B || [], bdc: BD.C || [], bde: BD.E || [] };
    Object.keys(src).forEach(function (id) { out[id] = src[id].map(function (x) { return bdParse(x, age, fname); }).filter(Boolean); });
    out.bdd = (BD.gen ? BD.gen(age, year - age, year) : []).map(function (q) { return toItem(q.map(function (x) { return String(x).replace(/\{n\}/g, fname); })); });
    (m.bd.customs || []).forEach(function (x) {
      if (!out[x.c]) return;
      out[x.c].push(x.self ? { t: x.q[0], r: null, o: x.q.slice(1) } : toItem(x.q));
    });
    return out;
  }
  function setupBD() {
    S.view = "setup"; var customBD = [];
    shell(
      '<form class="tv-card" id="tv-form" autocomplete="off">' +
      '<h2>Festa di compleanno</h2>' +
      '<p class="tv-muted">Il festeggiato risponde in segreto alle domande su di lui e gli invitati cercano di indovinare. Tutti votano dal telefono, senza limite di tempo; a ogni domanda si vedono le percentuali.</p>' +
      '<label class="tv-label" for="tv-age">Quanti anni compie?</label><input class="tv-in" id="tv-age" type="number" inputmode="numeric" min="1" max="110" placeholder="Es. 30">' +
      '<p class="tv-label">Categorie in gioco</p><div class="tv-checks">' +
      BD.cats.map(function (c) { return '<label class="tv-check" style="--cc:' + c.color + '"><input type="checkbox" name="cat" value="' + c.id + '"' + (c.id === "bdb" ? "" : " checked") + '><span><span id="bl-' + c.id + '">' + esc(c.name) + '</span> <em>' + esc(c.sub || "") + '</em></span></label>'; }).join("") +
      '</div>' +
      '<label class="tv-check solo" id="tv-adultbox" hidden><input type="checkbox" id="tv-adult"><span>Confermo che tutti i presenti sono maggiorenni: le domande «Esplicite» sono per adulti.</span></label>' +
      '<details class="tv-det"><summary>Le tue domande</summary>' +
      '<label class="tv-label" for="tv-bc">Categoria</label><select class="tv-in" id="tv-bc">' + BD.cats.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + "</option>"; }).join("") + '</select>' +
      '<label class="tv-label" for="tv-kind">Tipo di domanda</label><select class="tv-in" id="tv-kind"><option value="self">Sul festeggiato: risponde lui, gli altri indovinano</option><option value="fact">Con una risposta giusta</option></select>' +
      '<input class="tv-in" id="tv-cq" maxlength="140" placeholder="Domanda">' +
      '<input class="tv-in" id="tv-c0" maxlength="60"><input class="tv-in" id="tv-c1" maxlength="60"><input class="tv-in" id="tv-c2" maxlength="60"><input class="tv-in" id="tv-c3" maxlength="60">' +
      '<button class="tv-btn ghost" id="tv-cadd" type="button">Aggiungi domanda</button><ul class="tv-clist" id="tv-clist"></ul></details>' +
      '<label class="tv-label" for="tv-hr">Tu, che sei il master</label><select class="tv-in" id="tv-hr"><option value="">Non gioco, gestisco soltanto</option><option value="f">Sono il festeggiato</option><option value="i">Gioco come invitato</option></select>' +
      '<input class="tv-in" id="tv-hname" maxlength="16" placeholder="Il tuo nome" aria-label="Il tuo nome" hidden>' +
      '<p class="tv-err" id="tv-err" role="alert"></p>' +
      '<div class="tv-row"><button class="tv-btn" type="submit">Crea partita</button><button class="tv-btn ghost" id="tv-back" type="button">Indietro</button></div>' +
      '</form>');
    function ageNow() { return parseInt($("#tv-age").value, 10) || 0; }
    function draw() {
      var a = ageNow(); $("#bl-bda").textContent = a ? "I " + a + " anni" : "Gli anni che compie";
      var box = $('input[value="bdb"]'); box.disabled = a > 0 && a < 18; if (box.disabled) box.checked = false;
      $("#tv-adultbox").hidden = !box.checked;
      var self = $("#tv-kind").value === "self";
      $("#tv-c0").placeholder = self ? "Opzione 1" : "Risposta giusta"; $("#tv-c1").placeholder = self ? "Opzione 2" : "Risposta sbagliata 1";
      $("#tv-c2").placeholder = self ? "Opzione 3 (facoltativa)" : "Risposta sbagliata 2 (facoltativa)"; $("#tv-c3").placeholder = self ? "Opzione 4 (facoltativa)" : "Risposta sbagliata 3 (facoltativa)";
      $("#tv-hname").hidden = !$("#tv-hr").value;
      $("#tv-clist").innerHTML = customBD.map(function (x, i) { var c = BD.cats.filter(function (k) { return k.id === x.c; })[0]; return "<li><b>" + esc(c ? c.name : "") + ":</b> " + esc(x.q[0]) + ' <button type="button" class="tv-x" data-i="' + i + '" aria-label="Elimina">✕</button></li>'; }).join("");
    }
    draw();
    ["tv-age", "tv-kind", "tv-hr"].forEach(function (i) { $("#" + i).addEventListener("input", draw); });
    $$('input[name="cat"]').forEach(function (b) { b.addEventListener("change", draw); });
    $("#tv-clist").addEventListener("click", function (e) { var b = e.target.closest(".tv-x"); if (b) { customBD.splice(+b.dataset.i, 1); draw(); } });
    $("#tv-cadd").addEventListener("click", function () {
      var self = $("#tv-kind").value === "self", q = $("#tv-cq").value.trim(), o = [0, 1, 2, 3].map(function (i) { return $("#tv-c" + i).value.trim(); }).filter(Boolean);
      if (!q || o.length < 2) { $("#tv-err").textContent = self ? "Servono la domanda e almeno 2 opzioni." : "Servono la domanda, la risposta giusta e almeno una sbagliata."; return; }
      if (!self && !$("#tv-c0").value.trim()) { $("#tv-err").textContent = "Scrivi la risposta giusta nel primo campo."; return; }
      $("#tv-err").textContent = ""; customBD.push({ c: $("#tv-bc").value, self: self, q: [q].concat(o) });
      ["cq", "c0", "c1", "c2", "c3"].forEach(function (k) { $("#tv-" + k).value = ""; }); draw();
    });
    $("#tv-back").addEventListener("click", goHome);
    $("#tv-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("#tv-err"), a = ageNow();
      if (a < 1 || a > 110) { err.textContent = "Scrivi quanti anni compie il festeggiato (da 1 a 110)."; return; }
      var sel = $$('input[name="cat"]:checked').map(function (i) { return i.value; });
      if (!sel.length) { err.textContent = "Scegli almeno una categoria."; return; }
      if (sel.indexOf("bdb") >= 0 && !$("#tv-adult").checked) { err.textContent = "Per le domande «Esplicite» conferma che tutti sono maggiorenni."; return; }
      var hr = $("#tv-hr").value, hn = $("#tv-hname").value.trim();
      if (hr && !hn) { err.textContent = "Scrivi il tuo nome, oppure scegli «Non gioco»."; return; }
      var cn = {}; sel.forEach(function (id) { var c = BD.cats.filter(function (k) { return k.id === id; })[0]; cn[id] = id === "bda" ? "I " + a + " anni" : c.name; });
      createRoom({ cats: sel, secs: 0, hostName: hr ? hn : "", hostRole: hr || null, cn: cn, bd: { age: a, customs: customBD } });
    });
  }

  /* ---------- Senza vergogna: gioco di carte 18+ ---------- */
  function cahW() { return CAH.white.concat(toArr(S.tree.meta && S.tree.meta.cw)); }
  function cahB() { return CAH.black.concat(toArr(S.tree.meta && S.tree.meta.cb)); }
  function mapOf(o) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = true; }); return r; }
  function cahDraw(m) { if (!m.deck.length) { m.deck = shuffle(m.disc); m.disc = []; } return m.deck.pop(); }
  function setupCAH() {
    S.view = "setup";
    shell(
      '<form class="tv-card" id="tv-form" autocomplete="off">' +
      '<p class="tv-label">Vietato ai minori di 18 anni</p><h2>Senza vergogna</h2>' +
      '<p class="tv-muted">Ogni turno uno di voi fa il lettore: legge la carta nera, gli altri scelgono una carta bianca per completarla. Poi si votano le risposte, senza poter votare la propria. Linguaggio esplicito e humour nero.</p>' +
      '<label class="tv-label" for="tv-giri">Quanti giri?</label><select class="tv-in" id="tv-giri"><option value="1">1 giro: ognuno legge una volta</option><option value="2">2 giri</option><option value="3">3 giri</option></select>' +
      '<details class="tv-det"><summary>Aggiungi carte tue (facoltativo)</summary>' +
      '<p class="tv-muted">Una per riga. Nelle carte nere scrivi «_____» dove va la risposta.</p>' +
      '<label class="tv-label" for="tv-cb">Carte nere</label><textarea class="tv-in" id="tv-cb" rows="3" maxlength="1500" placeholder="Il regalo peggiore per Marco: _____"></textarea>' +
      '<label class="tv-label" for="tv-cw">Carte bianche</label><textarea class="tv-in" id="tv-cw" rows="4" maxlength="2000" placeholder="La macchina di Luca"></textarea></details>' +
      '<label class="tv-check solo"><input type="checkbox" id="tv-hp" checked><span>Gioco anch’io, su questo dispositivo</span></label>' +
      '<input class="tv-in" id="tv-hname" maxlength="16" placeholder="Il tuo nome" aria-label="Il tuo nome">' +
      '<label class="tv-check solo"><input type="checkbox" id="tv-adult"><span>Confermo di essere maggiorenne e che tutti i presenti hanno almeno 18 anni.</span></label>' +
      '<p class="tv-err" id="tv-err" role="alert"></p>' +
      '<div class="tv-row"><button class="tv-btn" type="submit">Crea partita</button><button class="tv-btn ghost" id="tv-back" type="button">Indietro</button></div></form>');
    $("#tv-back").addEventListener("click", goHome);
    $("#tv-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("#tv-err"), hp = $("#tv-hp").checked, hn = $("#tv-hname").value.trim();
      if (!$("#tv-adult").checked) { err.textContent = "Conferma che tutti i presenti sono maggiorenni."; return; }
      if (hp && !hn) { err.textContent = "Scrivi il tuo nome, oppure togli la spunta."; return; }
      function lines(id, max) { return $(id).value.split("\n").map(function (x) { return x.trim().slice(0, max); }).filter(Boolean).slice(0, 30); }
      var cb = lines("#tv-cb", 140).filter(function (x) { return /_{3,}/.test(x) || /\?/.test(x); }), cw = lines("#tv-cw", 80);
      createRoom({ cats: [], secs: 0, hostName: hp ? hn : "", cah: { giri: +$("#tv-giri").value, cb: cb, cw: cw } });
    });
  }
  function startCAH(ids) {
    var m = S.m, W = cahW(), B = cahB();
    m.order = ids; m.wedges = {}; m.score = {}; ids.forEach(function (i) { m.score[i] = 0; });
    m.deck = shuffle(range(W.length)); m.disc = []; m.bdeck = shuffle(range(B.length)); m.hands = {}; m.ri = -1; m.cur = null;
    ids.forEach(function (id) { m.hands[id] = []; for (var k = 0; k < 7; k++) m.hands[id].push(cahDraw(m)); });
    put("/hands", m.hands); del("/priv"); del("/mine");
    put("/meta/status", "playing");
    cahNext();
  }
  function cahNext() {
    var m = S.m; clearTimeout(m.to); m.ri++;
    var n = m.order.length, total = n * (m.cah.giri || 1), tries = 0, rd;
    while (tries < n && m.off.indexOf(m.order[m.ri % n]) >= 0) { m.ri++; tries++; }
    if (m.ri >= total) return cahEnd();
    rd = m.order[m.ri % n];
    if (!m.bdeck.length) m.bdeck = shuffle(range(cahB().length));
    m.cur = { qid: rid(), reader: rd, black: m.bdeck.pop(), picks: {}, votes: {}, subs: null, stage: "p" };
    del("/priv"); del("/mine");
    publish({ phase: "cp", qid: m.cur.qid, reader: rd, black: m.cur.black, rn: m.ri + 1, rt: total, picked: null, voted: null, answers: null, reveal: null, scores: m.score, winners: null });
  }
  function cahAct(x) {
    var m = S.m, c = m.cur; if (!c || x.qid !== c.qid) return;
    if (x.t === "pick") cahPick(x.pid, +x.card);
    else if (x.t === "show") { if (x.pid === c.reader) cahShow(); }
    else if (x.t === "vote") cahVote(x.pid, +x.idx);
  }
  function cahPick(pid, card) {
    var m = S.m, c = m.cur;
    if (!c || c.stage !== "p" || pid === c.reader || c.picks[pid] !== undefined || !(S.tree.players || {})[pid]) return;
    var h = m.hands[pid], pos = h ? h.indexOf(card) : -1; if (pos < 0) return;
    c.picks[pid] = card; h.splice(pos, 1); h.push(cahDraw(m));
    put("/hands/" + pid, h); put("/mine/" + pid, c.qid + ":" + card);
    publish({ picked: mapOf(c.picks) }); cahCheck();
  }
  function cahOnline(m, skipReader) {
    return m.order.filter(function (id) { return m.off.indexOf(id) < 0 && !(skipReader && id === m.cur.reader); });
  }
  function cahCheck() {
    var m = S.m, c = m && m.cur; if (!c) return;
    if (c.stage === "p") { var need = cahOnline(m, true); if (need.length && need.every(function (id) { return c.picks[id] !== undefined; })) cahRead(); }
    else if (c.stage === "v") { var nv = cahOnline(m, false); if (nv.length && nv.every(function (id) { return c.votes[id] !== undefined; })) cahReveal(); }
  }
  function cahRead() {
    var m = S.m, c = m.cur, ids = shuffle(Object.keys(c.picks));
    if (!ids.length) return cahNext();
    c.stage = "r"; c.subs = ids.map(function (p) { return { pid: p, card: c.picks[p] }; });
    put("/priv", { to: c.reader, qid: c.qid, a: c.subs.map(function (s) { return s.card; }) });
    publish({ phase: "cr" });
  }
  function cahShow() {
    var m = S.m, c = m.cur; if (!c || c.stage !== "r") return;
    c.stage = "v"; del("/priv");
    publish({ phase: "cv", answers: c.subs.map(function (s) { return s.card; }), voted: null });
  }
  function cahVote(pid, idx) {
    var m = S.m, c = m.cur;
    if (!c || c.stage !== "v" || c.votes[pid] !== undefined || !(S.tree.players || {})[pid] || !c.subs[idx] || c.subs[idx].pid === pid) return;
    c.votes[pid] = idx; publish({ voted: mapOf(c.votes) }); cahCheck();
  }
  function cahReveal() {
    var m = S.m, c = m.cur; if (!c || c.stage !== "v") return; c.stage = "s";
    var cnt = c.subs.map(function () { return 0; }), win = [], best = 0;
    Object.keys(c.votes).forEach(function (v) { cnt[c.votes[v]]++; });
    cnt.forEach(function (x) { if (x > best) best = x; });
    cnt.forEach(function (x, i) { if (best > 0 && x === best) { win.push(i); m.score[c.subs[i].pid]++; } });
    Object.keys(c.picks).forEach(function (p) { m.disc.push(c.picks[p]); });
    publish({ phase: "cs", reveal: { authors: c.subs.map(function (s) { return s.pid; }), votes: cnt, win: win }, scores: m.score });
    m.to = setTimeout(cahNext, 12000);
  }
  function cahForce() {
    var m = S.m, c = m.cur; if (!c) return;
    if (c.stage === "p") cahRead(); else if (c.stage === "r") cahShow(); else if (c.stage === "v") cahReveal(); else cahNext();
  }
  function cahEnd() {
    var m = S.m, best = -1, w = {}; m.cur = null;
    m.order.forEach(function (id) { if (m.score[id] > best) best = m.score[id]; });
    m.order.forEach(function (id) { if (m.score[id] === best) w[id] = true; });
    publish({ phase: "cend", scores: m.score, winners: w, reveal: null, voted: null, answers: null });
    put("/meta/status", "ended");
  }
  function cahSend(a, st) {
    a.pid = S.me; a.qid = st.qid;
    if (S.role === "master") cahAct(a); else put("/actions/" + rid(), a);
    S.sig = ""; render();
  }
  function cahBlack(st) {
    var t = esc(cahB()[st.black] || "").replace(/_{3,}/g, '<span class="cah-blank"></span>');
    return '<div class="cah-black"><p>' + t + '</p><small>Turno ' + st.rn + " di " + st.rt + " · Lettore: <b>" + esc(pname(st.reader)) + (st.reader === S.me ? " (tu)" : "") + "</b></small></div>";
  }
  function cahChips(ids, done, off) {
    return '<div class="tv-vchips">' + ids.map(function (id) { return '<span class="tv-vchip' + (done[id] ? " on" : "") + (off.indexOf(id) >= 0 ? " off" : "") + '">' + esc(pname(id)) + (done[id] ? " ✓" : "") + "</span>"; }).join("") + "</div>";
  }
  function cahScore(st, final) {
    var sc = st.scores || {}, pl = S.tree.players || {}, w = st.winners || {}, off = toArr(st.off);
    var ids = Object.keys(pl).sort(function (a, b) { return (sc[b] || 0) - (sc[a] || 0) || (pl[a].t || 0) - (pl[b].t || 0); });
    return '<ul class="tv-score">' + ids.map(function (id, i) {
      return '<li class="' + (final && w[id] ? "turn " : "") + (off.indexOf(id) >= 0 ? "off" : "") + '"><span class="tv-rank">' + (i + 1) + '</span><span class="tv-pn">' + esc(pl[id].name) + (id === S.me ? " (tu)" : "") + (off.indexOf(id) >= 0 ? " · offline" : "") + '</span><span class="tv-pc">' + (sc[id] || 0) + "</span></li>";
    }).join("") + "</ul>";
  }
  function cahView(st) {
    if (st.phase === "cend") {
      var pl0 = S.tree.players || {}, wn = Object.keys(st.winners || {}).map(function (i) { return pl0[i] ? pl0[i].name : "?"; });
      var h0 = '<div class="tv-card tv-end"><p class="tv-label">Partita finita</p><h2>' + (wn.length === 1 ? "Vince " + esc(wn[0]) + "!" : "Pari merito: " + esc(wn.join(" e ")) + "!") + '</h2><p class="tv-muted">Il più divertente, o il più depravato, della serata.</p></div><div class="tv-card"><p class="tv-label">Classifica</p>' + cahScore(st, true) + "</div>";
      if (S.role === "master") h0 += '<div class="tv-row"><button class="tv-btn" id="tv-again" type="button">Nuova partita</button><button class="tv-btn ghost" id="tv-close" type="button">Chiudi la stanza</button></div>';
      return h0 + '<p class="tv-muted">Il master può avviare una nuova partita.</p>';
    }
    if (S.selQ !== st.qid) { S.selQ = st.qid; S.sel = null; S.vsel = null; }
    var W = cahW(), pl = S.tree.players || {}, off = toArr(st.off), rd = st.reader, isR = !!S.me && S.me === rd;
    var ids = Object.keys(pl).sort(function (a, b) { return (pl[a].t || 0) - (pl[b].t || 0); }), pickers = ids.filter(function (i) { return i !== rd; });
    var mine = S.tree.mine && S.me ? String(S.tree.mine[S.me] || "") : "", mineQ = mine.split(":")[0] === st.qid, mineCard = mineQ ? +mine.split(":")[1] : -1;
    var html = '<div class="tv-card cah-card">', bar = "", body = "";
    if (st.phase === "cp") {
      var picked = st.picked || {};
      if (isR) { bar = '<div class="tv-turnbar me">SEI IL LETTORE</div>'; body = '<p class="tv-muted">Leggi ad alta voce la carta nera. Gli altri scelgono la risposta: ' + Object.keys(picked).length + " su " + pickers.length + ".</p>" + cahChips(pickers, picked, off); }
      else if (!S.me) { bar = '<div class="tv-turnbar watch">Scelgono: <b>' + Object.keys(picked).length + "</b> su " + pickers.length + "</div>"; body = cahChips(pickers, picked, off); }
      else if (mineQ) { bar = '<div class="tv-turnbar watch">Risposta inviata ✓</div>'; body = '<p class="tv-muted">Aspetto gli altri…</p>' + cahChips(pickers, picked, off); }
      else {
        bar = '<div class="tv-turnbar me">SCEGLI LA RISPOSTA</div>';
        var hand = toArr((S.tree.hands || {})[S.me]);
        body = '<div class="cah-hand">' + hand.map(function (c) { return '<button type="button" class="cah-white' + (S.sel === c ? " sel" : "") + '" data-c="' + c + '">' + esc(W[c] || "") + "</button>"; }).join("") + "</div>" +
          '<div class="tv-row"><button class="tv-btn" id="cah-send" type="button"' + (S.sel == null ? " disabled" : "") + ">Invia questa risposta</button></div>";
      }
    } else if (st.phase === "cr") {
      var pv = S.tree.priv;
      if (isR) {
        bar = '<div class="tv-turnbar me">LEGGI LE RISPOSTE</div>';
        body = pv && pv.qid === st.qid ? '<p class="tv-muted">Leggile ad alta voce, una alla volta. Gli altri non le vedono ancora.</p><div class="cah-hand">' + toArr(pv.a).map(function (c, i) { return '<div class="cah-white"><b>' + (i + 1) + ".</b> " + esc(W[c] || "") + "</div>"; }).join("") + '</div><div class="tv-row"><button class="tv-btn" id="cah-show" type="button">Ho letto tutto: mostra a tutti</button></div>' : '<p class="tv-muted">Carico le risposte…</p>';
      } else { bar = '<div class="tv-turnbar watch"><b>' + esc(pname(rd)) + "</b> sta leggendo le risposte</div>"; body = '<p class="tv-muted">Ascolta bene: tra poco le vedrai e potrai votare.</p>'; }
    } else if (st.phase === "cv") {
      var ans = toArr(st.answers), voted = st.voted || {}, iVoted = !!voted[S.me] || S.cv === st.qid;
      bar = !S.me ? '<div class="tv-turnbar watch">Votano: <b>' + Object.keys(voted).length + "</b> su " + ids.length + "</div>" : (iVoted ? '<div class="tv-turnbar watch">Voto inviato ✓</div>' : '<div class="tv-turnbar me">VOTA LA PIÙ DIVERTENTE</div>');
      body = '<div class="cah-hand">' + ans.map(function (c, i) {
        var own = mineQ && c === mineCard, dis = !S.me || iVoted || own;
        return '<button type="button" class="cah-white cah-ans' + (S.vsel === i ? " sel" : "") + (own ? " own" : "") + '" data-v="' + i + '"' + (dis ? " disabled" : "") + ">" + esc(W[c] || "") + (own ? ' <small class="tv-you">la tua carta</small>' : "") + "</button>";
      }).join("") + "</div>" + (S.me && !iVoted ? '<div class="tv-row"><button class="tv-btn" id="cah-vote" type="button"' + (S.vsel == null ? " disabled" : "") + ">Vota questa</button></div><p class=\"tv-muted\">Non puoi votare la tua carta.</p>" : cahChips(ids, voted, off));
    } else {
      var rv = st.reveal || {}, au = toArr(rv.authors), vo = toArr(rv.votes), wi = toArr(rv.win), an = toArr(st.answers);
      bar = '<div class="tv-turnbar good">' + (wi.length ? (wi.length > 1 ? "Pareggio! Vincono in " + wi.length : "Vince " + esc(pname(au[wi[0]]))) : "Nessun voto") + "</div>";
      body = '<div class="cah-hand">' + an.map(function (c, i) { return '<div class="cah-white' + (wi.indexOf(i) >= 0 ? " win" : "") + '">' + esc(W[c] || "") + '<small class="tv-you">' + esc(pname(au[i])) + " · " + (vo[i] || 0) + (vo[i] === 1 ? " voto" : " voti") + (wi.indexOf(i) >= 0 ? " · +1 punto" : "") + "</small></div>"; }).join("") + "</div>";
    }
    html += bar + cahBlack(st) + body + "</div>";
    if (S.role === "master") html += '<div class="tv-row">' + (st.phase === "cs" ? '<button class="tv-btn" id="tv-skip" type="button">Continua</button>' : '<button class="tv-btn ghost" id="tv-skipq" type="button">Passa avanti</button>') + '<button class="tv-btn ghost" id="tv-stop" type="button">Termina partita</button></div>';
    return html + '<div class="tv-card"><p class="tv-label">Punteggi</p>' + cahScore(st, false) + "</div>";
  }

  /* ---------- master: stanza ---------- */
  function createRoom(set) {
    var btn = $("#tv-form button[type=submit]"); if (btn) btn.disabled = true;
    (function attempt(n) {
      var c = randCode();
      req("GET", c, "/meta").then(function (ex) {
        if (ex && n < 8) return attempt(n + 1);
        S.code = c; S.role = "master"; S.me = set.hostName ? "host" : null; S.name = set.hostName; LOCALCN = set.cn || null;
        var room = { meta: { created: Date.now(), status: "lobby", secs: set.secs, cats: set.cats, cn: set.cn || null, bs: set.bs || null, bd: set.bd ? { age: set.bd.age } : null, cah: set.cah ? { giri: set.cah.giri } : null, cw: set.cah && set.cah.cw.length ? set.cah.cw : null, cb: set.cah && set.cah.cb.length ? set.cah.cb : null }, state: { phase: "lobby" }, hb: 0 };
        if (set.hostName) room.players = { host: { name: set.hostName, t: Date.now(), n: 0, role: set.hostRole || null } };
        return req("PUT", c, "", room).then(function () {
          S.m = { set: set, secs: set.secs, cats: set.cats.map(catById), custom: custom.slice(), banks: set.banks || null, bs: !!(set.bs || set.bd), bd: set.bd || null, cah: set.cah || null, seen: {}, off: [], wedges: {}, order: [], ti: 0, state: { phase: "lobby" } };
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
    if (m.cah) { if (ids.length < 3) return; return startCAH(ids); }
    if (m.bd) { var nf = ids.filter(function (i) { return pl[i].role === "f"; }).length; if (nf !== 1) return; }
    if (m.bs) return startBS(ids);
    m.order = ids; m.ti = 0; m.wedges = {}; ids.forEach(function (i) { m.wedges[i] = []; });
    m.pools = {};
    m.cats.forEach(function (c) { var arr = (m.banks && m.banks[c.id]) || (c.id === "noi" ? m.custom : BANK[c.id]); m.pools[c.id] = { arr: arr, idx: shuffle(range(arr.length)), p: 0 }; });
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
  /* baby shower: tutti rispondono a tutto, 7 domande per categoria, vince chi ha più punti */
  function toItem(q) { return { t: q[0], r: q[1], o: [q[1]].concat(q.slice(2).filter(Boolean)) }; }
  function startBS(ids) {
    var m = S.m, pl = S.tree.players || {};
    m.fid = null; ids.forEach(function (i) { if (pl[i].role === "f") m.fid = i; });
    m.order = ids; m.wedges = {}; m.score = {}; ids.forEach(function (i) { if (i !== m.fid) m.score[i] = 0; });
    m.plan = [];
    var banks = m.bd ? bdBanks(m, m.fid ? pl[m.fid].name : "il festeggiato") : null;
    m.cats.forEach(function (c) {
      var src = banks ? banks[c.id] : (m.banks[c.id] || []).map(toItem);
      var arr = shuffle(src).slice(0, 7);
      arr.forEach(function (it, i) { m.plan.push({ cat: c.id, it: it, i: i + 1, n: arr.length }); });
    });
    m.pi = -1; m.cur = null;
    put("/meta/status", "playing");
    askBS();
  }
  function askBS() {
    var m = S.m; clearTimeout(m.to); m.pi++;
    if (m.pi >= m.plan.length) return endBS();
    var p = m.plan[m.pi], it = p.it, opts = shuffle(it.o), self = it.r == null;
    m.cur = { qid: rid(), correct: self ? -1 : opts.indexOf(it.r), self: self, votes: {}, done: false };
    publish({ phase: "bq", qid: m.cur.qid, cat: p.cat, qn: m.pi + 1, qt: m.plan.length, ci: p.i, cn: p.n, q: { t: it.t, o: opts }, voted: null, scores: m.score, reveal: null, winners: null, self: self, fid: m.fid || null });
  }
  function bsVote(pid, idx) {
    var m = S.m, c = m && m.cur;
    if (!c || c.done || c.votes[pid] !== undefined || !(S.tree.players || {})[pid]) return;
    c.votes[pid] = idx;
    var v = {}; Object.keys(c.votes).forEach(function (k) { v[k] = true; });
    publish({ voted: v }); bsCheck();
  }
  function bsCheck() {
    var m = S.m, c = m && m.cur; if (!c || c.done) return;
    var need = m.order.filter(function (id) { return m.off.indexOf(id) < 0; });
    if (need.length && need.every(function (id) { return c.votes[id] !== undefined; })) bsReveal();
  }
  function bsReveal() {
    var m = S.m, c = m && m.cur; if (!c || c.done) return; c.done = true;
    var n = m.state.q ? toArr(m.state.q.o).length : 4, counts = [], right = {}, tot = 0;
    if (c.self) { var fv = c.votes[m.fid]; c.correct = typeof fv === "number" && fv >= 0 && fv < n ? fv : -1; }
    for (var i = 0; i < n; i++) counts.push(0);
    Object.keys(c.votes).forEach(function (pid) {
      if (pid === m.fid) return;
      var k = c.votes[pid]; if (k >= 0 && k < n) { counts[k]++; tot++; }
      if (c.correct >= 0 && k === c.correct) { m.score[pid] = (m.score[pid] || 0) + 1; right[pid] = true; }
    });
    publish({ phase: "br", reveal: { correct: c.correct, counts: counts, total: tot, right: right }, scores: m.score });
    m.to = setTimeout(askBS, 8000);
  }
  function endBS() {
    var m = S.m, best = -1, w = {}, ids = m.order.filter(function (id) { return id !== m.fid; });
    ids.forEach(function (id) { if (m.score[id] > best) best = m.score[id]; });
    ids.forEach(function (id) { if (m.score[id] === best) w[id] = true; });
    m.cur = null;
    publish({ phase: "bend", scores: m.score, winners: w, reveal: null, voted: null });
    put("/meta/status", "ended");
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
    if (JSON.stringify(off) !== JSON.stringify(m.off.slice().sort())) { m.off = off; if (m.state.phase !== "lobby") publish({}); else put("/state/off", off.length ? off : null); if (m.bs && m.state.phase === "bq") bsCheck(); if (m.cah && m.cur) cahCheck(); }
  }
  function processActions() {
    var a = S.tree.actions, m = S.m; if (!a || !m) return;
    Object.keys(a).forEach(function (k) {
      var x = a[k]; delete a[k]; del("/actions/" + k);
      if (m.cah) { if (x) cahAct(x); return; }
      if (m.bs) { if (x && m.cur && x.qid === m.cur.qid) bsVote(x.pid, +x.idx); return; }
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
      joinRoom(c, n).catch(function (ex) { b.disabled = false; if (ex && ex.needRole) return roleForm(c, n); if (ex && ex.needAdult) return adultForm(c, n); err.textContent = ex && ex.message && ex.message.indexOf("HTTP") < 0 && ex.message !== "Failed to fetch" ? ex.message : "Non riesco a collegarmi. Riprova."; });
    });
  }
  function adultForm(c, n) {
    S.view = "adult";
    shell('<div class="tv-card" id="tv-adultc"><p class="tv-label">Vietato ai minori di 18 anni</p><h2>Gioco per adulti</h2><p class="tv-muted">Questo gioco contiene linguaggio esplicito, humour nero e temi per adulti. Entra solo se hai almeno 18 anni.</p>' +
      '<p class="tv-err" id="tv-err" role="alert"></p><div class="tv-row"><button class="tv-btn" id="tv-yes" type="button">Ho almeno 18 anni, entra</button><button class="tv-btn ghost" id="tv-no" type="button">Esci</button></div></div>');
    $("#tv-no").addEventListener("click", function () { history.replaceState(null, "", location.pathname); goHome(); });
    $("#tv-yes").addEventListener("click", function () {
      $("#tv-yes").disabled = true;
      joinRoom(c, n, null, true).catch(function (ex) { $("#tv-yes").disabled = false; $("#tv-err").textContent = ex && ex.message && ex.message.indexOf("HTTP") < 0 && ex.message !== "Failed to fetch" ? ex.message : "Non riesco a collegarmi. Riprova."; });
    });
  }
  function roleForm(c, n) {
    S.view = "role";
    shell('<div class="tv-card" id="tv-role"><h2>Chi sei?</h2><p class="tv-muted">Ciao ' + esc(n) + ', scegli il tuo ruolo nella festa.</p>' +
      '<div class="tv-home"><button class="tv-big" data-r="f" type="button"><b>Sono il festeggiato</b><span>Rispondi alle domande su di te: gli altri cercano di indovinare.</span></button>' +
      '<button class="tv-big alt" data-r="i" type="button"><b>Sono un invitato</b><span>Cerca di indovinare cosa risponderà il festeggiato.</span></button></div>' +
      '<p class="tv-err" id="tv-err" role="alert"></p><div class="tv-row"><button class="tv-btn ghost" id="tv-back" type="button">Indietro</button></div></div>');
    $("#tv-back").addEventListener("click", goHome);
    $$("#tv-role [data-r]").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("#tv-role [data-r]").forEach(function (x) { x.disabled = true; });
        joinRoom(c, n, b.dataset.r).catch(function (ex) { $$("#tv-role [data-r]").forEach(function (x) { x.disabled = false; }); $("#tv-err").textContent = ex && ex.message && ex.message.indexOf("HTTP") < 0 && ex.message !== "Failed to fetch" ? ex.message : "Non riesco a collegarmi. Riprova."; });
      });
    });
  }
  function joinRoom(c, nm, role, adult) {
    return Promise.all([req("GET", c, "/meta"), req("GET", c, "/players"), req("GET", c, "/state/phase")]).then(function (r) {
      var meta = r[0], pl = r[1] || {}, phase = r[2];
      if (!meta) throw new Error("Codice non trovato. Controlla le lettere.");
      var ids = Object.keys(pl), same = ids.filter(function (i) { return String(pl[i].name).toLowerCase() === nm.toLowerCase(); })[0];
      var pid;
      if (same) {
        if (phase === "lobby" || !phase) throw new Error("Questo nome è già in uso: scegline un altro.");
        pid = same; role = pl[same].role || null;
      } else {
        if (phase && phase !== "lobby") throw new Error("La partita è già iniziata.");
        if (ids.length >= 20) throw new Error("La stanza è piena.");
        if (meta.cah && !adult) { var ae = new Error("adult"); ae.needAdult = true; throw ae; }
        if (meta.bd) {
          if (!role) { var ne = new Error("role"); ne.needRole = true; throw ne; }
          if (role === "f") { var fe = ids.filter(function (i) { return pl[i].role === "f"; })[0]; if (fe) throw new Error("Il festeggiato c’è già: " + pl[fe].name + ".");}
        }
        pid = rid();
      }
      S.code = c; S.role = "player"; S.me = pid; S.name = nm;
      var rec = { name: nm, t: same ? pl[same].t : Date.now(), n: 0 }; if (role) rec.role = role;
      return req("PUT", c, "/players/" + pid, rec);
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
    var meta = S.tree.meta || {}, cats = toArr(meta.cats).map(catById), nf = ids.filter(function (i) { return pl[i].role === "f"; }).length;
    var link = location.origin + location.pathname + "?c=" + S.code;
    var html = '';
    if (meta.cah) html += '<div class="tv-card tv-bsh"><p class="tv-label">Senza vergogna · vietato ai minori di 18 anni</p><h2>Il gioco delle risposte peggiori</h2><p class="tv-muted">Ogni turno uno di voi è il lettore: legge la carta nera, gli altri rispondono con una carta bianca. Poi si vota la risposta più divertente (non la propria). Linguaggio esplicito e humour nero.</p></div>';
    if (meta.bd) html += '<div class="tv-card tv-bsh"><p class="tv-label">Festa di compleanno</p><h2>' + esc(meta.bd.age) + ' anni!</h2><p class="tv-muted">Il festeggiato risponde in segreto alle domande su di lui, gli invitati cercano di indovinare. Tutti votano, senza limite di tempo: a ogni domanda si vedono le percentuali. 7 domande per categoria.</p></div>';
    if (meta.bs) html += '<div class="tv-card tv-bsh"><p class="tv-label">Baby shower</p><h2>' + (meta.bs.b ? "Aspettando " + esc(meta.bs.b) : "Aspettando il bebè") + '</h2><p class="tv-muted">Mamma <b>' + esc(meta.bs.m) + '</b> e papà <b>' + esc(meta.bs.p) + '</b></p><p class="tv-muted">Tutti rispondono a ogni domanda, 7 per categoria. Vince chi totalizza più punti.</p></div>';
    if (S.role === "master") {
      var qr = ""; try { qr = window.tavoloQR(link); } catch (e) {}
      html += '<div class="tv-card tv-lobby"><p class="tv-label">Codice della stanza</p><div class="tv-code" aria-label="Codice ' + S.code.split("").join(" ") + '">' + S.code + '</div>' +
        '<div class="tv-qr">' + qr + '</div><p class="tv-muted">Gli amici aprono <b>' + esc(location.host) + '</b>, scelgono «Entra con un codice» oppure inquadrano il QR.</p>' +
        '<div class="tv-row"><button class="tv-btn ghost" id="tv-copy" type="button">Copia il link</button>' + (navigator.share ? '<button class="tv-btn ghost" id="tv-share" type="button">Condividi</button>' : "") + '</div></div>';
    } else {
      html += '<div class="tv-card tv-lobby"><p class="tv-label">Sei nella stanza</p><div class="tv-code">' + S.code + '</div><p class="tv-muted">Aspetta che il master avvii la partita.</p></div>';
    }
    html += '<div class="tv-card"><p class="tv-label">Giocatori (' + ids.length + ')</p><ul class="tv-score">' + ids.map(function (i) { return "<li><span class=\"tv-pn\">" + esc(pl[i].name) + (i === S.me ? " (tu)" : "") + (i === "host" ? " · master" : "") + (meta.bd ? (pl[i].role === "f" ? " · festeggiato" : pl[i].role === "i" ? " · invitato" : "") : "") + "</span></li>"; }).join("") + '</ul>' +
      (cats.length ? '<p class="tv-muted">Categorie: ' : '<p hidden>') + cats.map(function (c) { return '<span class="tv-dot" style="--cc:' + c.color + '"></span>' + esc(c.name); }).join(" &nbsp; ") + '</p></div>';
    if (S.role === "master") html += '<div class="tv-row"><button class="tv-btn" id="tv-start" type="button"' + (ids.length < (meta.cah ? 3 : 2) || nf !== (meta.bd ? 1 : nf) ? " disabled" : "") + '>Avvia la partita</button><button class="tv-btn ghost" id="tv-close" type="button">Annulla</button></div>' + (meta.bd && nf !== 1 ? '<p class="tv-muted">' + (nf === 0 ? "Serve il festeggiato: deve scegliere «Sono il festeggiato»." : "C’è più di un festeggiato.") + "</p>" : (ids.length < (meta.cah ? 3 : 2) ? '<p class="tv-muted">Servono almeno ' + (meta.cah ? 3 : 2) + " giocatori.</p>" : ""));
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
  function bsScore(st, final) {
    var sc = st.scores || {}, pl = S.tree.players || {}, w = st.winners || {};
    var ids = Object.keys(pl).filter(function (id) { return pl[id].role !== "f"; }).sort(function (a, b) { return (sc[b] || 0) - (sc[a] || 0) || (pl[a].t || 0) - (pl[b].t || 0); });
    var off = toArr(st.off), fid = Object.keys(pl).filter(function (id) { return pl[id].role === "f"; })[0];
    return '<ul class="tv-score">' + ids.map(function (id, i) {
      return '<li class="' + (final && w[id] ? "turn " : "") + (off.indexOf(id) >= 0 ? "off" : "") + '"><span class="tv-rank">' + (i + 1) + '</span><span class="tv-pn">' + esc(pl[id].name) + (id === S.me ? " (tu)" : "") + (off.indexOf(id) >= 0 ? " · offline" : "") + '</span><span class="tv-pc">' + (sc[id] || 0) + (st.qt ? " / " + st.qt : "") + "</span></li>";
    }).join("") + "</ul>" + (fid ? '<p class="tv-muted">Festeggiato: <b>' + esc(pl[fid].name) + (fid === S.me ? " (tu)" : "") + "</b>, non in classifica.</p>" : "");
  }
  function bsGameView(st) {
    var cat = catById(st.cat), qo = toArr(st.q && st.q.o), rev = st.phase === "br" && st.reveal, pl = S.tree.players || {};
    var voted = st.voted || {}, ids = Object.keys(pl).sort(function (a, b) { return (pl[a].t || 0) - (pl[b].t || 0); }), off = toArr(st.off);
    var self = !!st.self, fid = st.fid, isF = !!S.me && S.me === fid, fname = fid ? pname(fid) : "";
    var guests = ids.filter(function (id) { return id !== fid; });
    var iVoted = S.answered === st.qid, counts = rev ? toArr(st.reveal.counts) : [], tot = rev ? (st.reveal.total || 0) : 0;
    var rightMap = rev ? (st.reveal.right || {}) : {}, nRight = Object.keys(rightMap).length, fc = rev ? st.reveal.correct : -1;
    var bar;
    if (!rev) {
      if (!S.me) bar = '<div class="tv-turnbar watch">Votano tutti: <b>' + Object.keys(voted).length + "</b> su " + ids.length + "</div>";
      else if (iVoted) bar = '<div class="tv-turnbar watch">Voto inviato ✓</div>';
      else bar = '<div class="tv-turnbar me">' + (isF && self ? "RISPONDI TU!" : "VOTA!") + "</div>";
    } else if (!S.me || !iVoted) bar = '<div class="tv-turnbar watch">Risultato</div>';
    else if (isF) bar = self ? '<div class="tv-turnbar watch">Hanno indovinato ' + nRight + " su " + guests.length + "</div>" : (fc === S.pick ? '<div class="tv-turnbar good">Giusto!</div>' : '<div class="tv-turnbar bad">Sbagliato</div>');
    else if (rightMap[S.me]) bar = '<div class="tv-turnbar good">' + (self ? "Hai indovinato! +1 punto" : "Giusto! +1 punto") + "</div>";
    else bar = '<div class="tv-turnbar bad">' + (self ? "Non ha scelto così" : "Sbagliato") + "</div>";
    var opts = qo.map(function (t, i) {
      var cls = "tv-opt", dis = "", extra = "", post = "", tag = "", pick = iVoted && S.pick === i;
      if (rev) {
        var pct = tot ? Math.round(counts[i] * 100 / tot) : 0;
        cls += " bar"; dis = " disabled";
        if (i === fc) { cls += " ok"; if (self) tag = ' <small class="tv-you">scelta di ' + esc(fname) + "</small>"; } else if (pick && !isF) cls += " no";
        else if (pick && isF) cls += " no";
        extra = '<i class="tv-fill" style="width:' + pct + '%"></i>'; post = '<em class="tv-pct">' + pct + "%</em>";
        if (pick && i !== fc) tag = ' <small class="tv-you">il tuo voto</small>';
        else if (pick && i === fc && !self) tag = ' <small class="tv-you">il tuo voto</small>';
      } else if (!S.me || iVoted) { dis = " disabled"; if (pick) cls += " pick"; }
      return '<button type="button" class="' + cls + '" data-i="' + i + '"' + dis + ">" + extra + "<b>" + "ABCD"[i] + "</b><span>" + esc(t) + tag + "</span>" + post + "</button>";
    }).join("");
    var html = '<div class="tv-card tv-q" style="--cc:' + cat.color + '">' + bar + '<div class="tv-qhead"><span class="tv-chip">' + esc(cat.name) + '</span><span class="tv-turn">' + st.ci + "/" + st.cn + " · domanda <b>" + st.qn + "</b> di " + st.qt + "</span></div>" +
      '<h2 class="tv-qt">' + esc(st.q && st.q.t) + "</h2>" +
      (!rev && self && fid ? '<p class="tv-muted">' + (isF ? "Rispondi sinceramente: gli altri cercano di indovinare cosa scegli." : "Cosa risponderà <b>" + esc(fname) + "</b>? Sceglie in segreto.") + "</p>" : "") +
      "<div class=\"tv-opts\">" + opts + "</div>";
    if (rev) html += '<p class="tv-msg" role="status">' + (self ? "Hanno indovinato " : "Ha risposto bene ") + nRight + " su " + guests.length + ".</p>";
    else html += '<div class="tv-vchips">' + ids.map(function (id) { return '<span class="tv-vchip' + (voted[id] ? " on" : "") + (off.indexOf(id) >= 0 ? " off" : "") + '">' + esc(pl[id].name) + (voted[id] ? " ✓" : "") + "</span>"; }).join("") + "</div>" +
      (!S.me ? "" : (iVoted ? '<p class="tv-muted">Aspetto gli altri…</p>' : ""));
    html += "</div>";
    if (S.role === "master") html += '<div class="tv-row">' + (rev ? '<button class="tv-btn" id="tv-skip" type="button">Continua</button>' : '<button class="tv-btn ghost" id="tv-skipq" type="button">Passa avanti</button>') + '<button class="tv-btn ghost" id="tv-stop" type="button">Termina partita</button></div>';
    return html + '<div class="tv-card"><p class="tv-label">Punteggi</p>' + bsScore(st, false) + "</div>";
  }
  function bsEndView(st) {
    var pl = S.tree.players || {}, w = Object.keys(st.winners || {}), names = w.map(function (i) { return pl[i] ? pl[i].name : "?"; });
    var title = names.length === 1 ? "Vince " + esc(names[0]) + "!" : "Pari merito: " + esc(names.join(" e ")) + "!";
    var html = '<div class="tv-card tv-end"><p class="tv-label">Partita finita</p><h2>' + title + '</h2><p class="tv-muted">Punteggio: ' + ((st.scores || {})[w[0]] || 0) + " su " + (st.qt || "") + " domande.</p></div>" +
      '<div class="tv-card"><p class="tv-label">Classifica finale</p>' + bsScore(st, true) + "</div>";
    if (S.role === "master") html += '<div class="tv-row"><button class="tv-btn" id="tv-again" type="button">Nuova partita</button><button class="tv-btn ghost" id="tv-close" type="button">Chiudi la stanza</button></div>';
    else html += '<p class="tv-muted">Il master può avviare una nuova partita.</p>';
    return html;
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
    var sig = JSON.stringify([st, Object.keys(pl).map(function (i) { return [i, pl[i].name]; }), S.answered, S.net, masterOff, S.tree.meta && S.tree.meta.cats, S.sel, S.vsel, S.cv, S.tree.hands && S.tree.hands[S.me], S.tree.priv, S.tree.mine && S.tree.mine[S.me]]);
    if (sig === S.sig) return; S.sig = sig;
    var body = /^c[prvs]$|^cend$/.test(st.phase) ? cahView(st) : st.phase === "bq" || st.phase === "br" ? bsGameView(st) : st.phase === "bend" ? bsEndView(st) : st.phase === "question" || st.phase === "reveal" ? gameView(st) : st.phase === "end" ? endView(st) : lobbyView();
    S.view = st.phase === "lobby" ? "lobby" : "game";
    shell((masterOff ? '<div class="tv-banner warn">Il master sembra offline: aspetta qualche istante.</div>' : "") + body);
    bind(st);
  }
  function bind(st) {
    var g = function (id, fn) { var e = $(id); if (e) e.addEventListener("click", fn); };
    g("#tv-start", startGame); g("#tv-again", newGame); g("#tv-close", closeRoom);
    g("#tv-stop", function () { if (confirm("Terminare la partita e chiudere la stanza?")) closeRoom(); });
    g("#tv-skip", function () { if (S.m.cah) cahNext(); else if (S.m.bs) askBS(); else next(S.m.cur && S.m.cur.ok); });
    g("#tv-skipq", function () { if (S.m.cah) cahForce(); else if (S.m.bs) bsReveal(); else resolve(-1); });
    $$(".cah-hand [data-c]").forEach(function (b) { b.addEventListener("click", function () { S.sel = +b.dataset.c; S.sig = ""; render(); }); });
    $$(".cah-ans[data-v]").forEach(function (b) { b.addEventListener("click", function () { S.vsel = +b.dataset.v; S.sig = ""; render(); }); });
    g("#cah-send", function () { if (S.sel == null) return; cahSend({ t: "pick", card: S.sel }, st); });
    g("#cah-show", function () { cahSend({ t: "show" }, st); });
    g("#cah-vote", function () { if (S.vsel == null) return; S.cv = st.qid; cahSend({ t: "vote", idx: S.vsel }, st); });
    g("#tv-copy", function () { var l = location.origin + location.pathname + "?c=" + S.code; (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(function () { $("#tv-copy").textContent = "Link copiato"; }).catch(function () { prompt("Copia questo link:", l); }); });
    g("#tv-share", function () { navigator.share({ title: MODE === "bs" ? "Baby shower" : MODE === "bd" ? "Festa di compleanno" : MODE === "cah" ? "Senza vergogna" : "Sfida a spicchi", text: "Gioca con me! Codice: " + S.code, url: location.origin + location.pathname + "?c=" + S.code }).catch(function () {}); });
    $$(".tv-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        if (st.phase === "bq") {
          if (!S.me || S.answered === st.qid) return;
          var j = +b.dataset.i; S.answered = st.qid; S.pick = j;
          if (S.role === "master") bsVote(S.me, j); else put("/actions/" + rid(), { pid: S.me, qid: st.qid, idx: j });
          S.sig = ""; render(); return;
        }
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
