// La pagina per i bambini: lo stesso villaggio e lo stesso calendario della pagina per grandi,
// solo da guardare. Si apre con /bimbi.html?c=CODICE; la chiave di modifica (k) non si usa mai
import { creaVillaggio } from './villaggio.js?v=20261120-bimbi4';

const ID = new URLSearchParams(location.search).get('c');

let calendario = null;
let villaggio = null;

// I giochi per bambini nei luoghi del villaggio (l'ufficio postale arriva dopo)
const GIOCHI = {
    pupazzo: { src: 'bimbi-giochi/1_Pupazzo_di_Neve.html?v=20261120-g1' },
    stalla: { src: 'bimbi-giochi/2_Stalla_di_Cometa.html?v=20261120-g1' },
    parco: { src: 'bimbi-giochi/3_Parco_del_Polo_Nord.html?v=20261120-g1' },
    laboratorio: { src: 'bimbi-giochi/4_Laboratorio_degli_Elfi.html?v=20261120-g2' }
};

// ========== FUNZIONI DI SUPPORTO ==========

const $ = id => document.getElementById(id);

function crea(tag, proprieta = {}, ...figli) {
    const elemento = Object.assign(document.createElement(tag), proprieta);
    elemento.append(...figli);
    return elemento;
}

function mostraMessaggio(testo, tipo = 'info') {
    const avviso = $('avviso');
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
        // Solo una comodità: senza memoria il villaggio funziona lo stesso
    }
}

// ========== AUDIO NATALIZIO (come nella pagina per grandi) ==========

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
let musicaInPausa = false;

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

// ========== I REGALI ==========

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

function apriGiorno(giorno) {
    const dati = calendario.giorni?.[giorno];
    $('modal-corpo').replaceChildren(dati
        ? creaContenuto(giorno, dati)
        : crea('p', { className: 'nessun-contenuto', textContent: 'Oggi la sorpresa è solo un sorriso 🎄' }));
    $('modal-titolo').textContent = `${giorno} dicembre`;
    $('modal').classList.add('mostra');
    $('btnChiudi').focus();
}

function chiudiModal({ porte = true } = {}) {
    // Svuotare ferma anche audio, video e YouTube
    $('modal-corpo').replaceChildren();
    $('modal').classList.remove('mostra');
    if (porte) villaggio?.chiudiPorte();
}

const nomeGiorno = giorno => (Number(giorno) === 1 ? '1°' : giorno);

// ========== IL VILLAGGIO ==========

function disegnaVillaggio() {
    // Le case aperte si ricordano a parte: grandi e bambini non si mescolano
    const chiaveViste = `viste_bimbi_${ID}`;
    const viste = new Set(leggiMemoria(chiaveViste, []));
    $('villaggio').hidden = false;
    villaggio = creaVillaggio($('villaggio'), {
        aperti: calendario.aperti,
        viste,
        benvenuto: calendario.benvenuto,
        destinatario: calendario.destinatario,
        letteraBabbo: calendario.letteraBabbo,
        perBambini: true,
        giochi: GIOCHI,
        onTocco: suonoAperturaCasella,
        // La letterina a Babbo Natale arriva a chi ha preparato il calendario
        onLettera: (testo, firma) => chiamaApi('/api/calendario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ azione: 'lettera', id: ID, testo, firma })
        }),
        onApri: giorno => {
            scriviMemoria(chiaveViste, [...viste]);
            apriGiorno(giorno);
        },
        onChiusa: giorno => mostraMessaggio(`Pazienza! Questa casa si apre il ${nomeGiorno(giorno)} dicembre.`),
        // Il finale del 24: il riquadro del dono si chiude prima dei fuochi
        onChiudiDono: () => {
            if ($('modal').classList.contains('mostra')) chiudiModal({ porte: false });
        }
    });
}

function testoAttesa() {
    return calendario.aperti === 0 ? `Si apre il 1° dicembre ${calendario.anno}` : 'Ogni giorno si apre una nuova casa';
}

// Se la pagina resta aperta durante la notte, a mezzanotte si apre la casa nuova
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

// ========== AVVIO ==========

function preparaFinestra() {
    $('btnAudio').addEventListener('click', toggleAudio);
    $('btnChiudi').addEventListener('click', () => chiudiModal());
    $('modal').addEventListener('click', evento => {
        if (evento.target === $('modal')) chiudiModal();
    });
    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape' && $('modal').classList.contains('mostra')) chiudiModal();
    });
    // Quando il coro del villaggio canta, la musica si mette in pausa e poi riparte
    $('villaggio').addEventListener('coro', evento => {
        if (evento.detail.canta && musicaTimer) {
            musicaInPausa = true;
            toggleAudio();
        } else if (!evento.detail.canta && musicaInPausa) {
            musicaInPausa = false;
            toggleAudio();
        }
    });
}

async function avvia() {
    preparaFinestra();
    if (!ID) {
        $('sottotitolo').textContent = 'Chiedi il link a chi ti ha preparato il calendario 🎁';
        return;
    }
    try {
        // Sempre e solo la vista di chi riceve: niente chiave, niente modifiche
        calendario = await chiamaApi(`/api/calendario?id=${encodeURIComponent(ID)}`);
    } catch (errore) {
        $('sottotitolo').textContent = errore.message;
        return;
    }
    document.title = calendario.titolo;
    $('titolo').textContent = calendario.titolo;
    $('sottotitolo').textContent = testoAttesa();
    disegnaVillaggio();
    controllaNuovoGiorno();
}

avvia();
