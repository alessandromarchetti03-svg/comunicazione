/* Giochi formativi — contenuti.
   Ogni gioco è una lista di «slot». A ogni partita il motore pesca a caso UN elemento per slot,
   così ogni volta il percorso cambia. Per aggiungere varianti basta aggiungere elementi agli slot.
   Tipi di passo: timer | read | choice | reflect | rate | pick  */
(function () {
  var BR = { // schemi di respiro: [etichetta, secondi]
    calmo:   [["Inspira dal naso", 4], ["Espira piano dalla bocca", 6]],
    quadro:  [["Inspira", 4], ["Trattieni", 4], ["Espira", 4], ["Fermo", 4]],
    lungo:   [["Inspira", 4], ["Trattieni", 2], ["Espira lentamente", 8]],
    sospiro: [["Inspira dal naso", 4], ["Piccolo sorso d’aria in più", 1], ["Sospira con un suono", 7]]
  };
  function rate(t, tx, key) { return { type: "rate", title: t, text: tx, key: key }; }

  window.GAMES = [
  /* ============ 1. MI DEVO RILASSARE ============ */
  {
    id: "rilassarmi", title: "Mi devo rilassare", book: "Il tuo corpo il tuo centro", color: "#fdc93c", bg: "#17563c", ink: "#fff",
    blurb: "Cinque minuti per scaricare la tensione: respiro, corpo e un piccolo gesto da portarti dietro.",
    skill: "Calmare il corpo per ritrovare il centro",
    slots: [
      [ rate("Come stai adesso?", "Quanto ti senti teso o agitato in questo momento? 1 = per niente, 5 = moltissimo.", "prima") ],
      [
        { type: "timer", title: "Respiro lento", text: "Siediti comodo, spalle basse. Segui il cerchio: dentro dal naso, fuori piano dalla bocca. Se ti distrai, ricomincia senza giudicarti.", seconds: 60, breath: BR.calmo },
        { type: "timer", title: "Respiro a quadrato", text: "Quattro tempi uguali. È il respiro che usano i piloti e i soccorritori per restare lucidi sotto pressione.", seconds: 60, breath: BR.quadro },
        { type: "timer", title: "Espirazione lunga", text: "Quando l’espirazione è più lunga dell’inspirazione, il corpo riceve il segnale «sono al sicuro».", seconds: 60, breath: BR.lungo },
        { type: "timer", title: "Il doppio respiro", text: "Un piccolo sorso d’aria in più alla fine dell’inspirazione e un sospiro sonoro: il modo più rapido per sciogliere il petto.", seconds: 60, breath: BR.sospiro }
      ],
      [
        { type: "timer", title: "Sciogli la mandibola", text: "Appoggia la lingua dietro i denti, lascia cadere la mandibola, labbra morbide. Ogni tanto sbadiglia. Senti il viso che si scioglie.", seconds: 45 },
        { type: "timer", title: "Spalle lontane dalle orecchie", text: "Alza le spalle verso le orecchie, tienile 3 secondi, poi lasciale cadere di colpo. Ripeti piano per tutto il tempo e senti la differenza.", seconds: 45 },
        { type: "timer", title: "Mani aperte", text: "Stringi i pugni forte per 5 secondi, poi apri le mani e lasciale pesanti sulle gambe. Nota il calore che arriva alle dita.", seconds: 45 },
        { type: "timer", title: "Radicati nei piedi", text: "Appoggia i piedi a terra e premi piano, come se volessi spingere via il pavimento. Senti il peso passare dalla testa alle gambe.", seconds: 45 }
      ],
      [
        { type: "choice", title: "Domanda lampo", q: "Hai la mente piena di pensieri. Qual è la prima cosa utile da fare?", options: [
          { t: "Costringermi a non pensare a niente", ok: false, fb: "Più cerchi di spegnere i pensieri, più tornano. Meglio dare alla mente un compito semplice: il respiro." },
          { t: "Spostare l’attenzione sul respiro e sul corpo", ok: true, fb: "Esatto: il corpo è sempre nel presente, i pensieri no. Da lì si riparte." },
          { t: "Scrollare il telefono per distrarmi", ok: false, fb: "Distrae, ma non scarica la tensione: il corpo resta teso mentre la mente si riempie ancora." } ] },
        { type: "choice", title: "Domanda lampo", q: "Dove si accumula più spesso la tensione, senza che te ne accorga?", options: [
          { t: "Mandibola, spalle e mani", ok: true, fb: "Sì: sono i primi punti che si irrigidiscono. Controllarli spesso durante il giorno cambia molto." },
          { t: "Solo nella schiena", ok: false, fb: "La schiena risente, ma l’origine è spesso più in alto: mandibola e spalle." },
          { t: "Da nessuna parte, la tensione è solo mentale", ok: false, fb: "Mente e corpo viaggiano insieme: se uno si irrigidisce, anche l’altro." } ] },
        { type: "choice", title: "Domanda lampo", q: "Qual è il momento migliore per fare una pausa di respiro?", options: [
          { t: "Quando sono già al limite", ok: false, fb: "Funziona, ma è più difficile. Meglio prevenire." },
          { t: "In piccoli momenti ricorrenti: prima di una chiamata, in coda, appena sveglio", ok: true, fb: "Giusto: legare il respiro a gesti che già fai lo trasforma in abitudine." },
          { t: "Solo la sera prima di dormire", ok: false, fb: "La sera aiuta, ma la calma si costruisce anche durante il giorno." } ] }
      ],
      [
        { type: "timer", title: "Scansione del corpo", text: "Chiudi gli occhi se vuoi. Porta l’attenzione ai piedi, poi alle gambe, al bacino, alla pancia, al petto, alle spalle, al viso. Dove senti tensione, respira lì dentro.", seconds: 60, breath: BR.calmo },
        { type: "timer", title: "Rotazione del collo", text: "Lascia cadere il mento verso il petto e disegna lentamente un semicerchio da una spalla all’altra, senza forzare. Poi un lungo sospiro.", seconds: 45 },
        { type: "timer", title: "Tre cose che senti", text: "Resta fermo e nota: 3 cose che vedi, 3 suoni che senti, 3 contatti del corpo (sedia, piedi, vestiti). Riporta la mente al qui e ora.", seconds: 45 }
      ],
      [
        { type: "reflect", title: "Il tuo gesto di oggi", text: "Scegli UN piccolo gesto da ripetere oggi: per esempio tre respiri lenti prima di rispondere al telefono. Scrivilo qui (resta solo su questo schermo).", ph: "Il mio gesto: …" },
        { type: "reflect", title: "Il tuo segnale", text: "Quale parte del corpo ti avvisa per prima quando sei teso? Scrivila: sarà il tuo segnale per fermarti un istante.", ph: "Il mio segnale è …" },
        { type: "reflect", title: "Il tuo momento", text: "In quale momento della giornata di domani puoi inserire due minuti di respiro? Scegli ora l’orario.", ph: "Domani alle … prima di …" }
      ],
      [ rate("E adesso?", "Quanto ti senti teso ora? 1 = per niente, 5 = moltissimo.", "dopo") ]
    ],
    takeaway: "Il corpo si calma prima della mente: bastano pochi minuti, ripetuti ogni giorno."
  },

  /* ============ 2. VOCALIZZARE ============ */
  {
    id: "vocalizzare", title: "Vocalizzare", book: "La tua voce la tua presenza", color: "#5aaee8", bg: "#f6f3ee", ink: "#1e2a44",
    blurb: "Un riscaldamento vocale di cinque minuti: respiro, suono, dizione e un’ultima frase detta bene.",
    skill: "Scaldare la voce e dare presenza alle parole",
    slots: [
      [
        { type: "read", title: "Prima di cominciare", text: "In piedi, piedi alla larghezza delle spalle, ginocchia morbide, testa come tirata da un filo verso l’alto. La voce nasce dal corpo, non dalla gola." },
        { type: "read", title: "Prima di cominciare", text: "Bevi un sorso d’acqua e fai due sbadigli veri. Gola aperta, laringe bassa: è la posizione della voce piena e rilassata." }
      ],
      [
        { type: "timer", title: "Respiro che sostiene", text: "Mano sulla pancia. Inspira dal naso e senti la pancia che si gonfia, poi espira su un lungo «ssss» costante. Obiettivo: far durare il suono sempre di più.", seconds: 45, breath: BR.lungo },
        { type: "timer", title: "Il motorino", text: "Fai vibrare le labbra come un motorino («brrrr») su un’unica nota, poi sali e scendi come una sirena. Se le labbra non vibrano, sostienile con le dita sulle guance.", seconds: 45 },
        { type: "timer", title: "Il ronzio", text: "Labbra chiuse, fai un «mmmm» sentendo il solletico sul naso e sulle labbra. Sposta il suono dal petto alla fronte, poi di nuovo giù.", seconds: 45 }
      ],
      [
        { type: "timer", title: "Vocali piene", text: "Dì lentamente A – E – I – O – U, aprendo bene la bocca, come se parlassi a una persona in fondo a una sala. Ripeti più volte, ogni volta con più chiarezza.", seconds: 45 },
        { type: "timer", title: "Da piano a forte", text: "Dì «ciao, come stai?» sussurrando, poi a voce normale, poi più proiettata, senza gridare. Sentirai che il volume sale dal respiro, non dalla gola.", seconds: 45 },
        { type: "timer", title: "Una frase, tre emozioni", text: "Ripeti «Oggi è proprio una bella giornata» come se fossi felice, poi stanco, poi sicuro di te. Nota come cambia il suono.", seconds: 45 }
      ],
      [
        { type: "timer", title: "Scioglilingua: Trentatré trentini", text: "«Trentatré trentini entrarono a Trento tutti e trentatré trotterellando.» Prima lentissimo, poi più veloce, sempre chiaro. Le consonanti devono essere nitide.", seconds: 45 },
        { type: "timer", title: "Scioglilingua: Sopra la panca", text: "«Sopra la panca la capra campa, sotto la panca la capra crepa.» Esagera il movimento delle labbra. Ripeti finché non scorre.", seconds: 45 },
        { type: "timer", title: "Scioglilingua: Tre tigri", text: "«Tre tigri contro tre tigri.» Parti piano e accelera solo quando non sbagli più. La velocità viene dalla precisione.", seconds: 45 },
        { type: "timer", title: "Scioglilingua: Apelle", text: "«Apelle figlio di Apollo fece una palla di pelle di pollo; tutti i pesci vennero a galla per vedere la palla di pelle di pollo di Apelle.» Lentamente!", seconds: 45 }
      ],
      [
        { type: "choice", title: "Domanda lampo", q: "Qual è il segreto di una voce che arriva lontano senza sforzo?", options: [
          { t: "Spingere forte dalla gola", ok: false, fb: "Così ci si affatica e la voce si graffia. Il volume deve nascere dal respiro." },
          { t: "Respiro profondo e articolazione chiara", ok: true, fb: "Esatto: aria che sostiene e consonanti nitide fanno arrivare le parole." },
          { t: "Parlare molto in fretta", ok: false, fb: "La fretta mangia le parole. Rallentare aumenta la presenza." } ] },
        { type: "choice", title: "Domanda lampo", q: "Hai la voce che trema prima di parlare in pubblico. Cosa aiuta di più?", options: [
          { t: "Trattenere il fiato e sperare che passi", ok: false, fb: "Il fiato trattenuto peggiora il tremore." },
          { t: "Un’espirazione lunga prima di cominciare e una pausa", ok: true, fb: "Sì: espirare lungo calma il sistema e la pausa ti dà autorità." },
          { t: "Parlare più velocemente per finire prima", ok: false, fb: "Accelerare aumenta l’ansia e riduce la chiarezza." } ] },
        { type: "choice", title: "Domanda lampo", q: "Cosa comunica di più una pausa di un secondo prima di una frase importante?", options: [
          { t: "Insicurezza", ok: false, fb: "Al contrario: chi si prende il tempo sembra sicuro." },
          { t: "Presenza e attenzione per ciò che dici", ok: true, fb: "Giusto: la pausa dà peso alle parole e il tempo di ascoltare a chi ti ascolta." },
          { t: "Nulla, è tempo perso", ok: false, fb: "Le pause sono parte del messaggio quanto le parole." } ] }
      ],
      [
        { type: "timer", title: "Leggi ad alta voce", text: "Dì questa frase tre volte, ogni volta più lentamente e con una pausa dopo la virgola: «La mia voce è calma, chiara e presente.» Poi inventane una tua.", seconds: 45 },
        { type: "timer", title: "Presentati in 20 secondi", text: "Presentati ad alta voce come se fossi davanti a una platea: nome, cosa fai, una cosa che ti rende unico. Respira prima di cominciare e parla lentamente.", seconds: 60 },
        { type: "timer", title: "Racconta la tua giornata", text: "Racconta ad alta voce, a una persona immaginaria, una cosa bella accaduta oggi. Cura il tono, fai pause, sorridi mentre parli.", seconds: 60 }
      ],
      [
        { type: "reflect", title: "Come ti sembra la voce?", text: "Che differenza noti rispetto a cinque minuti fa? Più aperta, più calda, più chiara? Annotalo.", ph: "Ora la mia voce è …" },
        { type: "reflect", title: "Dove la userai?", text: "In quale conversazione di oggi o di domani userai questa voce? Scrivi persona e momento.", ph: "La userò con … quando …" }
      ]
    ],
    takeaway: "La voce si allena come un muscolo: pochi minuti al giorno valgono più di un’ora ogni tanto."
  },

  /* ============ 3. NON SO PARLARE ============ */
  {
    id: "parlare", title: "Non so parlare", book: "Ritrova la parola", color: "#d9849a", bg: "#e8eee5", ink: "#284438",
    blurb: "Un esercizio di parola per volta: un tema, una struttura semplice e un minuto per dirlo ad alta voce.",
    skill: "Dire quello che pensi con ordine e senza panico",
    slots: [
      [
        { type: "read", title: "Una regola per cominciare", text: "Non devi parlare bene, devi parlare. Il blocco nasce dal pretendere la frase perfetta: oggi puntiamo a una frase semplice e vera, detta ad alta voce." },
        { type: "read", title: "Una regola per cominciare", text: "Quando le parole non arrivano, respira e dì la cosa più semplice che pensi. Il silenzio di due secondi sembra lunghissimo a te, ma a chi ascolta sembra calma." }
      ],
      [
        { type: "timer", title: "Parla di una cosa che ami", text: "Parla ad alta voce per un minuto di un oggetto di casa che ami. Non fermarti: se perdi il filo, ripeti l’ultima parola e vai avanti.", seconds: 60 },
        { type: "timer", title: "Descrivi la tua mattina", text: "Racconta ad alta voce la tua mattina, dal risveglio a ora, come se parlassi a un amico. Anche i dettagli piccoli: sono quelli che fanno ascoltare.", seconds: 60 },
        { type: "timer", title: "Spiega come si fa", text: "Spiega a voce alta come si prepara il tuo piatto preferito, passo dopo passo. Usa «prima», «poi», «infine»: sono le parole che danno ordine.", seconds: 60 },
        { type: "timer", title: "Racconta un ricordo", text: "Racconta un ricordo felice. Parti da dove eri, chi c’era, cosa è successo, cosa hai provato. Quattro domande, una storia.", seconds: 60 }
      ],
      [
        { type: "read", title: "Metodo: Punto – Motivo – Esempio", text: "Quando devi dire la tua: 1) il punto («penso che…»), 2) il motivo («perché…»), 3) un esempio («per esempio…»). Tre frasi e hai già una risposta chiara." },
        { type: "read", title: "Metodo: Prima – Poi – Infine", text: "Per raccontare un fatto: prima cosa è successo, poi cosa è cambiato, infine cosa ne deriva. Tre tempi e la storia si regge da sola." },
        { type: "read", title: "Metodo: Le tre immagini", text: "Prima di parlare, immagina tre scene (un luogo, una persona, un oggetto) legate a ciò che vuoi dire e passa dall’una all’altra: non perderai il filo." }
      ],
      [
        { type: "timer", title: "Usa il metodo: la tua opinione", text: "Scegli un tema qualsiasi: i social, il lavoro da casa, le vacanze. Dì ad alta voce la tua opinione con il metodo appena visto, per un minuto.", seconds: 60 },
        { type: "timer", title: "Usa il metodo: un consiglio", text: "Dai ad alta voce un consiglio che daresti a un amico che inizia un nuovo lavoro: punto, motivo, esempio.", seconds: 60 },
        { type: "timer", title: "Usa il metodo: un ringraziamento", text: "Ringrazia ad alta voce una persona (anche immaginaria): cosa ha fatto, perché per te conta, un episodio concreto.", seconds: 60 }
      ],
      [
        { type: "choice", title: "Che cosa fai?", q: "Sei a una riunione e ti si svuota la mente a metà frase. Cosa fai?", options: [
          { t: "Mi scuso più volte e smetto di parlare", ok: false, fb: "Scusarsi troppo amplifica l’imbarazzo." },
          { t: "Respiro, ripeto l’ultima frase e riprendo", ok: true, fb: "Perfetto: ripetere l’ultima frase ti ridà il filo e passa per naturale." },
          { t: "Parlo velocissimo per riempire il vuoto", ok: false, fb: "Più veloce significa meno chiaro. Meglio una pausa." } ] },
        { type: "choice", title: "Che cosa fai?", q: "Devi dire «no» a una richiesta senza sembrare scortese. Qual è la formula migliore?", options: [
          { t: "«Grazie di avermelo chiesto, ma questa volta non posso»", ok: true, fb: "Sì: gratitudine, chiarezza e nessuna giustificazione infinita." },
          { t: "Un lungo discorso di scuse e motivi", ok: false, fb: "Più spieghi, più dai appigli per insistere." },
          { t: "Evitare la risposta finché non lo dimentica", ok: false, fb: "L’evitamento aumenta la tensione per entrambi." } ] },
        { type: "choice", title: "Che cosa fai?", q: "Parli con qualcuno che ti interrompe sempre. Qual è la mossa più efficace?", options: [
          { t: "Alzare la voce", ok: false, fb: "Si crea una gara, non un dialogo." },
          { t: "Fare una pausa e dire con calma «Lasciami finire, poi ti ascolto»", ok: true, fb: "Giusto: tono calmo e frase breve, la fermezza passa dal modo, non dal volume." },
          { t: "Smettere di parlare", ok: false, fb: "Così gli lasci tutto lo spazio." } ] }
      ],
      [
        { type: "reflect", title: "La tua frase", text: "Scrivi la frase più importante che oggi vorresti dire a qualcuno e non hai ancora detto.", ph: "Vorrei dire a … che …" },
        { type: "reflect", title: "Il tuo prossimo passo", text: "Quale situazione ti blocca di più (riunione, telefono, famiglia, sconosciuti)? Scegli la prima da allenare questa settimana.", ph: "Questa settimana alleno …" }
      ]
    ],
    takeaway: "Parlare si impara parlando: una frase semplice detta ad alta voce vale più di dieci pensate in silenzio."
  },

  /* ============ 4. MI SERVONO SOLDI ============ */
  {
    id: "soldi", title: "Mi servono soldi", book: "I tuoi soldi il tuo benessere", color: "#fdd400", bg: "#fdd400", ink: "#111",
    blurb: "Scenari quotidiani, una mini-regola e un piccolo calcolo per prendere in mano i tuoi soldi.",
    skill: "Gestire il denaro con calma e metodo",
    slots: [
      [
        { type: "read", title: "Un punto di partenza", text: "I soldi non sono il problema: lo è non sapere dove vanno. Oggi non cerchiamo di guadagnare di più, ma di vedere con chiarezza ciò che già passa dalle tue mani." },
        { type: "read", title: "Un punto di partenza", text: "Non servono formule complicate. Servono tre abitudini: guardare le entrate e le uscite, pagare prima te stesso (risparmio), decidere prima di comprare." }
      ],
      [
        { type: "choice", title: "Scenario", q: "Arriva lo stipendio. Qual è la mossa più solida?", options: [
          { t: "Spendere, e risparmiare ciò che resta a fine mese", ok: false, fb: "Di solito non resta niente. Il risparmio va deciso all’inizio." },
          { t: "Mettere subito da parte una quota fissa, poi spendere il resto", ok: true, fb: "Esatto: «paga prima te stesso». Anche il 5% costruisce l’abitudine." },
          { t: "Tenere tutto sul conto per ogni evenienza", ok: false, fb: "Un conto fermo non lavora e si consuma con le piccole spese." } ] },
        { type: "choice", title: "Scenario", q: "Vedi un’offerta «imperdibile». Cosa fai?", options: [
          { t: "Compro subito, scade tra un’ora", ok: false, fb: "L’urgenza è fatta apposta per non farti ragionare." },
          { t: "Aspetto 24 ore: se la voglio ancora e rientra nel budget, compro", ok: true, fb: "Giusto: la regola delle 24 ore elimina gli acquisti d’impulso." },
          { t: "Compro, tanto è uno sconto", ok: false, fb: "Uno sconto su ciò che non serve resta una spesa." } ] },
        { type: "choice", title: "Scenario", q: "Hai una spesa imprevista di 300 euro e nessun margine. Cosa ti avrebbe protetto?", options: [
          { t: "Un fondo di emergenza di qualche mese di spese", ok: true, fb: "Sì: è il primo mattone della serenità economica." },
          { t: "Una carta di credito in più", ok: false, fb: "Spostare il debito non lo risolve." },
          { t: "Sperare che non succeda", ok: false, fb: "Gli imprevisti arrivano sempre: la questione è se sei pronto." } ] }
      ],
      [
        { type: "timer", title: "Fotografia delle uscite", text: "Per un minuto elenca (su carta o a mente) le tue cinque spese più grandi dell’ultimo mese. Senza giudicarti: serve solo vederle.", seconds: 60 },
        { type: "timer", title: "Caccia agli abbonamenti", text: "Per un minuto ripassa gli abbonamenti e i pagamenti ricorrenti: streaming, app, palestra, assicurazioni. Quanti ne usi davvero?", seconds: 60 },
        { type: "timer", title: "Le spese fantasma", text: "Pensa a una piccola spesa che fai ogni giorno (caffè, snack, app). Moltiplicala per 365: quanto costa in un anno? Scrivi il numero.", seconds: 60 }
      ],
      [
        { type: "read", title: "Regola da ricordare", text: "50 – 30 – 20: circa metà del reddito per i bisogni, il 30% per i desideri, il 20% per risparmio o debiti. Non è una legge: è un punto da cui partire e adattare." },
        { type: "read", title: "Regola da ricordare", text: "Il denaro ha tre compiti: farti vivere oggi, proteggerti domani, aiutarti a realizzare i sogni. Se uno dei tre manca, lo squilibrio si sente." },
        { type: "read", title: "Regola da ricordare", text: "Il tuo valore non coincide con il tuo conto in banca. Una relazione serena con i soldi parte da come ne parli a te stesso." }
      ],
      [
        { type: "choice", title: "Quale scelta?", q: "Hai 100 euro in più questo mese. Quale uso è più utile a lungo termine?", options: [
          { t: "Una cena fuori, me la merito", ok: false, fb: "Un premio ogni tanto va bene, ma non è la prima priorità." },
          { t: "Metà al fondo di emergenza, metà a un piccolo premio", ok: true, fb: "Un equilibrio sano: costruisci sicurezza senza rinunciare al piacere." },
          { t: "Tutto in un investimento di cui ho sentito parlare", ok: false, fb: "Senza fondo di emergenza e conoscenza, è un azzardo." } ] },
        { type: "choice", title: "Quale scelta?", q: "Un amico ti propone un «affare sicuro» con guadagni garantiti. Cosa fai?", options: [
          { t: "Verifico, mi informo e se non capisco non investo", ok: true, fb: "Giusto: nessun guadagno è garantito. Se non lo capisci, non è per te." },
          { t: "Entro subito, ci credo", ok: false, fb: "La fretta e la promessa di sicurezza sono i segnali tipici delle truffe." },
          { t: "Presto soldi per fargli un favore", ok: false, fb: "Mai prestare ciò che non puoi permetterti di perdere." } ] }
      ],
      [
        { type: "reflect", title: "Il tuo prossimo gesto", text: "Scegli UNA piccola azione da fare entro domani: disdire un abbonamento, aprire un salvadanaio, annotare le spese di oggi. Scrivila.", ph: "Entro domani io …" },
        { type: "reflect", title: "Il tuo obiettivo", text: "Per cosa vorresti mettere da parte dei soldi? Dai un nome e una cifra approssimativa: un obiettivo chiaro aiuta a risparmiare.", ph: "Voglio arrivare a … per …" }
      ]
    ],
    takeaway: "Non serve guadagnare di più per star meglio: serve sapere dove vanno i soldi e decidere prima."
  },

  /* ============ 5. MI ANNOIO ============ */
  {
    id: "noia", title: "Mi annoio", book: "La noia il vero motore della vita", color: "#e8892f", bg: "#f3ede2", ink: "#1e2a44",
    blurb: "La noia non è un nemico: cinque minuti per trasformarla in curiosità, idee e una piccola sfida.",
    skill: "Trasformare la noia in energia creativa",
    slots: [
      [
        { type: "read", title: "Benvenuto nella noia", text: "La noia è il segnale che la mente vuole qualcosa di nuovo. Se la copri subito con lo schermo, perdi l’idea che stava per arrivare. Oggi la ascoltiamo." },
        { type: "read", title: "Benvenuto nella noia", text: "Chi non si annoia mai, non si ferma mai: e chi non si ferma, non scopre cosa vuole davvero. Cinque minuti per cambiare sguardo." }
      ],
      [
        { type: "timer", title: "Due minuti di niente", text: "Lascia il telefono, siediti e non fare nulla per un minuto. Non meditare, non pianificare: lascia che la mente vaghi. Nota dove va.", seconds: 60 },
        { type: "timer", title: "Guarda come la prima volta", text: "Scegli un oggetto vicino a te e osservalo come se non l’avessi mai visto: forma, colori, materiale, storia. Cerca cinque dettagli nuovi.", seconds: 60 },
        { type: "timer", title: "Ascolta i suoni", text: "Chiudi gli occhi e conta tutti i suoni che riesci a distinguere: vicini, lontani, continui, improvvisi. Quanti ne trovi?", seconds: 60 }
      ],
      [
        { type: "timer", title: "Lista di cose che vorresti provare", text: "In un minuto elenca (a mente o su carta) più cose che puoi: luoghi, corsi, ricette, giochi, persone da chiamare. Senza filtro.", seconds: 60 },
        { type: "timer", title: "E se…?", text: "Scegli un oggetto o un compito noioso e invece di subirlo, inventa tre modi diversi di farlo. Anche assurdi. Meglio assurdi.", seconds: 60 },
        { type: "timer", title: "Scrivi per un minuto", text: "Prendi un foglio e scrivi di seguito, senza fermarti, tutto ciò che ti passa per la testa. Non rileggere: serve solo a svuotare e a far uscire idee.", seconds: 60 }
      ],
      [
        { type: "choice", title: "Domanda lampo", q: "Ti annoi e hai il telefono in mano. Qual è la mossa più utile?", options: [
          { t: "Scorrere i social finché passa", ok: false, fb: "Anestetizza la noia ma non ne ricava niente." },
          { t: "Aspettare un attimo e chiedermi che cosa mi manca davvero", ok: true, fb: "Esatto: la noia è una domanda. Ascoltala prima di zittirla." },
          { t: "Mangiare qualcosa per riempire il tempo", ok: false, fb: "Spesso non è fame, è bisogno di stimoli." } ] },
        { type: "choice", title: "Domanda lampo", q: "Quando nascono più spesso le idee migliori?", options: [
          { t: "Quando sono super occupato", ok: false, fb: "L’agenda piena lascia poco spazio alla mente." },
          { t: "Quando cammino, mi lavo o aspetto: momenti «vuoti»", ok: true, fb: "Sì: la mente libera collega cose lontane. È il lato creativo della noia." },
          { t: "Solo davanti allo schermo", ok: false, fb: "Gli schermi riempiono, raramente generano." } ] },
        { type: "choice", title: "Domanda lampo", q: "Che differenza c’è tra annoiarsi e perdere tempo?", options: [
          { t: "Nessuna", ok: false, fb: "Annoiarsi con consapevolezza è un investimento." },
          { t: "Annoiarsi ascoltandosi porta a nuove scelte, perdere tempo no", ok: true, fb: "Giusto: la differenza è l’attenzione che ci metti." },
          { t: "Perdere tempo è più piacevole", ok: false, fb: "Dà sollievo subito, ma resta il vuoto." } ] }
      ],
      [
        { type: "pick", title: "Scegli la tua micro-sfida", text: "Prendi UNA sfida e falla entro oggi.", options: [
          { t: "Cammina 10 minuti senza telefono" }, { t: "Chiama una persona che non senti da tempo" },
          { t: "Cucina qualcosa che non hai mai provato" }, { t: "Impara 5 parole di un’altra lingua" },
          { t: "Riordina un solo cassetto con musica a volume alto" }, { t: "Scrivi a mano una pagina su com’è andata la giornata" } ] },
        { type: "pick", title: "Scegli la tua micro-sfida", text: "Prendi UNA sfida e falla entro oggi.", options: [
          { t: "Esci e fai una foto a 5 cose che non avevi mai notato" }, { t: "Disegna qualcosa anche se «non sai disegnare»" },
          { t: "Suona o canta una canzone che ami" }, { t: "Fai una passeggiata in una strada nuova" },
          { t: "Proponi a qualcuno un gioco da tavolo" }, { t: "Impara un piccolo trucco di magia" } ] }
      ],
      [
        { type: "reflect", title: "Cosa è emerso?", text: "Cosa ti è venuto in mente durante questi minuti di «niente»? Una persona, un desiderio, una paura, un’idea? Scrivilo.", ph: "Mi è venuto in mente …" },
        { type: "reflect", title: "Dove ti annoi di più?", text: "In quale momento della giornata ti annoi più spesso? Quel momento è un’occasione: cosa potresti metterci?", ph: "Mi annoio quando … potrei …" }
      ]
    ],
    takeaway: "La noia è un messaggio: se la ascolti, ti indica la direzione."
  },

  /* ============ 6. NON SO COSA VOGLIO ============ */
  {
    id: "voglio", title: "Non so cosa voglio", book: "Tutti e cinque i libri", color: "#5aaee8", bg: "#10142e", ink: "#fff",
    blurb: "Un percorso che attraversa corpo, voce, parola, soldi e noia per capire da dove ripartire.",
    skill: "Fare chiarezza su di sé e scegliere un passo",
    slots: [
      [ rate("Quanta energia hai oggi?", "1 = pochissima, 5 = tantissima.", "energia") ],
      [
        { type: "timer", title: "Fermati e respira", text: "Per capire cosa vuoi devi prima fare silenzio. Respira lento per un minuto: niente decisioni, solo presenza.", seconds: 60, breath: BR.calmo },
        { type: "timer", title: "Ascolta il corpo", text: "Chiudi gli occhi e chiediti: «Cosa mi manca davvero?». Aspetta una risposta del corpo (un peso, un calore, una spinta). Non cercare la risposta giusta.", seconds: 60 }
      ],
      [
        { type: "reflect", title: "Una giornata perfetta", text: "Immagina una giornata ideale tra un anno. Dove sei? Con chi? Cosa fai nelle prime tre ore? Scrivi i dettagli.", ph: "Mi sveglio a … faccio …" },
        { type: "reflect", title: "Ti invidio perché…", text: "Di chi hai un pizzico di invidia? L’invidia indica un desiderio. Che cosa fa quella persona che tu vorresti fare?", ph: "Mi piacerebbe fare come … perché …" },
        { type: "reflect", title: "Cosa non vuoi più", text: "Spesso si capisce cosa si vuole partendo da ciò che non si vuole più. Scrivi tre cose da lasciare andare.", ph: "Non voglio più …" }
      ],
      [
        { type: "pick", title: "Dove vuoi lavorare oggi?", text: "Scegli l’area in cui senti più bisogno di cambiare. Ti consiglierò il gioco più adatto.", options: [
          { t: "Sono teso e stanco", go: "rilassarmi" }, { t: "Voglio una voce più sicura", go: "vocalizzare" },
          { t: "Mi blocco quando devo parlare", go: "parlare" }, { t: "Voglio mettere ordine nei soldi", go: "soldi" },
          { t: "Mi sento in un loop e annoiato", go: "noia" } ] }
      ],
      [
        { type: "choice", title: "Domanda lampo", q: "Non sai cosa vuoi. Qual è il primo passo più piccolo?", options: [
          { t: "Aspettare che arrivi un segno", ok: false, fb: "Il segno arriva più spesso mentre ti muovi." },
          { t: "Fare un piccolo esperimento, anche imperfetto", ok: true, fb: "Esatto: si scopre cosa si vuole provandolo, non pensandolo." },
          { t: "Chiedere a tutti cosa farebbero al mio posto", ok: false, fb: "Le opinioni degli altri aiutano, ma la direzione è tua." } ] },
        { type: "choice", title: "Domanda lampo", q: "Quando sei in dubbio, cosa ti dà più informazioni?", options: [
          { t: "Come reagisce il mio corpo quando immagino le due strade", ok: true, fb: "Sì: tensione o leggerezza sono dati preziosi." },
          { t: "Fare una lista infinita di pro e contro", ok: false, fb: "Può servire, ma da sola spesso aumenta la confusione." },
          { t: "Rimandare la decisione", ok: false, fb: "Rimandare è una scelta, di solito la meno informata." } ] }
      ],
      [
        { type: "timer", title: "Dillo a voce alta", text: "Completa ad alta voce la frase «Quello che mi piacerebbe davvero è…» almeno cinque volte, con finali diversi. Ascolta quale suona più vero.", seconds: 60 },
        { type: "timer", title: "Scrivi per un minuto", text: "Scrivi senza fermarti ciò che vorresti iniziare, smettere o cambiare. Poi sottolinea la parola che si ripete di più.", seconds: 60 }
      ],
      [
        { type: "reflect", title: "Il tuo prossimo passo", text: "Scegli UN piccolo passo (di 10 minuti) da fare entro 48 ore verso ciò che hai scoperto.", ph: "Entro due giorni io …" }
      ],
      [ rate("E adesso?", "Quanta energia hai ora? 1 = pochissima, 5 = tantissima.", "energia2") ]
    ],
    takeaway: "Non serve sapere tutto: serve un primo passo piccolo e vero."
  }
  ];
})();
