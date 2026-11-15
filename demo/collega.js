
// ========== DEMO ==========

const MESSAGGI = [
    'Benvenuto nel villaggio! Da oggi ogni giorno si accende una casa.',
    'Una tazza di cioccolata calda ti aspetta stasera ☕',
    'Il primo addobbo è sempre il più bello.',
    'Oggi regala un sorriso a uno sconosciuto.',
    'I biscotti allo zenzero sono pronti 🍪',
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
    'Buona vigilia di Natale! L\'albero della piazza si è acceso 🌟'
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

const villaggio = creaVillaggio(document.getElementById('villaggio'), {
    aperti: 10,
    viste,
    onTocco: campanella,
    onApri: giorno => {
        document.getElementById('giorno-titolo').textContent = `${giorno} dicembre`;
        document.getElementById('giorno-contenuto').replaceChildren(contenutoDemo(giorno));
        velo.hidden = false;
        document.getElementById('btnChiudi').focus();
    },
    onChiusa: giorno => avviso(`Pazienza! Questa casa si apre il ${giorno === 1 ? '1°' : giorno} dicembre.`)
});

function chiudi() {
    velo.hidden = true;
    villaggio.chiudiPorte();
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

document.querySelectorAll('[data-momento]').forEach(bottone => {
    bottone.addEventListener('click', () => villaggio.impostaMomento(bottone.dataset.momento || null));
});
