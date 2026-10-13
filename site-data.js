/* ============================================================
   DATI DEL SITO — modifica solo questo file per aggiornare
   video, libri e link. Non serve toccare l'HTML.
   ============================================================ */

window.SITE = {
  /* Link al tuo canale YouTube (es. https://www.youtube.com/@alessandromarchetti) */
  youtubeChannel: "https://www.youtube.com/@AlessandroMarchetti_AM",

  /* Video di presentazione: incolla solo l'ID del video.
     Da https://www.youtube.com/watch?v=AbC123xyz  →  "AbC123xyz"
     Lascia "" finché non l'hai caricato: comparirà un riquadro "in arrivo". */
  introVideoId: "",

  /* Galleria YouTube: aggiungi un video per riga (i più recenti in alto).
     id = ID del video, title = titolo da mostrare */
  videos: [
    // { id: "AbC123xyz", title: "Ritrova la Parola — Capitolo 1: le tre immagini" },
    // { id: "DeF456uvw", title: "Esercizio: tre frasi, tre finali" },
  ],

  /* Libri: incolla il link Amazon quando è disponibile.
     Se amazon è "", il pulsante mostra "In arrivo". */
  books: [
    {
      title: "Ritrova la Parola",
      subtitle: "Una guida pratica per imparare ad esprimerti in maniera efficace e carismatica in tutte le occasioni",
      cover: "cover-ritrova-la-parola.jpg",
      amazon: "https://amzn.eu/d/0aDT5QVA",
      blurb: "Quindici capitoli su voce, corpo, mente sotto pressione, ascolto e guida della conversazione — più un percorso pratico di 90 giorni, in trenta blocchi da tre giorni, con spazio per le tue annotazioni.",
      tags: ["Comunicazione", "Public speaking", "Percorso 90 giorni"]
    },
    {
      title: "La Tua Voce, La Tua Presenza",
      subtitle: "Un percorso pratico per comunicare con sicurezza, dal vivo e in pubblico",
      cover: "cover-la-tua-voce-la-tua-presenza.jpg",
      amazon: "https://amzn.eu/d/07qjkZVK",
      blurb: "Il seguito dedicato a voce, tono e presenza: i cinque fondamentali vocali, il corpo come telecomando, il coraggio di esporsi e un percorso personalizzato di 12 settimane con schede di lavoro.",
      tags: ["Voce", "Presenza scenica", "12 settimane"]
    }
  ],

  /* OMAGGIO + MAILING LIST (Brevo)
     formUrl: l'indirizzo "action" del modulo Brevo (inizia con https://...sibforms.com/serve/...).
     Finché è vuoto il pulsante mostra "In arrivo". */
  gift: {
    formUrl: "https://3f4b877b.sibforms.com/serve/MUIFAIrTLQRgOPS2G3kkKHjT27_MpJg4aAHy_G7iccCIg2fKyqfsFeDuy9Pfgsvi2767xIXZKcGqpVJiQZ5B2y-dVhbsSQdFwm_VbjDmeT_vhWPf1KtoTw9EKSu8oIXSAPzxcRS-LW52tGBuqw_wHLetrUhWPKRzv_Z77M0xxkhtiC9koZdpzH_lS2cu_3rMdKc72QKVkM1itOIYLA==",
    title: "7 giorni per ritrovare la parola",
    subtitle: "Sette esercizi da pochi minuti per sentire, già da questa settimana, la differenza nella tua voce e nella tua presenza.",
    points: ["Un esercizio al giorno: voce, dizione, presenza, gestione della tensione", "Tratto da “Ritrova la Parola”, con spazio per annotare i progressi", "PDF gratuito, da leggere su telefono o stampare"],
    cover: "omaggio-copertina.jpg"
  },

  /* Social e contatti (lascia "" per nasconderli) */
  email: "info@alessandromarchetti.net",
  instagram: "",
  linkedin: ""
};

/* ============================================================
   ARTICOLI DEL BLOG — il più recente in alto.
   Ogni articolo è un file in /blog/ (es. blog/la-voce-si-allena.html)
   ============================================================ */
window.POSTS = [
  {
    slug: "la-voce-si-allena",
    title: "La voce si allena: tre esercizi da due minuti",
    date: "2026-10-13",
    excerpt: "La voce che usi oggi non è un dato di natura: è il risultato di migliaia di ripetizioni involontarie. Ecco da dove iniziare a cambiarla.",
    category: "Voce"
  }
];
