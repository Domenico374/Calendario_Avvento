// Crea la demo per bambini, un file unico che funziona anche senza internet: node demo/costruisci-bimbi.cjs
// Usa la stessa pagina (bimbi.html), lo stesso codice (bimbi.js, villaggio.js con perBambini) e gli stessi stili
// (style.css, bimbi.css) del sito. Al posto del server c'è un calendario di prova con i 24 regali.
// Scrive demo/bimbi-demo.html: la cartella demo non va sul sito.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const leggi = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const progetto = path.join(__dirname, '..');
const sostituisci = (testo, vecchio, nuovo, dove) => {
    if (testo.split(vecchio).length !== 2) throw new Error(`${dove} è cambiato: aggiorna lo script (${vecchio.slice(0, 50)})`);
    return testo.replace(vecchio, () => nuovo);
};

// I testi dei regali sono gli stessi della demo per grandi (non se ne inventano di nuovi)
const collega = leggi(path.join(__dirname, 'collega.js'));
const MESSAGGI = vm.runInNewContext(collega.match(/const MESSAGGI = (\[[\s\S]*?\n\]);/)[1]);
if (MESSAGGI.length !== 24) throw new Error('servono 24 testi');
const foto = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(progetto, 'albero_natale.jpeg')).toString('base64');

// Il villaggio: come nella demo per grandi, si aggiunge solo impostaOggi per il cursore del giorno
let villaggio = leggi(path.join(progetto, 'villaggio.js'));
villaggio = sostituisci(villaggio, 'export function creaVillaggio(', 'function creaVillaggio(', 'villaggio.js');
villaggio = villaggio.replace(/\bimport\s[^;]+;\n/g, () => { throw new Error('villaggio.js ora importa altri file'); });
villaggio = sostituisci(villaggio,
    '        // Solo per le prove: sposta la vista in un punto del paese\n        centraSu\n',
    '        centraSu,\n        // Nella demo il giorno si cambia con il cursore\n        impostaOggi(giorno) {\n            aperti = giorno;\n            aggiornaStato();\n            const casa = mondo.querySelector(`.casa[data-giorno="${giorno}"]`);\n            centraSu(casa ? Number(casa.dataset.x) : PIAZZA.x);\n        }\n',
    'villaggio.js');
// "aperti" deve poter cambiare: nella firma è una costante dell'oggetto delle opzioni
const firma = /function creaVillaggio\(contenitore, \{ aperti, (.*) \}\) \{/;
if (!firma.test(villaggio)) throw new Error('villaggio.js: firma cambiata');
villaggio = villaggio.replace(firma, (_, resto) => `function creaVillaggio(contenitore, opzioni) {\n    let { aperti } = opzioni;\n    let { ${resto} } = opzioni;`);

// La pagina per bambini, con tre piccoli agganci per la prova
let bimbi = leggi(path.join(progetto, 'bimbi.js'));
// La versione (?v=...) cambia a ogni modifica: si riconosce qualunque numero
const togli = (testo, regola, nuovo, dove) => { if (!regola.test(testo)) throw new Error(`${dove} è cambiato: aggiorna lo script (${regola})`); return testo.replace(regola, () => nuovo); };
bimbi = togli(bimbi, /import \{ creaVillaggio \} from '\.\/villaggio\.js\?v=[^']*';\n/, '', 'bimbi.js');
bimbi = sostituisci(bimbi, "const ID = new URLSearchParams(location.search).get('c');", "const ID = 'prova';", 'bimbi.js');
bimbi = sostituisci(bimbi, 'const viste = new Set(leggiMemoria(chiaveViste, []));', 'const viste = window.__visteProva = new Set(leggiMemoria(chiaveViste, []));', 'bimbi.js');
bimbi = sostituisci(bimbi, 'villaggio = creaVillaggio(', 'villaggio = window.__villaggio = creaVillaggio(', 'bimbi.js');
// I giochi viaggiano dentro la pagina, così funzionano anche senza internet
bimbi = bimbi.replace(/\{ src: '(bimbi-giochi\/[^'?]+)(\?[^']*)?' \}/g, (_, file) => {
    const html = leggi(path.join(progetto, file));
    // Dentro lo script, "</script>" chiuderebbe la pagina: i "<" si scrivono in un altro modo
    return `{ html: ${JSON.stringify(html).replace(/</g, '\\u003c')} }`;
});
if (bimbi.includes("src: 'bimbi-giochi/")) throw new Error('bimbi.js: giochi non trovati');
// Nella prova ogni regalo ha una foto e un testo insieme
bimbi = sostituisci(bimbi, '    switch (dati.tipo) {\n', `    switch (dati.tipo) {
        case 'prova':
            return crea('div', { className: 'regalo-prova' },
                crea('img', { src: dati.url, alt: \`La foto del \${giorno} dicembre\` }),
                crea('p', { textContent: dati.testo }));
`, 'bimbi.js');

// Il calendario di prova risponde al posto del server
const GIORNO_INIZIALE = 10;
const server = `
// ========== DEMO: IL CALENDARIO DI PROVA AL POSTO DEL SERVER ==========
(() => {
    const FOTO = ${JSON.stringify(foto)};
    const TESTI = ${JSON.stringify(MESSAGGI)};
    const giorni = {};
    TESTI.forEach((testo, i) => { giorni[i + 1] = { tipo: 'prova', url: FOTO, testo }; });
    const calendario = { titolo: 'Il calendario di prova', anno: 2026, benvenuto: '', destinatario: 'Bimbo', letteraBabbo: '', aperti: ${GIORNO_INIZIALE}, giorni };
    const rispondi = (dati, stato = 200) => Promise.resolve(new Response(JSON.stringify(dati), { status: stato, headers: { 'Content-Type': 'application/json' } }));
    const fetchVero = window.fetch.bind(window);
    window.fetch = (url, opzioni) => {
        if (String(url).startsWith('/api/calendario')) {
            // La letterina a Babbo Natale nella prova non parte davvero
            return opzioni?.method === 'POST' ? rispondi({ spedita: true }, 201) : rispondi(calendario);
        }
        return fetchVero(url, opzioni);
    };
})();
`;

// I comandi della prova, sotto il villaggio
const comandi = `
<section class="comandi-prova" aria-label="Comandi della prova">
    <p class="nota-prova">🧪 Demo di prova: i regali sono finti e niente viene spedito.</p>
    <label for="oggi">Fai finta che oggi sia il</label>
    <input type="range" id="oggi" min="0" max="24" value="${GIORNO_INIZIALE}">
    <output id="oggi-testo" for="oggi">${GIORNO_INIZIALE} dicembre</output>
    <button type="button" id="btnRichiudi">Richiudi le porte</button>
</section>
`;
const comandiScript = `
// ========== DEMO: IL CURSORE DEL GIORNO ==========
(() => {
    const cursore = document.getElementById('oggi');
    const scritta = document.getElementById('oggi-testo');
    cursore.addEventListener('input', () => {
        const giorno = Number(cursore.value);
        scritta.textContent = giorno === 0 ? 'prima di dicembre' : \`\${giorno} dicembre\`;
        window.__villaggio?.impostaOggi(giorno);
    });
    // Le case si richiudono tutte, anche la 24 con la signora Natale alla porta
    document.getElementById('btnRichiudi').addEventListener('click', () => {
        window.__visteProva?.clear();
        try { localStorage.removeItem('viste_bimbi_prova'); } catch { /* niente memoria */ }
        window.__villaggio?.impostaOggi(Number(cursore.value));
        mostraMessaggio('Porte richiuse: puoi riaprirle tutte.');
    });
})();
`;
const stileProva = `
<style>
.regalo-prova { display: grid; gap: 14px; justify-items: center; }
.regalo-prova img { width: 100%; max-width: 520px; max-height: 52vh; object-fit: contain; border-radius: 14px; border: 4px solid #f4d03f; }
.regalo-prova p { margin: 0; font-size: clamp(1.1rem, 3.4vw, 1.5rem); line-height: 1.4; text-align: center; color: #3b2416; }
.comandi-prova { max-width: 900px; margin: 0 auto 30px; padding: 14px 18px; display: flex; flex-wrap: wrap; gap: 10px 14px; align-items: center; justify-content: center; border-radius: 18px; background: rgba(255, 255, 255, 0.1); color: #fff; font-weight: 700; }
.comandi-prova .nota-prova { flex-basis: 100%; margin: 0; text-align: center; color: #ffe9a8; }
.comandi-prova input { width: min(320px, 70vw); min-height: 32px; }
.comandi-prova output { min-width: 7.5em; }
.comandi-prova button { min-height: 44px; padding: 8px 16px; border: 2px solid #ffd36b; border-radius: 999px; background: rgba(26, 13, 8, 0.6); color: #ffe9a8; font: inherit; cursor: pointer; }
</style>
`;

let pagina = leggi(path.join(progetto, 'bimbi.html'));
pagina = sostituisci(pagina, '<link rel="stylesheet" href="style.css?v=20261119b">', `<style>\n${leggi(path.join(progetto, 'style.css'))}\n</style>`, 'bimbi.html');
pagina = togli(pagina, /<link rel="stylesheet" href="bimbi\.css\?v=[^"]*">/, `<style>\n${leggi(path.join(progetto, 'bimbi.css'))}\n</style>${stileProva}`, 'bimbi.html');
pagina = sostituisci(pagina, '<title>Il Villaggio dell\'Avvento</title>', '<title>Il Villaggio dell\'Avvento – prova per bambini</title>', 'bimbi.html');
pagina = sostituisci(pagina, '    <main id="villaggio" class="scena" hidden></main>\n', '    <main id="villaggio" class="scena" hidden></main>\n' + comandi, 'bimbi.html');
const script = '<script>\n' + server + villaggio + '\n' + bimbi + comandiScript + '</script>';
// Controlla solo la sintassi: new Function non esegue il codice
new Function(server + villaggio + bimbi + comandiScript);
pagina = togli(pagina, /    <script type="module" src="bimbi\.js\?v=[^"]*"><\/script>/, script, 'bimbi.html');

fs.writeFileSync(path.join(__dirname, 'bimbi-demo.html'), pagina);
console.log('demo/bimbi-demo.html', Math.round(pagina.length / 1024), 'KB');
