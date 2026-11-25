// Demo per i genitori, un file unico con un server finto: node demo/costruisci-genitori.cjs
// Dentro ci sono le tre pagine vere del sito (genitori.html, l'editor index.html e bimbi.html)
// con il loro codice (genitori.js, script.js, bimbi.js, villaggio.js) e i loro stili.
// La "cornice" fa da server: crea, salva e legge i calendari in memoria. Niente parte davvero:
// né i calendari, né le foto, né le letterine, né WhatsApp.
// Scrive demo/genitori-demo.html: la cartella demo non va sul sito.
const fs = require('fs');
const path = require('path');
const os = require('os');

const leggi = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const progetto = path.join(__dirname, '..');
const ORIGINE = 'https://villaggio-avvento.vercel.app';
const sostituisci = (testo, vecchio, nuovo, dove) => {
    if (testo.split(vecchio).length !== 2) throw new Error(`${dove} è cambiato: aggiorna lo script (${String(vecchio).slice(0, 60)})`);
    return testo.replace(vecchio, () => nuovo);
};
const togli = (testo, regola, nuovo, dove) => {
    if (!regola.test(testo)) throw new Error(`${dove} è cambiato: aggiorna lo script (${regola})`);
    return testo.replace(regola, () => nuovo);
};

// Gli agganci comuni: indirizzo, cambio pagina e ricarica passano dalla cornice
function agganci(js, dove) {
    js = js.replace(/new URLSearchParams\(location\.search\)/g, 'new URLSearchParams(__cerca)');
    js = js.replace(/location\.href = (`[^`]*`|'[^']*');/g, '__vai($1);');
    js = js.replace(/location\.replace\((`[^`]*`|'[^']*'|\w+)\);/g, '__demo.vai($1, true);');
    js = js.replace(/location\.reload\(\)/g, '__vai(null)');
    js = js.replace(/location\.origin/g, '__origine');
    js = js.replace(/history\.replaceState\(null, '', ('[^']*')\)/g, '__demo.indirizzo($1)');
    const resto = js.match(/\blocation\.\w+|\bhistory\.\w+/g);
    if (resto) throw new Error(`${dove}: aggancio mancante per ${resto.join(', ')}`);
    return js;
}

// villaggio.js chiuso in una funzione: i suoi nomi non si mescolano con quelli della pagina
let villaggio = leggi(path.join(progetto, 'villaggio.js'));
villaggio = sostituisci(villaggio, 'export function creaVillaggio(', 'function creaVillaggio(', 'villaggio.js');
if (/\bimport\s/.test(villaggio.split('\n').filter(r => r.startsWith('import ')).join('\n'))) throw new Error('villaggio.js ora importa altri file');
villaggio = agganci(villaggio, 'villaggio.js');
const conVillaggio = js => `const creaVillaggio = (() => {\n${villaggio}\nreturn creaVillaggio;\n})();\n${js}`;

const stile = `<style>\n${leggi(path.join(progetto, 'style.css'))}\n</style>`;
const PRELUDIO = '<script>/*__PRELUDIO__*/</script>';
const conPreludio = html => sostituisci(html, '<meta charset="UTF-8">', `<meta charset="UTF-8">\n    ${PRELUDIO}`, 'pagina');
const inline = js => {
    if (/<\/script/i.test(js)) throw new Error('nel codice c\'è </script>');
    new Function(js.replace(/^import .*$/gm, '')); // solo la sintassi
    return `<script type="module">\n${js}\n</script>`;
};

// 1) genitori.html
let genitori = leggi(path.join(progetto, 'genitori.html'));
genitori = togli(genitori, /<link rel="stylesheet" href="style\.css\?v=[^"]*">/, stile, 'genitori.html');
genitori = togli(genitori, /<script type="module" src="genitori\.js\?v=[^"]*"><\/script>/, inline(agganci(leggi(path.join(progetto, 'genitori.js')), 'genitori.js')), 'genitori.html');
genitori = conPreludio(genitori);

// 2) L'editor (index.html + script.js): le foto, i vocali e i video restano nella demo
let editorJs = leggi(path.join(progetto, 'script.js'));
editorJs = togli(editorJs, /import \{ creaVillaggio \} from '\.\/villaggio\.js\?v=[^']*';\n/, '', 'script.js');
editorJs = sostituisci(editorJs, "await import('https://cdn.jsdelivr.net/npm/@vercel/blob@2.8.2/client/+esm')", '__demo.archivio', 'script.js');
editorJs = conVillaggio(agganci(editorJs, 'script.js'));
let editor = leggi(path.join(progetto, 'index.html'));
editor = togli(editor, /<link rel="stylesheet" href="style\.css\?v=[^"]*">/, stile, 'index.html');
editor = togli(editor, /    <script type="module" src="script\.js\?v=[^"]*"><\/script>/, inline(editorJs), 'index.html');
editor = conPreludio(editor);

// 3) La versione per bambini (bimbi.html + bimbi.js), con i giochi dentro la pagina
let bimbiJs = leggi(path.join(progetto, 'bimbi.js'));
bimbiJs = togli(bimbiJs, /import \{ creaVillaggio \} from '\.\/villaggio\.js\?v=[^']*';\n/, '', 'bimbi.js');
bimbiJs = bimbiJs.replace(/\{ src: '(bimbi-giochi\/[^'?]+)(\?[^']*)?' \}/g, (_, file) =>
    `{ html: ${JSON.stringify(leggi(path.join(progetto, file))).replace(/</g, '\\u003c')} }`);
if (bimbiJs.includes("src: 'bimbi-giochi/")) throw new Error('bimbi.js: giochi non trovati');
bimbiJs = conVillaggio(agganci(bimbiJs, 'bimbi.js'));
let bimbi = leggi(path.join(progetto, 'bimbi.html'));
bimbi = togli(bimbi, /<link rel="stylesheet" href="style\.css\?v=[^"]*">/, stile, 'bimbi.html');
bimbi = togli(bimbi, /<link rel="stylesheet" href="bimbi\.css\?v=[^"]*">/, `<style>\n${leggi(path.join(progetto, 'bimbi.css'))}\n</style>`, 'bimbi.html');
bimbi = togli(bimbi, /    <script type="module" src="bimbi\.js\?v=[^"]*"><\/script>/, inline(bimbiJs), 'bimbi.html');
bimbi = conPreludio(bimbi);

const PAGINE = { genitori, editor, bimbi };

// La cornice: barra della prova, server finto e le pagine
const cornice = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Il Villaggio dell'Avvento – prova</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎄</text></svg>">
<style>
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: #0d1633; font-family: Nunito, system-ui, sans-serif; }
body { display: flex; flex-direction: column; }
.barra-prova { flex: none; display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; padding: 8px 12px; background: #1a0d08; color: #ffe9a8; font-size: 14px; font-weight: 700; border-bottom: 2px solid #ffd36b; }
.barra-prova .nota { white-space: nowrap; }
.barra-prova .indirizzo { flex: 1 1 260px; min-width: 0; padding: 5px 10px; border-radius: 999px; background: #fff; color: #333; font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.barra-prova button, .barra-prova select { min-height: 34px; padding: 4px 12px; border: 2px solid #ffd36b; border-radius: 999px; background: rgba(255, 255, 255, 0.08); color: #ffe9a8; font: inherit; cursor: pointer; }
.barra-prova select option { color: #222; }
.barra-prova button:disabled { opacity: 0.4; cursor: default; }
.barra-prova .messaggio { flex-basis: 100%; color: #fff; }
iframe { flex: 1; width: 100%; border: 0; background: #0d1633; }
</style>
</head>
<body>
<div class="barra-prova">
    <span class="nota">🧪 Demo di prova: niente viene spedito</span>
    <button type="button" id="btnIndietro" disabled>← Indietro</button>
    <span class="indirizzo" id="indirizzo"></span>
    <label id="campo-giorno" hidden>Il bambino lo apre il
        <select id="giorno"></select>
    </label>
    <button type="button" id="btnRicomincia">Ricomincia</button>
    <span class="messaggio" id="messaggio" role="status" hidden></span>
</div>
<iframe id="pagina" title="Il sito" allow="clipboard-write *; clipboard-read *; autoplay *; fullscreen *; microphone *"></iframe>
<script>
(() => {
    const ORIGINE = ${JSON.stringify(ORIGINE)};
    const PAGINE = ${JSON.stringify(PAGINE).replace(/</g, '\\u003c')};
    const $ = id => document.getElementById(id);

    // ---- Il server finto: i calendari restano in memoria finché la demo è aperta ----
    const calendari = new Map();
    let giornoDemo = 10;
    const casuale = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return btoa(String.fromCharCode(...a)).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, ''); };
    const risposta = (dati, stato = 200) => Promise.resolve(new Response(JSON.stringify(dati), { status: stato, headers: { 'Content-Type': 'application/json' } }));
    const completo = c => ({ titolo: c.titolo, anno: c.anno, ...(c.perBambini ? { perBambini: true } : {}), benvenuto: c.benvenuto, destinatario: c.destinatario, letteraBabbo: c.letteraBabbo, giorni: { ...c.giorni }, lettere: [...c.lettere] });
    function api(url, opzioni = {}) {
        const u = new URL(url, ORIGINE);
        if (u.pathname !== '/api/calendario') return risposta({ errore: 'Richiesta non valida.' }, 405);
        if ((opzioni.method || 'GET') === 'GET') {
            const c = calendari.get(u.searchParams.get('id'));
            if (!c) return risposta({ errore: 'Calendario non trovato.' }, 404);
            const chiave = u.searchParams.get('chiave');
            if (chiave && chiave !== c.chiave) return risposta({ errore: 'Link di modifica non valido.' }, 403);
            if (chiave) return risposta({ ...completo(c), modifica: true });
            // Quello che vede il bambino: solo le case già aperte nel giorno scelto nella barra
            const giorni = {};
            for (let g = 1; g <= giornoDemo; g++) if (c.giorni[g]) giorni[g] = c.giorni[g];
            return risposta({ titolo: c.titolo, anno: c.anno, benvenuto: c.benvenuto, destinatario: c.destinatario, letteraBabbo: c.letteraBabbo, aperti: giornoDemo, giorni });
        }
        const b = JSON.parse(opzioni.body || '{}');
        if (b.azione === 'crea') {
            const id = casuale(9), chiave = casuale(24);
            const titolo = typeof b.titolo === 'string' && b.titolo.trim() ? b.titolo.trim().slice(0, 80) : "Calendario dell'Avvento";
            calendari.set(id, { chiave, titolo, anno: 2026, perBambini: b.perBambini === true, benvenuto: '', destinatario: '', letteraBabbo: '', giorni: {}, lettere: [] });
            return risposta({ id, chiave }, 201);
        }
        const c = calendari.get(b.id);
        if (b.azione === 'lettera') {
            // La letterina del bambino resta qui: la legge solo chi prepara
            if (!c) return risposta({ errore: 'Calendario non trovato.' }, 404);
            c.lettere = [...c.lettere, { testo: String(b.testo || '').slice(0, 1000), firma: String(b.firma || '').slice(0, 40), data: new Date().toISOString() }].slice(-30);
            return risposta({ spedita: true }, 201);
        }
        if (!c || b.chiave !== c.chiave) return risposta({ errore: 'Link di modifica non valido.' }, 403);
        if (b.azione === 'salva') {
            for (const campo of ['titolo', 'benvenuto', 'destinatario', 'letteraBabbo']) if (typeof b[campo] === 'string') c[campo] = campo === 'titolo' ? (b.titolo.trim() || "Calendario dell'Avvento") : b[campo].trim();
            for (const [g, contenuto] of Object.entries(b.modifiche || {})) {
                if (contenuto === null) delete c.giorni[g];
                else c.giorni[g] = contenuto;
            }
            return risposta(completo(c));
        }
        if (b.azione === 'elimina') {
            calendari.delete(b.id);
            return risposta({ eliminato: true });
        }
        return risposta({ errore: 'Richiesta non valida.' }, 405);
    }
    // Foto, audio e video restano nel browser: non vanno su nessun archivio
    const archivio = {
        async upload(percorso, file, opzioni = {}) {
            opzioni.onUploadProgress?.({ percentage: 100 });
            return { url: URL.createObjectURL(file) };
        }
    };

    // ---- Le pagine: si passa dall'una all'altra senza uscire dal file ----
    const storia = [];
    let attuale = null;
    function pagina(percorso) {
        if (percorso === '/genitori.html') return 'genitori';
        if (percorso === '/bimbi.html') return 'bimbi';
        if (percorso === '/' || percorso === '/index.html') return 'editor';
        return null;
    }
    function mostra(testo) {
        $('messaggio').textContent = testo;
        $('messaggio').hidden = false;
        clearTimeout(mostra.timer);
        mostra.timer = setTimeout(() => { $('messaggio').hidden = true; }, 6000);
    }
    function apri(indirizzo) {
        const u = new URL(indirizzo, ORIGINE);
        const quale = pagina(u.pathname);
        attuale = u.pathname + u.search;
        $('indirizzo').textContent = ORIGINE + attuale;
        $('btnIndietro').disabled = storia.length === 0;
        $('campo-giorno').hidden = quale !== 'bimbi';
        const preludio = \`
const __demo = parent.__demo;
const __cerca = \${JSON.stringify(u.search)};
const __origine = \${JSON.stringify(ORIGINE)};
const __vai = indirizzo => __demo.vai(indirizzo);
(() => {
    const fetchVero = window.fetch.bind(window);
    window.fetch = (url, opzioni) => String(url).startsWith('/api/') ? __demo.api(String(url), opzioni) : fetchVero(url, opzioni);
    document.addEventListener('click', evento => {
        const a = evento.target.closest && evento.target.closest('a[href]');
        if (!a) return;
        const h = a.getAttribute('href');
        if (/^https:\\\\/\\\\/(wa\\\\.me|api\\\\.whatsapp)/.test(h)) {
            evento.preventDefault();
            __demo.messaggio('Nella demo WhatsApp non si apre: niente viene spedito.');
        } else if (h.startsWith('mailto:')) {
            evento.preventDefault();
            __demo.messaggio('Nella demo l\\\\'email non si apre: niente viene spedito.');
        } else if (h.startsWith('/') || h.startsWith(__origine)) {
            evento.preventDefault();
            __vai(h.startsWith('/') ? h : (h.slice(__origine.length) || '/'));
        }
    }, true);
})();\`;
        $('pagina').srcdoc = PAGINE[quale].replace('/*__PRELUDIO__*/', preludio);
    }
    function vai(indirizzo, sostituisci = false) {
        // Il cambio pagina parte dopo, fuori dal codice della pagina che lo chiede
        setTimeout(() => {
            if (indirizzo === null) return apri(attuale);
            const u = new URL(indirizzo, ORIGINE);
            if (u.origin !== ORIGINE || !pagina(u.pathname)) return mostra('Nella demo questa pagina non c\\'è.');
            if (attuale && !sostituisci) storia.push(attuale);
            apri(indirizzo);
        });
    }
    window.__demo = {
        api, archivio, vai,
        messaggio: mostra,
        indirizzo(percorso) {
            attuale = new URL(percorso, ORIGINE).pathname + new URL(percorso, ORIGINE).search;
            $('indirizzo').textContent = ORIGINE + attuale;
        },
        // Solo per le prove automatiche
        calendari
    };

    $('btnIndietro').addEventListener('click', () => { if (storia.length) apri(storia.pop()); });
    $('btnRicomincia').addEventListener('click', () => {
        calendari.clear();
        storia.length = 0;
        try { ['miei_calendari', 'vista_bambino', 'calendario_bimbi'].forEach(chiave => localStorage.removeItem(chiave)); } catch { /* niente memoria */ }
        apri('/genitori.html');
    });
    const scelta = $('giorno');
    scelta.append(new Option('prima di dicembre', '0'), ...Array.from({ length: 24 }, (_, i) => new Option(\`\${i + 1} dicembre\`, String(i + 1))));
    scelta.value = String(giornoDemo);
    scelta.addEventListener('change', () => { giornoDemo = Number(scelta.value); apri(attuale); });

    // Si parte sempre puliti, dalla pagina dei genitori
    try { ['miei_calendari', 'vista_bambino', 'calendario_bimbi'].forEach(chiave => localStorage.removeItem(chiave)); } catch { /* niente memoria */ }
    apri('/genitori.html');
})();
</script>
</body>
</html>
`;
// Controlla la sintassi dello script della cornice
new Function(cornice.slice(cornice.lastIndexOf('<script>') + 8, cornice.lastIndexOf('</script>')));

const uscita = path.join(__dirname, 'genitori-demo.html');
fs.writeFileSync(uscita, cornice);
console.log('demo/genitori-demo.html', Math.round(cornice.length / 1024), 'KB');
