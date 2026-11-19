
// ========== DEMO ==========

const MESSAGGI = [
    'Benvenuto nel villaggio! Da oggi ogni giorno si accende una casa.',
    'I biscotti allo zenzero sono pronti 🍪',
    'Il primo addobbo è sempre il più bello.',
    'Oggi regala un sorriso a uno sconosciuto.',
    'Una tazza di cioccolata calda ti aspetta stasera ☕',
    'Buon San Nicola!',
    'Scrivi un biglietto a chi non senti da tempo.',
    'Buona Immacolata: oggi si fa l\'albero 🎄',
    'Una canzone di Natale da cantare a squarciagola.',
    'La neve rende tutto più silenzioso.',
    'Accendi una candela e goditi la sera.',
    'Metà strada verso la vigilia!',
    'Buona Santa Lucia ✨',
    'Un film di Natale sul divano.',
    'Il profumo di cannella è nell\'aria.',
    'Oggi niente fretta: cammina piano.',
    'Il villaggio brilla sempre di più.',
    'Prepara una lista dei desideri.',
    'Una passeggiata tra le luci della città.',
    'Ricordi il tuo Natale più bello?',
    'La notte più lunga dell\'anno: tante stelle.',
    'Incarta un regalo con cura.',
    'Domani è la vigilia!',
    'Buona vigilia di Natale! 🌟 Ce l\'hai fatta: hai aperto tutte le 24 case del villaggio. L\'albero della piazza si è acceso, le renne sono pronte a partire e Babbo Natale sta per iniziare il suo lungo giro. Stasera spegni le luci, guarda fuori dalla finestra e ascolta bene: forse sentirai i campanelli della slitta. Grazie per aver fatto questo viaggio con noi. Buon Natale!'
];

// Nella demo alcune case mostrano gli altri tipi di regalo: una foto e i link ai video
const FOTO_ESEMPIO = '__FOTO_ESEMPIO__';
const SPECIALI = {
    3: { tipo: 'foto', url: FOTO_ESEMPIO, testo: 'Una foto: qui ognuno mette i suoi ricordi più belli.' },
    7: { tipo: 'link', url: 'https://www.youtube.com/results?search_query=canzoni+di+natale', testo: 'Guarda il video', nota: 'Un link a un video: YouTube, Instagram, TikTok, Vimeo…' },
    15: { tipo: 'foto', url: FOTO_ESEMPIO, testo: 'Il profumo di cannella è nell\'aria.' },
    19: { tipo: 'link', url: 'https://www.youtube.com/results?search_query=film+di+natale+trailer', testo: 'Il film di stasera', nota: 'Il testo del pulsante si può scegliere.' }
};

function contenutoDemo(giorno) {
    const crea = (tag, proprieta = {}, ...figli) => {
        const elemento = Object.assign(document.createElement(tag), proprieta);
        elemento.append(...figli);
        return elemento;
    };
    const speciale = SPECIALI[giorno];
    const box = crea('div', { className: 'regalo-demo' });
    if (speciale?.tipo === 'foto') {
        box.append(crea('img', { src: speciale.url, alt: `La foto del ${giorno} dicembre` }), crea('p', { textContent: speciale.testo }));
    } else if (speciale?.tipo === 'link') {
        box.append(
            crea('a', { className: 'link-video', href: speciale.url, target: '_blank', rel: 'noopener noreferrer', textContent: `▶ ${speciale.testo}` }),
            crea('p', { className: 'nota-link', textContent: speciale.nota }));
    } else {
        box.append(crea('p', { textContent: MESSAGGI[giorno - 1] }));
    }
    return box;
}

let audio = null;
function campanella() {
    try {
        audio ??= new (window.AudioContext || window.webkitAudioContext)();
        audio.resume();
        [1046.5, 1318.5, 1568].forEach((frequenza, i) => {
            const oscillatore = audio.createOscillator();
            const volume = audio.createGain();
            const inizio = audio.currentTime + i * 0.09;
            oscillatore.frequency.value = frequenza;
            volume.gain.setValueAtTime(0.08, inizio);
            volume.gain.exponentialRampToValueAtTime(0.001, inizio + 0.5);
            oscillatore.connect(volume).connect(audio.destination);
            oscillatore.start(inizio);
            oscillatore.stop(inizio + 0.5);
        });
    } catch {
        // Senza audio la demo funziona lo stesso
    }
}

let timerAvviso = null;
function avviso(testo) {
    const box = document.getElementById('avviso');
    box.textContent = testo;
    clearTimeout(timerAvviso);
    timerAvviso = setTimeout(() => { box.textContent = ''; }, 3000);
}

const velo = document.getElementById('velo');
const viste = new Set();
// Salva solo i numeri dei regali realmente mostrati, non il loro contenuto.
// Ogni calendario/file ha una chiave separata; se il browser blocca lo storage,
// l'album continua a funzionare durante la visita corrente.
const chiaveRicordi = 'villaggio_ricordi_v1:' + location.origin + location.pathname + location.search;
function caricaRicordi() {
    try {
        const salvati = JSON.parse(localStorage.getItem(chiaveRicordi) || '[]');
        if (!Array.isArray(salvati)) return new Set();
        return new Set(salvati.filter(n => Number.isInteger(n) && n >= 1 && n <= 24));
    } catch { return new Set(); }
}
const ricordiAperti = caricaRicordi();
function salvaRicordo(giorno) {
    if (!Number.isInteger(giorno) || giorno < 1 || giorno > 24) return;
    ricordiAperti.add(giorno);
    try { localStorage.setItem(chiaveRicordi, JSON.stringify([...ricordiAperti].sort((a,b)=>a-b))); }
    catch { /* La memoria rimane disponibile finché la pagina è aperta. */ }
}
function aggiornaAlbum() {
    const contenuto = document.getElementById('albumContenuto');
    if (!ricordiAperti.size) {
        const vuoto = document.createElement('p');
        vuoto.className = 'album-vuoto';
        vuoto.textContent = 'Il tuo album è ancora vuoto. Apri il primo regalo per iniziare a riempirlo! 🎁';
        contenuto.replaceChildren(vuoto);
        return;
    }
    const griglia = document.createElement('div');
    griglia.className = 'album-griglia';
    [...ricordiAperti].sort((a,b)=>a-b).forEach(giorno => {
        const pulsante = document.createElement('button');
        pulsante.type = 'button';
        pulsante.className = 'ricordo-giorno';
        pulsante.innerHTML = '<span aria-hidden="true">🎁</span>';
        pulsante.append(document.createTextNode(`${giorno} dicembre`));
        pulsante.addEventListener('click', () => {
            document.getElementById('giorno-titolo').textContent = `${giorno} dicembre`;
            document.getElementById('giorno-contenuto').replaceChildren(contenutoDemo(giorno));
            document.getElementById('velo').hidden = false;
            document.getElementById('btnChiudi').focus();
        });
        griglia.append(pulsante);
    });
    contenuto.replaceChildren(griglia);
}


const villaggio = creaVillaggio(document.getElementById('villaggio'), {
    aperti: 10,
    viste,
    onTocco: campanella,
    onApri: giorno => {
        document.getElementById('giorno-titolo').textContent = `${giorno} dicembre`;
        document.getElementById('giorno-contenuto').replaceChildren(contenutoDemo(giorno));
        velo.hidden = false;
        salvaRicordo(giorno);
        aggiornaAlbum();
        document.getElementById('btnChiudi').focus();
    },
    onChiusa: giorno => avviso(`Pazienza! Questa casa si apre il ${giorno === 1 ? '1°' : giorno} dicembre.`),
    // Il finale del 24: il riquadro del dono si chiude prima dei fuochi
    onChiudiDono: () => { velo.hidden = true; }
});

function chiudi() {
    velo.hidden = true;
    villaggio.chiudiPorte();
    if (ricordiAperti.size) consiglioElfo('dopo-regalo', 'Che bella sorpresa! La ritrovi quando vuoi nel Libro dei ricordi. 📖');
}

document.getElementById('btnChiudi').addEventListener('click', chiudi);
velo.addEventListener('click', evento => { if (evento.target === velo) chiudi(); });
document.addEventListener('keydown', evento => { if (evento.key === 'Escape' && !velo.hidden) chiudi(); });

const cursore = document.getElementById('oggi');
cursore.addEventListener('input', () => {
    const giorno = Number(cursore.value);
    document.getElementById('oggi-testo').textContent = giorno === 0 ? 'prima di dicembre' : `${giorno} dicembre`;
    villaggio.impostaOggi(giorno);
});
document.getElementById('btnRichiudi').addEventListener('click', () => {
    viste.clear();
    villaggio.impostaOggi(Number(cursore.value));
    avviso('Porte richiuse: puoi riaprirle tutte.');
});



// I consigli compaiono solo dopo azioni volontarie, mai durante l'apertura del pacco.
const elfoMessaggio = document.getElementById('elfoMessaggio');
const elfiToggle = document.getElementById('elfiToggle');
let elfiAttivi = true;
let elfoTimer = null;
const consigliVisti = new Set();
function chiudiConsiglio() { clearTimeout(elfoTimer); elfoMessaggio.hidden = true; }
function stanzaApertaPerElfo() { return !!document.querySelector('#villaggio .interno.visibile:not([hidden])'); }
function aggiornaNomeElfo() {
    let brina = typeof guidaScelta !== 'undefined' && guidaScelta === GUIDE.elfa;
    if (!brina && (typeof guidaScelta === 'undefined' || !guidaScelta)) {
        try { brina = localStorage.getItem('villaggio_guida') === 'elfa'; } catch { /* Fiocco predefinito */ }
    }
    document.getElementById('elfoNome').textContent = brina ? 'Brina, la tua guida' : 'Fiocco, la tua guida';
    elfoMessaggio.querySelector('.elfo-avatar').textContent = brina ? '🧝‍♀️' : '🧝‍♂️';
}
function consiglioElfo(chiave, testo) {
    if (!elfiAttivi || consigliVisti.has(chiave) || !velo.hidden || stanzaApertaPerElfo()) return;
    consigliVisti.add(chiave);
    clearTimeout(elfoTimer);
    aggiornaNomeElfo();
    document.getElementById('elfoTesto').textContent = testo;
    elfoMessaggio.hidden = false;
    elfoTimer = setTimeout(chiudiConsiglio, 6500);
}
// Chiude immediatamente i consigli quando si entra in una stanza; nessun messaggio in coda.
new MutationObserver(() => { if (stanzaApertaPerElfo() && !elfoMessaggio.hidden) chiudiConsiglio(); })
    .observe(document.getElementById('villaggio'), {subtree:true, attributes:true, attributeFilter:['class','hidden']});
document.getElementById('elfoChiudi').addEventListener('click', chiudiConsiglio);
elfiToggle.addEventListener('click', () => {
    elfiAttivi = !elfiAttivi;
    elfiToggle.setAttribute('aria-pressed', String(elfiAttivi));
    elfiToggle.textContent = elfiAttivi ? '🧝 Elfi: attivi' : '🧝 Elfi: silenziosi';
    chiudiConsiglio();
    if (elfiAttivi) consiglioElfo('riattivati', 'Sono di nuovo qui! Ti darò solo qualche piccolo suggerimento mentre esplori.');
});

// Il libro dei ricordi non interferisce con la mappa o con la scena.
const ricordiApri = document.getElementById('ricordiApri');
const albumRicordi = document.getElementById('albumRicordi');
function mostraRicordi(visibile) {
    albumRicordi.hidden = !visibile;
    ricordiApri.setAttribute('aria-expanded', String(visibile));
    if (visibile) { aggiornaAlbum(); albumRicordi.scrollIntoView({behavior:'smooth',block:'nearest'}); consiglioElfo('album', 'Questo album conserva le sorprese che hai già aperto. Puoi rivederle quando vuoi!'); }
    else ricordiApri.focus();
}
ricordiApri.addEventListener('click', () => mostraRicordi(albumRicordi.hidden));
document.getElementById('ricordiChiudi').addEventListener('click', () => mostraRicordi(false));

// La mappa usa la funzione di spostamento già presente nel motore 2D.
// Non simula clic sugli edifici: l'utente decide se entrarvi.
const mappaApri = document.getElementById('mappaApri');
const mappaVillaggio = document.getElementById('mappaVillaggio');
function mostraMappa(si) {
    mappaVillaggio.hidden = !si;
    mappaApri.setAttribute('aria-expanded', String(si));
    if (si) mappaVillaggio.scrollIntoView({behavior:'smooth',block:'nearest'});
    else mappaApri.focus();
}
mappaApri.addEventListener('click', () => mostraMappa(mappaVillaggio.hidden));
document.getElementById('mappaChiudi').addEventListener('click', () => mostraMappa(false));
document.querySelectorAll('[data-mappa]').forEach(b => b.addEventListener('click', () => {
    const destinazione = document.querySelector('#villaggio svg ' + b.dataset.mappa);
    if (!destinazione) { avviso('Questa attrazione non è disponibile in questa vista.'); return; }
    // Il 3D non usa la stessa panoramica orizzontale: passiamo alla vista 2D.
    const scena = document.getElementById('villaggio');
    if (scena.classList.contains('vista-3d')) scena.querySelector('.cambia-vista')?.click();
    let x = Number(destinazione.dataset.x);
    if (!Number.isFinite(x)) {
        const t = destinazione.getAttribute('transform') || '';
        const m = t.match(/translate\(\s*([-\d.]+)/);
        if (m) x = Number(m[1]);
    }
    if (!Number.isFinite(x)) {
        try { const bb = destinazione.getBBox(); x = bb.x + bb.width / 2; } catch { x = NaN; }
    }
    if (Number.isFinite(x)) villaggio.centraSu(x);
    mostraMappa(false);
    consiglioElfo('mappa', 'Eccoci arrivati! Ora tocca a te decidere se entrare o continuare a esplorare.');
    scena.scrollIntoView({behavior:'smooth',block:'center'});
}));

// La guida è indipendente dalle transizioni del villaggio e non copre la scena.
document.getElementById('iniziaTour').addEventListener('click', () => { document.getElementById('villaggio').scrollIntoView({behavior: 'smooth', block:'center'}); document.getElementById('villaggio').focus?.(); consiglioElfo('inizio', 'Benvenuto! Comincia dalla stazione oppure scegli un luogo sulla mappa. Io ti lascio esplorare!'); });
const guidaApri = document.getElementById('guidaApri');
const guidaPannello = document.getElementById('guidaPannello');
function mostraGuida(visibile) {
    guidaPannello.hidden = !visibile;
    guidaApri.setAttribute('aria-expanded', String(visibile));
    if (visibile) guidaPannello.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
    else guidaApri.focus();
}
guidaApri.addEventListener('click', () => mostraGuida(guidaPannello.hidden));
document.getElementById('guidaChiudi').addEventListener('click', () => mostraGuida(false));

document.querySelectorAll('[data-momento]').forEach(bottone => {
    bottone.addEventListener('click', () => villaggio.impostaMomento(bottone.dataset.momento || null));
});
