# alessandromarchetti.net

Sito statico per GitHub Pages. Tutti i file stanno nella cartella principale.

## Modifiche frequenti — file `site-data.js`
- Link Amazon dei libri (`amazon`), video di presentazione (`introVideoId`), email e social.
- Articoli del blog: elenco `POSTS` in fondo al file + una pagina `.html` per articolo.

## Giochi formativi e Altri progetti
- `giochi.html` + `giochi-data.js` (contenuti) + `giochi.js` (motore). Ogni gioco è una lista di «slot»: a ogni partita viene pescata una variante a caso per slot. Per aggiungere varianti basta aggiungere elementi in `giochi-data.js`.
- Nessun dato viene salvato o inviato (niente cookie, niente localStorage).
- Sezione «Altri progetti» nella home (`#progetti`). L'indirizzo del canale Melodie Capogiro è `melodieChannel` in `site-data.js`: ora è un link di ricerca provvisorio, sostituiscilo con l'indirizzo esatto del canale.

## Automazione YouTube e caratteri
Il file del flusso automatico deve stare in `.github/workflows/youtube.yml`
(contenuto in `youtube-workflow.txt`). Ogni 6 ore salva gli ultimi 6 video lunghi
in `videos.json` e le anteprime in `yt/`; al primo avvio scarica i caratteri in `fonts/`.

## Privacy
Nessun cookie di profilazione: niente banner. Video YouTube solo dopo consenso,
revocabile con "Preferenze video". Informativa in `privacy.html`.

## Caratteri

Inter è salvato sul sito (`inter-*.woff` + `fonts.css`), nessuna richiesta a Google. La cartella `fonts/` creata dal workflow non è più usata.
