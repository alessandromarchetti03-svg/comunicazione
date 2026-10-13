# alessandromarchetti.net

Sito personale statico (HTML/CSS/JS), pensato per GitHub Pages con dominio Aruba.

## Cosa modificare

Quasi tutto si aggiorna da **un solo file**: `assets/js/site-data.js`

| Cosa | Dove |
|---|---|
| Link Amazon dei libri | `books[].amazon` — finché è vuoto il pulsante mostra "In arrivo" |
| Video di presentazione | `introVideoId` — solo l'ID (la parte dopo `v=` nel link YouTube) |
| Galleria YouTube | automatica (vedi sotto). `videos` in site-data.js serve solo come riserva |
| Link al canale | `youtubeChannel` |
| Email, Instagram, LinkedIn | `email`, `instagram`, `linkedin` (vuoto = nascosto) |
| Elenco articoli | `POSTS` in fondo al file |

Immagini da aggiungere in `assets/img/` (finché mancano, il sito mostra un'alternativa grafica):

- `alessandro.jpg` — tua foto verticale (4:5, almeno 900×1125 px)
- `cover-ritrova-la-parola.jpg` — copertina fronte (5.5×8.5)
- `cover-la-tua-voce.jpg` — copertina fronte
- `og-image.jpg` — anteprima per WhatsApp/social (1200×630)

Il testo di "Chi sono" è in `index.html`, sezione `CHI SONO`.

## Pubblicare un articolo

1. Mandami il testo: ti preparo il file `blog/nome-articolo.html` e la riga da aggiungere in `POSTS`.
2. Carica il file nella cartella `blog/` del repository e aggiorna `site-data.js`.
3. GitHub Pages ripubblica il sito in 1–2 minuti.

## Messa online — GitHub Pages

1. Crea un account su github.com e un **nuovo repository pubblico** (es. `sito`).
2. *Add file → Upload files*: trascina **tutto il contenuto** di questa cartella (incluso `CNAME` e `.nojekyll`), poi *Commit changes*.
3. *Settings → Pages*: Source = **Deploy from a branch**, Branch = `main`, cartella `/ (root)` → *Save*.
4. Sempre in *Settings → Pages*, Custom domain: `www.alessandromarchetti.net`.

## Collegare il dominio — pannello Aruba

*Pannello di controllo → Gestione DNS e name server* del dominio. Elimina eventuali record A/CNAME esistenti per `@` e `www`, poi aggiungi:

| Tipo | Nome | Valore |
|---|---|---|
| A | @ (dominio radice) | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `TUO-UTENTE.github.io.` |

La propagazione richiede da pochi minuti a qualche ora. Quando GitHub mostra il dominio come verificato, spunta **Enforce HTTPS**.

> Se su Aruba hai anche la casella email `@alessandromarchetti.net`, **non toccare i record MX**: la posta continua a funzionare.

## Privacy (GDPR) — com'è impostato il sito

- Nessun cookie di profilazione o statistica, quindi **niente cookie banner**.
- I video YouTube si caricano solo dopo il consenso ("Accetta e guarda"), revocabile con "Preferenze video" nel footer.
- Caratteri e anteprime dei video sono salvati sul sito: al caricamento il browser non contatta Google.
- Informativa completa in `privacy.html`. Se aggiungi statistiche, newsletter o moduli, va aggiornata (e potrebbe servire il banner).

## Galleria YouTube automatica (ultimi 6 video)

Ogni 6 ore GitHub legge il feed pubblico del canale e aggiorna `assets/data/videos.json`. Il sito mostra gli ultimi 6 caricamenti.

L'ID del canale (`UChzn_LKY3UXMd2PYOynDUOQ`) è già inserito in `.github/workflows/youtube.yml` e gli Shorts sono esclusi (`YT_EXCLUDE_SHORTS: "true"`).

1. *Settings → Actions → General → Workflow permissions*: scegli **Read and write permissions** → *Save*.
2. Scheda *Actions* → *Aggiorna video YouTube e caratteri* → **Run workflow**. **Obbligatorio la prima volta**: oltre ai video scarica i caratteri del sito in `assets/fonts/` (finché non lo fai, i titoli usano un carattere di sistema). Poi è automatico.

> Se carichi il sito trascinando i file nel browser, la cartella `.github` (nascosta su Mac/Windows) potrebbe non venire caricata. In quel caso: *Add file → Create new file*, nome `.github/workflows/youtube.yml`, e incolla il contenuto del file.
