(function () {
  const S = window.SITE || {};
  const P = window.POSTS || [];
  const base = document.body.dataset.base || "";
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Menu mobile */
  const btn = $(".menu-btn"), nav = $(".nav");
  if (btn && nav) btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });

  /* Data italiana */
  const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  /* Video YouTube con consenso "a due clic" (GDPR):
     prima del consenso non viene contattato nessun server di Google.
     Le anteprime sono salvate sul sito da GitHub (yt/). */
  const CONSENT_KEY = "yt-consent";
  const hasConsent = () => { try { return localStorage.getItem(CONSENT_KEY) === "1"; } catch (e) { return false; } };
  const saveConsent = () => { try { localStorage.setItem(CONSENT_KEY, "1"); } catch (e) {} };
  const embed = (wrap, id, title) => {
    wrap.innerHTML =
      `<iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}?autoplay=1&rel=0" title="${esc(title)}" ` +
      `allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  };
  function videoFrame(id, title, thumb) {
    const wrap = document.createElement("div");
    wrap.className = "video-frame";
    const bg = thumb
      ? `<img src="${base}${esc(thumb)}" alt="" loading="lazy">`
      : `<div class="video-placeholder"><div><strong>${esc(title)}</strong></div></div>`;
    wrap.innerHTML = bg + `<button type="button" aria-label="Riproduci: ${esc(title)}"><span class="play"></span></button>`;
    wrap.querySelector("button").addEventListener("click", () => {
      if (hasConsent()) return embed(wrap, id, title);
      const box = document.createElement("div");
      box.className = "yt-consent";
      box.innerHTML =
        `<p>Questo video è ospitato su <b>YouTube</b> (Google). Riproducendolo, Google può raccogliere dati e impostare cookie. ` +
        `<a href="${base}privacy.html#cookie">Maggiori info</a></p>` +
        `<label><input type="checkbox" checked> Ricorda la mia scelta</label>` +
        `<div class="yt-actions"><button type="button" class="btn">Accetta e guarda</button>` +
        `<a class="btn ghost" href="https://www.youtube.com/watch?v=${esc(id)}" target="_blank" rel="noopener">Apri su YouTube</a></div>`;
      box.querySelector("button").addEventListener("click", () => {
        if (box.querySelector("input").checked) saveConsent();
        embed(wrap, id, title);
      });
      wrap.appendChild(box);
      box.querySelector("button").focus();
    });
    return wrap;
  }

  /* Link "Preferenze video" nel footer: revoca il consenso */
  document.querySelectorAll("[data-reset-consent]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    try { localStorage.removeItem(CONSENT_KEY); } catch (err) {}
    a.textContent = "Consenso video revocato";
  }));

  /* Video di presentazione */
  const intro = $("#intro-video");
  if (intro) {
    if (S.introVideoId) intro.replaceWith(videoFrame(S.introVideoId, "Guarda la presentazione"));
    else intro.innerHTML = `<div class="video-placeholder"><div><strong>Il video di presentazione arriva presto</strong>Nel frattempo, scopri i video sul canale.</div></div>`;
  }

  /* Libri */
  const books = $("#book-list");
  if (books && S.books) {
    books.innerHTML = S.books.map((b) => `
      <article class="book reveal">
        <div class="cover">
          <div class="cover-fallback"><span class="orn">❧</span><span class="t">${esc(b.title).replace(/, /g, ",<br>")}</span><span class="a">Alessandro Marchetti</span></div>
          <img src="${base}${esc(b.cover)}" alt="Copertina di ${esc(b.title)}" loading="lazy" onerror="this.remove()">
        </div>
        <div>
          <h3>${esc(b.title)}</h3>
          <p class="sub">${esc(b.subtitle)}</p>
          <p>${esc(b.blurb)}</p>
          <ul class="tags">${(b.tags || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          ${b.amazon
            ? `<a class="btn" href="${esc(b.amazon)}" target="_blank" rel="noopener">Acquista su Amazon</a>`
            : `<span class="btn" aria-disabled="true">In arrivo su Amazon</span>`}
        </div>
      </article>`).join("");
  }

  /* Galleria YouTube: ultimi caricamenti da videos.json (aggiornato da GitHub ogni 6 ore),
     altrimenti la lista manuale in site-data.js */
  const gal = $("#gallery");
  const renderGallery = (vids) => {
    if (!gal) return;
    if (!vids.length) {
      gal.outerHTML = `<div class="empty">I primi video del canale compariranno qui.</div>`;
      return;
    }
    gal.innerHTML = "";
    vids.slice(0, 6).forEach((v) => {
      const fig = document.createElement("figure");
      fig.className = "reveal" + (v.short ? " is-short" : "");
      fig.appendChild(videoFrame(v.id, v.title, v.thumb));
      const date = v.published ? `<span class="vdate">${fmtDate(v.published)}</span>` : "";
      fig.insertAdjacentHTML("beforeend", `<figcaption>${date}${esc(v.title)}</figcaption>`);
      gal.appendChild(fig);
    });
  };
  if (gal) {
    fetch(base + "videos.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => renderGallery(d && d.videos && d.videos.length ? d.videos : S.videos || []))
      .catch(() => renderGallery(S.videos || []));
  }
  document.querySelectorAll("[data-yt]").forEach((a) => (a.href = S.youtubeChannel || "#"));

  /* Articoli */
  const postsEl = $("#posts");
  if (postsEl) {
    const limit = parseInt(postsEl.dataset.limit || "0", 10);
    const list = limit ? P.slice(0, limit) : P;
    postsEl.innerHTML = list.length
      ? list.map((p) => `
        <a class="post-card reveal" href="${base}${esc(p.slug)}.html">
          <div class="meta"><b>${esc(p.category || "Blog")}</b> · ${fmtDate(p.date)}</div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.excerpt)}</p>
        </a>`).join("")
      : `<div class="empty">Il primo articolo è in arrivo.</div>`;
  }

  /* Omaggio + iscrizione Brevo (doppia conferma via email) */
  const G = S.gift;
  const gf = $("#gift-form");
  if (G && gf) {
    $("#gift-title").textContent = G.title || "";
    $("#gift-sub").textContent = G.subtitle || "";
    $("#gift-points").innerHTML = (G.points || []).map((x) => `<li>${esc(x)}</li>`).join("");
    $("#gift-cover").innerHTML = G.cover
      ? `<img src="${base}${esc(G.cover)}" alt="Copertina: ${esc(G.title)}">`
      : `<div class="gift-fallback"><span class="t">${esc(G.title)}</span><span class="a">PDF gratuito · Alessandro Marchetti</span></div>`;
    const btn = $("#gift-btn"), msg = $("#gift-msg");
    if (!G.formUrl) { btn.textContent = "In arrivo"; btn.disabled = true; }
    else gf.action = G.formUrl;
    gf.addEventListener("submit", (e) => {
      const em = $("#gift-email"), ok = $("#gift-ok");
      msg.className = "gift-msg";
      if (!G.formUrl) { e.preventDefault(); return; }
      if (!em.value || !em.checkValidity()) { e.preventDefault(); msg.textContent = "Inserisci un indirizzo email valido."; msg.classList.add("err"); em.focus(); return; }
      if (!ok.checked) { e.preventDefault(); msg.textContent = "Per ricevere l’omaggio spunta la casella del consenso."; msg.classList.add("err"); return; }
      btn.disabled = true; btn.textContent = "Invio…";
      setTimeout(() => {
        gf.querySelector(".gift-row").hidden = true; gf.querySelector(".gift-consent").hidden = true;
        msg.innerHTML = "<strong>Quasi fatto!</strong> Ti ho inviato un’email: apri il link di conferma e il PDF ti arriverà per email. Se non la trovi, controlla Spam o Promozioni.";
        msg.classList.add("ok");
      }, 900);
    });
  }

  /* Contatti */
  document.querySelectorAll("[data-email]").forEach((a) => { a.href = "mailto:" + S.email; if (!a.textContent.trim()) a.textContent = S.email; });
  [["instagram", "[data-ig]"], ["linkedin", "[data-li]"]].forEach(([k, sel]) =>
    document.querySelectorAll(sel).forEach((a) => (S[k] ? (a.href = S[k]) : a.remove())));

  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* Comparsa allo scroll */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 })
    : null;
  document.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
})();
