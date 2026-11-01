// Configurazione
const CONFIG = {
    giorni: 24,
    limitiMB: { foto: 15, audio: 10, video: 30 },
    foto: { lato: 1600, qualita: 0.8 }
};

const TIPI = {
    foto: { icona: '🖼️', nome: 'Foto' },
    messaggio: { icona: '💬', nome: 'Messaggio' },
    audio: { icona: '🎵', nome: 'Audio' },
    video: { icona: '🎬', nome: 'Video' },
    youtube: { icona: '📺', nome: 'YouTube' },
    vocale: { icona: '🎤', nome: 'Vocale' }
};

const parametri = new URLSearchParams(location.search);
const ID = parametri.get('c');
const CHIAVE = parametri.get('k');

let calendario = null;
let giornoCorrente = null;
let raccogliContenuto = null; // Lo imposta l'editor del tipo scelto
let urlDaRimuovere = [];
let salvataggioInCorso = false;

// ========== FUNZIONI DI SUPPORTO ==========

const $ = id => document.getElementById(id);

function crea(tag, proprieta = {}, ...figli) {
    const elemento = Object.assign(document.createElement(tag), proprieta);
    elemento.append(...figli);
    return elemento;
}

function mostraMessaggio(testo, tipo = 'info') {
    const avviso = $('avviso');
    const inModal = $('modal').classList.contains('mostra');
    (inModal ? $('modal-corpo').parentElement : document.body).insertBefore(avviso, inModal ? $('modal-corpo') : $('griglia'));
    avviso.textContent = testo;
    avviso.className = `messaggio-stato messaggio-${tipo}`;
    avviso.hidden = false;
    clearTimeout(mostraMessaggio.timer);
    mostraMessaggio.timer = setTimeout(() => { avviso.hidden = true; }, 5000);
}

async function chiamaApi(url, opzioni) {
    const risposta = await fetch(url, opzioni);
    const dati = await risposta.json().catch(() => ({}));
    if (!risposta.ok) throw new Error(dati.errore || 'Qualcosa non ha funzionato. Riprova.');
    return dati;
}

function leggiMemoria(chiave, predefinito) {
    try {
        return JSON.parse(localStorage.getItem(chiave)) ?? predefinito;
    } catch {
        return predefinito;
    }
}

function scriviMemoria(chiave, valore) {
    try {
        localStorage.setItem(chiave, JSON.stringify(valore));
    } catch {
        // Solo una comodità: senza memoria il sito funziona lo stesso
    }
}

// ========== AUDIO NATALIZIO ==========
// Tutti i suoni nascono nel browser, così non dipendono da file esterni

const NOTE = { C: 523.25, D: 587.33, E: 659.25, F: 698.46, G: 783.99 };
const JINGLE_BELLS = [
    ['E', 1], ['E', 1], ['E', 2], ['E', 1], ['E', 1], ['E', 2],
    ['E', 1], ['G', 1], ['C', 1.5], ['D', 0.5], ['E', 4],
    ['F', 1], ['F', 1], ['F', 1.5], ['F', 0.5], ['F', 1], ['E', 1], ['E', 1], ['E', 0.5], ['E', 0.5],
    ['E', 1], ['D', 1], ['D', 1], ['E', 1], ['D', 2], ['G', 2]
];
const BATTITO = 0.3;

let audioContesto = null;
let musicaTimer = null;

function contestoAudio() {
    audioContesto ??= new (window.AudioContext || window.webkitAudioContext)();
    return audioContesto;
}

function suonaNota(frequenza, inizio, durata, volume) {
    const contesto = contestoAudio();
    const oscillatore = contesto.createOscillator();
    const inviluppo = contesto.createGain();
    oscillatore.type = 'sine';
    oscillatore.frequency.value = frequenza;
    inviluppo.gain.setValueAtTime(volume, inizio);
    inviluppo.gain.exponentialRampToValueAtTime(0.001, inizio + durata);
    oscillatore.connect(inviluppo).connect(contesto.destination);
    oscillatore.start(inizio);
    oscillatore.stop(inizio + durata);
}

function suonaGiro() {
    let tempo = contestoAudio().currentTime + 0.05;
    for (const [nota, battiti] of JINGLE_BELLS) {
        suonaNota(NOTE[nota], tempo, battiti * BATTITO * 1.6, 0.12);
        tempo += battiti * BATTITO;
    }
    musicaTimer = setTimeout(suonaGiro, (tempo - contestoAudio().currentTime) * 1000);
}

function toggleAudio() {
    const pulsante = $('btnAudio');
    if (musicaTimer) {
        clearTimeout(musicaTimer);
        musicaTimer = null;
        contestoAudio().suspend();
        pulsante.textContent = '🎵 Attiva Musica';
        pulsante.classList.remove('attivo');
        return;
    }
    contestoAudio().resume().then(suonaGiro);
    pulsante.textContent = '🔇 Disattiva Musica';
    pulsante.classList.add('attivo');
}

function suonoAperturaCasella() {
    const contesto = contestoAudio();
    contesto.resume();
    [1046.5, 1318.5, 1568].forEach((frequenza, indice) => {
        suonaNota(frequenza, contesto.currentTime + indice * 0.09, 0.5, 0.1);
    });
}

// ========== CONTENUTI ==========

function estraiIdYouTube(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    return url.match(regex)?.[1] ?? null;
}

function creaContenuto(giorno, dati) {
    switch (dati.tipo) {
        case 'messaggio':
            return crea('div', { className: 'contenuto-messaggio', textContent: dati.testo });
        case 'foto':
            return crea('div', { className: 'contenuto-immagine' },
                crea('img', { src: dati.url, alt: `Immagine del ${giorno} dicembre` }));
        case 'audio':
            return crea('div', { className: 'contenuto-audio' }, crea('audio', { controls: true, src: dati.url }));
        case 'vocale':
            return crea('div', { className: 'contenuto-audio' },
                crea('audio', { controls: true, src: dati.url }), crea('p', { textContent: '🎤 Messaggio vocale' }));
        case 'video':
            return crea('div', { className: 'contenuto-video' },
                crea('video', { controls: true, playsInline: true, src: dati.url }));
        case 'youtube':
            return crea('div', { className: 'contenuto-video' }, crea('iframe', {
                src: `https://www.youtube-nocookie.com/embed/${dati.video}`,
                title: `Video del ${giorno} dicembre`,
                allowFullscreen: true
            }));
    }
    return crea('p');
}

function apriFinestra(titolo) {
    $('modal-titolo').textContent = titolo;
    $('modal').classList.add('mostra');
    $('btnChiudi').focus();
}

function chiudiModal() {
    // Svuotare ferma anche audio, video e YouTube
    $('modal-corpo').replaceChildren();
    $('editor-campi').replaceChildren();
    $('editor-campi').hidden = true;
    $('avviso').hidden = true;
    $('modal').classList.remove('mostra');
    fermaRegistrazione();
    giornoCorrente = null;
    raccogliContenuto = null;
}

// ========== VISTA DI CHI RICEVE IL LINK ==========

function apriGiorno(giorno) {
    suonoAperturaCasella();
    const dati = calendario.giorni[giorno];
    $('editor').hidden = true;
    $('btnSalva').hidden = true;
    $('btnElimina').hidden = true;
    $('modal-corpo').replaceChildren(dati
        ? creaContenuto(giorno, dati)
        : crea('p', { className: 'nessun-contenuto', textContent: 'Oggi la sorpresa è solo un sorriso 🎄' }));
    apriFinestra(`${giorno} dicembre`);
}

function testoAttesa() {
    return calendario.aperti === 0 ? `Si apre il 1° dicembre ${calendario.anno}` : 'Ogni giorno si apre una nuova casella';
}

// ========== GRIGLIA ==========

function disegnaGriglia() {
    const griglia = $('griglia');
    griglia.hidden = false;
    griglia.replaceChildren();
    const modifica = Boolean(calendario.modifica);

    for (let giorno = 1; giorno <= CONFIG.giorni; giorno++) {
        const chiusa = !modifica && giorno > calendario.aperti;
        const piena = modifica && calendario.giorni[giorno];
        const pulsante = crea('button', { type: 'button', className: 'pulsante' },
            crea('span', { className: 'numero-giorno', textContent: giorno }),
            crea('span', { className: 'data-giorno', textContent: chiusa ? '🔒' : 'dicembre' }));
        pulsante.classList.toggle('contenutoSalvato', Boolean(piena) || (!modifica && !chiusa));
        pulsante.classList.toggle('chiusa', chiusa);
        pulsante.addEventListener('click', () => {
            if (modifica) apriEditor(giorno);
            else if (chiusa) mostraMessaggio(`Pazienza! Questa casella si apre il ${giorno} dicembre.`);
            else apriGiorno(giorno);
        });
        griglia.append(pulsante);
    }

    if (modifica) {
        const pieni = Object.keys(calendario.giorni).length;
        $('stato-riempimento').textContent = `Caselle riempite: ${pieni} su ${CONFIG.giorni}. Chi riceve il link vede ogni casella solo dal suo giorno.`;
    }
}

// ========== EDITOR ==========

function apriEditor(giorno) {
    giornoCorrente = giorno;
    const dati = calendario.giorni[giorno];
    $('editor').hidden = false;
    $('btnSalva').hidden = false;
    $('btnSalva').disabled = true;
    $('btnElimina').hidden = !dati;
    $('modal-corpo').replaceChildren(dati
        ? creaContenuto(giorno, dati)
        : crea('p', { className: 'nessun-contenuto', textContent: 'Nessun contenuto salvato per questo giorno' }));
    apriFinestra(`${giorno} dicembre`);
}

function pronto(funzioneRaccolta) {
    raccogliContenuto = funzioneRaccolta;
    $('btnSalva').disabled = !funzioneRaccolta;
}

function scegliTipo(tipo) {
    pronto(null);
    fermaRegistrazione();
    const campi = $('editor-campi');
    campi.hidden = false;
    campi.replaceChildren();
    ({
        foto: () => editorFile(campi, 'foto', 'image/jpeg,image/png,image/gif,image/webp', `Foto fino a ${CONFIG.limitiMB.foto} MB. Viene ridotta prima del caricamento.`),
        audio: () => editorFile(campi, 'audio', 'audio/*', `File audio fino a ${CONFIG.limitiMB.audio} MB.`),
        video: () => editorFile(campi, 'video', 'video/mp4,video/webm,video/quicktime', `MP4 o WEBM fino a ${CONFIG.limitiMB.video} MB. Per i video lunghi usa YouTube.`),
        messaggio: () => editorMessaggio(campi),
        youtube: () => editorYouTube(campi),
        vocale: () => editorVocale(campi)
    })[tipo]();
}

function editorFile(campi, tipo, accetta, spiegazione) {
    const input = crea('input', { type: 'file', accept: accetta, id: `file-${tipo}` });
    const anteprima = crea('p', { className: 'upload-info', textContent: spiegazione });
    input.addEventListener('change', () => {
        const file = input.files[0];
        pronto(null);
        if (!file) return;
        if (file.size > CONFIG.limitiMB[tipo] * 1024 * 1024) {
            anteprima.textContent = `File troppo grande: il massimo è ${CONFIG.limitiMB[tipo]} MB.`;
            return;
        }
        anteprima.textContent = `Scelto: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB). Ora premi Salva.`;
        pronto(() => caricaFile(tipo, file));
    });
    campi.append(crea('h4', { textContent: `${TIPI[tipo].icona} Carica ${TIPI[tipo].nome}` }), input, anteprima);
}

function editorMessaggio(campi) {
    const testo = crea('textarea', { rows: 6, maxLength: 5000, placeholder: 'Scrivi qui il tuo messaggio speciale...' });
    const attuale = calendario.giorni[giornoCorrente];
    if (attuale?.tipo === 'messaggio') testo.value = attuale.testo;
    const aggiorna = () => pronto(testo.value.trim() ? async () => ({ tipo: 'messaggio', testo: testo.value.trim() }) : null);
    testo.addEventListener('input', aggiorna);
    aggiorna();
    campi.append(crea('h4', { textContent: '💬 Scrivi il tuo messaggio' }), testo);
    testo.focus();
}

function editorYouTube(campi) {
    const url = crea('input', { type: 'url', placeholder: 'https://www.youtube.com/watch?v=...' });
    const nota = crea('p', { className: 'upload-info', textContent: 'Incolla il link del video.' });
    url.addEventListener('input', () => {
        const video = estraiIdYouTube(url.value.trim());
        nota.textContent = video || !url.value ? 'Incolla il link del video.' : 'Questo non sembra un link di YouTube.';
        pronto(video ? async () => ({ tipo: 'youtube', video }) : null);
    });
    campi.append(crea('h4', { textContent: '📺 Video YouTube' }), url, nota);
}

// === MESSAGGIO VOCALE ===
let registratore = null;
let timerRegistrazione = null;

function editorVocale(campi) {
    const pulsante = crea('button', { type: 'button', className: 'bottone', textContent: '🎤 Inizia Registrazione' });
    const stato = crea('p', { className: 'upload-info', textContent: 'Al termine potrai riascoltare il messaggio prima di salvarlo.' });
    const ascolto = crea('div');

    pulsante.addEventListener('click', async () => {
        if (registratore?.state === 'recording') {
            fermaRegistrazione();
            pulsante.textContent = '🎤 Registra di nuovo';
            return;
        }
        try {
            await iniziaRegistrazione(stato, ascolto);
            pulsante.textContent = '⏹️ Ferma';
        } catch (errore) {
            console.error('Errore nella registrazione:', errore);
            stato.textContent = 'Non riesco a usare il microfono. Controlla i permessi del browser.';
        }
    });
    campi.append(crea('h4', { textContent: '🎤 Messaggio vocale' }), pulsante, stato, ascolto);
}

async function iniziaRegistrazione(stato, ascolto) {
    pronto(null);
    ascolto.replaceChildren();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const pezzi = [];
    registratore = new MediaRecorder(stream);
    registratore.ondataavailable = evento => pezzi.push(evento.data);
    registratore.onstop = () => {
        stream.getTracks().forEach(traccia => traccia.stop());
        const tipoFile = (registratore.mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(pezzi, { type: tipoFile });
        const anteprima = crea('audio', { controls: true, src: URL.createObjectURL(blob) });
        ascolto.replaceChildren(anteprima);
        stato.textContent = 'Riascolta il messaggio, poi premi Salva.';
        pronto(() => caricaFile('vocale', blob, tipoFile.includes('mp4') ? 'mp4' : 'webm'));
    };
    registratore.start();

    let secondi = 0;
    stato.textContent = 'Sto registrando... 00:00';
    timerRegistrazione = setInterval(() => {
        secondi++;
        const minuti = String(Math.floor(secondi / 60)).padStart(2, '0');
        stato.textContent = `Sto registrando... ${minuti}:${String(secondi % 60).padStart(2, '0')}`;
    }, 1000);
}

function fermaRegistrazione() {
    clearInterval(timerRegistrazione);
    if (registratore?.state === 'recording') registratore.stop();
}

// === CARICAMENTO FILE ===

function comprimiFoto(file) {
    if (file.type === 'image/gif') return Promise.resolve(file); // Conserva l'animazione

    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onerror = () => reject(new Error('Non riesco a leggere questa immagine.'));
        img.onload = () => {
            const scala = Math.min(1, CONFIG.foto.lato / Math.max(img.width, img.height));
            const canvas = crea('canvas', { width: Math.round(img.width * scala), height: Math.round(img.height * scala) });
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingQuality = 'high';
            ctx.fillStyle = '#fff'; // Le trasparenze non diventano nere
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compressione non riuscita.')), 'image/jpeg', CONFIG.foto.qualita);
        };
        img.src = url;
    });
}

async function caricaFile(tipo, file, estensione) {
    const { upload } = await import('https://cdn.jsdelivr.net/npm/@vercel/blob@2.8.2/client/+esm');
    const daInviare = tipo === 'foto' ? await comprimiFoto(file) : file;
    const finale = estensione ?? (daInviare.type === 'image/jpeg' ? 'jpg' : (file.name?.split('.').pop() || 'bin').toLowerCase());

    const risultato = await upload(`media/${ID}-${tipo}.${finale}`, daInviare, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        contentType: daInviare.type,
        clientPayload: JSON.stringify({ id: ID, chiave: CHIAVE, tipo }),
        onUploadProgress: ({ percentage }) => {
            $('btnSalva').textContent = `Caricamento ${Math.round(percentage)}%`;
        }
    });
    return { tipo, url: risultato.url };
}

// === SALVATAGGIO ===

async function salvaCalendario() {
    const dati = await chiamaApi('/api/calendario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            azione: 'salva',
            id: ID,
            chiave: CHIAVE,
            titolo: $('titolo-modifica').value,
            giorni: calendario.giorni,
            rimossi: urlDaRimuovere
        })
    });
    urlDaRimuovere = [];
    calendario = { ...dati, modifica: true };
    $('titolo').textContent = calendario.titolo;
    disegnaGriglia();
}

async function salvaGiorno() {
    if (salvataggioInCorso || !raccogliContenuto) return;
    salvataggioInCorso = true;
    const pulsante = $('btnSalva');
    const giorno = giornoCorrente;
    pulsante.disabled = true;
    pulsante.textContent = 'Salvataggio...';
    const precedente = calendario.giorni[giorno];

    try {
        fermaRegistrazione();
        calendario.giorni[giorno] = await raccogliContenuto();
        if (precedente?.url) urlDaRimuovere.push(precedente.url);
        await salvaCalendario();
        chiudiModal();
        mostraMessaggio(`${giorno} dicembre salvato!`, 'successo');
    } catch (errore) {
        console.error(errore);
        if (precedente) calendario.giorni[giorno] = precedente;
        else delete calendario.giorni[giorno];
        urlDaRimuovere = [];
        mostraMessaggio(errore.message || 'Salvataggio non riuscito. Riprova.', 'errore');
        pulsante.disabled = false;
    } finally {
        salvataggioInCorso = false;
        pulsante.textContent = 'Salva';
    }
}

async function eliminaContenuto() {
    const giorno = giornoCorrente;
    if (!confirm(`Vuoi eliminare il contenuto del ${giorno} dicembre?`)) return;
    const precedente = calendario.giorni[giorno];
    delete calendario.giorni[giorno];
    if (precedente?.url) urlDaRimuovere.push(precedente.url);

    try {
        await salvaCalendario();
        chiudiModal();
        mostraMessaggio(`Contenuto del ${giorno} dicembre eliminato.`, 'successo');
    } catch (errore) {
        calendario.giorni[giorno] = precedente;
        urlDaRimuovere = [];
        mostraMessaggio(errore.message, 'errore');
    }
}

// === RECUPERO DEI VECCHI CONTENUTI ===
// La vecchia versione salvava tutto nel browser, con chiavi giorno_N_utente

function contenutiVecchi() {
    const trovati = {};
    try {
        for (const chiave of Object.keys(localStorage)) {
            const numero = chiave.match(/^giorno_(\d+)_/)?.[1];
            if (numero) trovati[numero] = JSON.parse(localStorage.getItem(chiave));
        }
    } catch {
        return {};
    }
    return trovati;
}

async function convertiVecchio(dati) {
    if (dati.tipo === 'messaggio') return { tipo: 'messaggio', testo: dati.contenuto };
    if (dati.tipo === 'youtube') {
        const video = estraiIdYouTube(dati.contenuto);
        return video ? { tipo: 'youtube', video } : null;
    }
    if (!String(dati.contenuto).startsWith('data:')) return null;
    const blob = await (await fetch(dati.contenuto)).blob();
    const tipo = dati.tipo === 'messaggio-vocale' ? 'vocale' : dati.tipo;
    return caricaFile(tipo, blob, blob.type.split('/')[1]?.split(';')[0] || 'bin');
}

async function importaVecchi() {
    const vecchi = Object.entries(contenutiVecchi());
    let recuperati = 0;
    for (const [giorno, dati] of vecchi) {
        if (calendario.giorni[giorno]) continue;
        mostraMessaggio(`Recupero il ${giorno} dicembre...`);
        try {
            const contenuto = await convertiVecchio(dati);
            if (contenuto) {
                calendario.giorni[giorno] = contenuto;
                recuperati++;
            }
        } catch (errore) {
            console.error(`Recupero giorno ${giorno}:`, errore);
        }
    }
    await salvaCalendario();
    $('btnImporta').hidden = true;
    mostraMessaggio(`Contenuti recuperati: ${recuperati} su ${vecchi.length}.`, recuperati ? 'successo' : 'info');
}

// ========== PANNELLO E CREAZIONE ==========

function preparaPannello() {
    const linkPubblico = `${location.origin}/?c=${ID}`;
    $('pannello-modifica').hidden = false;
    $('avviso-nuovo').hidden = !parametri.has('nuovo');
    $('titolo-modifica').value = calendario.titolo;
    $('link-condivisione').value = linkPubblico;
    $('linkAnteprima').href = linkPubblico;
    $('linkWhatsApp').href = `https://wa.me/?text=${encodeURIComponent(`Ho preparato per te un calendario dell'Avvento 🎄 ${linkPubblico}`)}`;
    $('btnImporta').hidden = Object.keys(contenutiVecchi()).length === 0;

    $('btnCopia').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(linkPubblico);
            mostraMessaggio('Link copiato!', 'successo');
        } catch {
            $('link-condivisione').select();
            mostraMessaggio('Copia il link selezionato.');
        }
    });
    $('titolo-modifica').addEventListener('change', () => {
        salvaCalendario().then(
            () => mostraMessaggio('Titolo salvato!', 'successo'),
            errore => mostraMessaggio(errore.message, 'errore'));
    });
    $('btnImporta').addEventListener('click', () => {
        importaVecchi().catch(errore => mostraMessaggio(errore.message, 'errore'));
    });

    const salvati = leggiMemoria('miei_calendari', []);
    if (!salvati.some(voce => voce.id === ID)) {
        scriviMemoria('miei_calendari', [...salvati, { id: ID, chiave: CHIAVE, titolo: calendario.titolo }]);
    }
}

function mostraCreazione() {
    $('vista-crea').hidden = false;
    // Chi arriva dal link di invito non deve digitare nessun codice
    const invito = parametri.get('invito');
    if (invito) {
        $('nuovo-codice').value = invito;
        $('campo-codice').hidden = true;
    }
    const salvati = leggiMemoria('miei_calendari', []);
    $('miei-calendari').hidden = salvati.length === 0;
    $('lista-calendari').replaceChildren(...salvati.map(voce => crea('li', {},
        crea('a', { href: `/?c=${encodeURIComponent(voce.id)}&k=${encodeURIComponent(voce.chiave)}`, textContent: voce.titolo }))));

    $('form-crea').addEventListener('submit', async evento => {
        evento.preventDefault();
        const pulsante = evento.submitter;
        pulsante.disabled = true;
        try {
            const { id, chiave } = await chiamaApi('/api/calendario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ azione: 'crea', titolo: $('nuovo-titolo').value, codice: $('nuovo-codice').value })
            });
            location.href = `/?c=${id}&k=${chiave}&nuovo=1`;
        } catch (errore) {
            mostraMessaggio(errore.message, 'errore');
            $('campo-codice').hidden = false;
            pulsante.disabled = false;
        }
    });
}

// ========== AVVIO ==========

function preparaFinestra() {
    $('btnAudio').addEventListener('click', toggleAudio);
    $('btnChiudi').addEventListener('click', chiudiModal);
    $('btnSalva').addEventListener('click', salvaGiorno);
    $('btnElimina').addEventListener('click', eliminaContenuto);
    $('modal').addEventListener('click', evento => {
        if (evento.target === $('modal')) chiudiModal();
    });
    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape' && $('modal').classList.contains('mostra')) chiudiModal();
    });
    $('tipi').replaceChildren(...Object.entries(TIPI).map(([tipo, { icona, nome }]) => {
        const pulsante = crea('button', { type: 'button', className: 'btn-tipo' },
            crea('span', { className: 'icona', textContent: icona }), crea('span', { textContent: nome }));
        pulsante.addEventListener('click', () => scegliTipo(tipo));
        return pulsante;
    }));
}

async function avvia() {
    preparaFinestra();
    if (!ID) return mostraCreazione();

    try {
        const indirizzo = `/api/calendario?id=${encodeURIComponent(ID)}${CHIAVE ? `&chiave=${encodeURIComponent(CHIAVE)}` : ''}`;
        calendario = await chiamaApi(indirizzo);
    } catch (errore) {
        mostraMessaggio(errore.message, 'errore');
        clearTimeout(mostraMessaggio.timer);
        return;
    }

    document.title = calendario.titolo;
    $('titolo').textContent = calendario.titolo;
    if (calendario.modifica) preparaPannello();
    else $('sottotitolo').textContent = testoAttesa();
    disegnaGriglia();
}

avvia();
