/* Disegna e indovina: parole in 4 fasce di difficoltà (1, 2, 3 e 5 punti). */
window.TAVOLO_DIS = {
  levels: [
    { name: "Facile", pts: 1 }, { name: "Media", pts: 2 }, { name: "Difficile", pts: 3 }, { name: "Quasi impossibile", pts: 5 }
  ],
  words: [
    /* facile */
    ["Sole", "Luna", "Stella", "Casa", "Albero", "Fiore", "Gatto", "Cane", "Pesce", "Uccello", "Mela", "Banana", "Pizza", "Gelato", "Palla", "Auto", "Bicicletta", "Barca", "Aereo", "Treno",
     "Nuvola", "Pioggia", "Montagna", "Mare", "Cuore", "Occhio", "Mano", "Piede", "Naso", "Bocca", "Orecchio", "Scarpa", "Cappello", "Maglietta", "Occhiali", "Orologio", "Telefono", "Libro", "Matita", "Chiave",
     "Porta", "Finestra", "Letto", "Sedia", "Tavolo", "Bicchiere", "Forchetta", "Cucchiaio", "Torta", "Uovo", "Ombrello", "Candela", "Regalo", "Palloncino", "Corona", "Fungo", "Carota", "Cavallo", "Mucca", "Maiale",
     "Pecora", "Coniglio", "Serpente", "Rana", "Ape", "Farfalla", "Ragno", "Tartaruga", "Elefante", "Giraffa", "Scimmia", "Orso", "Leone", "Pinguino", "Fantasma", "Robot"],
    /* media */
    ["Pirata", "Vampiro", "Sirena", "Dinosauro", "Astronauta", "Cavaliere", "Mago", "Principessa", "Drago", "Unicorno", "Ponte", "Castello", "Faro", "Lampadario", "Frigorifero", "Lavatrice", "Aspirapolvere", "Spazzolino", "Forbici", "Martello",
     "Chitarra", "Pianoforte", "Tamburo", "Microfono", "Fotocamera", "Televisione", "Computer", "Cuffie", "Pallone da calcio", "Racchetta da tennis", "Canestro", "Sciatore", "Surfista", "Pescatore", "Cuoco", "Pompiere", "Dottore", "Poliziotto", "Pagliaccio", "Mago e coniglio",
     "Igloo", "Tenda", "Falò", "Zaino", "Bussola", "Mappa del tesoro", "Vulcano", "Arcobaleno", "Fulmine", "Neve", "Pupazzo di neve", "Albero di Natale", "Babbo Natale", "Zucca di Halloween", "Uovo di Pasqua", "Carro armato", "Elicottero", "Sottomarino", "Razzo", "Montgolfiera",
     "Gelato al cono", "Hamburger", "Spaghetti", "Caffè", "Bottiglia di vino", "Cocomero", "Ananas", "Peperoncino", "Panino", "Biscotto", "Salvadanaio", "Lucchetto", "Calendario", "Termometro", "Bilancia", "Giostra"],
    /* difficile */
    ["Compleanno", "Matrimonio", "Vacanza", "Silenzio", "Traffico", "Sciopero", "Insonnia", "Mal di testa", "Fretta", "Pigrizia", "Onda anomala", "Terremoto", "Eclissi", "Aurora boreale", "Tempesta di sabbia", "Allergia", "Starnuto", "Solletico", "Brivido", "Imbarazzo",
     "Raffreddore", "Dieta", "Palestra", "Yoga", "Sauna", "Cena a lume di candela", "Aperitivo", "Pic-nic", "Campeggio", "Traslocare", "Fila alla cassa", "Ingorgo", "Fuga di notizie", "Tradimento", "Segreto", "Bugia", "Fortuna", "Sfortuna", "Gelosia", "Nostalgia",
     "Giardiniere", "Elettricista", "Idraulico", "Bibliotecario", "Archeologo", "Equilibrista", "Domatore", "Ballerina di danza classica", "Fachiro", "Giocoliere", "Sveglia che suona", "Parcheggio", "Telecomando", "Wi-Fi", "Batteria scarica", "Selfie", "Videochiamata", "Password", "Carta di credito", "Codice a barre",
     "Fuso orario", "Pronto soccorso", "Spazzatura differenziata", "Raccolta delle olive", "Vendemmia", "Carnevale", "Capodanno", "Lista della spesa", "Cambiare una gomma", "Montare un mobile"],
    /* quasi impossibile */
    ["Democrazia", "Inflazione", "Reputazione", "Burocrazia", "Gravità", "Eternità", "Coincidenza", "Deja vu", "Ironia", "Vergogna", "Libertà", "Giustizia", "Privacy", "Algoritmo", "Fotosintesi", "Evoluzione", "Relatività", "Buco nero", "Effetto serra", "Intelligenza artificiale",
     "Criptovaluta", "Cloud", "Realtà virtuale", "Fake news", "Stress", "Maleducazione", "Fiducia", "Rimpianto", "Coraggio", "Speranza", "Perdono", "Ingenuità", "Ossessione", "Nostalgia di casa", "Curiosità", "Coincidenza fortunata", "Prima impressione", "Seconda possibilità", "Effetto farfalla", "Sindrome dell'impostore",
     "Tasse", "Mutuo", "Assicurazione", "Fallimento", "Contratto", "Eredità", "Stipendio", "Sciopero generale", "Referendum", "Elezioni", "Diplomazia", "Neutralità", "Rivoluzione", "Rinascimento", "Medioevo", "Preistoria", "Fuga di cervelli", "Globalizzazione", "Sostenibilità", "Riciclo",
     "Metafora", "Sinonimo", "Proverbio", "Barzelletta", "Colpo di scena", "Finale aperto", "Spoiler", "Tormentone", "Cliffhanger", "Pettegolezzo"]
  ]
};
