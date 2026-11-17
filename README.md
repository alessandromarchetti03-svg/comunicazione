# alessandromarchetti.net

Sito statico per GitHub Pages. Tutti i file stanno nella cartella principale.

## Modifiche frequenti — file `site-data.js`
- Link Amazon dei libri (`amazon`), video di presentazione (`introVideoId`), email e social.
- Articoli del blog: elenco `POSTS` in fondo al file + una pagina `.html` per articolo.

## Giochi formativi e Altri progetti
- `giochi.html` + `giochi-data.js` (contenuti) + `giochi.js` (motore). Ogni gioco è una lista di «slot»: a ogni partita viene pescata una variante a caso per slot. Per aggiungere varianti basta aggiungere elementi in `giochi-data.js`.
- Nessun dato viene salvato o inviato (niente cookie, niente localStorage).
- Pagina «Altri progetti» (`altri-progetti.html`, voce «Progetti» nel menu). L'indirizzo del canale Melodie Capogiro è `melodieChannel` in `site-data.js`: ora è un link di ricerca provvisorio, sostituiscilo con l'indirizzo esatto del canale.

## Automazione YouTube e caratteri
Il file del flusso automatico deve stare in `.github/workflows/youtube.yml`
(contenuto in `youtube-workflow.txt`). Ogni 6 ore salva gli ultimi 6 video lunghi
in `videos.json` e le anteprime in `yt/`; al primo avvio scarica i caratteri in `fonts/`.

## Privacy
Nessun cookie di profilazione: niente banner. Video YouTube solo dopo consenso,
revocabile con "Preferenze video". Informativa in `privacy.html`.

## Caratteri

Inter è salvato sul sito (`inter-*.woff` + `fonts.css`), nessuna richiesta a Google. La cartella `fonts/` creata dal workflow non è più usata.

## Menu
Le stesse 8 voci (Chi sono, Libri, Giochi, Progetti, Omaggio, Video, Blog, Contatti) sono in tutte le pagine, con link che funzionano da ovunque. Se ne aggiungi una, ricopiala in ogni file `.html`.

## Giochi da tavolo — Sfida a spicchi 
- Pagina `tavolo.html` (collegata dalla scheda in «Altri progetti» e da «Giochi formativi») + `tavolo-data.js` (180 domande in 6 categorie), `tavolo-qr.js` (QR), `tavolo.js` (gioco), `tavolo-config.js` (indirizzo del database in tempo reale).
- Finché `db` in `tavolo-config.js` è vuoto la pagina dice «non ancora attivo». Per attivarla serve il database (vedi la guida a parte).
- Il database Firebase (indirizzo in `tavolo-config.js`) usa le regole del file `tavolo-firebase-rules.json`. La privacy è già aggiornata.
