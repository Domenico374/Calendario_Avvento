import { creaVillaggio } from './villaggio.js?v=20261119b';

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
    link: { icona: '🔗', nome: 'Link' },
    vocale: { icona: '🎤', nome: 'Vocale' }
};

const parametri = new URLSearchParams(location.search);
// Cambiano quando il calendario viene creato dal villaggio
let ID = parametri.get('c');
let CHIAVE = parametri.get('k');
let codiceInvito = null;

let calendario = null;
let giornoCorrente = null;
let raccogliContenuto = null; // Lo imposta l'editor del tipo scelto
let salvataggioInCorso = false;
let villaggio = null;

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

// Quando il coro del villaggio canta, la musica di sottofondo si mette in pausa e poi riparte
let musicaInPausa = false;
document.addEventListener('DOMContentLoaded', () => {
    $('villaggio')?.addEventListener('coro', evento => {
        if (evento.detail.canta && musicaTimer) {
            musicaInPausa = true;
            toggleAudio();
        } else if (!evento.detail.canta && musicaInPausa) {
            musicaInPausa = false;
            toggleAudio();
        }
    });
});

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
        case 'link':
            return crea('div', { className: 'contenuto-link' },
                crea('a', {
                    className: 'link-video', href: dati.url, target: '_blank', rel: 'noopener noreferrer',
                    textContent: `▶ ${dati.testo || 'Guarda il video'}`
                }),
                crea('p', { className: 'upload-info', textContent: new URL(dati.url).hostname.replace(/^www\./, '') }));
    }
    return crea('p');
}

function apriFinestra(titolo) {
    $('modal-titolo').textContent = titolo;
    $('modal').classList.add('mostra');
    $('btnChiudi').focus();
}

function chiudiModal({ porte = true } = {}) {
    // Svuotare ferma anche audio, video e YouTube
    $('modal-corpo').replaceChildren();
    $('editor-campi').replaceChildren();
    $('editor-campi').hidden = true;
    $('avviso').hidden = true;
    $('modal').classList.remove('mostra');
    fermaRegistrazione();
    if (porte) villaggio?.chiudiPorte();
    giornoCorrente = null;
    raccogliContenuto = null;
}

// ========== VISTA DI CHI RICEVE IL LINK ==========

function apriGiorno(giorno, { suono = true } = {}) {
    if (suono) suonoAperturaCasella();
    const dati = calendario.giorni[giorno];
    $('editor').hidden = true;
    $('btnSalva').hidden = true;
    $('btnElimina').hidden = true;
    $('modal-corpo').replaceChildren(dati
        ? creaContenuto(giorno, dati)
        : crea('p', { className: 'nessun-contenuto', textContent: 'Oggi la sorpresa è solo un sorriso 🎄' }));
    apriFinestra(`${giorno} dicembre`);
}

// Il villaggio si usa ovunque, anche sul telefono (si scorre col dito).
// La griglia resta solo per gli schermi minuscoli
function usaVillaggio() {
    return matchMedia('(min-width: 320px)').matches;
}

const nomeGiorno = giorno => (Number(giorno) === 1 ? '1°' : giorno);

const giorniPieni = () => new Set(Object.keys(calendario.giorni).map(Number));

function disegnaVillaggio() {
    if (calendario.modifica) {
        // Chi prepara il calendario clicca una casa e prepara la sua sorpresa
        // (per i bambini il villaggio resta disegnato: niente pulsante della Vista 3D)
        if (calendario.perBambini === true) delete $('villaggio').dataset.vista;
        $('villaggio').hidden = false;
        villaggio = creaVillaggio($('villaggio'), {
            aperti: CONFIG.giorni,
            viste: new Set(),
            modifica: true,
            benvenuto: calendario.benvenuto,
            lettere: calendario.lettere ?? [],
            destinatario: calendario.destinatario,
            letteraBabbo: calendario.letteraBabbo,
            piene: giorniPieni(),
            onTocco: suonoAperturaCasella,
            // Casa vuota: si prepara la sorpresa. Casa pronta: si vede com'è, con Modifica ed Elimina
            onApri: giorno => (!ID ? chiediNome(giorno) : calendario.giorni[giorno] ? mostraAnteprima(giorno) : apriEditor(giorno)),
            onChiusa: () => {}
        });
        aggiornaRiempimento();
        return;
    }
    // Le case già aperte restano illuminate anche tornando sul sito
    const chiaveViste = `viste_${ID}`;
    const viste = new Set(leggiMemoria(chiaveViste, []));
    $('villaggio').hidden = false;
    villaggio = creaVillaggio($('villaggio'), {
        aperti: calendario.aperti,
        viste,
        benvenuto: calendario.benvenuto,
        destinatario: calendario.destinatario,
        letteraBabbo: calendario.letteraBabbo,
        onTocco: suonoAperturaCasella,
        // La letterina a Babbo Natale arriva a chi ha preparato il calendario
        onLettera: (testo, firma) => chiamaApi('/api/calendario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ azione: 'lettera', id: ID, testo, firma })
        }),
        onApri: giorno => {
            scriviMemoria(chiaveViste, [...viste]);
            apriGiorno(giorno, { suono: false });
        },
        onChiusa: giorno => mostraMessaggio(`Pazienza! Questa casa si apre il ${nomeGiorno(giorno)} dicembre.`),
        // Il finale del 24: il riquadro del dono si chiude prima dei fuochi
        onChiudiDono: () => {
            if ($('modal').classList.contains('mostra')) chiudiModal({ porte: false });
        }
    });
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
            else if (chiusa) mostraMessaggio(`Pazienza! Questa casella si apre il ${nomeGiorno(giorno)} dicembre.`);
            else apriGiorno(giorno);
        });
        griglia.append(pulsante);
    }

    if (modifica) aggiornaRiempimento();
}

function aggiornaRiempimento() {
    const pieni = Object.keys(calendario.giorni).length;
    // Per il calendario preparato da un genitore: un promemoria discreto
    if (calendario.perBambini === true) {
        $('stato-riempimento').textContent = `Hai preparato ${pieni} ${pieni === 1 ? 'sorpresa' : 'sorprese'} su ${CONFIG.giorni}. Le altre le puoi aggiungere quando vuoi, anche a dicembre.`;
        return;
    }
    $('stato-riempimento').textContent = villaggio
        ? `Sorprese pronte: ${pieni} su ${CONFIG.giorni}. Clicca una casa spenta per aggiungere una sorpresa, oppure una casa accesa per vederla.`
        : `Caselle riempite: ${pieni} su ${CONFIG.giorni}. Chi riceve il link vede ogni casella solo dal suo giorno.`;
}

// Dopo un salvataggio si aggiorna il villaggio o la griglia
function aggiornaVista() {
    if (villaggio) {
        villaggio.segnaPiene(giorniPieni());
        aggiornaRiempimento();
    } else {
        disegnaGriglia();
    }
}

// ========== EDITOR ==========

function apriEditor(giorno) {
    giornoCorrente = giorno;
    $('btnModifica').hidden = true;
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
        link: () => editorLink(campi),
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

// Un link a qualsiasi video o pagina: Instagram, TikTok, Vimeo, Google Drive...
function editorLink(campi) {
    const url = crea('input', { type: 'url', id: 'url-link', placeholder: 'https://...' });
    const testo = crea('input', { type: 'text', id: 'testo-link', maxLength: 80, placeholder: 'Guarda il video' });
    const nota = crea('p', { className: 'upload-info', textContent: 'Incolla il link del video. Chi apre il regalo vedrà un pulsante per guardarlo.' });
    const attuale = calendario.giorni[giornoCorrente];
    if (attuale?.tipo === 'link') {
        url.value = attuale.url;
        testo.value = attuale.testo ?? '';
    }

    const aggiorna = () => {
        const indirizzo = url.value.trim();
        let valido = false;
        try {
            valido = ['https:', 'http:'].includes(new URL(indirizzo).protocol);
        } catch {
            valido = false;
        }
        const video = valido ? estraiIdYouTube(indirizzo) : null;
        nota.textContent = !indirizzo
            ? 'Incolla il link del video. Chi apre il regalo vedrà un pulsante per guardarlo.'
            : !valido ? 'Questo non sembra un link: deve iniziare con https://'
                : video ? 'È un video YouTube: si vedrà direttamente dentro la casella.'
                    : 'Perfetto: chi apre il regalo vedrà un pulsante per aprirlo.';
        // I video YouTube si guardano direttamente nella casella
        pronto(!valido ? null : video
            ? async () => ({ tipo: 'youtube', video })
            : async () => ({ tipo: 'link', url: indirizzo, testo: testo.value.trim() }));
    };
    url.addEventListener('input', aggiorna);
    testo.addEventListener('input', aggiorna);
    aggiorna();
    campi.append(
        crea('h4', { textContent: '🔗 Link a un video' }),
        crea('label', { htmlFor: 'url-link', textContent: 'Link' }), url,
        crea('label', { htmlFor: 'testo-link', textContent: 'Testo del pulsante (facoltativo)' }), testo,
        nota);
    url.focus();
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

// Si mandano solo le caselle cambiate (null = svuota): così una pagina aperta
// da un po' non può cancellare quello che è stato salvato nel frattempo
async function salvaCalendario(modifiche = {}) {
    const dati = await chiamaApi('/api/calendario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            azione: 'salva',
            id: ID,
            chiave: CHIAVE,
            titolo: $('titolo-modifica').value,
            benvenuto: $('benvenuto-modifica').value,
            destinatario: $('destinatario-modifica').value,
            letteraBabbo: $('lettera-babbo-modifica').value,
            modifiche
        })
    });
    calendario = { ...dati, modifica: true };
    $('titolo').textContent = calendario.titolo;
    villaggio?.impostaBenvenuto(calendario.benvenuto);
    villaggio?.impostaLettere(calendario.lettere ?? []);
    villaggio?.impostaSacco(calendario.destinatario, calendario.letteraBabbo);
    mostraLettere();
    aggiornaVista();
}

async function salvaGiorno() {
    if (salvataggioInCorso || !raccogliContenuto) return;
    salvataggioInCorso = true;
    const pulsante = $('btnSalva');
    const giorno = giornoCorrente;
    pulsante.disabled = true;
    pulsante.textContent = 'Salvataggio...';

    try {
        fermaRegistrazione();
        await salvaCalendario({ [giorno]: await raccogliContenuto() });
        chiudiModal();
        mostraMessaggio(`${giorno} dicembre salvato!`, 'successo');
    } catch (errore) {
        console.error(errore);
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

    try {
        await salvaCalendario({ [giorno]: null });
        chiudiModal();
        mostraMessaggio(`Contenuto del ${giorno} dicembre eliminato.`, 'successo');
    } catch (errore) {
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
    const modifiche = {};
    for (const [giorno, dati] of vecchi) {
        if (calendario.giorni[giorno]) continue;
        mostraMessaggio(`Recupero il ${giorno} dicembre...`);
        try {
            const contenuto = await convertiVecchio(dati);
            if (contenuto) modifiche[giorno] = contenuto;
        } catch (errore) {
            console.error(`Recupero giorno ${giorno}:`, errore);
        }
    }
    const recuperati = Object.keys(modifiche).length;
    await salvaCalendario(modifiche);
    $('btnImporta').hidden = true;
    mostraMessaggio(`Contenuti recuperati: ${recuperati} su ${vecchi.length}.`, recuperati ? 'successo' : 'info');
}

// Casa già pronta: si vede la sorpresa come la vedrà chi la riceve, con Modifica ed Elimina
function mostraAnteprima(giorno) {
    giornoCorrente = giorno;
    $('editor').hidden = true;
    $('btnSalva').hidden = true;
    $('btnModifica').hidden = false;
    $('btnElimina').hidden = false;
    $('modal-corpo').replaceChildren(creaContenuto(giorno, calendario.giorni[giorno]));
    apriFinestra(`${giorno} dicembre`);
}

// ========== PANNELLO E CREAZIONE ==========

function preparaPannello() {
    // Il calendario preparato da un genitore (genitori.html) si regala nella versione per bambini
    const linkPubblico = calendario.perBambini === true ? `${location.origin}/bimbi.html?c=${ID}` : `${location.origin}/?c=${ID}`;
    const linkPersonale = `${location.origin}/?c=${ID}&k=${CHIAVE}`;
    $('pannello-modifica').hidden = false;
    $('titolo-modifica').value = calendario.titolo;
    $('benvenuto-modifica').value = calendario.benvenuto ?? '';
    $('destinatario-modifica').value = calendario.destinatario ?? '';
    $('lettera-babbo-modifica').value = calendario.letteraBabbo ?? '';
    mostraLettere();
    $('link-condivisione').value = linkPubblico;
    $('link-personale').value = linkPersonale;
    $('linkAnteprima').href = linkPubblico;
    $('linkWhatsApp').href = `https://wa.me/?text=${encodeURIComponent(`Ho preparato per te un calendario dell'Avvento 🎄 ${linkPubblico}`)}`;
    $('btnImporta').hidden = Object.keys(contenutiVecchi()).length === 0;

    const copia = async (testo, campo, messaggio) => {
        try {
            await navigator.clipboard.writeText(testo);
            mostraMessaggio(messaggio, 'successo');
        } catch {
            $(campo).select();
            mostraMessaggio('Copia il link selezionato.');
        }
    };
    $('btnCopia').addEventListener('click', () => copia(linkPubblico, 'link-condivisione', 'Link da regalare copiato!'));
    $('btnCopiaPersonale').addEventListener('click', () => copia(linkPersonale, 'link-personale', 'Link personale copiato!'));
    $('btnRegala').addEventListener('click', () => {
        const apri = $('regala').hidden;
        $('regala').hidden = !apri;
        $('btnRegala').setAttribute('aria-expanded', String(apri));
    });
    $('titolo-modifica').addEventListener('change', () => {
        salvaCalendario().then(
            () => mostraMessaggio('Titolo salvato!', 'successo'),
            errore => mostraMessaggio(errore.message, 'errore'));
    });
    ['destinatario-modifica', 'lettera-babbo-modifica'].forEach(campo => $(campo).addEventListener('change', () => {
        salvaCalendario().then(
            () => mostraMessaggio(calendario.perBambini === true ? 'Salvato!' : 'Salvato! Lo trovi nel sacco dell\'ufficio postale.', 'successo'),
            errore => mostraMessaggio(errore.message, 'errore'));
    }));
    $('benvenuto-modifica').addEventListener('change', () => {
        salvaCalendario().then(
            () => mostraMessaggio('Benvenuto salvato! Entra in stazione per vederlo.', 'successo'),
            errore => mostraMessaggio(errore.message, 'errore'));
    });
    $('btnImporta').addEventListener('click', () => {
        importaVecchi().catch(errore => mostraMessaggio(errore.message, 'errore'));
    });
    $('btnEliminaCalendario').addEventListener('click', eliminaCalendario);

    // Il calendario si ricorda su questo dispositivo: l'ultimo usato si riapre da solo
    const altri = leggiMemoria('miei_calendari', []).filter(voce => voce.id !== ID);
    scriviMemoria('miei_calendari', [...altri, { id: ID, chiave: CHIAVE, titolo: calendario.titolo }]);

    if (calendario.perBambini === true) preparaGenitori();
}

// ========== CALENDARIO PREPARATO DA UN GENITORE (segnale perBambini) ==========
// Solo per i calendari creati da genitori.html: i grandi non vedono niente di tutto questo.

const STILE_GENITORI = `
.passi { list-style: none; padding: 0; margin: 0 0 18px; display: grid; gap: 12px; }
.passi li { display: flex; gap: 12px; align-items: flex-start; line-height: 1.45; }
.passi .numero { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; background: #ffd36b; color: #3a2416; }
.bottone-ho-finito { position: fixed; right: 16px; bottom: max(16px, env(safe-area-inset-bottom)); z-index: 800; font-size: 1.15em; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35); max-width: calc(100vw - 32px); }
body { padding-bottom: 90px; }
#editor .aiuto-piccoli { margin: 0 0 10px; padding: 10px 12px; border-radius: 10px; background: #fff3cd; color: #5a3b00; line-height: 1.4; }
#editor .esempi { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 14px; }
#editor .esempio { border: 1px solid #e0c48a; background: #fffaf0; color: #3a2416; border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 0.92em; cursor: pointer; text-align: left; }
#editor .esempio:hover, #editor .esempio:focus-visible { background: #ffe8b0; }
`;

// Gli esempi da toccare: quelli scritti riempiono il messaggio, gli altri aprono il tipo giusto
const ESEMPI_GENITORI = [
    { testo: '🎤 un vocale della nonna che canta una canzoncina', tipo: 'vocale' },
    { testo: '📷 una foto di quando eri piccolo', tipo: 'foto' },
    { testo: '🍪 «Oggi facciamo i biscotti insieme!»', tipo: 'messaggio', messaggio: 'Oggi facciamo i biscotti insieme!' },
    { testo: '🔎 «Cerca una sorpresa sotto il cuscino!»', tipo: 'messaggio', messaggio: 'Cerca una sorpresa sotto il cuscino!' },
    { testo: '🎥 un video del papà che saluta da lavoro', tipo: 'video' },
    { testo: '📖 «Stasera storia in più prima di dormire»', tipo: 'messaggio', messaggio: 'Stasera storia in più prima di dormire' }
];

function preparaGenitori() {
    document.head.append(crea('style', { textContent: STILE_GENITORI }));

    // Testi della letterina senza il "sacco della posta"
    document.querySelector('label[for="destinatario-modifica"]').textContent = 'Per chi è il calendario?';
    document.querySelector('label[for="lettera-babbo-modifica"]').textContent = 'La letterina di Babbo Natale (facoltativa)';
    $('lettera-babbo-modifica').nextElementSibling.textContent = 'Scrivi qui una letterina di Babbo Natale per il tuo bambino. Se la lasci vuota, Babbo Natale ne scrive una lui.';

    // Niente link da mandare: il bambino guarda il villaggio sul telefono del genitore
    $('btnRegala').hidden = true;
    $('regala').remove();
    const altro = document.querySelector('#pannello-modifica .altro');
    altro.querySelector('p').remove();
    $('link-personale').closest('.input-group').remove();
    altro.querySelector('a[href="/?nuovo-calendario=1"]').closest('p').remove();

    // In alto i 3 passi
    const passo = (numero, testo) => crea('li', {},
        crea('span', { className: 'numero', textContent: numero }),
        crea('span', { textContent: testo }));
    $('pannello-modifica').prepend(
        crea('h2', { textContent: 'Come funziona' }),
        crea('ol', { className: 'passi' },
            passo('1', 'Scrivi il nome del tuo bambino.'),
            passo('2', 'Tocca una casetta e metti una sorpresa.'),
            passo('3', 'Premi «✅ Ho finito» e dai il telefono al tuo bambino.')));

    // «Ho finito»: si chiude la modifica e su questo telefono si apre sempre la vista del bambino
    const finito = crea('button', { type: 'button', className: 'bottone bottone-ho-finito', id: 'btnHoFinito', textContent: '✅ Ho finito' });
    finito.addEventListener('click', () => {
        scriviMemoria('vista_bambino', ID);
        scriviMemoria('calendario_bimbi', ID);
        location.replace(`/bimbi.html?c=${encodeURIComponent(ID)}`);
    });
    document.body.append(finito);

    // Mentre si sceglie la sorpresa: un consiglio e gli esempi da toccare
    const esempi = ESEMPI_GENITORI.map(esempio => {
        const bottone = crea('button', { type: 'button', className: 'esempio', textContent: esempio.testo });
        bottone.addEventListener('click', () => {
            scegliTipo(esempio.tipo);
            const testo = $('editor-campi').querySelector('textarea');
            if (esempio.messaggio && testo) {
                testo.value = esempio.messaggio;
                testo.dispatchEvent(new Event('input'));
            }
        });
        return bottone;
    });
    $('tipi').before(
        crea('p', { className: 'aiuto-piccoli', textContent: 'I piccoli spesso non sanno leggere: un vocale o un video funziona meglio di un testo lungo.' }),
        crea('div', { className: 'esempi' }, ...esempi));
    aggiornaRiempimento();
}

// Le letterine a Babbo Natale arrivate da chi ha ricevuto il calendario
function mostraLettere() {
    const lettere = calendario.lettere ?? [];
    $('lettere-titolo').textContent = `✉️ Letterine a Babbo Natale (${lettere.length})`;
    $('lettere-elenco').replaceChildren(...(lettere.length
        ? [...lettere].reverse().map(l => crea('article', { className: 'letterina-ricevuta' },
            crea('p', { textContent: l.testo }),
            crea('p', { className: 'firma', textContent: `${l.firma || 'Senza firma'} · ${new Date(l.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}` })))
        : [crea('p', { className: 'upload-info', textContent: "Quando chi riceve il calendario scriverà a Babbo Natale dall'ufficio postale del villaggio, la letterina arriverà qui." })]));
}

// Elimina il calendario intero e passa al prossimo ricordato su questo dispositivo, o a uno nuovo
async function eliminaCalendario() {
    if (!confirm(`Vuoi eliminare il calendario "${calendario.titolo}" con tutte le sue sorprese? Non si può annullare.`)) return;
    try {
        await chiamaApi('/api/calendario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ azione: 'elimina', id: ID, chiave: CHIAVE })
        });
    } catch (errore) {
        mostraMessaggio(errore.message, 'errore');
        return;
    }
    scriviMemoria('miei_calendari', leggiMemoria('miei_calendari', []).filter(voce => voce.id !== ID));
    location.href = '/';
}

function mostraCreazione() {
    const invito = parametri.get('invito');
    const salvati = leggiMemoria('miei_calendari', []);
    // Sul PC si entra subito nel villaggio e il calendario si crea al primo clic su una casa
    if (usaVillaggio()) return avviaVillaggioNuovo(invito);
    $('vista-crea').hidden = false;
    // Chi arriva dal link di invito non deve digitare nessun codice
    // Il codice si chiede solo se il server lo richiede (vedi l'errore più sotto)
    $('nuovo-codice').value = invito ?? '';
    $('nuovo-codice').required = false;
    $('campo-codice').hidden = true;
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

// === CREAZIONE DAL VILLAGGIO ===
// Il calendario si crea al primo clic su una casa, dopo aver chiesto per chi è:
// così chi apre l'invito solo per curiosità non lascia calendari vuoti

function avviaVillaggioNuovo(invito) {
    codiceInvito = invito;
    calendario = { titolo: "Il tuo calendario dell'Avvento", giorni: {}, modifica: true };
    $('titolo').textContent = calendario.titolo;
    $('sottotitolo').textContent = 'Clicca una casa per preparare la prima sorpresa';
    disegnaVillaggio();
}

function chiediNome(giorno) {
    giornoCorrente = giorno;
    $('editor').hidden = true;
    $('btnSalva').hidden = true;
    $('btnElimina').hidden = true;
    const nome = crea('input', { id: 'nome-calendario', maxLength: 80, placeholder: 'Es. Il calendario di Anna' });
    const inizia = crea('button', { type: 'submit', className: 'bottone', textContent: 'Inizia' });
    const modulo = crea('form', { className: 'chiedi-nome' },
        crea('label', { htmlFor: 'nome-calendario', textContent: 'Per chi è questo calendario?' }), nome, inizia);
    modulo.addEventListener('submit', async evento => {
        evento.preventDefault();
        inizia.disabled = true;
        inizia.textContent = 'Creo il calendario...';
        try {
            await creaDalVillaggio(nome.value);
            apriEditor(giorno);
        } catch (errore) {
            mostraMessaggio(errore.message, 'errore');
            inizia.disabled = false;
            inizia.textContent = 'Inizia';
        }
    });
    $('modal-corpo').replaceChildren(modulo);
    apriFinestra('Il tuo calendario');
    nome.focus();
}

async function creaDalVillaggio(titolo) {
    const { id, chiave } = await chiamaApi('/api/calendario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ azione: 'crea', titolo, codice: codiceInvito })
    });
    ID = id;
    CHIAVE = chiave;
    // L'indirizzo resta quello semplice: il calendario si ricorda su questo dispositivo
    history.replaceState(null, '', '/');
    calendario = { ...(await chiamaApi(`/api/calendario?id=${encodeURIComponent(id)}&chiave=${encodeURIComponent(chiave)}`)), modifica: true };
    document.title = calendario.titolo;
    $('titolo').textContent = calendario.titolo;
    $('sottotitolo').textContent = 'Un viaggio di 24 giorni di Meraviglia';
    $('vista-crea').hidden = true;
    preparaPannello();
    aggiornaRiempimento();
}

// ========== AVVIO ==========

function preparaFinestra() {
    $('btnAudio').addEventListener('click', toggleAudio);
    $('btnChiudi').addEventListener('click', chiudiModal);
    $('btnSalva').addEventListener('click', salvaGiorno);
    $('btnElimina').addEventListener('click', eliminaContenuto);
    $('btnModifica').addEventListener('click', () => apriEditor(giornoCorrente));
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
    if (!ID) {
        // Chi ha già un calendario su questo dispositivo lo ritrova subito, senza link
        const ultimo = parametri.has('nuovo-calendario') ? null : leggiMemoria('miei_calendari', []).at(-1);
        if (!ultimo) return mostraCreazione();
        ID = ultimo.id;
        CHIAVE = ultimo.chiave;
    }
    // Dopo «✅ Ho finito» su questo telefono si apre la vista del bambino (solo per i calendari dei bimbi)
    if (ID && leggiMemoria('vista_bambino', null) === ID) {
        location.replace(`/bimbi.html?c=${encodeURIComponent(ID)}`);
        return;
    }

    try {
        const indirizzo = `/api/calendario?id=${encodeURIComponent(ID)}${CHIAVE ? `&chiave=${encodeURIComponent(CHIAVE)}` : ''}`;
        calendario = await chiamaApi(indirizzo);
    } catch (errore) {
        // Un calendario ricordato che non esiste più si dimentica, e si ricomincia
        if (!parametri.get('c')) {
            scriviMemoria('miei_calendari', leggiMemoria('miei_calendari', []).filter(voce => voce.id !== ID));
            ID = null;
            CHIAVE = null;
            return mostraCreazione();
        }
        mostraMessaggio(errore.message, 'errore');
        clearTimeout(mostraMessaggio.timer);
        return;
    }

    document.title = calendario.titolo;
    $('titolo').textContent = calendario.titolo;
    if (calendario.modifica) preparaPannello();
    else $('sottotitolo').textContent = testoAttesa();
    if (usaVillaggio()) disegnaVillaggio();
    else disegnaGriglia();
    if (!calendario.modifica) controllaNuovoGiorno();
}

// Se la pagina resta aperta durante la notte (per esempio sulla LIM), a mezzanotte
// il server sblocca la casa nuova: ogni 10 minuti si controlla e, se serve, si ricarica.
// Non si ricarica mentre una sorpresa è aperta
function controllaNuovoGiorno() {
    setInterval(async () => {
        if (document.hidden || $('modal').classList.contains('mostra') || document.querySelector('.scena.dentro')) return;
        try {
            const nuovo = await chiamaApi(`/api/calendario?id=${encodeURIComponent(ID)}`);
            if (nuovo.aperti !== calendario.aperti) location.reload();
        } catch {
            // Senza rete si riprova al giro dopo
        }
    }, 10 * 60 * 1000);
}

avvia();
