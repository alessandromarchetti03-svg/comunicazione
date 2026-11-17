/* Generatore di QR code (modalità byte, correzione errori M, versioni 1-6). Nessuna dipendenza esterna. */
(function () {
  "use strict";
  var EXP = [], LOG = [];
  (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  function gmul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function rsGen(d) { var p = [1]; for (var i = 0; i < d; i++) { var n = new Array(p.length + 1).fill(0); for (var j = 0; j < p.length; j++) { n[j] ^= p[j]; n[j + 1] ^= gmul(p[j], EXP[i]); } p = n; } return p; }
  function rsRem(data, d) { var g = rsGen(d), r = new Array(d).fill(0); data.forEach(function (b) { var f = b ^ r.shift(); r.push(0); for (var i = 0; i < d; i++) r[i] ^= gmul(g[i + 1], f); }); return r; }
  // versione: [byte dati totali, codewords EC per blocco, numero blocchi]
  var VER = { 1: [16, 10, 1], 2: [28, 16, 1], 3: [44, 26, 1], 4: [64, 18, 2], 5: [86, 24, 2], 6: [108, 16, 4] };
  var ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] };

  function encode(text) {
    var bytes = unescape(encodeURIComponent(text)).split("").map(function (c) { return c.charCodeAt(0); });
    var v = 0; for (var k = 1; k <= 6; k++) if (bytes.length + 2 <= VER[k][0]) { v = k; break; }
    if (!v) throw new Error("testo troppo lungo");
    var cap = VER[v][0], bits = [];
    function push(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    push(4, 4); push(bytes.length, 8); bytes.forEach(function (b) { push(b, 8); });
    push(0, Math.min(4, cap * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    var data = []; for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }
    for (var pad = 0xec; data.length < cap; pad ^= 0xec ^ 0x11) data.push(pad);
    var nb = VER[v][2], ec = VER[v][1], per = cap / nb, blocks = [], ecs = [];
    for (var q = 0; q < nb; q++) { var blk = data.slice(q * per, (q + 1) * per); blocks.push(blk); ecs.push(rsRem(blk, ec)); }
    var out = [];
    for (i = 0; i < per; i++) blocks.forEach(function (b) { out.push(b[i]); });
    for (i = 0; i < ec; i++) ecs.forEach(function (b) { out.push(b[i]); });
    return { v: v, cw: out };
  }

  function build(text) {
    var e = encode(text), v = e.v, size = 17 + 4 * v;
    var m = [], f = [];
    for (var y = 0; y < size; y++) { m.push(new Array(size).fill(false)); f.push(new Array(size).fill(false)); }
    function setF(x, y, d) { if (x >= 0 && y >= 0 && x < size && y < size) { m[y][x] = d; f[y][x] = true; } }
    function finder(cx, cy) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var d = Math.max(Math.abs(dx), Math.abs(dy)); setF(cx + dx, cy + dy, d !== 2 && d !== 4); } }
    for (var i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var ap = ALIGN[v], last = ap.length - 1;
    ap.forEach(function (ay, a) { ap.forEach(function (ax, b) {
      if ((a === 0 && b === 0) || (a === 0 && b === last) || (a === last && b === 0)) return;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) setF(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }); });
    function format(mask) {
      var d = (0 << 3) | mask, r = d; for (var i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var bits = ((d << 10) | r) ^ 0x5412; function bit(i) { return ((bits >>> i) & 1) !== 0; }
      for (i = 0; i <= 5; i++) setF(8, i, bit(i)); setF(8, 7, bit(6)); setF(8, 8, bit(7)); setF(7, 8, bit(8));
      for (i = 9; i < 15; i++) setF(14 - i, 8, bit(i));
      for (i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(i));
      for (i = 8; i < 15; i++) setF(8, size - 15 + i, bit(i));
      setF(8, size - 8, true);
    }
    format(0);
    var n = 0, total = e.cw.length * 8;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
        var x = right - j, up = ((right + 1) & 2) === 0, yy = up ? size - 1 - vert : vert;
        if (!f[yy][x] && n < total) { m[yy][x] = ((e.cw[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0; n++; }
      }
    }
    var MASKS = [
      function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }, function (x, y) { return x % 3 === 0; },
      function (x, y) { return (x + y) % 3 === 0; }, function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return ((x * y) % 2) + ((x * y) % 3) === 0; }, function (x, y) { return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; },
      function (x, y) { return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; }
    ];
    function applyMask(k) { for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (!f[y][x] && MASKS[k](x, y)) m[y][x] = !m[y][x]; }
    function penalty() {
      var p = 0, dark = 0, x, y, run, i;
      function lines(get) {
        for (var a = 0; a < size; a++) {
          run = 1; var hist = [];
          for (var b = 0; b < size; b++) { var c = get(a, b); if (b && c === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; hist.push(c ? 1 : 0); }
          var s = hist.join(""); ["10111010000", "00001011101"].forEach(function (pt) { var idx = -1; while ((idx = s.indexOf(pt, idx + 1)) >= 0) p += 40; });
        }
      }
      lines(function (r, c) { return m[r][c]; }); lines(function (c, r) { return m[r][c]; });
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
      var tot = size * size; p += Math.floor(Math.abs(dark * 20 - tot * 10) / tot) * 10;
      return p;
    }
    var best = 0, bp = Infinity;
    for (var k = 0; k < 8; k++) { applyMask(k); format(k); var pp = penalty(); if (pp < bp) { bp = pp; best = k; } applyMask(k); }
    applyMask(best); format(best);
    return { size: size, m: m };
  }
  window.tavoloQR = function (text) {
    var q = build(text), s = q.size, d = "";
    for (var y = 0; y < s; y++) for (var x = 0; x < s; x++) if (q.m[y][x]) d += "M" + (x + 2) + " " + (y + 2) + "h1v1h-1z";
    var w = s + 4;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + " " + w + '" shape-rendering="crispEdges"><rect width="' + w + '" height="' + w + '" fill="#fff"/><path d="' + d + '" fill="#10142e"/></svg>';
  };
})();
