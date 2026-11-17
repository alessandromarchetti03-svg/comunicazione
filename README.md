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

## Baby shower (pagina baby-shower.html)
Gioco separato, con scheda propria in «Progetti». Usa lo stesso motore di tavolo.js (la pagina imposta `window.TAVOLO_MODE = "bs"`). Modalità diversa dagli spicchi: tutti rispondono a ogni domanda, senza tempo; si va avanti quando hanno votato tutti (il master può «Passare avanti»). Dopo ogni voto si vedono le percentuali; a fine partita punteggi e vincitore (anche pari merito).
Ogni partita pesca 7 domande per categoria. Il master scrive i nomi di mamma, papà e (facoltativo) bebè, sceglie le categorie e aggiunge domande sue.
Categorie: «Su mamma» e «Su papà» (solo domande del master, minimo 3), «Aspettando il bebè» (3 domande automatiche con i nomi + le sue), «Gravidanza e nascita» (76 domande) e «Neonati e bebè» (71) in tavolo-data.js, `TAVOLO_BS`.
I nomi delle categorie viaggiano in `meta/cn` così compaiono uguali su tutti i telefoni.

## Festa di compleanno (pagina compleanno.html)
Stesso motore del baby shower (`TAVOLO_MODE = "bd"`), dati in `compleanno-data.js` (`TAVOLO_BD`).
- Il master imposta gli anni, le categorie e le domande sue; chi entra sceglie «Sono il festeggiato» (uno solo) o «Sono un invitato».
- Domande «sul festeggiato»: risponde lui in segreto, la risposta giusta è la sua; gli invitati prendono un punto se indovinano. Il festeggiato non è in classifica.
- Categorie: «Gli anni che compie» (98 domande legate all'età), «Esplicite 18+» (89, solo se il master conferma che sono tutti maggiorenni), «Quanto conosci il festeggiato» (75), «Da quando è nato» (circa 80 calcolate dall'anno di nascita), «Come si comporta» (70).
- Formato delle stringhe nel file dati: «testo|opz1|opz2|opz3|opz4» = domanda sul festeggiato; prefisso «=» = con risposta giusta (la prima); prefisso «30-39>» = solo per quell'età. Segnaposto: {n} nome, {a} anni.
- Ogni partita: 7 domande per categoria. Fino a 20 giocatori in tutti i giochi.

## Menu
Chi sono, Libri, Esercizi (esercizi.html), Giochi (giochi.html: Sfida a spicchi, Baby shower, Festa di compleanno), Progetti (altri-progetti.html), Omaggio, Video, Blog, Contatti.

## Senza vergogna (pagina senza-vergogna.html, 18+)
Gioco di carte per adulti (`TAVOLO_MODE = "cah"`), carte originali in `senzavergogna-data.js` (base «piccante»: 81 nere, 169 bianche; livello «estremo», predefinito: altre 36 nere e 112 bianche). Il master sceglie il livello alla creazione. Il master può aggiungere carte sue.
- Ogni turno un giocatore diverso è il lettore (a rotazione): legge la carta nera; gli altri scelgono una delle 7 carte bianche, che viene subito rimpiazzata.
- Le risposte restano nascoste agli altri finché il lettore non le ha lette tutte e preme «Mostra a tutti»; poi tutti (lettore compreso) votano, ma non la propria carta. Un punto alla carta più votata (pari merito: un punto a testa).
- Serve il consenso «ho almeno 18 anni» del master all'avvio e di ogni giocatore all'ingresso. Servono almeno 3 giocatori.
- Le carte in mano sono in `hands/<id>` nel database: il gioco è pensato per amici in presenza, non è a prova di barare.

## Disegna e indovina (pagina disegna.html)
Gioco in stile Pictionary (`TAVOLO_MODE = "dis"`), parole in `disegna-data.js`: 4 fasce (Facile 1 punto, Media 2, Difficile 3, Quasi impossibile 5), 76/76/70/70 parole.
A turno uno disegna e sceglie tra 4 parole (una per fascia, può cambiarle una volta); gli altri vedono il disegno in diretta e indovinano a voce; chi disegna indica il vincitore. Il vincitore prende i punti della fascia, chi disegna metà (arrotondata per eccesso). Il master sceglie i giri, il tempo (60/90/120 s o nessuno) e può aggiungere parole sue (fascia Media).
Il disegno viaggia come tratti di testo in `/draw/s/sN` (coordinate 0-1000 × 0-750), scritti solo da chi disegna e cancellati a inizio turno.

## Indovina chi ha scritto cosa (pagina chi-ha-scritto.html)
`TAVOLO_MODE = "who"`, domande in `chiscritto-data.js` (72 per tutti + 30 «piccanti»). A ogni domanda tutti scrivono in segreto una risposta (max 80 caratteri); poi le risposte (al massimo 8 per domanda) compaiono anonime una alla volta e ognuno indovina l'autore. +1 a chi indovina, e all'autore +1 per ogni persona ingannata. Il master sceglie 1-5 domande e può aggiungerne di sue. Servono almeno 3 giocatori.

## Parole in comune (pagina parole-in-comune.html)
`TAVOLO_MODE = "par"`, 382 parole in `paroleincomune-data.js`. Griglia 5×5, squadre Rossa e Blu sorteggiate (almeno 4 giocatori), un capitano per squadra che vede i colori (in `/priv`) e dà un indizio di una parola + un numero; i compagni toccano le parole (selezione + conferma), tentativi = numero + 1. Vince chi trova tutte le sue parole; la parola nera fa perdere. L'indizio non può essere una parola ancora sul tavolo. Il master può passare il turno.

## HelpDesk (portfolio, pagina helpdesk.html)
Caso di studio del software gestionale, con riquadro in `altri-progetti.html` (sopra Melodie Capogiro, che resta ultima). Pagina autonoma con i suoi stili, caratteri locali (fonts.css) e nessuna richiesta esterna; immagini `helpdesk-*.webp` e `helpdesk-icona.png` nella cartella principale.

## Siti web (riquadro in altri-progetti.html)
Riquadro con i due siti sviluppati: ciemmegiardini.it e emme2000impiantielettrici.it (link esterni). Sta sopra Melodie Capogiro, che resta ultima.

## Home: sezioni oltre i libri
La home resta centrata sui libri. Dopo il blog ci sono le sezioni NaturalPlan, Giochi, Software e siti web (HelpDesk) e Melodie Capogiro, poi i Contatti («Ti interessa uno dei miei lavori o hai un'idea che vuoi sviluppare? Contattami»). Non esiste una pagina «Lavora con me».
