// Il villaggio dell'Avvento: un paese innevato più largo dello schermo, da esplorare trascinando.
// 23 case lungo la strada e l'albero del 24 in piazza.

const NS = 'http://www.w3.org/2000/svg';
const ALTEZZA = 900;
// Si inquadra solo la parte bassa del cielo, così le case sono più grandi
const VISTA_Y = 300;
const VISTA_H = 600;
const MONDO = 5300; // Larghezza del paese: dopo la stazione il quartiere di Babbo Natale, in fondo il luna park
// Subito dopo la stazione c'è il quartiere di Babbo Natale (posta, laboratorio, stalla):
// tutto quello che veniva dopo è spostato più in là
const QUARTIERE = { da: 2060, largo: 900 };
const sposta = x => (x > QUARTIERE.da ? x + QUARTIERE.largo : x);
const PIAZZA = { x: 1800, y: 705 };
const BINARI_Y = 580;
// Il treno si ferma con la locomotiva davanti alla stazione
const STAZIONE = { x: 2010, y: 572, fermata: 1990 };

// La strada principale: le case si dispongono ai suoi lati
const STRADA = 'M-50 720 C 300 660, 600 780, 1000 720 S 1500 640, 1800 700 C 2100 760, 2400 640, 2700 700 C 3000 760, 3200 780, 3600 710 S 4200 650, 4600 720 S 5100 690, 5500 720';

// Le case sono in ordine di giorno, da sinistra a destra lungo la strada: il 24 è l'albero in piazza.
// Il tipo di casa dipende dalla fila: le torri, alte, stanno solo dietro per non coprire i numeri
const TIPI_DIETRO = ['punta', 'torre', 'punta', 'piatto'];
const TIPI_DAVANTI = ['punta', 'piatto', 'punta'];
// Lato della strada: dietro (più lontane e piccole) o davanti
const DIETRO = [180, 380, 1000, 1230, 1460, 2150, 2380, 2610, 3080, 3300, 3500].map(sposta);
const DAVANTI = [120, 330, 560, 790, 1030, 1270, 1520, 2080, 2330, 2580, 3150, 3420].map(sposta);

function el(tag, attributi = {}, genitore = null) {
    const nodo = document.createElementNS(NS, tag);
    for (const [nome, valore] of Object.entries(attributi)) nodo.setAttribute(nome, valore);
    if (genitore) genitore.append(nodo);
    return nodo;
}

// Generatore ripetibile: il villaggio è sempre uguale
let seme = 7;
function caso() {
    seme = (seme * 16807) % 2147483647;
    return (seme - 1) / 2147483646;
}

function scurisci(colore, quanto) {
    const n = parseInt(colore.slice(1), 16);
    const canale = shift => Math.max(0, Math.round(((n >> shift) & 255) * (1 - quanto)));
    return `rgb(${canale(16)},${canale(8)},${canale(0)})`;
}

// Più in basso vuol dire più vicino, quindi più grande
function scalaPer(y) {
    return Math.min(1.05, Math.max(0.5, 0.5 + ((y - 560) / 320) * 0.55));
}

// ========== SFONDO ==========

function disegnaDefinizioni(svg) {
    const defs = el('defs', {}, svg);
    const cielo = el('linearGradient', { id: 'cielo', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#060a24' }, cielo);
    el('stop', { offset: '55%', 'stop-color': '#1d2b6b' }, cielo);
    el('stop', { offset: '100%', 'stop-color': '#5b6fb8' }, cielo);
    // Gli altri cieli: alba rosata, giorno azzurro, tramonto arancione
    [
        ['cielo-alba', '#34407e', '#c98aab', '#ffd2a6'],
        ['cielo-giorno', '#3f7fd0', '#8dbcec', '#d9eafb'],
        ['cielo-tramonto', '#262a66', '#a8578a', '#ffa860']
    ].forEach(([id, alto, medio, basso]) => {
        const g = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        el('stop', { offset: '0%', 'stop-color': alto }, g);
        el('stop', { offset: '60%', 'stop-color': medio }, g);
        el('stop', { offset: '100%', 'stop-color': basso }, g);
    });
    const sole = el('radialGradient', { id: 'alone-sole' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff3c0', 'stop-opacity': 0.9 }, sole);
    el('stop', { offset: '40%', 'stop-color': '#ffd27a', 'stop-opacity': 0.45 }, sole);
    el('stop', { offset: '100%', 'stop-color': '#ffd27a', 'stop-opacity': 0 }, sole);
    const terra = el('linearGradient', { id: 'terra', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#dfe9fb' }, terra);
    el('stop', { offset: '100%', 'stop-color': '#b8c8e8' }, terra);
    const ghiaccio = el('linearGradient', { id: 'ghiaccio', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#d6f1ff' }, ghiaccio);
    el('stop', { offset: '100%', 'stop-color': '#8cc4e6' }, ghiaccio);
    const sfoca = el('filter', { id: 'sfoca', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feGaussianBlur', { stdDeviation: 30 }, sfoca);
    const bagliore = el('filter', { id: 'bagliore', x: '-100%', y: '-100%', width: '300%', height: '300%' }, defs);
    el('feGaussianBlur', { stdDeviation: 3, result: 'b' }, bagliore);
    const unisci = el('feMerge', {}, bagliore);
    el('feMergeNode', { in: 'b' }, unisci);
    el('feMergeNode', { in: 'SourceGraphic' }, unisci);
    const fumoMorbido = el('radialGradient', { id: 'fumo-morbido' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#f1f4fb', 'stop-opacity': 0.95 }, fumoMorbido);
    el('stop', { offset: '60%', 'stop-color': '#e3e9f6', 'stop-opacity': 0.5 }, fumoMorbido);
    el('stop', { offset: '100%', 'stop-color': '#e3e9f6', 'stop-opacity': 0 }, fumoMorbido);
    const riflesso = el('linearGradient', { id: 'riflesso-ghiaccio', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.75 }, riflesso);
    el('stop', { offset: '55%', 'stop-color': '#ffffff', 'stop-opacity': 0.08 }, riflesso);
    el('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': 0 }, riflesso);
    // Foschia della lontananza: le cose lontane si fanno più chiare e azzurre
    const foschia = el('linearGradient', { id: 'foschia', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { class: 'stop-foschia', offset: '0%', 'stop-color': '#e3ebfb', 'stop-opacity': 0 }, foschia);
    el('stop', { class: 'stop-foschia', offset: '100%', 'stop-color': '#e3ebfb', 'stop-opacity': 0.6 }, foschia);
    const banco = el('radialGradient', { id: 'banco-nebbia' }, defs);
    el('stop', { class: 'stop-nebbia', offset: '0%', 'stop-color': '#f2f6ff', 'stop-opacity': 0.5 }, banco);
    el('stop', { class: 'stop-nebbia', offset: '100%', 'stop-color': '#f2f6ff', 'stop-opacity': 0 }, banco);
    const duna = el('radialGradient', { id: 'duna', cx: '45%', cy: '35%', r: '60%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.95 }, duna);
    el('stop', { offset: '65%', 'stop-color': '#ffffff', 'stop-opacity': 0.35 }, duna);
    el('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': 0 }, duna);
    // La luce arriva da sinistra (luna o sole): il lato sinistro è più chiaro, il destro in ombra
    const luce = el('linearGradient', { id: 'luce-facciata', x1: 0, y1: 0, x2: 1, y2: 0.25 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff6e0', 'stop-opacity': 0.16 }, luce);
    el('stop', { offset: '45%', 'stop-color': '#fff6e0', 'stop-opacity': 0 }, luce);
    el('stop', { offset: '100%', 'stop-color': '#0b1440', 'stop-opacity': 0.22 }, luce);
    const lucetetto = el('linearGradient', { id: 'luce-tetto', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.14 }, lucetetto);
    el('stop', { offset: '50%', 'stop-color': '#ffffff', 'stop-opacity': 0 }, lucetetto);
    el('stop', { offset: '100%', 'stop-color': '#0b1440', 'stop-opacity': 0.25 }, lucetetto);
    const ombraMorbida = el('filter', { id: 'ombra-morbida', x: '-30%', y: '-60%', width: '160%', height: '220%' }, defs);
    el('feGaussianBlur', { stdDeviation: 5 }, ombraMorbida);
    const pozza = el('radialGradient', { id: 'pozza-luce' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffcf73', 'stop-opacity': 0.55 }, pozza);
    el('stop', { offset: '60%', 'stop-color': '#ffcf73', 'stop-opacity': 0.18 }, pozza);
    el('stop', { offset: '100%', 'stop-color': '#ffcf73', 'stop-opacity': 0 }, pozza);
    const cono = el('linearGradient', { id: 'cono-luce', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff1b8', 'stop-opacity': 0.45 }, cono);
    el('stop', { offset: '100%', 'stop-color': '#fff1b8', 'stop-opacity': 0 }, cono);
    const monteVicino = el('linearGradient', { id: 'monte-vicino', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { class: 'stop-monte-alto', offset: '0%', 'stop-color': '#d3def5' }, monteVicino);
    el('stop', { class: 'stop-monte-basso', offset: '100%', 'stop-color': '#a8b9df' }, monteVicino);
    const monteRemoto = el('linearGradient', { id: 'monte-remoto', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { class: 'stop-remoto-alto', offset: '0%', 'stop-color': '#dfe7f8' }, monteRemoto);
    el('stop', { class: 'stop-remoto-basso', offset: '100%', 'stop-color': '#c3d0ee' }, monteRemoto);
    const cumulo = el('linearGradient', { id: 'cumulo-davanti', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffffff' }, cumulo);
    el('stop', { offset: '100%', 'stop-color': '#c9d6f0' }, cumulo);
    const bokeh = el('radialGradient', { id: 'bokeh' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffe2a0', 'stop-opacity': 0.55 }, bokeh);
    el('stop', { offset: '70%', 'stop-color': '#ffd27a', 'stop-opacity': 0.25 }, bokeh);
    el('stop', { offset: '100%', 'stop-color': '#ffd27a', 'stop-opacity': 0 }, bokeh);
    const viaLattea = el('linearGradient', { id: 'via-lattea', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#b8c4ff', 'stop-opacity': 0 }, viaLattea);
    el('stop', { offset: '50%', 'stop-color': '#dfe4ff', 'stop-opacity': 0.5 }, viaLattea);
    el('stop', { offset: '100%', 'stop-color': '#b8c4ff', 'stop-opacity': 0 }, viaLattea);
    const alone = el('radialGradient', { id: 'alone' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffe08a', 'stop-opacity': 0.9 }, alone);
    el('stop', { offset: '100%', 'stop-color': '#ffe08a', 'stop-opacity': 0 }, alone);

    // Materiali delle case: righe leggere sopra il colore di base
    const trama = (id, larghezza, altezza, disegno, tratto = 'rgba(0,0,0,0.2)') => {
        const motivo = el('pattern', { id, width: larghezza, height: altezza, patternUnits: 'userSpaceOnUse' }, defs);
        el('path', { d: disegno, fill: 'none', stroke: tratto, 'stroke-width': 1 }, motivo);
    };
    trama('tex-assi', 24, 8, 'M0 7.5 H24 M9 2 q4 1 8 0', 'rgba(0,0,0,0.16)');
    trama('tex-mattoni', 16, 8, 'M0 3.5 H16 M0 7.5 H16 M5 0 V3.5 M13 3.5 V7.5', 'rgba(0,0,0,0.22)');
    trama('tex-intonaco', 30, 30, 'M4 6 l2 1 M18 20 l3 -1 M25 9 l1 2', 'rgba(0,0,0,0.08)');
    trama('tex-pietra', 18, 12, 'M0 5.5 H18 M0 11.5 H18 M6 0 V5.5 M14 5.5 V11.5 M2 5.5 q2 -3 4 0', 'rgba(0,0,0,0.3)');
    trama('tex-tegole', 14, 18, 'M-7 9 Q-3.5 3 0 9 Q3.5 3 7 9 Q10.5 3 14 9 Q17.5 3 21 9 M-7 18 Q-3.5 12 0 18 Q3.5 12 7 18 Q10.5 12 14 18 Q17.5 12 21 18', 'rgba(0,0,0,0.25)');
    // Tavole verticali sulle pareti: tre assi di tono diverso, fessure, venature e qualche nodo
    const tavole = el('pattern', { id: 'tavole-parete', width: 168, height: 420, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: 0, y: 0, width: 56, height: 420, fill: '#000', opacity: 0.07 }, tavole);
    el('rect', { x: 112, y: 0, width: 56, height: 420, fill: '#ffd9a8', opacity: 0.05 }, tavole);
    [0, 56, 112].forEach((tx, i) => {
        el('rect', { x: tx, y: 0, width: 3, height: 420, fill: '#000', opacity: 0.38 }, tavole);
        el('rect', { x: tx + 3, y: 0, width: 1.5, height: 420, fill: '#fff', opacity: 0.07 }, tavole);
        el('path', { d: `M${tx + 16} 0 C ${tx + 22} 120, ${tx + 10} 240, ${tx + 18} 420 M${tx + 38} 0 C ${tx + 32} 140, ${tx + 44} 280, ${tx + 36} 420`, stroke: '#000', 'stroke-width': 1.2, fill: 'none', opacity: 0.12 }, tavole);
        const ny = [90, 300, 200][i];
        el('ellipse', { cx: tx + 28, cy: ny, rx: 5, ry: 9, fill: 'none', stroke: '#000', 'stroke-width': 1.5, opacity: 0.2 }, tavole);
        el('ellipse', { cx: tx + 28, cy: ny, rx: 2, ry: 4, fill: '#000', opacity: 0.18 }, tavole);
    });
    // Assi del pavimento orizzontali, con le giunture sfalsate
    const pavimento = el('pattern', { id: 'tavole-pavimento', width: 360, height: 72, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: 0, y: 36, width: 360, height: 36, fill: '#000', opacity: 0.06 }, pavimento);
    el('path', { d: 'M0 35 H360 M0 71 H360 M120 0 V35 M300 36 V71', stroke: '#000', 'stroke-width': 2.5, opacity: 0.35 }, pavimento);
    el('path', { d: 'M0 2 H360 M0 38 H360', stroke: '#fff', 'stroke-width': 1.2, opacity: 0.07 }, pavimento);
    el('path', { d: 'M10 18 C 80 14, 160 22, 240 17 M140 54 C 210 50, 280 58, 350 53', stroke: '#000', 'stroke-width': 1, fill: 'none', opacity: 0.12 }, pavimento);
    // La luce delle stanze: centro illuminato, angoli in penombra
    const penombra = el('radialGradient', { id: 'penombra-stanza', gradientUnits: 'userSpaceOnUse', cx: 800, cy: 400, r: 1050 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#120804', 'stop-opacity': 0 }, penombra);
    el('stop', { offset: '50%', 'stop-color': '#120804', 'stop-opacity': 0 }, penombra);
    el('stop', { offset: '100%', 'stop-color': '#120804', 'stop-opacity': 0.6 }, penombra);
    const lucePalco = el('radialGradient', { id: 'luce-stanza' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffd99a', 'stop-opacity': 0.22 }, lucePalco);
    el('stop', { offset: '100%', 'stop-color': '#ffd99a', 'stop-opacity': 0 }, lucePalco);
    // Ombra sotto la gronda e verso terra
    const ombra = el('linearGradient', { id: 'ombra-muro', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#000', 'stop-opacity': 0.3 }, ombra);
    el('stop', { offset: '18%', 'stop-color': '#000', 'stop-opacity': 0 }, ombra);
    el('stop', { offset: '80%', 'stop-color': '#000', 'stop-opacity': 0 }, ombra);
    el('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': 0.15 }, ombra);
    // Vetri: spenti con un riflesso, accesi con una luce calda
    const spento = el('linearGradient', { id: 'vetro-spento', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#4a5a8c' }, spento);
    el('stop', { offset: '45%', 'stop-color': '#27325a' }, spento);
    el('stop', { offset: '100%', 'stop-color': '#1a2142' }, spento);
    const acceso = el('radialGradient', { id: 'vetro-acceso', cx: '50%', cy: '60%', r: '70%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff7d1' }, acceso);
    el('stop', { offset: '55%', 'stop-color': '#ffc864' }, acceso);
    el('stop', { offset: '100%', 'stop-color': '#e98a2c' }, acceso);
    // Pelo delle renne: schiena scura, pancia chiara
    const peloRenna = el('linearGradient', { id: 'pelo-renna', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#5e3f2a' }, peloRenna);
    el('stop', { offset: '45%', 'stop-color': '#8a5f40' }, peloRenna);
    el('stop', { offset: '100%', 'stop-color': '#d9c3a5' }, peloRenna);
    // Riflesso dei cilindri e delle casse del treno: luce in alto, ombra in basso
    const cilindro = el('linearGradient', { id: 'cilindro', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': 0.08 }, cilindro);
    el('stop', { offset: '22%', 'stop-color': '#fff', 'stop-opacity': 0.28 }, cilindro);
    el('stop', { offset: '45%', 'stop-color': '#fff', 'stop-opacity': 0 }, cilindro);
    el('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': 0.4 }, cilindro);
}

function disegnaCielo(strato) {
    el('rect', { class: 'volta', x: -100, width: 3400, height: ALTEZZA, fill: 'url(#cielo)' }, strato);
    // Il sole: basso all'alba e al tramonto, alto di giorno (la posizione la decide il CSS)
    const sole = el('g', { class: 'sole' }, strato);
    el('circle', { cx: 0, cy: 0, r: 150, fill: 'url(#alone-sole)' }, sole);
    el('circle', { class: 'disco-sole', cx: 0, cy: 0, r: 34, fill: '#fff1b8' }, sole);
    // Nuvole morbide, visibili di giorno
    const nuvole = el('g', { class: 'nuvole' }, strato);
    [[260, 360, 1], [760, 330, 1.3], [1250, 380, 0.9], [1750, 345, 1.15], [2300, 370, 1]].forEach(([x, y, k]) => {
        const n = el('g', { transform: `translate(${x} ${y}) scale(${k})` }, nuvole);
        [[-50, 6, 34, 16], [-14, -6, 40, 22], [28, 2, 36, 18], [60, 10, 26, 12]].forEach(([cx, cy, rx, ry]) => el('ellipse', { cx, cy, rx, ry, fill: '#ffffff' }, n));
        el('ellipse', { cx: 6, cy: 16, rx: 80, ry: 8, fill: '#dfe7f5' }, n);
    });
    // L'animazione dell'aurora usa transform, quindi lo spostamento va sul gruppo
    const aurore = el('g', { class: 'aurore', transform: 'translate(0 180)' }, strato);
    el('path', { class: 'aurora', d: 'M-100 260 C 250 120, 500 300, 820 170 S 1350 120, 1700 230 S 2500 140, 3300 220 L3300 320 C 2600 260, 2000 330, 1700 290 S 300 240, -100 360 Z', fill: '#3ee6b0', filter: 'url(#sfoca)' }, aurore);
    el('path', { class: 'aurora', style: 'animation-delay:-4s', d: 'M-100 200 C 300 90, 700 240, 1000 120 S 1900 160, 3300 140 L3300 200 C 2400 230, 1600 250, 900 220 S 300 200, -100 280 Z', fill: '#7b6cff', filter: 'url(#sfoca)', opacity: 0.4 }, aurore);
    for (let i = 0; i < 160; i++) {
        el('circle', {
            class: 'stella', cx: caso() * 3300, cy: 300 + caso() * 230, r: 0.8 + caso() * 2,
            fill: '#fff', style: `animation-delay:${(caso() * 3).toFixed(2)}s`
        }, strato);
    }
    // Numeri a parte, così il resto del paese resta disegnato com'era
    let semeCielo = 11;
    const casoCielo = () => (semeCielo = (semeCielo * 16807) % 2147483647) / 2147483647;
    const notturno = el('g', { class: 'cielo-notte', 'pointer-events': 'none' }, strato);
    el('path', { d: 'M-100 470 C 500 330, 1200 300, 1800 360 S 2900 300, 3300 340 L3300 400 C 2800 360, 2200 430, 1700 410 S 500 390, -100 540 Z', fill: 'url(#via-lattea)', filter: 'url(#sfoca)', opacity: 0.55 }, notturno);
    let polvere = '';
    for (let i = 0; i < 260; i++) {
        const x = casoCielo() * 3300, y = 300 + casoCielo() * 260, k = 0.5 + casoCielo() * 0.7;
        polvere += `M${x.toFixed(1)} ${y.toFixed(1)}h${k.toFixed(1)}v${k.toFixed(1)}h-${k.toFixed(1)}Z`;
    }
    el('path', { d: polvere, fill: '#ffffff', opacity: 0.65 }, notturno);
    const luna = el('g', { class: 'luna' }, strato);
    el('circle', { cx: 1500, cy: 370, r: 130, fill: 'url(#alone-sole)', opacity: 0.35 }, luna);
    el('circle', { cx: 1500, cy: 370, r: 40, fill: '#fdf6d8', filter: 'url(#bagliore)' }, luna);
    [[1488, 360, 7], [1506, 384, 5], [1484, 384, 3.5]].forEach(([cx, cy, rr]) => el('circle', { cx, cy, r: rr, fill: '#e6dcb4', opacity: 0.55 }, luna));
    el('circle', { cx: 1516, cy: 360, r: 36, fill: '#1d2b6b', opacity: 0.25 }, luna);
    disegnaSlitta(strato);
}

// ========== LA SLITTA DI BABBO NATALE ==========
// Ogni tanto attraversa il cielo, trainata dalle renne, lasciando una scia di polvere di stelle

function rennaVolante(genitore, x, y, scuro, naso) {
    const r = el('g', { transform: `translate(${x} ${y})` }, genitore);
    const pelo = scuro ? '#6b4428' : '#8a5a36';
    // Zampe posteriori e anteriori: si muovono come al galoppo
    el('path', { class: 'zampe-volo', d: 'M-9 3 l-7 7 M-6 3 l-4 9', stroke: pelo, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, r);
    el('path', { class: 'zampe-volo dopo', d: 'M8 3 l7 6 M10 2 l9 3', stroke: pelo, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, r);
    el('ellipse', { cx: 0, cy: 0, rx: 14, ry: 6.5, fill: pelo }, r);
    el('ellipse', { cx: -1, cy: 2.5, rx: 10, ry: 3, fill: '#c9a27c', opacity: 0.7 }, r);
    el('path', { d: 'M-14 -2 q -4 -3 -3 -6', stroke: '#f2e6d8', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, r);
    // Collo, testa e corna
    el('path', { d: 'M9 -3 Q14 -10 15 -14 L20 -12 Q18 -6 13 2 Z', fill: pelo }, r);
    el('ellipse', { cx: 20, cy: -14, rx: 6, ry: 3.6, transform: 'rotate(18 20 -14)', fill: pelo }, r);
    el('circle', { cx: 26, cy: -12, r: naso ? 2.4 : 1.6, fill: naso ? '#ff3b30' : '#2a1d14', ...(naso ? { filter: 'url(#bagliore)' } : {}) }, r);
    el('path', { d: 'M17 -17 q -2 -7 -7 -9 M15 -22 l -5 -1 M18 -17 q 3 -7 0 -12 M19 -24 l 4 -2', stroke: '#d9c3a0', 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round' }, r);
    // Finimenti rossi con il campanello
    el('path', { d: 'M8 -4 Q10 2 7 6', stroke: '#c0392b', 'stroke-width': 2.4, fill: 'none' }, r);
    el('circle', { cx: 8, cy: 6, r: 1.6, fill: '#f4d03f' }, r);
    return r;
}

function disegnaSlitta(strato) {
    const volo = el('g', { class: 'slitta', 'pointer-events': 'none' }, strato);
    const corpo = el('g', { class: 'slitta-corpo' }, volo);
    // Scia di polvere di stelle dietro la slitta
    for (let i = 0; i < 26; i++) {
        const x = -60 - i * 9 - (i % 3) * 4, y = 4 + Math.sin(i * 0.8) * 7 + i * 0.6;
        el('circle', { class: 'scia', cx: x, cy: y, r: Math.max(0.6, 2.6 - i * 0.08), fill: i % 4 ? '#fff6c8' : '#ffd36b', style: `animation-delay:${(-i * 0.13).toFixed(2)}s` }, corpo);
    }
    // Redini dalla slitta fino alla renna davanti
    el('path', { d: 'M18 -14 Q 90 -6 210 -14', stroke: '#8a5a1f', 'stroke-width': 1.2, fill: 'none' }, corpo);
    el('path', { d: 'M18 -10 Q 90 0 206 -8', stroke: '#8a5a1f', 'stroke-width': 1.2, fill: 'none', opacity: 0.7 }, corpo);
    // Il sacco dei regali e Babbo Natale
    el('path', { d: 'M-40 -22 q -10 -22 6 -30 q 12 -4 18 6 q 6 14 -6 26 Z', fill: '#8a5a36' }, corpo);
    [[-36, -50, '#2e7d5b'], [-26, -54, '#f4d03f'], [-30, -46, '#c0392b']].forEach(([x, y, c]) => el('rect', { x: x - 4, y: y - 4, width: 8, height: 7, fill: c }, corpo));
    el('circle', { cx: -10, cy: -26, r: 11, fill: '#c0392b' }, corpo);
    el('path', { d: 'M-20 -22 h20', stroke: '#2a1d14', 'stroke-width': 3 }, corpo);
    el('circle', { cx: -6, cy: -41, r: 6, fill: '#f2d2bd' }, corpo);
    el('path', { d: 'M-12 -40 q 2 10 7 10 q 6 0 7 -9 q -3 3 -7 3 q -4 0 -7 -4 Z', fill: '#fbfdff' }, corpo);
    el('path', { d: 'M-12 -44 Q -6 -60 4 -52 L 0 -45 Z', fill: '#c0392b' }, corpo);
    el('path', { d: 'M-13 -44 h 14', stroke: '#fbfdff', 'stroke-width': 3, 'stroke-linecap': 'round' }, corpo);
    el('circle', { cx: 4, cy: -52, r: 2.6, fill: '#fbfdff' }, corpo);
    el('path', { d: 'M-2 -28 L 16 -16', stroke: '#c0392b', 'stroke-width': 4, 'stroke-linecap': 'round' }, corpo);
    // La slitta rossa con i bordi d'oro e il pattino ricurvo
    el('path', { d: 'M-50 -2 Q-56 -26 -40 -28 L-28 -20 L8 -20 Q20 -20 22 -8 L18 4 L-44 4 Z', fill: '#b3202b' }, corpo);
    el('path', { d: 'M-50 -2 Q-56 -26 -40 -28 L-28 -20 L8 -20 Q20 -20 22 -8', stroke: '#e8c766', 'stroke-width': 2.4, fill: 'none' }, corpo);
    el('path', { d: 'M-30 -8 q 8 -6 16 0 q 8 6 16 0', stroke: '#e8c766', 'stroke-width': 1.4, fill: 'none' }, corpo);
    el('path', { d: 'M-44 4 L-40 10 M14 4 L10 10 M-58 10 H22 Q34 10 32 0', stroke: '#e8c766', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, corpo);
    // Quattro coppie di renne, con quella dal naso rosso davanti
    [[52, -12], [96, -14], [140, -16], [184, -18]].forEach(([x, y], i) => {
        rennaVolante(corpo, x - 4, y - 5, true, false);
        rennaVolante(corpo, x, y, false, i === 3);
    });
    return volo;
}

function disegnaMontagne(strato) {
    let lontane = 'M-100 600';
    let vicine = 'M-100 620';
    const cime = [];
    const colli = [];
    for (let x = -100; x <= 4200; x += 180 + caso() * 160) {
        const y = 345 + caso() * 120;
        const valle = y + 90 + caso() * 60;
        lontane += ` L${x} ${y} L${x + 120} ${valle}`;
        cime.push([x, y, valle]);
        const [cy, vy] = [495 + caso() * 45, 560 + caso() * 30];
        vicine += ` L${x + 60} ${cy} L${x + 170} ${vy}`;
        colli.push([x + 60, cy, x + 170, vy]);
    }
    // Numeri a parte per i dettagli nuovi: il resto del paese non cambia
    let semeMonti = 23;
    const casoMonti = () => (semeMonti = (semeMonti * 16807) % 2147483647) / 2147483647;
    // La catena più lontana, chiara e velata dall'aria
    let remote = 'M-100 600';
    for (let x = -40; x <= 4300; x += 230 + casoMonti() * 170) {
        const y = 330 + casoMonti() * 70;
        remote += ` Q${x - 40} ${y + 30} ${x} ${y} Q${x + 50} ${y + 40} ${x + 130} ${y + 110 + casoMonti() * 40}`;
    }
    el('path', { class: 'monti-remoti', d: `${remote} L4300 600 L4300 640 L-100 640 Z`, fill: 'url(#monte-remoto)', opacity: 0.85 }, strato);

    el('path', { class: 'monte-medio', d: `${lontane} L4300 600 L4300 640 L-100 640 Z`, fill: '#8fa6d8' }, strato);
    let valleSinistra = [-100, 600];
    cime.forEach(([x, y, valle]) => {
        // Versante a destra in ombra, versante a sinistra appena illuminato
        el('path', { class: 'ombra-monte', d: `M${x} ${y} L${x + 120} ${valle} L${x + 160} 640 L${x + 18} 640 Z`, fill: '#4f63a3', opacity: 0.28 }, strato);
        el('path', { d: `M${x} ${y} L${valleSinistra[0]} ${valleSinistra[1]} L${x - 10} 640 Z`, fill: '#ffffff', opacity: 0.1 }, strato);
        // Canaloni: righe di neve che scendono dalla cima
        el('path', { d: `M${x + 4} ${y + 30} l 14 46 M${x - 14} ${y + 44} l -6 38 M${x + 30} ${y + 40} l 22 40`, stroke: '#eef3ff', 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0.45 }, strato);
        // La cima innevata: frastagliata, con la parte destra più in ombra
        el('path', { d: `M${x} ${y} L${x - 40} ${y + 42} L${x - 24} ${y + 36} L${x - 14} ${y + 50} L${x - 2} ${y + 38} L${x + 10} ${y + 54} L${x + 22} ${y + 38} L${x + 34} ${y + 50} L${x + 48} ${y + 40} Z`, class: 'cima-neve', fill: '#f6f9ff' }, strato);
        el('path', { d: `M${x} ${y} L${x + 48} ${y + 40} L${x + 34} ${y + 50} L${x + 22} ${y + 38} L${x + 10} ${y + 54} L${x + 4} ${y + 30} Z`, fill: '#c9d6f2' }, strato);
        valleSinistra = [x + 120, valle];
    });
    el('path', { d: `${vicine} L4300 620 L4300 660 L-100 660 Z`, fill: 'url(#monte-vicino)' }, strato);
    // Le colline davanti: un filo di neve illuminata sul crinale e il fianco destro in ombra
    colli.forEach(([cx, cy, vx, vy]) => {
        el('path', { class: 'ombra-monte', d: `M${cx} ${cy} L${vx} ${vy} L${vx} 660 L${cx + 20} 660 Z`, fill: '#5a6fae', opacity: 0.16 }, strato);
        el('path', { d: `M${cx - 50} ${cy + 26} L${cx} ${cy} L${cx + 40} ${cy + 22}`, stroke: '#ffffff', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.7 }, strato);
    });
    // Velo di foschia ai piedi delle montagne
    el('rect', { x: -100, y: 420, width: 4500, height: 250, fill: 'url(#foschia)', 'pointer-events': 'none' }, strato);
}

function disegnaPrimoPiano(strato) {
    let semeDavanti = 31;
    const casoDavanti = () => (semeDavanti = (semeDavanti * 16807) % 2147483647) / 2147483647;
    const g = el('g', { class: 'primo-piano', 'pointer-events': 'none' }, strato);
    let bordo = `M-200 ${ALTEZZA + 40} L-200 ${ALTEZZA - 6}`;
    for (let x = -200; x < 7400; x += 160 + casoDavanti() * 140) {
        bordo += ` Q${(x + 80).toFixed(0)} ${(ALTEZZA - 26 - casoDavanti() * 18).toFixed(0)} ${(x + 200).toFixed(0)} ${(ALTEZZA - 4 - casoDavanti() * 6).toFixed(0)}`;
    }
    el('path', { d: `${bordo} L7600 ${ALTEZZA + 40} Z`, fill: 'url(#cumulo-davanti)' }, g);
    // Luci calde fuori fuoco, come viste attraverso un vetro: solo di sera e di notte
    const luci = el('g', { class: 'bokeh' }, g);
    for (let i = 0; i < 34; i++) {
        const x = casoDavanti() * 7200, y = 360 + casoDavanti() * 520, raggio = 14 + casoDavanti() * 26;
        el('circle', { cx: x.toFixed(0), cy: y.toFixed(0), r: raggio.toFixed(0), fill: 'url(#bokeh)', style: `animation-delay:-${(casoDavanti() * 6).toFixed(2)}s` }, luci);
    }
}

function disegnaBosco(strato) {
    for (let x = -100; x < 5000; x += 34 + caso() * 40) {
        disegnaAbete(strato, x, 585 + caso() * 25, 0.55 + caso() * 0.45, '#2f5a5c');
    }
    // Il bosco lontano si perde un po' nella foschia
    el('rect', { x: -100, y: 520, width: 5200, height: 110, fill: 'url(#foschia)', opacity: 0.75, 'pointer-events': 'none' }, strato);
}

// ========== IL PAESE ==========

function disegnaTerreno(mondo) {
    el('path', { d: `M-200 560 C 600 540, 1400 575, 2200 550 S 3400 560, 3800 555 S 4400 560, 5600 555 L5600 ${ALTEZZA} L-200 ${ALTEZZA} Z`, fill: 'url(#terra)' }, mondo);

    // Binari del trenino, in fondo al paese
    el('path', { d: 'M-200 575 L5600 575', stroke: '#8d98b8', 'stroke-width': 3 }, mondo);
    el('path', { d: 'M-200 583 L5600 583', stroke: '#8d98b8', 'stroke-width': 3 }, mondo);
    for (let x = -200; x < 5600; x += 18) el('rect', { x, y: 573, width: 6, height: 13, fill: '#7a6a5a', opacity: 0.6 }, mondo);

    // Laghetto ghiacciato, con il bordo in ombra e i riflessi del cielo
    el('ellipse', { cx: 700, cy: 615, rx: 190, ry: 42, fill: '#c3d1ec' }, mondo);
    el('ellipse', { cx: 700, cy: 612, rx: 175, ry: 35, fill: 'url(#ghiaccio)' }, mondo);
    el('path', { d: 'M600 605 q 40 -8 80 0 M720 620 q 50 -6 90 2', stroke: '#fff', 'stroke-width': 3, fill: 'none', opacity: 0.8 }, mondo);
    el('ellipse', { cx: 700, cy: 606, rx: 172, ry: 30, fill: 'none', stroke: '#8fa9d6', 'stroke-width': 4, opacity: 0.45 }, mondo);
    el('ellipse', { cx: 650, cy: 604, rx: 120, ry: 18, fill: 'url(#riflesso-ghiaccio)' }, mondo);
    el('path', { d: 'M560 618 l 70 -14 M585 626 l 40 -8 M760 606 l 60 -10 M790 616 l 34 -6', stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.55 }, mondo);

    // Ruscello che scende verso il basso
    el('path', { transform: `translate(${QUARTIERE.largo} 0)`, d: 'M2860 560 C 2840 620, 2900 660, 2870 720 S 2930 820, 2900 920 L2960 920 C 2990 820, 2930 760, 2945 720 S 2900 620, 2905 560 Z', fill: 'url(#ghiaccio)' }, mondo);

    // La neve non è piatta: morbide ondulazioni con la parte alta illuminata e l'ombra sotto
    let seme3 = 5;
    const caso3 = () => (seme3 = (seme3 * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) {
        const x = caso3() * MONDO, y = 610 + caso3() * 280, rx = 60 + caso3() * 120, ry = 10 + caso3() * 12;
        el('ellipse', { cx: (x + rx * 0.15).toFixed(1), cy: (y + ry * 0.7).toFixed(1), rx: rx.toFixed(1), ry: (ry * 0.8).toFixed(1), fill: '#9fb2dc', opacity: 0.22, filter: 'url(#ombra-morbida)' }, mondo);
        el('ellipse', { cx: x.toFixed(1), cy: y.toFixed(1), rx: rx.toFixed(1), ry: ry.toFixed(1), fill: 'url(#duna)' }, mondo);
    }
    // Strada e piazza, con la neve spalata ammucchiata ai bordi
    el('path', { d: STRADA, fill: 'none', stroke: '#f6f9ff', 'stroke-width': 108, 'stroke-linecap': 'round' }, mondo);
    el('path', { d: STRADA, fill: 'none', stroke: '#c3cfea', 'stroke-width': 94, 'stroke-linecap': 'round', opacity: 0.7 }, mondo);
    el('path', { d: STRADA, fill: 'none', stroke: '#a3b3d6', 'stroke-width': 86, 'stroke-linecap': 'round' }, mondo);
    el('path', { d: STRADA, fill: 'none', stroke: '#cbd6ec', 'stroke-width': 70, 'stroke-linecap': 'round' }, mondo);
    el('path', { d: STRADA, fill: 'none', stroke: '#f2f6fd', 'stroke-width': 4, 'stroke-dasharray': '22 26' }, mondo);
    el('ellipse', { cx: PIAZZA.x, cy: PIAZZA.y, rx: 250, ry: 78, fill: '#b6c3e0' }, mondo);
    el('ellipse', { cx: PIAZZA.x, cy: PIAZZA.y, rx: 238, ry: 70, fill: '#dde5f4' }, mondo);
    el('ellipse', { cx: PIAZZA.x, cy: PIAZZA.y, rx: 150, ry: 42, fill: 'none', stroke: '#c3cfe8', 'stroke-width': 3, 'stroke-dasharray': '10 12' }, mondo);

    // Ponte dove la strada passa sul ruscello
    const ponte = el('g', { transform: `translate(${sposta(2905)} 690)` }, mondo);
    el('path', { d: 'M-70 -28 Q 0 -48 70 -28', fill: 'none', stroke: '#8a5a3c', 'stroke-width': 7 }, ponte);
    el('path', { d: 'M-70 32 Q 0 12 70 32', fill: 'none', stroke: '#8a5a3c', 'stroke-width': 7 }, ponte);
    for (let x = -60; x <= 60; x += 20) {
        el('path', { d: `M${x} ${-34 + Math.abs(x) / 6} v -14 M${x} ${26 + Math.abs(x) / 6} v -14`, stroke: '#6d4630', 'stroke-width': 4 }, ponte);
    }
}

// Una ruota con i raggi: gira quando il treno è in corsa
function ruota(genitore, cx, cy, r, cerchione = '#9b1d2a') {
    const g = el('g', { class: 'ruota' }, genitore);
    el('circle', { cx, cy, r, fill: '#1c1c1c' }, g);
    el('circle', { cx, cy, r: r - 2, fill: 'none', stroke: cerchione, 'stroke-width': 2.5 }, g);
    const raggi = r > 12 ? 10 : 6;
    let d = '';
    for (let i = 0; i < raggi; i++) {
        const a = (i / raggi) * Math.PI * 2;
        d += `M${cx} ${cy} L${(cx + Math.cos(a) * (r - 3)).toFixed(1)} ${(cy + Math.sin(a) * (r - 3)).toFixed(1)} `;
    }
    el('path', { d, stroke: cerchione, 'stroke-width': r > 12 ? 2 : 1.5 }, g);
    el('circle', { cx, cy, r: r * 0.28, fill: '#c9a227' }, g);
    // Contrappeso: rende visibile la rotazione
    if (r > 12) el('path', { d: `M${cx} ${cy} m ${-r * 0.55} ${r * 0.35} a ${r * 0.65} ${r * 0.65} 0 0 0 ${r * 1.1} 0 Z`, fill: cerchione }, g);
}

// La neve che si posa su un tetto curvo
function nevicata(genitore, x1, x2, y, curva) {
    el('path', { d: `M${x1 - 3} ${y + 2} Q ${(x1 + x2) / 2} ${y - curva - 7} ${x2 + 3} ${y + 2} Q ${(x1 + x2) / 2} ${y - curva + 1} ${x1 - 3} ${y + 2} Z`, fill: '#fbfdff' }, genitore);
}

// Carrozza passeggeri con i finestrini accesi e qualche sagoma dentro
function carrozza(treno, x0, colore, passeggeri) {
    const larghezza = 120;
    // Carrelli e ganci
    el('rect', { x: x0 + 8, y: -20, width: 34, height: 6, rx: 2, fill: '#222' }, treno);
    el('rect', { x: x0 + 78, y: -20, width: 34, height: 6, rx: 2, fill: '#222' }, treno);
    [x0 + 16, x0 + 34, x0 + 86, x0 + 104].forEach(cx => ruota(treno, cx, -9, 9, '#555'));
    el('rect', { x: x0 + larghezza, y: -22, width: 10, height: 4, fill: '#333' }, treno);
    // Cassa
    el('rect', { x: x0, y: -70, width: larghezza, height: 52, rx: 5, fill: colore }, treno);
    el('rect', { x: x0, y: -70, width: larghezza, height: 52, rx: 5, fill: 'url(#cilindro)' }, treno);
    el('rect', { x: x0, y: -30, width: larghezza, height: 3, fill: '#c9a227' }, treno);
    el('rect', { x: x0, y: -64, width: larghezza, height: 2, fill: '#c9a227', opacity: 0.8 }, treno);
    // Porte alle estremità
    [x0 + 4, x0 + larghezza - 16].forEach(px => {
        el('rect', { x: px, y: -60, width: 12, height: 38, rx: 2, fill: scurisci(colore, 0.25) }, treno);
        el('rect', { x: px + 2, y: -57, width: 8, height: 10, rx: 1, fill: 'url(#vetro-acceso)' }, treno);
    });
    // Finestrini
    for (let i = 0; i < 5; i++) {
        const fx = x0 + 22 + i * 16;
        el('rect', { x: fx, y: -58, width: 12, height: 16, rx: 2, fill: 'url(#vetro-acceso)' }, treno);
        if (passeggeri.includes(i)) {
            el('circle', { cx: fx + 6, cy: -51, r: 3, fill: '#5a3a22', opacity: 0.85 }, treno);
            el('path', { d: `M${fx + 1} -42 q 5 -8 10 0 Z`, fill: '#5a3a22', opacity: 0.85 }, treno);
        }
    }
    // Tetto bombato con la neve
    el('path', { d: `M${x0 - 4} -69 Q ${x0 + larghezza / 2} -86 ${x0 + larghezza + 4} -69 Z`, fill: '#3b2a1a' }, treno);
    nevicata(treno, x0 - 2, x0 + larghezza + 2, -72, 14);
}

function disegnaTrenino(mondo) {
    const treno = el('g', { class: 'trenino' }, mondo);

    // Carrozze e tender, da dietro in avanti
    carrozza(treno, -344, '#2e6b4a', [1, 3]);
    carrozza(treno, -214, '#8e2b2b', [0, 2, 4]);
    el('rect', { x: -94, y: -22, width: 10, height: 4, fill: '#333' }, treno);

    // Tender con il carbone
    el('rect', { x: -84, y: -20, width: 62, height: 6, rx: 2, fill: '#222' }, treno);
    ruota(treno, -70, -9, 9, '#555');
    ruota(treno, -36, -9, 9, '#555');
    el('path', { d: 'M-84 -52 H-22 V-18 H-84 Z', fill: '#1e2a22' }, treno);
    el('rect', { x: -84, y: -52, width: 62, height: 34, fill: 'url(#cilindro)' }, treno);
    el('rect', { x: -84, y: -26, width: 62, height: 3, fill: '#c9a227' }, treno);
    // Montagnola di carbone con la neve in cima
    el('path', { d: 'M-83 -51 Q -53 -74 -23 -51 Z', fill: '#151515' }, treno);
    el('path', { d: 'M-70 -60 l 5 -2 M-56 -64 l 4 1 M-44 -59 l 5 -1', stroke: '#3a3a3a', 'stroke-width': 2 }, treno);
    el('path', { d: 'M-72 -58 Q -53 -71 -34 -58 Q -53 -63 -72 -58 Z', fill: '#fbfdff' }, treno);

    // Locomotiva: telaio e ruote
    el('rect', { x: -12, y: -26, width: 160, height: 10, rx: 2, fill: '#1a1a1a' }, treno);
    ruota(treno, 2, -9, 9);
    ruota(treno, 134, -9, 9);
    [32, 66, 100].forEach(cx => ruota(treno, cx, -15, 15));
    // Biella che collega le ruote motrici
    const biella = el('g', { class: 'biella' }, treno);
    el('rect', { x: 30, y: -19, width: 72, height: 5, rx: 2.5, fill: '#c0c4cc', stroke: '#6b6f78', 'stroke-width': 1 }, biella);
    [32, 66, 100].forEach(cx => el('circle', { cx, cy: -16.5, r: 3, fill: '#8a8f99' }, biella));
    // Spazzaneve davanti
    el('path', { d: 'M146 -18 L170 0 H146 Z', fill: '#9b1d2a' }, treno);
    el('path', { d: 'M150 -14 L152 0 M156 -10 L158 0 M162 -6 L163 0', stroke: '#5a1018', 'stroke-width': 2 }, treno);

    // Caldaia con riflessi e fasce d'ottone
    el('rect', { x: 26, y: -66, width: 122, height: 42, rx: 20, fill: '#1f2b24' }, treno);
    el('rect', { x: 26, y: -66, width: 122, height: 42, rx: 20, fill: 'url(#cilindro)' }, treno);
    [56, 86, 116].forEach(bx => el('rect', { x: bx, y: -66, width: 4, height: 42, fill: '#c9a227' }, treno));
    el('rect', { x: 136, y: -64, width: 14, height: 38, rx: 5, fill: '#141414' }, treno);
    el('path', { d: 'M30 -64 Q 87 -72 146 -64', stroke: '#fbfdff', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, treno);
    // Cupola dorata e comignolo svasato
    el('path', { d: 'M76 -64 q 0 -18 12 -18 q 12 0 12 18 Z', fill: '#c9a227' }, treno);
    el('path', { d: 'M80 -78 q 8 -6 16 0', stroke: '#fff3c4', 'stroke-width': 2, fill: 'none' }, treno);
    el('path', { d: 'M116 -64 L118 -88 L108 -100 H138 L128 -88 L130 -64 Z', fill: '#141414' }, treno);
    el('rect', { x: 106, y: -104, width: 34, height: 6, rx: 2, fill: '#c9a227' }, treno);
    // Fanale con il fascio di luce
    el('path', { d: 'M158 -74 L320 -104 L320 -40 Z', fill: 'url(#alone)', opacity: 0.45 }, treno);
    el('rect', { x: 140, y: -80, width: 14, height: 13, rx: 2, fill: '#141414' }, treno);
    el('circle', { cx: 154, cy: -73.5, r: 5, fill: '#fff6b0', filter: 'url(#bagliore)' }, treno);

    // Cabina del macchinista
    el('rect', { x: -18, y: -90, width: 48, height: 66, rx: 3, fill: '#9b1d2a' }, treno);
    el('rect', { x: -18, y: -90, width: 48, height: 66, rx: 3, fill: 'url(#cilindro)' }, treno);
    el('rect', { x: -10, y: -82, width: 30, height: 22, rx: 3, fill: 'url(#vetro-acceso)' }, treno);
    el('circle', { cx: 4, cy: -71, r: 4, fill: '#3b2a1a', opacity: 0.85 }, treno);
    el('rect', { x: -18, y: -40, width: 48, height: 3, fill: '#c9a227' }, treno);
    el('path', { d: 'M-24 -89 Q 6 -100 36 -89 Z', fill: '#1a1a1a' }, treno);
    nevicata(treno, -22, 34, -92, 8);

    // Sbuffi di vapore dal comignolo, visibili solo mentre il treno corre
    const vapore = el('g', { class: 'vapore' }, treno);
    for (let i = 0; i < 5; i++) el('circle', { cx: 123, cy: -110, r: 12, fill: i % 2 ? '#dfe6f5' : '#f4f7ff', style: `animation-delay:${i * 0.3}s` }, vapore);
    treno.setAttribute('transform', `translate(${STAZIONE.fermata} ${BINARI_Y}) scale(0.55)`);
}

// La stazione dove il treno si ferma, accanto alla piazza
function disegnaStazione(mondo, x, y, scala) {
    const stazione = el('g', {
        class: 'stazione', role: 'button', tabindex: 0, 'aria-label': 'Entra in stazione', 'data-x': x,
        transform: `translate(${x} ${y}) scale(${scala})`
    }, mondo);
    el('ellipse', { class: 'alone-stazione', cx: 0, cy: -70, rx: 200, ry: 140, fill: 'url(#alone)' }, stazione);
    el('rect', { x: -110, y: -8, width: 220, height: 12, fill: '#9aa0b5' }, stazione);
    el('rect', { x: -90, y: -96, width: 180, height: 90, fill: '#b5652f' }, stazione);
    el('rect', { x: -90, y: -96, width: 180, height: 90, fill: 'url(#tex-mattoni)' }, stazione);
    el('rect', { x: -90, y: -96, width: 180, height: 90, fill: 'url(#ombra-muro)' }, stazione);
    [-62, 38].forEach(fx => {
        el('rect', { x: fx - 3, y: -77, width: 30, height: 34, rx: 3, fill: '#efe6d2' }, stazione);
        el('rect', { x: fx, y: -74, width: 24, height: 28, rx: 2, fill: 'url(#vetro-acceso)', filter: 'url(#bagliore)' }, stazione);
    });
    el('rect', { x: -14, y: -60, width: 28, height: 54, rx: 12, fill: '#5d3a22' }, stazione);
    // Tettoia con la neve
    el('path', { d: 'M-130 -96 L0 -150 L130 -96 Z', fill: '#2e4a7d' }, stazione);
    el('path', { d: 'M-130 -96 L0 -150 L130 -96 Z', fill: 'url(#tex-tegole)' }, stazione);
    el('path', { d: 'M-136 -94 L0 -153 L136 -94', fill: 'none', stroke: '#fbfdff', 'stroke-width': 10, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, stazione);
    ghiaccioli(stazione, -128, -93, 128, -93, 9);
    // Cartello che invita a entrare, visibile quando il treno è arrivato
    const cartello = el('g', { transform: 'translate(0 -200)' }, el('g', { class: 'cartello-entra' }, stazione));
    el('rect', { x: -86, y: -24, width: 172, height: 40, rx: 20, fill: '#c0392b', stroke: '#ffd36b', 'stroke-width': 3 }, cartello);
    el('text', { x: 0, y: 3, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 'bold', fill: '#fff', 'font-family': 'Georgia, serif' }, cartello).textContent = 'Entra! Si parte';
    el('path', { d: 'M-10 16 l10 14 10 -14 Z', fill: '#c0392b' }, cartello);
    // Insegna e orologio
    el('rect', { x: -58, y: -122, width: 116, height: 24, rx: 4, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 2 }, stazione);
    el('text', { x: 0, y: -105, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 'bold', 'letter-spacing': 2, fill: '#9b1d2a', 'font-family': 'Georgia, serif' }, stazione).textContent = 'STAZIONE';
    el('circle', { cx: 0, cy: -84, r: 9, fill: '#fdf6dc', stroke: '#3b2a1a', 'stroke-width': 2 }, stazione);
    el('path', { d: 'M0 -84 V-90 M0 -84 L4 -82', stroke: '#222', 'stroke-width': 1.5 }, stazione);
    el('rect', { x: 118, y: -70, width: 5, height: 66, fill: '#2c2f45' }, stazione);
    el('rect', { x: 113, y: -80, width: 15, height: 14, rx: 2, fill: '#ffe08a', filter: 'url(#bagliore)' }, stazione);
}

// Una renna: passeggia avanti e indietro, oppure bruca sul posto
function disegnaRenna(mondo, x, y, scala, { percorso = 0, durata = 26, ritardo = 0, naso = '#2a1d14', collare = '#c0392b' }) {
    const renna = el('g', { class: 'renna', transform: `translate(${x} ${y}) scale(${scala})`, role: 'img', 'aria-label': 'Una renna' }, mondo);
    const cammino = el('g', {
        class: percorso ? 'passeggia' : 'bruca',
        style: `--percorso:${percorso}px;animation-duration:${durata}s;animation-delay:-${ritardo}s`
    }, renna);
    const salto = el('g', { class: 'salto' }, cammino);
    el('ellipse', { cx: 0, cy: 1, rx: 44, ry: 6, fill: '#6f84bd', opacity: 0.35 }, salto);

    const pelo = '#7a5236';
    const peloScuro = '#5a3d29';

    // Zampe sottili: davanti il ginocchio, dietro il garretto piegato all'indietro
    const zampa = (d, classe, lontana) => {
        const g = el('g', { class: `zampa ${classe}` }, salto);
        el('path', { d, fill: 'none', stroke: lontana ? '#4a3222' : peloScuro, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        const [, hx, hy] = d.match(/L(-?[\d.]+) (-?[\d.]+)$/).map(Number);
        el('path', { d: `M${hx - 4} ${hy + 1} h8 l-1 3 h-6 Z`, fill: '#1e140d' }, g);
        el('path', { d: `M${hx} ${hy + 1} v3`, stroke: '#4a3a2c', 'stroke-width': 0.8 }, g);
    };
    zampa('M-24 -40 L-20 -28 L-27 -16 L-25 -4', 'b', true);
    zampa('M22 -40 L25 -22 L24 -4', 'a', true);
    zampa('M-30 -40 L-25 -28 L-33 -16 L-31 -4', 'a', false);
    zampa('M16 -40 L19 -22 L18 -4', 'b', false);

    // Corpo: schiena scura, pancia chiara, macchia bianca sul posteriore
    el('path', {
        d: 'M-38 -50 C -40 -62, -18 -68, 4 -66 C 22 -64, 34 -60, 34 -48 C 34 -38, 22 -34, 4 -35 C -14 -35, -36 -36, -38 -50 Z',
        fill: 'url(#pelo-renna)'
    }, salto);
    el('path', { d: 'M-38 -50 C -36 -40, -26 -34, -14 -36 C -20 -44, -24 -54, -30 -61 C -36 -59, -39 -55, -38 -50 Z', fill: peloScuro, opacity: 0.35 }, salto);
    el('ellipse', { cx: -36, cy: -50, rx: 5, ry: 8, fill: '#f1e8d8' }, salto);
    el('path', { d: 'M-40 -56 q -6 1 -5 6 q 4 -1 6 -3 Z', fill: '#f1e8d8' }, salto);

    // Collo, criniera, testa e corna: si muovono insieme quando bruca
    const testa = el('g', { class: 'testa' }, salto);
    el('path', { d: 'M10 -60 C 20 -76, 30 -88, 40 -93 L 52 -84 C 45 -74, 40 -62, 36 -46 Z', fill: pelo }, testa);
    el('path', {
        d: 'M33 -48 C 34 -58, 38 -70, 45 -81 l -1 7 l 4 -3 l -2 7 l 4 -2 l -3 7 l 4 -1 l -5 8 l 3 0 l -5 6 Z',
        fill: '#e8dcc4'
    }, testa);
    // Corno lontano, più scuro, dietro alla testa
    const corna = (dx, dy, colore) => {
        // Le corna partono dalla fronte e sono un po' più basse del disegno di base
        const palco = el('g', { transform: `translate(${44 + dx} ${-96 + dy}) scale(0.8) translate(${-44 - dx} ${96 - dy})` }, testa);
        el('path', {
            d: `M${44 + dx} ${-96 + dy} C ${38 + dx} ${-110 + dy}, ${28 + dx} ${-122 + dy}, ${31 + dx} ${-138 + dy} C ${33 + dx} ${-148 + dy}, ${42 + dx} ${-153 + dy}, ${50 + dx} ${-151 + dy}` +
                ` M${35 + dx} ${-116 + dy} l 9 -7 l 3 -8` +
                ` M${31 + dx} ${-130 + dy} l -9 -6 l -3 -7` +
                ` M${34 + dx} ${-143 + dy} l 2 -12` +
                ` M${44 + dx} ${-150 + dy} l 6 -9`,
            fill: 'none', stroke: colore, 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }, palco);
        // Palco anteriore che scende sulla fronte
        el('path', { d: `M${45 + dx} ${-99 + dy} q 8 -6 13 -4 l -3 4 l 4 1 l -6 3 Z`, fill: colore }, palco);
    };
    corna(7, 2, '#a8916d');
    el('path', { d: 'M38 -93 C 44 -99, 56 -97, 64 -89 C 68 -85, 68 -80, 63 -79 C 56 -78, 48 -81, 40 -83 Z', fill: pelo }, testa);
    el('path', { d: 'M54 -90 C 60 -90, 66 -86, 66 -82 C 64 -79, 58 -79, 54 -81 Z', fill: '#a88462' }, testa);
    el('circle', { class: naso === '#e74c3c' ? 'naso-rosso' : '', cx: 65.5, cy: -83, r: naso === '#e74c3c' ? 4.5 : 3, fill: naso }, testa);
    el('ellipse', { cx: 50, cy: -91, rx: 2.4, ry: 2, fill: '#120c08' }, testa);
    el('circle', { cx: 50.8, cy: -91.6, r: 0.7, fill: '#fff' }, testa);
    el('path', { d: 'M41 -93 C 34 -98, 30 -96, 28 -92 C 32 -91, 37 -91, 41 -90 Z', fill: peloScuro }, testa);
    corna(0, 0, '#d8c3a0');
    // Collare con la campanella
    el('path', { d: 'M22 -62 q 8 -7 16 -3', stroke: collare, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, testa);
    el('circle', { cx: 31, cy: -60, r: 3.2, fill: '#e2b93b', stroke: '#8a6d1d', 'stroke-width': 0.8 }, testa);
}

function disegnaLampione(mondo, x, y, scala) {
    const lampione = el('g', { transform: `translate(${x} ${y}) scale(${scala})` }, mondo);
    el('path', { class: 'ombra-proiettata', d: 'M-3 0 L3 0 L90 -16 L84 -18 Z', fill: '#2d3c78', opacity: 0.22, filter: 'url(#ombra-morbida)' }, lampione);
    el('ellipse', { class: 'pozza-lampione', cx: 0, cy: 2, rx: 70, ry: 16, fill: 'url(#pozza-luce)' }, lampione);
    el('path', { class: 'cono-lampione', d: 'M-9 -112 L-58 0 L58 0 L9 -112 Z', fill: 'url(#cono-luce)' }, lampione);
    el('rect', { x: -3, y: -110, width: 6, height: 110, fill: '#2c2f45' }, lampione);
    el('rect', { x: -3, y: -110, width: 2, height: 110, fill: '#5a6080', opacity: 0.7 }, lampione);
    el('circle', { cx: 0, cy: -118, r: 30, fill: 'url(#alone)', opacity: 0.8 }, lampione);
    el('rect', { x: -10, y: -128, width: 20, height: 20, rx: 3, fill: '#ffe08a', filter: 'url(#bagliore)' }, lampione);
    el('path', { d: 'M-13 -128 L0 -140 L13 -128 Z', fill: '#2c2f45' }, lampione);
    el('path', { d: 'M-12 -140 q 12 -8 24 0', stroke: '#f7fbff', 'stroke-width': 4, fill: 'none' }, lampione);
}

function disegnaPupazzo(mondo, x, y, scala) {
    const pupazzo = el('g', { transform: `translate(${x} ${y}) scale(${scala})` }, mondo);
    el('circle', { cx: 0, cy: -22, r: 24, fill: '#fbfdff', stroke: '#cdd8ee', 'stroke-width': 2 }, pupazzo);
    el('circle', { cx: 0, cy: -60, r: 17, fill: '#fbfdff', stroke: '#cdd8ee', 'stroke-width': 2 }, pupazzo);
    el('path', { d: 'M0 -60 l14 4 -14 3 Z', fill: '#f39c12' }, pupazzo);
    el('rect', { x: -14, y: -86, width: 28, height: 8, fill: '#222' }, pupazzo);
    el('rect', { x: -9, y: -100, width: 18, height: 16, fill: '#222' }, pupazzo);
    el('path', { d: 'M-16 -46 q 16 8 32 0', stroke: '#c0392b', 'stroke-width': 6, fill: 'none' }, pupazzo);
}

function disegnaAbete(genitore, x, y, scala, colore) {
    const g = el('g', { transform: `translate(${x} ${y}) scale(${scala})` }, genitore);
    el('path', { d: 'M-18 2 L18 2 L70 -10 L40 -12 Z', fill: '#2d3c78', opacity: 0.18, filter: 'url(#ombra-morbida)' }, g);
    el('rect', { x: -4, y: -10, width: 8, height: 12, fill: '#4a3426' }, g);
    el('rect', { x: 0, y: -10, width: 4, height: 12, fill: '#2e2018' }, g);
    // Quattro palchi di rami, dal più largo in basso al più stretto in cima
    [[0, 54, 30], [-15, 45, 27], [-30, 35, 25], [-45, 25, 24]].forEach(([dy, w, h]) => {
        const by = dy - 6, cima = by - h;
        let bordo = '';
        for (let k = 0; k <= 6; k++) bordo += ` L${(-w / 2 + (k * w) / 6).toFixed(1)} ${(by + (k % 2 ? 4 : 0)).toFixed(1)}`;
        el('path', { d: `M0 ${cima}${bordo} Z`, fill: colore }, g);
        // Il lato destro in ombra e un filo di luce sul lato sinistro
        el('path', { d: `M0 ${cima} L${w / 2} ${by} L${w / 2 - w / 6} ${by + 4} L${w * 0.04} ${by + 3} Z`, fill: '#0b1440', opacity: 0.24 }, g);
        el('path', { d: `M0 ${cima} L${-w / 2} ${by}`, stroke: '#ffffff', 'stroke-width': 1.4, opacity: 0.25 }, g);
        // La neve posata sul lato illuminato del ramo
        el('path', { d: `M0 ${cima} Q${(-w * 0.18).toFixed(1)} ${(cima + h * 0.45).toFixed(1)} ${(-w * 0.46).toFixed(1)} ${by - 1} Q${(-w * 0.32).toFixed(1)} ${by - 6} ${(-w * 0.18).toFixed(1)} ${by - 3} Q${(-w * 0.08).toFixed(1)} ${(by - h * 0.32).toFixed(1)} ${(w * 0.06).toFixed(1)} ${(cima + h * 0.25).toFixed(1)} Z`, fill: '#f4f8ff' }, g);
        el('circle', { cx: (w * 0.22).toFixed(1), cy: by - 2, r: 2.4, fill: '#f4f8ff' }, g);
    });
    el('path', { d: 'M0 -82 l3 6 h-6 Z', fill: '#f4f8ff' }, g);
    return g;
}

// ========== CASE E ALBERO ==========

const COLORI = [
    { muro: '#c0392b', tetto: '#7b2d26' },
    { muro: '#2e7d5b', tetto: '#7b2d26' },
    { muro: '#f2c1d1', tetto: '#b5476b' },
    { muro: '#e9d8b4', tetto: '#9a5b34' },
    { muro: '#3a5ba0', tetto: '#c0392b' },
    { muro: '#f4e1a1', tetto: '#2e7d5b' },
    { muro: '#8e5ea2', tetto: '#4b2c5e' },
    { muro: '#b5652f', tetto: '#5a3a22' }
];

// Materiali delle pareti: cambiano da casa a casa
const COLORI_FESTA = ['#ff5a4f', '#ffd36b', '#6fd3ff', '#7dff9a', '#ff9de2'];

const MATERIALI = ['assi', 'intonaco', 'mattoni', 'assi', 'intonaco'];

function finestra(corpo, fx, fy, larghezza, altezza, { cornice, persiane }) {
    if (persiane) {
        [fx - 11, fx + larghezza + 3].forEach(px => {
            el('rect', { x: px, y: fy, width: 8, height: altezza, rx: 1, fill: persiane }, corpo);
            el('path', { d: `M${px + 1} ${fy + 6} h6 M${px + 1} ${fy + 12} h6 M${px + 1} ${fy + 18} h6`, stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 1 }, corpo);
        });
    }
    el('rect', { x: fx - 3, y: fy - 3, width: larghezza + 6, height: altezza + 6, rx: 2, fill: cornice }, corpo);
    el('rect', { class: 'finestra', x: fx, y: fy, width: larghezza, height: altezza, rx: 1.5 }, corpo);
    el('path', { d: `M${fx + larghezza / 2} ${fy} V${fy + altezza} M${fx} ${fy + altezza / 2} H${fx + larghezza}`, stroke: cornice, 'stroke-width': 2.2 }, corpo);
    // Davanzale con la neve sopra
    el('rect', { x: fx - 5, y: fy + altezza + 2, width: larghezza + 10, height: 4, rx: 1, fill: scurisci(cornice, 0.25) }, corpo);
    el('path', { d: `M${fx - 6} ${fy + altezza + 3} q ${(larghezza + 12) / 2} -6 ${larghezza + 12} 0 Z`, fill: '#fbfdff' }, corpo);
}

function ghiaccioli(corpo, x1, y1, x2, y2, quanti) {
    for (let i = 1; i <= quanti; i++) {
        const t = i / (quanti + 1);
        const gx = x1 + (x2 - x1) * t;
        const gy = y1 + (y2 - y1) * t;
        const lunghezza = 5 + caso() * 9;
        el('path', { d: `M${gx - 2.5} ${gy} L${gx} ${gy + lunghezza} L${gx + 2.5} ${gy} Z`, fill: '#eaf6ff', stroke: '#c4def2', 'stroke-width': 0.6 }, corpo);
        el('path', { d: `M${gx - 1.2} ${gy + 1} L${gx - 0.2} ${gy + lunghezza * 0.7}`, stroke: '#ffffff', 'stroke-width': 0.9, 'stroke-linecap': 'round' }, corpo);
    }
}

function disegnaCasa(mondo, giorno, x, y, scala, tipo, speciale = {}) {
    const colori = speciale.colori ?? COLORI[(giorno * 5) % COLORI.length];
    const materiale = speciale.materiale ?? (tipo === 'torre' ? 'mattoni' : MATERIALI[(giorno * 3) % MATERIALI.length]);
    const w = speciale.w ?? 92 + caso() * 22;
    const h = speciale.h ?? (tipo === 'torre' ? 150 : 70 + caso() * 30);
    const d = 34;
    const dy = d * 0.5;
    // Alcune case mostrano il fianco sinistro, come se fossero girate
    const verso = giorno % 3 === 0 ? -1 : 1;
    const dx = d * 0.8 * verso;
    const lato = (w / 2) * verso;
    const cornice = materiale === 'mattoni' ? '#efe6d2' : '#fbf6ea';
    const persiane = materiale === 'assi' ? scurisci(colori.tetto, 0.05) : null;

    const casa = el('g', {
        class: 'casa', 'data-giorno': giorno, 'data-x': x, tabindex: 0, role: 'button',
        'aria-label': `${giorno} dicembre`, transform: `translate(${x} ${y}) scale(${scala})`
    }, mondo);
    el('ellipse', { class: 'alone', cx: 10, cy: -h / 2, rx: w * 1.1, ry: h, fill: 'url(#alone)' }, casa);
    // Ombra lunga e morbida verso destra, come se la luce venisse da sinistra
    const lunga = h * 0.9 + 30;
    el('path', { class: 'ombra-proiettata', d: `M${-w / 2 + 6} 2 L${w / 2 + dx} ${-dy + 2} L${w / 2 + dx + lunga} ${-dy - lunga * 0.16} L${-w / 2 + lunga} ${-lunga * 0.16} Z`, fill: '#2d3c78', opacity: 0.2, filter: 'url(#ombra-morbida)' }, casa);
    el('ellipse', { cx: 14 * verso, cy: 4, rx: w * 0.8, ry: 11, fill: '#6f84bd', opacity: 0.35 }, casa);
    // Di notte, la luce delle finestre accese si posa sulla neve davanti alla casa
    el('ellipse', { class: 'pozza-luce', cx: 0, cy: 14, rx: w * 0.85, ry: 20, fill: 'url(#pozza-luce)' }, casa);
    const corpo = el('g', { class: 'corpo' }, casa);

    // ---- Fianco ----
    const fianco = `M${lato} 0 L${lato + dx} ${-dy} L${lato + dx} ${-h - dy} L${lato} ${-h} Z`;
    el('path', { d: fianco, fill: scurisci(colori.muro, 0.32) }, corpo);
    el('path', { d: fianco, fill: `url(#tex-${materiale})` }, corpo);
    el('path', { d: `M${lato} 0 L${lato + dx} ${-dy} L${lato + dx} ${-dy - 12} L${lato} -12 Z`, fill: '#6f7282' }, corpo);
    if (h > 80 && tipo !== 'piatto') {
        // Finestrella sul fianco, in prospettiva
        const a = 0.3, b = 0.7, alto = -h + 22;
        const p = t => [lato + dx * t, alto - dy * t];
        const [x1, y1] = p(a);
        const [x2, y2] = p(b);
        el('path', { d: `M${x1 - 2 * verso} ${y1 - 3} L${x2 + 2 * verso} ${y2 - 3} L${x2 + 2 * verso} ${y2 + 25} L${x1 - 2 * verso} ${y1 + 25} Z`, fill: scurisci(cornice, 0.2) }, corpo);
        el('path', { class: 'finestra', d: `M${x1} ${y1} L${x2} ${y2} L${x2} ${y2 + 22} L${x1} ${y1 + 22} Z` }, corpo);
    }

    // ---- Facciata ----
    el('rect', { x: -w / 2, y: -h, width: w, height: h, fill: colori.muro }, corpo);
    el('rect', { x: -w / 2, y: -h, width: w, height: h, fill: `url(#tex-${materiale})` }, corpo);
    if (materiale === 'intonaco') {
        // Travi a vista, come nelle case di montagna
        const trave = scurisci(colori.tetto, 0.35);
        const meta = -h * 0.52;
        el('path', {
            d: `M${-w / 2 + 2} ${-h + 2} V-12 M${w / 2 - 2} ${-h + 2} V-12 M${-w / 2} ${meta} H${w / 2} M${-w / 2 + 3} ${meta} L${-w / 4} -12 M${w / 2 - 3} ${meta} L${w / 4} -12`,
            stroke: trave, 'stroke-width': 5, 'stroke-linecap': 'square', fill: 'none'
        }, corpo);
    }
    el('rect', { x: -w / 2, y: -h, width: w, height: h, fill: 'url(#ombra-muro)' }, corpo);
    el('rect', { x: -w / 2, y: -h, width: w, height: h, fill: 'url(#luce-facciata)' }, corpo);
    // Zoccolo in pietra
    el('rect', { x: -w / 2, y: -12, width: w, height: 12, fill: '#8b8e9e' }, corpo);
    el('rect', { x: -w / 2, y: -12, width: w, height: 12, fill: 'url(#tex-pietra)' }, corpo);

    // ---- Tetto ----
    let cima = -h;
    let targaY = -h - 26;
    if (tipo === 'piatto') {
        el('rect', { x: -w / 2 - 6, y: -h - 12, width: w + 12, height: 14, fill: scurisci(colori.tetto, 0.1) }, corpo);
        el('rect', { x: -w / 2 - 6, y: -h - 12, width: w + 12, height: 14, fill: 'url(#tex-mattoni)' }, corpo);
        el('path', { d: `M${-w / 2 - 8} ${-h - 11} q 10 -9 24 -6 q ${w / 2 - 20} -12 ${w - 10} -2 q 6 2 ${10} 8 Z`, fill: '#fbfdff' }, corpo);
        ghiaccioli(corpo, -w / 2 - 4, -h + 2, w / 2 + 4, -h + 2, 6);
        cima = -h - 20;
    } else {
        const rh = tipo === 'torre' ? 70 : 46;
        const gronda = lato + 6 * verso;
        const falda = `M0 ${-h - rh} L${gronda} ${-h} L${gronda + dx} ${-h - dy} L${dx} ${-h - rh - dy} Z`;
        el('path', { d: falda, fill: scurisci(colori.tetto, 0.12) }, corpo);
        el('path', { d: falda, fill: 'url(#tex-tegole)' }, corpo);
        // Neve sulla falda: copre la parte alta e finisce con un bordo morbido
        const t = 0.45;
        const [bx, by] = [dx + gronda * t, -h - rh - dy + rh * t];
        const [ax, ay] = [gronda * t, -h - rh + rh * t];
        el('path', {
            d: `M0 ${-h - rh} L${dx} ${-h - rh - dy} L${bx} ${by} Q ${(ax + bx) / 2} ${(ay + by) / 2 + 7} ${ax} ${ay} Z`,
            fill: '#fbfdff'
        }, corpo);
        ghiaccioli(corpo, gronda, -h + 1, gronda + dx, -h - dy + 1, 4);

        el('path', { d: `M${-w / 2 - 6} ${-h} L0 ${-h - rh} L${w / 2 + 6} ${-h} Z`, fill: colori.tetto }, corpo);
        el('path', { d: `M${-w / 2 - 6} ${-h} L0 ${-h - rh} L${w / 2 + 6} ${-h} Z`, fill: 'url(#tex-assi)', opacity: 0.6 }, corpo);
        el('path', { d: `M${-w / 2 - 6} ${-h} L0 ${-h - rh} L${w / 2 + 6} ${-h} Z`, fill: 'url(#luce-tetto)' }, corpo);
        // Ombra della gronda sul timpano e tavola di bordo
        el('path', { d: `M${-w / 2 - 4} ${-h + 3} L0 ${-h - rh + 5} L${w / 2 + 4} ${-h + 3}`, fill: 'none', stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 6 }, corpo);
        el('path', { d: `M${-w / 2 - 9} ${-h + 1} L0 ${-h - rh - 1} L${w / 2 + 9} ${-h + 1}`, fill: 'none', stroke: scurisci(colori.tetto, 0.45), 'stroke-width': 6, 'stroke-linejoin': 'round' }, corpo);
        el('path', { d: `M${-w / 2 - 10} ${-h + 2} L0 ${-h - rh - 1} L${w / 2 + 10} ${-h + 2}`, fill: 'none', stroke: '#b3c3e3', 'stroke-width': 10, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, corpo);
        el('path', { d: `M${-w / 2 - 10} ${-h - 2} L0 ${-h - rh - 5} L${w / 2 + 10} ${-h - 2}`, fill: 'none', stroke: '#fbfdff', 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, corpo);
        el('path', { d: `M${-w / 2 - 8} ${-h - 4} L0 ${-h - rh - 7}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.9 }, corpo);
        el('path', { d: `M0 ${-h - rh - 3} L${dx} ${-h - rh - dy - 3}`, stroke: '#fbfdff', 'stroke-width': 9, 'stroke-linecap': 'round' }, corpo);
        ghiaccioli(corpo, -w / 2 - 8, -h + 4, -w / 2 + 14, -h - 10, 2);
        ghiaccioli(corpo, w / 2 - 14, -h - 10, w / 2 + 8, -h + 4, 2);
        cima = -h - rh;
        targaY = -h - rh * 0.4;
        if (tipo === 'torre') {
            // Orologio con le tacche delle ore
            el('circle', { cx: 0, cy: -h + 34, r: 24, fill: scurisci(cornice, 0.25) }, corpo);
            el('circle', { cx: 0, cy: -h + 34, r: 21, fill: '#fdf6dc', stroke: '#6b4a1f', 'stroke-width': 2 }, corpo);
            for (let ora = 0; ora < 12; ora++) {
                const angolo = (ora / 12) * Math.PI * 2;
                const lungo = ora % 3 === 0 ? 5 : 3;
                el('path', { d: `M${Math.sin(angolo) * 18} ${-h + 34 - Math.cos(angolo) * 18} L${Math.sin(angolo) * (18 - lungo)} ${-h + 34 - Math.cos(angolo) * (18 - lungo)}`, stroke: '#3b2a1a', 'stroke-width': 1.5 }, corpo);
            }
            el('path', { d: `M0 ${-h + 34} L0 ${-h + 21} M0 ${-h + 34} L9 ${-h + 38}`, stroke: '#222', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, corpo);
        }
    }

    // ---- Comignolo ----
    if (tipo !== 'torre') {
        const cx = verso > 0 ? w * 0.25 + 10 : -w * 0.25 - 24;
        el('rect', { x: cx, y: cima + 12, width: 15, height: 28, fill: '#8a4b3a' }, corpo);
        el('rect', { x: cx, y: cima + 12, width: 15, height: 28, fill: 'url(#tex-mattoni)' }, corpo);
        el('rect', { x: cx - 2, y: cima + 9, width: 19, height: 5, fill: '#5d4037' }, corpo);
        el('path', { d: `M${cx - 3} ${cima + 10} q 4 -7 11 -6 q 7 -1 11 6 Z`, fill: '#fbfdff' }, corpo);
        const fumo = el('g', { class: 'fumo' }, corpo);
        for (let i = 0; i < 3; i++) el('circle', { cx: cx + 7, cy: cima + 4, r: 11, fill: 'url(#fumo-morbido)' }, fumo);
    }

    // ---- Lucine di festa sul tetto: si accendono quando la casa è stata aperta ----
    const lucineTetto = el('g', { class: 'luci-festa' }, corpo);
    const punti = [];
    if (tipo === 'piatto') {
        for (let i = 0; i <= 8; i++) punti.push([-w / 2 - 4 + ((w + 8) * i) / 8, -h - 3 + (i % 2) * 3]);
    } else {
        const rh = tipo === 'torre' ? 70 : 46;
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            punti.push([-w / 2 - 10 + (w + 20) * t, -h + 2 - (rh + 3) * (1 - Math.abs(2 * t - 1)) + (i % 2) * 3]);
        }
    }
    el('path', { d: 'M' + punti.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(' L'), fill: 'none', stroke: '#24322a', 'stroke-width': 1.2 }, lucineTetto);
    punti.forEach(([px, py], i) => {
        const colore = COLORI_FESTA[i % COLORI_FESTA.length], ritardo = `animation-delay:${((i % 4) * 0.35).toFixed(2)}s`;
        el('circle', { cx: px.toFixed(1), cy: (py + 3).toFixed(1), r: 8, fill: colore, opacity: 0.3, style: ritardo }, lucineTetto);
        el('circle', { cx: px.toFixed(1), cy: (py + 3).toFixed(1), r: 3.6, fill: colore, style: ritardo }, lucineTetto);
    });

    // ---- Finestre ----
    const fy = tipo === 'torre' ? -h + 70 : -h + 16;
    [-w / 2 + 15, w / 2 - 37].forEach(fx => finestra(corpo, fx, fy, 22, 24, { cornice, persiane }));

    // ---- Porta ----
    el('rect', { x: -18, y: -47, width: 36, height: 47, rx: 14, fill: cornice }, corpo);
    el('rect', { x: -14, y: -43, width: 28, height: 43, rx: 12, fill: '#2a1d14' }, corpo);
    el('rect', { class: 'luce-porta', x: -14, y: -43, width: 28, height: 43, rx: 12, filter: 'url(#bagliore)' }, corpo);
    const porta = el('g', { class: 'porta' }, corpo);
    const legno = scurisci(colori.tetto, 0.05);
    el('rect', { x: -14, y: -43, width: 28, height: 43, rx: 12, fill: legno, stroke: scurisci(legno, 0.4), 'stroke-width': 1.5 }, porta);
    el('path', { d: 'M-5 -40 V0 M5 -40 V0', stroke: scurisci(legno, 0.3), 'stroke-width': 1.2 }, porta);
    el('circle', { cx: 8, cy: -20, r: 1.8, fill: '#e6c35c' }, porta);
    // Ghirlanda con il fiocco
    el('circle', { cx: 0, cy: -29, r: 6.5, fill: 'none', stroke: '#2e6b3f', 'stroke-width': 3.5 }, porta);
    el('circle', { cx: -3, cy: -33, r: 1.3, fill: '#d63031' }, porta);
    el('circle', { cx: 4, cy: -27, r: 1.3, fill: '#d63031' }, porta);
    el('path', { d: 'M0 -23 l-4 3 v-5 Z M0 -23 l4 3 v-5 Z', fill: '#c0392b' }, porta);
    // Gradino innevato e lanterna
    el('rect', { x: -21, y: -3, width: 42, height: 6, rx: 1, fill: '#9aa0b5' }, corpo);
    el('path', { d: 'M-22 -2 q 22 -6 44 0 Z', fill: '#fbfdff' }, corpo);
    const lx = 24 * (verso > 0 ? -1 : 1);
    el('rect', { x: lx - 3, y: -40, width: 6, height: 9, rx: 1, fill: '#ffd47a', filter: 'url(#bagliore)' }, corpo);
    el('path', { d: `M${lx - 4} -40 h8 l-4 -4 Z`, fill: '#2c2f45' }, corpo);

    // Cumuli di neve alla base
    el('path', { d: `M${-w / 2 - 6} 3 q 10 -12 22 -6 q 8 -6 14 2 Z`, fill: '#fbfdff' }, corpo);
    el('path', { d: `M${w / 2 - 30} 3 q 12 -10 22 -5 q 10 -7 16 3 Z`, fill: '#fbfdff' }, corpo);
    // Neve che cresce con i giorni: cumuli più alti e il tetto più carico
    const neveInPiu = el('g', { class: 'neve-extra' }, corpo);
    el('path', { d: `M${-w / 2 - 12} 4 q 8 -20 26 -14 q 10 -10 22 -2 q 6 4 4 16 Z`, fill: '#fbfdff' }, neveInPiu);
    el('path', { d: `M${w / 2 - 34} 4 q 6 -16 22 -12 q 12 -12 24 0 q 4 6 0 12 Z`, fill: '#fbfdff' }, neveInPiu);
    if (tipo === 'piatto') {
        el('path', { d: `M${-w / 2 - 8} ${-h - 12} q ${w / 4} -16 ${w / 2} -8 q ${w / 4} -12 ${w / 2 + 16} 4 Z`, fill: '#fbfdff' }, neveInPiu);
    } else {
        const rh = tipo === 'torre' ? 70 : 46;
        el('path', { d: `M${-w / 2 - 12} ${-h - 1} L0 ${-h - rh - 9} L${w / 2 + 12} ${-h - 1} L${w / 2 + 2} ${-h + 2} L0 ${-h - rh - 1} L${-w / 2 - 2} ${-h + 2} Z`, fill: '#fbfdff' }, neveInPiu);
    }

    // Targa con il numero, in alto sul timpano
    el('circle', { class: 'targa', cx: 0, cy: targaY, r: 15, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 2.5 }, corpo);
    el('text', { class: 'targa-testo', x: 0, y: targaY + 6, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 'bold', fill: '#b22222' }, corpo).textContent = giorno;

    // Segnale "oggi"
    const segnale = el('g', { class: 'segnale' }, casa);
    el('path', { d: `M0 ${cima - 40} l7 14 15 2 -11 10 3 15 -14 -7 -14 7 3 -15 -11 -10 15 -2 Z`, fill: '#ffe066', filter: 'url(#bagliore)' }, segnale);
    return casa;
}

function disegnaAlbero(mondo, x, y, scala) {
    // L'albero della piazza è sempre acceso: il 24 è la casa di Babbo Natale, qui accanto
    const albero = el('g', {
        class: 'albero aperta', transform: `translate(${x} ${y}) scale(${scala})`, tabindex: 0, role: 'button',
        'aria-label': 'Il balletto intorno all\'albero: clicca per sentire la musica dello Schiaccianoci'
    }, mondo);
    el('ellipse', { class: 'alone', cx: 0, cy: -140, rx: 170, ry: 200, fill: 'url(#alone)' }, albero);
    // Il laghetto ghiacciato dove danzano le ballerine
    el('ellipse', { cx: 0, cy: 0, rx: 128, ry: 34, fill: '#cfe0f5', stroke: '#a9c1e4', 'stroke-width': 3 }, albero);
    el('ellipse', { cx: -20, cy: -4, rx: 84, ry: 16, fill: '#eef5ff', opacity: 0.8 }, albero);
    el('path', { d: 'M-70 8 q 30 -6 60 2 M20 12 q 30 -8 56 -2', stroke: '#ffffff', 'stroke-width': 2, fill: 'none', opacity: 0.9 }, albero);
    const dietro = el('g', { class: 'ballerine' }, albero);
    const corpo = el('g', { class: 'corpo' }, albero);
    el('rect', { x: -14, y: -30, width: 28, height: 32, fill: '#5d4037' }, corpo);
    [[0, 170, 90], [-60, 140, 80], [-115, 105, 70], [-165, 70, 60]].forEach(([dy, larghezza, altezza]) => {
        el('path', { d: `M${-larghezza / 2} ${dy - 26} L0 ${dy - 26 - altezza} L${larghezza / 2} ${dy - 26} Z`, fill: '#1f6b4a' }, corpo);
        el('path', { d: `M${-larghezza / 2} ${dy - 26} q ${larghezza / 4} -12 ${larghezza / 2} 0 q ${larghezza / 4} -12 ${larghezza / 2} 0`, fill: 'none', stroke: '#f4f8ff', 'stroke-width': 7, 'stroke-linecap': 'round' }, corpo);
    });
    for (let i = 0; i < 18; i++) {
        const livello = caso();
        const yy = -40 - livello * 210;
        const meta = (1 - livello) * 70;
        el('circle', { class: 'lucina', cx: (caso() * 2 - 1) * meta, cy: yy, r: 5 }, corpo);
    }
    el('path', { class: 'puntale', d: 'M0 -280 l9 18 20 3 -15 13 4 20 -18 -10 -18 10 4 -20 -15 -13 20 -3 Z' }, corpo);
    const davanti = el('g', { class: 'ballerine' }, albero);
    danzaBallerine(albero, dietro, davanti);
    return albero;
}

// ========== LE BALLERINE ==========
// Danzano in cerchio intorno all'albero della piazza, come i cigni del balletto:
// tutù bianco, braccia ad ali, ogni tanto una piroetta. Passano dietro e davanti all'albero.

let contaBallerine = 0;

// Sfumature del tutù: tulle bianco che sfuma verso il bordo, oppure nero per il cigno nero
function sfumatureTutu(contenitore) {
    const defs = el('defs', {}, contenitore);
    [['tutu-bianco', '#ffffff', '#eef0fb', '#c9cfe6'], ['tutu-nero', '#3a3450', '#221e30', '#0e0c16']].forEach(([id, centro, medio, bordo]) => {
        const g = el('radialGradient', { id, cx: '50%', cy: '45%', r: '55%' }, defs);
        el('stop', { offset: '0%', 'stop-color': centro }, g);
        el('stop', { offset: '70%', 'stop-color': medio }, g);
        el('stop', { offset: '100%', 'stop-color': bordo, 'stop-opacity': 0.75 }, g);
    });
}

// Gamba affusolata (coscia, ginocchio, polpaccio, caviglia) con la scarpetta da punta.
// L'anca è in (0,0), il piede in (0,44)
function gambaBallerina(padre, collant, scarpetta, transform) {
    const g = el('g', { transform }, padre);
    el('path', { d: 'M-3.7 0 Q-4.2 9 -2.6 21 Q-1.6 26 -2.9 31 Q-2.4 37 -1.2 39 L1.2 39 Q2 36 2.6 30 Q3.4 25 2.5 21 Q3.8 10 3.7 0 Z', fill: collant }, g);
    el('path', { d: 'M1 2 Q2.6 10 1.6 20', stroke: '#ffffff', 'stroke-width': 0.9, opacity: 0.35, fill: 'none' }, g);
    el('path', { d: 'M-1.4 38.5 L1.4 38.5 L1.1 44 L-1.1 44 Z', fill: scarpetta }, g);
    el('path', { d: 'M-1.3 36 L1.3 39 M1.3 36 L-1.3 39', stroke: scarpetta, 'stroke-width': 0.8 }, g);
    return g;
}

// Braccia da cigno: spalla, gomito morbido, polso e mano allungata. "onda" le fa ondeggiare come ali
function bracciaBallerina(onda) {
    const lato = s => {
        const gx = 15 * s, gy = -67 + onda * 0.5, px = 26 * s, py = -61 - onda, mx = 31 * s, my = -63 - onda * 1.4;
        return `M${5 * s} -63.5 Q${10 * s} ${(-68 + onda * 0.3).toFixed(1)} ${gx} ${gy.toFixed(1)} Q${21 * s} ${(-66 - onda * 0.2).toFixed(1)} ${px} ${py.toFixed(1)} L${mx} ${my.toFixed(1)}`;
    };
    return `${lato(-1)} ${lato(1)}`;
}

function disegnaBallerina(variante) {
    const n = ++contaBallerine;
    const pelle = ['#f2d2bd', '#e3b393', '#c48a66', '#f5dccb', '#9c6a4b'][variante % 5];
    const ombraPelle = ['#e0b9a2', '#cf9c7b', '#a9714f', '#e6c4ae', '#82553a'][variante % 5];
    const capelli = ['#5a3b2a', '#2b1d14', '#1c1410', '#c9984a', '#3a2418'][variante % 5];
    const nero = variante === 2; // il cigno nero tra quelli bianchi
    const abito = nero ? '#25212f' : '#fbfaff';
    const ricamo = nero ? '#c0263a' : '#d9c27a';
    const collant = '#f3d4cc', scarpetta = '#e8b4b0';

    const posto = el('g', {});
    // Ombra sul ghiaccio e riflesso della ballerina
    el('ellipse', { cx: 0, cy: 1, rx: 15, ry: 3, fill: 'rgba(40,60,110,0.28)' }, posto);
    el('use', { href: `#ballerina-${n}`, transform: 'scale(1 -0.55)', opacity: 0.16 }, posto);
    const giro = el('g', { id: `ballerina-${n}` }, posto);

    // Gamba d'appoggio sulle punte e gamba alzata all'indietro in arabesque
    gambaBallerina(giro, collant, scarpetta, 'translate(0 -44)');
    gambaBallerina(giro, '#ecc8bf', scarpetta, 'translate(2 -46) rotate(-112)');

    // Tutù a piatto: strati di tulle con il bordo a piume
    const tutu = el('g', { transform: 'rotate(-6 0 -45)' }, giro);
    el('ellipse', { cx: 0, cy: -43.5, rx: 25, ry: 5.5, fill: nero ? '#0e0c16' : '#c7cde4', opacity: 0.9 }, tutu);
    for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2;
        const x = Math.cos(a) * 25.5, y = -45 + Math.sin(a) * 6.2;
        el('ellipse', { cx: x.toFixed(1), cy: y.toFixed(1), rx: 3.2, ry: 1.6, transform: `rotate(${(a * 180 / Math.PI).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})`, fill: nero ? '#2c2738' : '#ffffff', opacity: 0.9 }, tutu);
    }
    el('ellipse', { cx: 0, cy: -45.5, rx: 24, ry: 6, fill: `url(#${nero ? 'tutu-nero' : 'tutu-bianco'})` }, tutu);
    el('ellipse', { cx: 0, cy: -46.5, rx: 15, ry: 3.4, fill: nero ? '#3a3450' : '#ffffff', opacity: 0.8 }, tutu);
    for (let i = 0; i < 7; i++) {
        const a = Math.PI * (0.15 + i * 0.12);
        el('circle', { cx: (Math.cos(a) * 17).toFixed(1), cy: (-46 + Math.sin(a) * 4).toFixed(1), r: 0.9, fill: ricamo }, tutu);
    }

    // Busto leggermente inclinato in avanti, come nell'arabesque
    const busto = el('g', { transform: 'rotate(-9 0 -46)' }, giro);
    // Corpetto aderente con la vita stretta e il ricamo a punta
    el('path', { d: 'M-4.2 -45 Q-3.6 -51 -5.2 -57 Q-6 -61.5 -4.6 -63.2 L4.6 -63.2 Q6 -61.5 5.2 -57 Q3.6 -51 4.2 -45 Z', fill: abito }, busto);
    el('path', { d: 'M1.5 -45 Q3.6 -51 3.4 -57 Q4.4 -61.5 4.6 -63.2 L5.5 -62 Q6 -58 5 -55 Q3.8 -50 4.2 -45 Z', fill: '#000', opacity: 0.12 }, busto);
    el('path', { d: 'M-4.4 -47 L0 -43.5 L4.4 -47 M-4.6 -58 Q0 -55.5 4.6 -58', stroke: ricamo, 'stroke-width': 0.9, fill: 'none' }, busto);
    // Spalle, collo lungo e braccia
    el('path', { d: 'M-5 -63 Q0 -61.6 5 -63 Q5.6 -65.5 3 -66.2 L-3 -66.2 Q-5.6 -65.5 -5 -63 Z', fill: pelle }, busto);
    el('path', { d: 'M-1.7 -71 L-1.9 -65.5 L1.9 -65.5 L1.7 -71 Z', fill: ombraPelle }, busto);
    const braccia = el('path', { d: bracciaBallerina(0), stroke: pelle, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, busto);
    // Testa di profilo, con lo chignon dietro e la coroncina di piume da cigno
    el('ellipse', { cx: -0.6, cy: -75.2, rx: 4.3, ry: 5.2, fill: pelle }, busto);
    el('path', { d: 'M-4.9 -75.5 Q-5.2 -81 0 -81 Q4.4 -81 4.4 -76 Q4 -73 3.2 -71.8 Q1.5 -75 -0.5 -76.6 Q-3 -77.6 -4.9 -75.5 Z', fill: capelli }, busto);
    el('circle', { cx: 4.4, cy: -77.2, r: 2.9, fill: capelli }, busto);
    el('path', { d: 'M-3.6 -75.2 q 0.9 -0.5 1.8 0', stroke: '#3a2a22', 'stroke-width': 0.6, fill: 'none' }, busto);
    el('circle', { cx: -3, cy: -73, r: 0.9, fill: '#e89a9a', opacity: 0.55 }, busto);
    const piuma = nero ? '#1a1724' : '#ffffff';
    [[-3.8, -80.2, -40], [-1.5, -81.4, -15], [1.2, -81.3, 15], [3.4, -80.2, 40]].forEach(([x, y, r]) => {
        el('ellipse', { cx: x, cy: y, rx: 1.3, ry: 2.4, transform: `rotate(${r} ${x} ${y})`, fill: piuma, stroke: nero ? '#3a3450' : '#d8dcef', 'stroke-width': 0.4 }, busto);
    });
    el('circle', { cx: -0.2, cy: -80.6, r: 0.8, fill: nero ? '#e0263a' : '#bfe3ff' }, busto);

    return { posto, giro, braccia };
}

function danzaBallerine(albero, dietro, davanti) {
    const RX = 104, RY = 26, QUANTE = 5;
    sfumatureTutu(albero);
    const ballerine = Array.from({ length: QUANTE }, (_, i) => ({ ...disegnaBallerina(i), fase: (i / QUANTE) * Math.PI * 2 }));
    const ferma = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const disponi = t => {
        for (const [i, b] of ballerine.entries()) {
            const a = b.fase + t * 0.32;
            const x = Math.cos(a) * RX, y = Math.sin(a) * RY;
            const avanti = Math.sin(a) > 0;
            // Va verso sinistra quando passa davanti, verso destra quando passa dietro
            const verso = avanti ? 1 : -1;
            // Ogni tanto una piroetta, a turno
            const ciclo = (t * 0.25 + i * 0.37) % 1;
            const piroetta = ciclo < 0.18 ? Math.cos((ciclo / 0.18) * Math.PI * 4) : 1;
            const salto = Math.abs(Math.sin(t * 2.6 + i)) * 3;
            const scala = 1.15 * (1 + Math.sin(a) * 0.08);
            b.posto.setAttribute('transform', `translate(${x.toFixed(1)} ${(y - salto).toFixed(1)}) scale(${scala.toFixed(3)})`);
            b.giro.setAttribute('transform', `scale(${(verso * piroetta).toFixed(3)} 1)`);
            const onda = Math.sin(t * 3 + i) * 3;
            b.braccia.setAttribute('d', bracciaBallerina(onda));
            const gruppo = avanti ? davanti : dietro;
            if (b.posto.parentNode !== gruppo) gruppo.append(b.posto);
        }
        // Più in basso sullo schermo = più vicine: vanno disegnate dopo
        for (const gruppo of [dietro, davanti]) {
            [...gruppo.children]
                .sort((p, q) => p.transform.baseVal.consolidate().matrix.f - q.transform.baseVal.consolidate().matrix.f)
                .forEach(figlio => gruppo.append(figlio));
        }
    };

    disponi(0);
    if (ferma) return;
    let era = false;
    let ultimo = performance.now(), tempo = 0;
    const passo = adesso => {
        if (albero.isConnected) era = true;
        else if (era) return;
        // Quando suona lo Schiaccianoci il balletto si anima
        const passato = (adesso - ultimo) / 1000;
        ultimo = adesso;
        if (nonSiVede(albero)) return requestAnimationFrame(passo);
        tempo += Math.min(passato, 0.1) * (albero.classList.contains('suona') ? 2 : 1);
        disponi(tempo);
        requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
}

// La casa di Babbo Natale: più grande, rossa con il tetto verde, il cartello, i bastoncini e il sacco dei regali
function disegnaCasaBabbo(mondo, x, y, scala) {
    const casa = disegnaCasa(mondo, 24, x, y, scala, 'punta', { w: 150, h: 104, colori: { muro: '#c0392b', tetto: '#2e5b3f' }, materiale: 'intonaco' });
    casa.setAttribute('aria-label', '24 dicembre, la casa di Babbo Natale');
    const corpo = casa.querySelector('.corpo');
    const targa = [...corpo.querySelectorAll('.targa, .targa-testo')];
    // Bastoncini di zucchero ai lati della porta
    [-34, 34].forEach(px => {
        el('path', { d: `M${px} 0 V-46 a7 7 0 0 ${px < 0 ? 0 : 1} ${px < 0 ? -14 : 14} 0`, fill: 'none', stroke: '#fbfdff', 'stroke-width': 6, 'stroke-linecap': 'round' }, corpo);
        el('path', { d: `M${px} 0 V-46 a7 7 0 0 ${px < 0 ? 0 : 1} ${px < 0 ? -14 : 14} 0`, fill: 'none', stroke: '#d63031', 'stroke-width': 6, 'stroke-dasharray': '5 5' }, corpo);
    });
    // Cartello di legno
    el('path', { d: 'M-116 0 V-50 M-60 0 V-50', stroke: '#5d3a22', 'stroke-width': 5 }, corpo);
    el('rect', { x: -134, y: -84, width: 92, height: 38, rx: 4, fill: '#8a5a3c', stroke: '#5d3a22', 'stroke-width': 2 }, corpo);
    el('text', { x: -88, y: -68, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 'bold', fill: '#fffaf0', 'font-family': 'Georgia, serif' }, corpo).textContent = 'CASA DI';
    el('text', { x: -88, y: -53, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 'bold', fill: '#ffd36b', 'font-family': 'Georgia, serif' }, corpo).textContent = 'BABBO NATALE';
    el('path', { d: 'M-136 -84 q 46 -8 96 0', stroke: '#fbfdff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, corpo);
    // Sacco dei regali accanto alla porta
    el('path', { d: 'M70 2 q -30 0 -24 -34 q 4 -16 24 -20 q 20 4 24 20 q 6 34 -24 34 Z', fill: '#a0663a' }, corpo);
    el('path', { d: 'M58 -50 q 12 -8 24 0', stroke: '#c0392b', 'stroke-width': 4, fill: 'none' }, corpo);
    [[60, -56, '#2e7d5b'], [74, -60, '#f4d03f'], [86, -54, '#3a5ba0']].forEach(([cx, cy, c]) => el('rect', { x: cx - 7, y: cy - 7, width: 14, height: 12, fill: c }, corpo));
    // La targa con il 24 torna in primo piano
    corpo.append(...targa);
    return casa;
}

// Cartello di legno in piazza: quanti giorni mancano a Natale
function disegnaCartelloNatale(mondo, x, y, scala) {
    const c = el('g', { class: 'cartello-natale', transform: `translate(${x} ${y}) scale(${scala})`, 'pointer-events': 'none' }, mondo);
    el('ellipse', { cx: 0, cy: 3, rx: 90, ry: 8, fill: '#6f84bd', opacity: 0.3 }, c);
    el('path', { d: 'M-64 0 V-64 M64 0 V-64', stroke: '#5d3a22', 'stroke-width': 7 }, c);
    el('rect', { x: -104, y: -112, width: 208, height: 56, rx: 6, fill: '#8a5a3c', stroke: '#5d3a22', 'stroke-width': 3 }, c);
    el('path', { d: 'M-100 -94 H100 M-100 -76 H100', stroke: '#7a4b2e', 'stroke-width': 1.5 }, c);
    el('path', { d: 'M-108 -110 q 26 -12 60 -6 q 40 -10 80 -2 q 30 -6 76 4 L 106 -106 L-106 -106 Z', fill: '#fbfdff' }, c);
    // Ghirlanda con le lucine sotto il cartello
    el('path', { d: 'M-102 -56 q 51 16 102 0 q 51 16 102 0', stroke: '#2e6b3f', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, c);
    [-78, -40, 0, 40, 78].forEach((lx, i) => el('circle', { class: 'lucina-cartello', cx: lx, cy: -50 + (i % 2) * 3, r: 3, fill: COLORI_FESTA[i], style: `animation-delay:${(i * 0.3).toFixed(1)}s` }, c));
    const sopra = el('text', { x: 0, y: -88, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 'bold', fill: '#fffaf0', 'font-family': 'Georgia, serif' }, c);
    const sotto = el('text', { x: 0, y: -66, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 'bold', fill: '#ffd36b', 'font-family': 'Georgia, serif' }, c);
    return { sopra, sotto };
}

// Che cosa dice il cartello, a seconda del giorno
function testoAttesa(giorno) {
    if (giorno <= 0) {
        const oggi = new Date();
        let natale = new Date(oggi.getFullYear(), 11, 25);
        if (oggi > natale) natale = new Date(oggi.getFullYear() + 1, 11, 25);
        const mancano = Math.ceil((natale - oggi) / 86400000);
        return ['Mancano', `${mancano} giorni a Natale!`];
    }
    if (giorno >= 25) return ['Buon Natale', 'a tutti!'];
    if (giorno === 24) return ['È la Vigilia:', 'domani è Natale!'];
    return ['Mancano', `${25 - giorno} giorni a Natale!`];
}

// ========== IL CORO ==========
// Cinque cantori in piazza, con i libretti e una lanterna. Cantano dondolando e le note salgono nel cielo.
// Se si clicca il coro, canta davvero "We Wish You a Merry Christmas", il canto dei cantori inglesi.

const CANTORI = [
    { x: -38, y: -9, cappotto: '#2e6b4a', sciarpa: '#c0392b', cappello: 'cilindro', pelle: '#f2d2bd', capelli: '#5a3b2a' },
    { x: 0, y: -12, cappotto: '#8e2433', sciarpa: '#f4f1e8', cappello: 'cuffia', pelle: '#e3b393', capelli: '#2b1d14' },
    { x: 38, y: -9, cappotto: '#2d4f8a', sciarpa: '#f4d03f', cappello: 'berretto', pelle: '#c48a66', capelli: '#1c1410', lanterna: true },
    { x: -19, y: 6, cappotto: '#6b3f8a', sciarpa: '#7dcf9a', cappello: 'berretto', pelle: '#f5dccb', capelli: '#c9984a', piccolo: true },
    { x: 20, y: 6, cappotto: '#b5651d', sciarpa: '#2e6b4a', cappello: 'cuffia', pelle: '#9c6a4b', capelli: '#3a2418', piccolo: true }
];

function disegnaCantore(genitore, c, i) {
    const posto = el('g', { transform: `translate(${c.x} ${c.y}) scale(${c.piccolo ? 0.82 : 1})` }, genitore);
    el('ellipse', { cx: 0, cy: 1, rx: 13, ry: 3, fill: 'rgba(40,60,110,0.3)' }, posto);
    const g = el('g', { class: 'cantore', style: `animation-delay:${(-i * 0.45).toFixed(2)}s` }, posto);
    const scuro = scurisci(c.cappotto, 0.3);
    // Stivali e cappotto lungo
    el('path', { d: 'M-6 -8 h5 v8 h-7 q0 -3 2 -3 Z M1 -8 h5 v5 q2 0 2 3 h-7 Z', fill: '#2a2230' }, g);
    el('path', { d: 'M-11 -7 Q-12 -28 -8 -44 L8 -44 Q12 -28 11 -7 Q0 -4 -11 -7 Z', fill: c.cappotto }, g);
    el('path', { d: 'M2 -44 Q6 -28 11 -7 Q6 -5.5 2 -5.5 Z', fill: scuro, opacity: 0.45 }, g);
    el('path', { d: 'M0 -42 V-7', stroke: scuro, 'stroke-width': 1 }, g);
    [-36, -28, -20].forEach(y => el('circle', { cx: -1.6, cy: y, r: 0.9, fill: '#e8c766' }, g));
    el('path', { d: 'M-11 -9 Q0 -5 11 -9', stroke: '#fbfdff', 'stroke-width': 2.2, fill: 'none' }, g);
    // Libretto rosso tenuto con due mani (chi ha la lanterna lo tiene con una sola)
    el('path', { d: 'M-8 -40 Q-12 -34 -6 -33', stroke: c.cappotto, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('rect', { x: -7, y: -37, width: 13, height: 9, rx: 1, fill: '#8b1e2b', transform: 'rotate(-8 0 -33)' }, g);
    el('path', { d: 'M-5 -35.5 h4.5 M1 -35.5 h4 M-5 -33.5 h4.5 M1 -33.5 h4', stroke: '#f6eedc', 'stroke-width': 0.8, transform: 'rotate(-8 0 -33)' }, g);
    el('circle', { cx: -6, cy: -32.5, r: 1.8, fill: c.pelle }, g);
    if (c.lanterna) {
        // Braccio alzato con il bastone e la lanterna accesa
        el('path', { d: 'M8 -41 Q14 -46 15 -52', stroke: c.cappotto, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
        el('path', { d: 'M15 -52 L19 -76', stroke: '#5d3a22', 'stroke-width': 1.8 }, g);
        el('circle', { cx: 15, cy: -52, r: 1.9, fill: c.pelle }, g);
        el('path', { d: 'M19 -76 q 6 0 6 5', stroke: '#2a2230', 'stroke-width': 1.2, fill: 'none' }, g);
        el('circle', { class: 'luce-lanterna', cx: 25, cy: -66, r: 18, fill: 'url(#alone)' }, g);
        el('path', { d: 'M21.5 -70 h7 l-1 10 h-5 Z', fill: '#ffd36b', stroke: '#2a2230', 'stroke-width': 1.1, filter: 'url(#bagliore)' }, g);
        el('path', { d: 'M21 -70.5 h8 l-4 -3 Z M22 -59.5 h6', stroke: '#2a2230', 'stroke-width': 1.2, fill: '#2a2230' }, g);
    } else {
        el('path', { d: 'M8 -40 Q12 -34 6 -33', stroke: c.cappotto, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
        el('circle', { cx: 6, cy: -32.5, r: 1.8, fill: c.pelle }, g);
    }
    // Sciarpa
    el('rect', { x: -7, y: -47, width: 14, height: 4.5, rx: 2, fill: c.sciarpa }, g);
    el('path', { d: 'M3 -44 l2 9 l3 -1 l-1 -8 Z', fill: c.sciarpa }, g);
    // Testa che canta: occhi chiusi felici, guance rosse e bocca aperta
    el('circle', { cx: 0, cy: -53, r: 7, fill: c.pelle }, g);
    el('path', { d: 'M-4 -54.5 q 1.2 -1.2 2.4 0 M1.6 -54.5 q 1.2 -1.2 2.4 0', stroke: '#3a2a22', 'stroke-width': 0.8, fill: 'none' }, g);
    el('circle', { cx: -4.2, cy: -51.5, r: 1.3, fill: '#e8848a', opacity: 0.6 }, g);
    el('circle', { cx: 4.2, cy: -51.5, r: 1.3, fill: '#e8848a', opacity: 0.6 }, g);
    el('ellipse', { class: 'bocca', cx: 0, cy: -49.5, rx: 1.5, ry: 1.9, fill: '#5a2027' }, g);
    // Cappelli diversi
    if (c.cappello === 'cilindro') {
        el('path', { d: 'M-7 -58 q 7 -3 14 0', stroke: c.capelli, 'stroke-width': 2.5, fill: 'none' }, g);
        el('rect', { x: -9.5, y: -60, width: 19, height: 2.6, rx: 1, fill: '#1d1a22' }, g);
        el('rect', { x: -6, y: -73, width: 12, height: 14, rx: 1, fill: '#1d1a22' }, g);
        el('rect', { x: -6, y: -63, width: 12, height: 2.4, fill: '#c0392b' }, g);
        el('path', { d: 'M3 -63 l 3 -3 l 1 3 Z', fill: '#2e6b4a' }, g);
    } else if (c.cappello === 'cuffia') {
        el('path', { d: 'M-8.5 -50 Q-10 -63 0 -63 Q10 -63 8.5 -50 Q7 -57 0 -58 Q-7 -57 -8.5 -50 Z', fill: c.sciarpa === '#f4f1e8' ? '#c0392b' : c.sciarpa }, g);
        el('path', { d: 'M-8 -50 Q-9 -61 0 -61.5 Q9 -61 8 -50', stroke: '#fbfdff', 'stroke-width': 1.6, fill: 'none' }, g);
        el('path', { d: 'M-7 -51 q -2 6 -4 9 M7 -51 q 2 6 4 9', stroke: '#c9a227', 'stroke-width': 1, fill: 'none' }, g);
        el('path', { d: 'M-5 -58 q 5 2 10 0', stroke: c.capelli, 'stroke-width': 2, fill: 'none' }, g);
    } else {
        el('path', { d: 'M-7.5 -56 Q-8 -66 0 -66 Q8 -66 7.5 -56 Z', fill: c.sciarpa }, g);
        el('rect', { x: -8, y: -58, width: 16, height: 3.6, rx: 1.6, fill: '#fbfdff' }, g);
        el('path', { d: 'M-6 -62 h12', stroke: scurisci(c.sciarpa, 0.25), 'stroke-width': 1, 'stroke-dasharray': '1.5 1.5' }, g);
        el('circle', { cx: 0, cy: -67, r: 2.8, fill: '#fbfdff' }, g);
    }
}

function disegnaCoro(mondo, x, y, scala) {
    const coro = el('g', {
        class: 'coro', transform: `translate(${x} ${y}) scale(${scala})`, tabindex: 0, role: 'button',
        'aria-label': 'Il coro del villaggio: clicca per sentirlo cantare'
    }, mondo);
    el('ellipse', { class: 'alone-coro', cx: 0, cy: -30, rx: 80, ry: 60, fill: 'url(#alone)' }, coro);
    // Le note escono a turno dal coro e salgono nel cielo
    ['♪', '♫', '♪', '♬', '♫', '♪'].forEach((nota, i) => {
        el('text', { class: 'nota-coro', x: -40 + i * 16, y: -70 - (i % 2) * 8, 'font-size': 15 + (i % 3) * 3, style: `animation-delay:${(i * 0.7).toFixed(1)}s` }, coro).textContent = nota;
    });
    CANTORI.forEach((c, i) => disegnaCantore(coro, c, i));
    return coro;
}

// "We Wish You a Merry Christmas" (canto tradizionale inglese): nota e durata in battiti
const MERRY_CHRISTMAS = [
    ['D4', 1],
    ['G4', 1], ['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5], ['E4', 1], ['C4', 1], ['E4', 1],
    ['A4', 1], ['A4', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 1], ['D4', 1], ['D4', 1],
    ['B4', 1], ['B4', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 1], ['E4', 1], ['D4', 0.5], ['D4', 0.5],
    ['E4', 1], ['A4', 1], ['F#4', 1], ['G4', 2], ['D4', 1],
    ['G4', 1], ['G4', 1], ['G4', 1], ['F#4', 2], ['F#4', 1],
    ['G4', 1], ['F#4', 1], ['E4', 1], ['D4', 2], ['A4', 1],
    ['B4', 1], ['A4', 0.5], ['A4', 0.5], ['G4', 0.5], ['G4', 0.5], ['D5', 1], ['D4', 1], ['D4', 0.5], ['D4', 0.5],
    ['E4', 1], ['A4', 1], ['F#4', 1], ['G4', 3]
];
// Le note basse dell'accompagnamento, una per battuta da tre battiti (dopo la prima nota)
const BASSI_MERRY = [
    ['G2', 3], ['C3', 3], ['A2', 3], ['D3', 3], ['B2', 3], ['E3', 3], ['C3', 1.5], ['D3', 1.5], ['G2', 3],
    ['G2', 3], ['D3', 3], ['E3', 3], ['D3', 3], ['G2', 3], ['B2', 3], ['C3', 1.5], ['D3', 1.5], ['G2', 3]
];

// "Danza della Fata Confetto" dallo Schiaccianoci di Čajkovskij, suonata come una celesta col pizzicato.
// Nota e durata in battiti (null = pausa)
const FATA_CONFETTO = [
    ['G5', 0.5], ['E5', 0.5], ['G5', 0.5], ['F#5', 0.5], ['D#5', 0.5], ['E5', 0.5], ['D5', 0.5], ['D5', 0.5],
    ['C#5', 0.5], ['C#5', 0.5], ['C5', 0.5], ['C5', 0.5], ['B4', 1], [null, 1],
    ['G5', 0.5], ['E5', 0.5], ['G5', 0.5], ['F#5', 0.5], ['D#5', 0.5], ['E5', 0.5], ['D5', 0.5], ['D5', 0.5],
    ['C#5', 0.5], ['C#5', 0.5], ['C5', 0.5], ['C5', 0.5], ['B4', 1], [null, 1],
    ['B4', 0.5], ['G4', 0.5], ['B4', 0.5], ['A#4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['F4', 0.5], ['F4', 0.5],
    ['E4', 0.5], ['E4', 0.5], ['D#4', 0.5], ['D#4', 0.5], ['E4', 2]
];

function suonaSchiaccianoci(alla_fine) {
    const Contesto = window.AudioContext || window.webkitAudioContext;
    if (!Contesto) {
        setTimeout(alla_fine, 3000);
        return () => {};
    }
    const contesto = new Contesto();
    const uscita = contesto.createGain();
    uscita.gain.value = 0.9;
    uscita.connect(contesto.destination);
    const BATTITO = 0.46;
    // La celesta: un suono di campanella dolce, con gli armonici
    const celesta = (nota, t, durata) => {
        const g = contesto.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.6, durata * 1.6));
        g.connect(uscita);
        [[1, 1], [2, 0.32], [4, 0.1], [6.8, 0.04]].forEach(([multiplo, peso]) => {
            const o = contesto.createOscillator();
            const p = contesto.createGain();
            o.type = 'sine';
            o.frequency.value = frequenza(nota) * multiplo;
            p.gain.value = peso;
            o.connect(p).connect(g);
            o.start(t);
            o.stop(t + Math.max(0.7, durata * 1.7));
        });
    };
    // Il pizzicato degli archi: corto e morbido
    const pizzicato = (nota, t) => {
        const o = contesto.createOscillator();
        const g = contesto.createGain();
        o.type = 'triangle';
        o.frequency.value = frequenza(nota);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(g).connect(uscita);
        o.start(t);
        o.stop(t + 0.3);
    };
    const partenza = contesto.currentTime + 0.1;
    // Quattro colpi di pizzicato per cominciare, poi la melodia (due volte)
    const INTRO = 4;
    let t = partenza + INTRO * BATTITO;
    for (let giro = 0; giro < 2; giro++) {
        for (const [nota, battiti] of FATA_CONFETTO) {
            if (nota) celesta(nota, t, battiti * BATTITO);
            t += battiti * BATTITO;
        }
        t += BATTITO;
    }
    for (let tb = partenza, i = 0; tb < t - BATTITO; tb += BATTITO, i++) pizzicato(i % 2 ? 'B2' : 'E3', tb);
    const fine = (t - partenza + 0.8) * 1000;
    let finito = false;
    const ferma = () => {
        if (finito) return;
        finito = true;
        clearTimeout(timer);
        uscita.gain.setTargetAtTime(0.0001, contesto.currentTime, 0.15);
        setTimeout(() => contesto.close(), 600);
        alla_fine();
    };
    const timer = setTimeout(ferma, fine);
    return ferma;
}

function frequenza(nota) {
    const passi = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[nota[0]] + (nota[1] === '#' ? 1 : 0);
    return 440 * Math.pow(2, (passi + (Number(nota.slice(-1)) - 4) * 12) / 12);
}

// Il coro canta con voci morbide (due oscillatori e un leggero vibrato). Restituisce la funzione per fermarlo.
function cantaMerryChristmas(alla_fine) {
    const Contesto = window.AudioContext || window.webkitAudioContext;
    if (!Contesto) {
        setTimeout(alla_fine, 3000);
        return () => {};
    }
    const contesto = new Contesto();
    const uscita = contesto.createGain();
    uscita.gain.value = 0.9;
    uscita.connect(contesto.destination);
    const BATTITO = 0.42;
    const partenza = contesto.currentTime + 0.1;
    const voce = (nota, inizio, durata, volume, timbro) => {
        const g = contesto.createGain();
        g.gain.setValueAtTime(0.0001, inizio);
        g.gain.exponentialRampToValueAtTime(volume, inizio + 0.08);
        g.gain.setValueAtTime(volume * 0.85, inizio + durata * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, inizio + durata + 0.12);
        g.connect(uscita);
        const vibrato = contesto.createOscillator();
        const ampiezza = contesto.createGain();
        vibrato.frequency.value = 5;
        ampiezza.gain.value = frequenza(nota) * 0.006;
        vibrato.connect(ampiezza);
        [[timbro, 1, 1], ['sine', 2, 0.25]].forEach(([tipo, multiplo, peso]) => {
            const o = contesto.createOscillator();
            const p = contesto.createGain();
            o.type = tipo;
            o.frequency.value = frequenza(nota) * multiplo;
            ampiezza.connect(o.frequency);
            p.gain.value = peso;
            o.connect(p).connect(g);
            o.start(inizio);
            o.stop(inizio + durata + 0.2);
        });
        vibrato.start(inizio);
        vibrato.stop(inizio + durata + 0.2);
    };
    let t = partenza;
    for (const [nota, battiti] of MERRY_CHRISTMAS) {
        voce(nota, t, battiti * BATTITO * 0.9, 0.12, 'triangle');
        t += battiti * BATTITO;
    }
    let tb = partenza + BATTITO;
    for (const [nota, battiti] of BASSI_MERRY) {
        voce(nota, tb, battiti * BATTITO * 0.95, 0.05, 'sine');
        tb += battiti * BATTITO;
    }
    const fine = (t - partenza + 0.6) * 1000;
    let finito = false;
    const ferma = () => {
        if (finito) return;
        finito = true;
        clearTimeout(timer);
        uscita.gain.setTargetAtTime(0.0001, contesto.currentTime, 0.15);
        setTimeout(() => contesto.close(), 600);
        alla_fine();
    };
    const timer = setTimeout(ferma, fine);
    return ferma;
}

// ========== LA VITA NEL VILLAGGIO ==========

// Una parte del paese non si vede se è fuori dallo schermo o se si è dentro una casa:
// allora le sue animazioni si fermano, così il villaggio resta leggero anche sui computer vecchi
function nonSiVede(nodo) {
    return nodo.classList.contains('fuori') || Boolean(nodo.closest('.scena.dentro, .scena.vista-3d'));
}

// Muove una figura disegnata di profilo: verso 1 guarda a sinistra, -1 a destra
function giraFigura(nodo, x, y, scala, verso) {
    nodo.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(scala * verso).toFixed(3)} ${scala.toFixed(3)})`);
}

// Avvia un'animazione che si ferma da sola quando il villaggio viene tolto dalla pagina
function anima(nodo, passo) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return passo(0);
    let era = false;
    const inizio = performance.now();
    const giro = adesso => {
        if (nodo.isConnected) era = true;
        else if (era) return;
        if (!nonSiVede(nodo)) passo((adesso - inizio) / 1000);
        requestAnimationFrame(giro);
    };
    requestAnimationFrame(giro);
}

// ---- I pattinatori sul laghetto ----
const PATTINATORI = [
    { giacca: '#c0392b', pantaloni: '#2c3e66', cappello: '#f4d03f', sciarpa: '#2e7d5b', pelle: '#f2d2bd', velocita: 0.32, fase: 0 },
    { giacca: '#2e6fb5', pantaloni: '#3a2f45', cappello: '#e74c3c', sciarpa: '#fbfdff', pelle: '#c48a66', velocita: 0.27, fase: 2.1 },
    { giacca: '#7d4e9e', pantaloni: '#2c2c3a', cappello: '#fbfdff', sciarpa: '#ff9de2', pelle: '#f5dccb', velocita: 0.3, fase: 4.2, piccolo: true },
    { giacca: '#2e7d5b', pantaloni: '#4a3426', cappello: '#c0392b', sciarpa: '#f4d03f', pelle: '#9c6a4b', velocita: 0.24, fase: 3.1 }
];

function disegnaPattinatore(c) {
    const posto = el('g', {});
    el('ellipse', { cx: 0, cy: 1, rx: 14, ry: 2.5, fill: 'rgba(60,90,140,0.25)' }, posto);
    // Gamba di spinta, tesa all'indietro, con il pattino
    const dietro = el('g', { class: 'gamba-spinta' }, posto);
    el('path', { d: 'M2 -27 L16 -11', stroke: c.pantaloni, 'stroke-width': 5, 'stroke-linecap': 'round' }, dietro);
    el('path', { d: 'M14 -13 l5 4 l-3 3 l-5 -4 Z', fill: '#3a2a22' }, dietro);
    el('path', { d: 'M13 -6 l9 -2', stroke: '#c9d3e6', 'stroke-width': 1.4, 'stroke-linecap': 'round' }, dietro);
    // Gamba d'appoggio piegata e pattino sul ghiaccio
    el('path', { d: 'M0 -27 L-4 -15 L-2 -5', stroke: c.pantaloni, 'stroke-width': 5, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, posto);
    el('path', { d: 'M-6 -6 h8 v-4 h-6 Z', fill: '#3a2a22' }, posto);
    el('path', { d: 'M-9 -0.5 h13 q2 0 2 -2', stroke: '#c9d3e6', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, posto);
    el('path', { d: 'M-5 -2 v-3 M1 -2 v-3', stroke: '#8d98b8', 'stroke-width': 0.8 }, posto);
    // Busto inclinato in avanti, con la giacca
    el('path', { d: 'M-4 -24 L-12 -45 Q-6 -49 0 -46 L6 -25 Q1 -21 -4 -24 Z', fill: c.giacca }, posto);
    el('path', { d: 'M-5 -25 Q0 -22 6 -25 L7 -22 Q1 -19 -6 -22 Z', fill: scurisci(c.giacca, 0.3) }, posto);
    // Braccia: una avanti e una dietro, che oscillano
    el('path', { class: 'braccio-avanti', d: 'M-9 -42 L-20 -33', stroke: c.giacca, 'stroke-width': 4, 'stroke-linecap': 'round' }, posto);
    el('path', { class: 'braccio-dietro', d: 'M-4 -43 L8 -37', stroke: scurisci(c.giacca, 0.15), 'stroke-width': 4, 'stroke-linecap': 'round' }, posto);
    // Sciarpa che svolazza all'indietro
    el('path', { class: 'sciarpa-vento', d: 'M-9 -46 q 8 -2 14 2 q 6 3 12 0 l-1 4 q -6 3 -12 0 q -5 -3 -12 -1 Z', fill: c.sciarpa }, posto);
    // Testa con il berretto e il pompon
    el('circle', { cx: -14, cy: -52, r: 6.2, fill: c.pelle }, posto);
    el('circle', { cx: -17.5, cy: -52, r: 0.9, fill: '#2a1d14' }, posto);
    el('circle', { cx: -16.5, cy: -49.5, r: 1.3, fill: '#e8848a', opacity: 0.6 }, posto);
    el('path', { d: 'M-20.5 -54 Q-20 -62 -13 -62 Q-7 -62 -7.5 -54 Z', fill: c.cappello }, posto);
    el('rect', { x: -21, y: -55.5, width: 14, height: 3, rx: 1.4, fill: '#fbfdff' }, posto);
    el('circle', { cx: -11, cy: -63, r: 2.4, fill: '#fbfdff' }, posto);
    return posto;
}

function disegnaPattinatori(mondo, cx, cy) {
    const lago = el('g', { class: 'pattinatori', 'pointer-events': 'none' }, mondo);
    // Le righe lasciate dai pattini sul ghiaccio
    [[0, 0, 128, 21], [8, -2, 104, 15], [-10, 3, 146, 25]].forEach(([dx, dy, rx, ry]) => {
        el('ellipse', { cx: cx + dx, cy: cy + dy, rx, ry, fill: 'none', stroke: '#ffffff', 'stroke-width': 1.2, opacity: 0.55, 'stroke-dasharray': '30 14 50 20' }, lago);
    });
    const RX = 128, RY = 21;
    const figure = PATTINATORI.map(c => ({ ...c, nodo: disegnaPattinatore(c) }));
    figure.forEach(f => lago.append(f.nodo));
    anima(lago, t => {
        for (const [i, f] of figure.entries()) {
            const a = f.fase + t * f.velocita;
            const x = cx + Math.cos(a) * RX * (f.piccolo ? 0.8 : 1);
            const y = cy + Math.sin(a) * RY * (f.piccolo ? 0.8 : 1);
            // Davanti al lago va verso sinistra, dietro torna verso destra
            const verso = Math.sin(a) > 0 ? 1 : -1;
            // Leggera inclinazione nelle curve e piccola spinta ritmica
            const spinta = Math.sin(t * 3 + i) * 2;
            giraFigura(f.nodo, x + spinta * verso, y, scalaPer(y) * (f.piccolo ? 0.95 : 1.15), verso);
        }
        [...lago.children].filter(n => n.tagName === 'g')
            .sort((p, q) => p.transform.baseVal.consolidate().matrix.f - q.transform.baseVal.consolidate().matrix.f)
            .forEach(n => lago.append(n));
    });
    return lago;
}

// ---- Il mercatino di Natale ----
const BANCARELLE = [
    { nome: 'Castagne', tetto: '#9b1d2a', banco: 'castagne', venditore: { giacca: '#3b3f58', cappello: '#c0392b', pelle: '#f0cfb6' } },
    { nome: 'Cioccolata', tetto: '#2e6b3f', banco: 'cioccolata', venditore: { giacca: '#5b3a6b', cappello: '#e3e3ea', pelle: '#e3b393' } },
    { nome: 'Frittelle', tetto: '#2d4f8a', banco: 'frittelle', venditore: { giacca: '#2d4f8a', cappello: '#e3e3ea', pelle: '#c48a66' } }
];

function disegnaBancarella(genitore, x, b) {
    const g = el('g', { transform: `translate(${x} 0)` }, genitore);
    el('ellipse', { cx: 0, cy: 2, rx: 54, ry: 6, fill: 'rgba(60,90,140,0.25)' }, g);
    // Casetta di legno aperta sul davanti
    el('rect', { x: -46, y: -78, width: 92, height: 78, fill: '#7a4b2e' }, g);
    el('rect', { x: -46, y: -78, width: 92, height: 78, fill: 'url(#tex-assi)' }, g);
    el('rect', { x: -38, y: -70, width: 76, height: 40, fill: '#3b2416' }, g);
    el('circle', { class: 'luce-calda', cx: 0, cy: -50, r: 46, fill: 'url(#alone)', opacity: 0.7 }, g);
    // Il venditore dietro al banco
    const v = b.venditore;
    el('path', { d: 'M-12 -30 Q-12 -46 0 -47 Q12 -46 12 -30 Z', fill: v.giacca }, g);
    el('circle', { cx: 0, cy: -53, r: 7, fill: v.pelle }, g);
    el('path', { d: 'M-3 -54 q 1 -1 2 0 M1.5 -54 q 1 -1 2 0', stroke: '#2a1d14', 'stroke-width': 0.8, fill: 'none' }, g);
    el('path', { d: 'M-2.5 -50 q 2.5 2 5 0', stroke: '#7a3a2a', 'stroke-width': 0.9, fill: 'none' }, g);
    el('path', { d: 'M-7.5 -56 Q-8 -64 0 -64 Q8 -64 7.5 -56 Z', fill: v.cappello }, g);
    if (v.cappello === '#e3e3ea') el('circle', { cx: 0, cy: -65, r: 3.6, fill: '#d4d4de' }, g);
    // Occhialini da nonna
    el('path', { d: 'M-4.6 -54 a 2.2 2.2 0 1 0 0.1 0 M2.4 -54 a 2.2 2.2 0 1 0 0.1 0 M-2.4 -54 h2.8', stroke: '#8a6a2a', 'stroke-width': 0.7, fill: 'none' }, g);
    el('path', { d: 'M-12 -40 Q0 -36 12 -40 L11 -30 L-11 -30 Z', fill: '#fbf6ea' }, g);
    // Il banco con la tovaglia
    el('rect', { x: -44, y: -32, width: 88, height: 32, fill: '#8a5a3c' }, g);
    el('path', { d: 'M-46 -33 H46 V-24 q -7.7 5 -15.3 0 q -7.7 5 -15.3 0 q -7.7 5 -15.3 0 q -7.7 5 -15.3 0 q -7.7 5 -15.3 0 q -7.7 5 -15.3 0 Z', fill: '#fbf6ea' }, g);
    el('path', { d: 'M-46 -29 H46', stroke: b.tetto, 'stroke-width': 2, 'stroke-dasharray': '4 4' }, g);
    // La merce sul banco
    if (b.banco === 'castagne') {
        el('path', { d: 'M-34 -33 q 14 10 28 0 Z', fill: '#2c2c2c' }, g);
        for (let i = 0; i < 6; i++) el('ellipse', { cx: -30 + i * 4.4, cy: -35 + (i % 2), rx: 2.6, ry: 2, fill: '#6b3a1f' }, g);
        const fumo = el('g', { class: 'fumo-mercato' }, g);
        for (let i = 0; i < 3; i++) el('circle', { cx: -20, cy: -40, r: 5, fill: '#e8edf6', style: `animation-delay:${(i * 0.9).toFixed(1)}s` }, fumo);
        [[14, '#a0663a'], [24, '#8a5a3c'], [34, '#a0663a']].forEach(([cx, c]) => el('path', { d: `M${cx - 4} -33 l2 -8 h4 l2 8 Z`, fill: c }, g));
    } else if (b.banco === 'cioccolata') {
        [-30, -18, -6, 18, 30].forEach((cx, i) => {
            el('rect', { x: cx - 4, y: -41, width: 8, height: 8, rx: 1.5, fill: ['#c0392b', '#fbfdff', '#2e6b3f', '#f4d03f', '#c0392b'][i] }, g);
            el('path', { d: `M${cx + 4} -39 q 3 0 3 2.5 q 0 2.5 -3 2.5`, stroke: '#8a8a8a', 'stroke-width': 1, fill: 'none' }, g);
            el('path', { class: 'vapore-tazza', d: `M${cx} -44 q -2 -4 0 -7 q 2 -3 0 -6`, stroke: '#ffffff', 'stroke-width': 1.3, fill: 'none', opacity: 0.8, style: `animation-delay:${(i * 0.4).toFixed(1)}s` }, g);
        });
    } else if (b.banco === 'addobbi') {
        [[-32, '#e74c3c'], [-20, '#f4d03f'], [-8, '#3498db'], [14, '#e84393'], [26, '#2ecc71'], [36, '#e67e22']].forEach(([cx, c]) => {
            el('circle', { cx, cy: -37, r: 4, fill: c }, g);
            el('circle', { cx: cx - 1.2, cy: -38.2, r: 1.2, fill: '#fff', opacity: 0.8 }, g);
        });
        [-36, -20, -4, 12, 28].forEach((cx, i) => {
            el('path', { d: `M${cx} -78 v${8 + (i % 2) * 6}`, stroke: '#c9a227', 'stroke-width': 0.8 }, g);
            el('circle', { cx, cy: -68 + (i % 2) * 6, r: 3.4, fill: ['#e74c3c', '#f4d03f', '#3498db', '#e84393', '#2ecc71'][i] }, g);
        });
    } else if (b.banco === 'candele') {
        [-30, -18, -6, 18, 30].forEach((cx, i) => {
            el('rect', { x: cx - 3, y: -44 + (i % 2) * 3, width: 6, height: 11 - (i % 2) * 3, fill: ['#fbf6ea', '#c0392b', '#f4d03f', '#2e7d4a', '#fbf6ea'][i] }, g);
            el('path', { class: 'fiamma', d: `M${cx} ${-50 + (i % 2) * 3} q 3 3 0 6 q -3 -3 0 -6 Z`, fill: '#ffb347' }, g);
        });
        el('circle', { cx: 0, cy: -60, r: 8, fill: 'none', stroke: '#1f5c34', 'stroke-width': 4 }, g);
        [0, 1, 2].forEach(i => el('circle', { cx: Math.cos(i * 2.1) * 8, cy: -60 + Math.sin(i * 2.1) * 8, r: 1.6, fill: '#e0262f' }, g));
    } else {
        // Padella di ferro sul fuoco e piatto di frittelle con lo zucchero
        el('path', { d: 'M-36 -33 l3 -6 h20 l3 6 Z', fill: '#2f2f33' }, g);
        el('ellipse', { cx: -23, cy: -39, rx: 11, ry: 2.5, fill: '#e0a94a' }, g);
        [-28, -21, -16].forEach(cx => el('circle', { cx, cy: -40, r: 2.4, fill: '#d4882e' }, g));
        const fumo = el('g', { class: 'fumo-mercato' }, g);
        for (let i = 0; i < 3; i++) el('circle', { cx: -23, cy: -46, r: 4.5, fill: '#e8edf6', style: `animation-delay:${(i * 0.9).toFixed(1)}s` }, fumo);
        el('ellipse', { cx: 24, cy: -34, rx: 16, ry: 3, fill: '#fbf6ea' }, g);
        [[17, -37], [24, -37], [31, -37], [20.5, -41], [27.5, -41], [24, -45]].forEach(([cx, cy]) => {
            el('circle', { cx, cy, r: 3.4, fill: '#d4882e' }, g);
            el('circle', { cx: cx - 0.8, cy: cy - 1.2, r: 1.4, fill: '#fdf6ea' }, g);
        });
    }
    // Tetto a punta innevato con l'insegna
    el('path', { d: 'M-56 -76 L0 -108 L56 -76 Z', fill: b.tetto }, g);
    el('path', { d: 'M-56 -76 L0 -108 L56 -76', stroke: scurisci(b.tetto, 0.35), 'stroke-width': 4, fill: 'none', 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M-58 -78 L0 -111 L58 -78 q -10 -2 -14 3 q -8 -9 -18 -2 q -10 -8 -26 -14 q -16 6 -26 14 q -10 -7 -18 2 q -4 -5 -14 -3 Z', fill: '#fbfdff' }, g);
    el('rect', { x: -32, y: -96, width: 64, height: 16, rx: 3, fill: '#fbf6ea', stroke: scurisci(b.tetto, 0.2), 'stroke-width': 1.5 }, g);
    el('text', { x: 0, y: -84, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: scurisci(b.tetto, 0.1) }, g).textContent = b.nome;
    // Lucine lungo il tetto
    for (let i = 0; i <= 8; i++) {
        const t = i / 8, lx = -52 + 104 * t, ly = -74 - 30 * (1 - Math.abs(2 * t - 1));
        el('circle', { class: 'lucina-mercato', cx: lx.toFixed(1), cy: ly.toFixed(1), r: 2.4, fill: COLORI_FESTA[i % COLORI_FESTA.length], style: `animation-delay:${((i % 3) * 0.4).toFixed(1)}s` }, g);
    }
    return g;
}

function disegnaMercatino(mondo, x, y, scala) {
    const m = el('g', { class: 'mercatino', transform: `translate(${x} ${y}) scale(${scala})` }, mondo);
    // Tre bancarelle sfalsate: quella in mezzo un po' più indietro.
    // Si possono cliccare: si entra a vedere la nonna che cucina
    [[1, 0, -18, 0.94], [0, -96, 0, 1], [2, 96, 0, 1]].forEach(([i, dx, dy, k]) => {
        const b = BANCARELLE[i];
        const g = disegnaBancarella(m, 0, b);
        g.setAttribute('transform', `translate(${dx} ${dy}) scale(${k})`);
        g.classList.add('bancarella');
        Object.assign(g.dataset, { tipo: b.banco, cx: x + dx * scala, cy: y + (dy - 50) * scala, larghezza: 140 * scala });
        g.setAttribute('tabindex', 0);
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `Bancarella delle ${b.nome.toLowerCase()}: entra a vedere la nonna che cucina`);
    });
    return m;
}

// ---- La neve che cresce giorno dopo giorno ----
// Cumuli e mucchi di neve in più: diventano sempre più visibili man mano che si va verso Natale
// Una nebbiolina leggera tra le case di dietro e quelle davanti: dà profondità al paese
function disegnaNebbia(mondo, y) {
    for (let x = -200; x < MONDO + 200; x += 700) {
        const g = el('g', { class: 'nebbia', 'pointer-events': 'none' }, mondo);
        el('ellipse', { cx: x + 350, cy: y, rx: 520, ry: 26, fill: 'url(#banco-nebbia)' }, g);
        el('ellipse', { cx: x + 120, cy: y - 14, rx: 300, ry: 16, fill: 'url(#banco-nebbia)', opacity: 0.7 }, g);
    }
}

// Brillantini sulla neve che luccicano qua e là, divisi in gruppi lungo il paese
function disegnaBrillantini(mondo) {
    let seme2 = 3;
    const caso2 = () => (seme2 = (seme2 * 16807) % 2147483647) / 2147483647;
    for (let tratto = 0; tratto < MONDO; tratto += 400) {
        const gruppo = el('g', { class: 'brillantini', 'pointer-events': 'none' }, mondo);
        for (let i = 0; i < 12; i++) {
            const x = tratto + caso2() * 400, y = 600 + caso2() * 290;
            el('path', { d: `M${x.toFixed(1)} ${(y - 3).toFixed(1)} L${(x + 0.8).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + 3).toFixed(1)} L${(x - 0.8).toFixed(1)} ${y.toFixed(1)} Z M${(x - 3).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y - 0.8).toFixed(1)} L${(x + 3).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + 0.8).toFixed(1)} Z`, fill: '#ffffff', style: `animation-delay:-${(caso2() * 4).toFixed(2)}s` }, gruppo);
        }
    }
}

function disegnaNeveCheCresce(mondo) {
    const neve = el('g', { class: 'neve-extra', 'pointer-events': 'none' }, mondo);
    [[220, 790], [470, 812], [700, 668], [1150, 800], [1390, 770], [2230, 812], [2460, 768], [2700, 800], [3060, 780], [3500, 800], [1320, 655], [2520, 650], [3240, 640]]
        .forEach(([x0, y], i) => {
            const x = sposta(x0);
            const k = 0.8 + (i % 3) * 0.25;
            el('path', { d: `M${x - 50 * k} ${y} q ${14 * k} -${16 * k} ${34 * k} -${9 * k} q ${18 * k} -${14 * k} ${38 * k} -${3 * k} q ${18 * k} -${8 * k} ${28 * k} ${12 * k} Z`, fill: '#fbfdff' }, neve);
        });
    return neve;
}

// ========== IL LUNA PARK D'INVERNO ==========
// In fondo al villaggio: la giostrina con i cavalli e il palazzetto del ghiaccio

// ---- Musiche: un piccolo lettore con carillon e organo ----
// Melodie tradizionali: nota e durata in battiti
const DECK_THE_HALLS = (() => {
    const a = [['G5', 1.5], ['F5', 0.5], ['E5', 1], ['D5', 1], ['C5', 1], ['D5', 1], ['E5', 1], ['C5', 1],
        ['D5', 0.5], ['E5', 0.5], ['F5', 0.5], ['D5', 0.5], ['E5', 1.5], ['D5', 0.5], ['C5', 1], ['B4', 1], ['C5', 2]];
    const b = [['D5', 1.5], ['E5', 0.5], ['F5', 1], ['D5', 1], ['E5', 1.5], ['F5', 0.5], ['G5', 1], ['D5', 1],
        ['E5', 0.5], ['F#5', 0.5], ['G5', 1], ['A5', 0.5], ['B5', 0.5], ['C6', 1], ['B5', 1], ['A5', 1], ['G5', 2]];
    return [...a, ...a, ...b, ...a];
})();
const BASSI_DECK = ['C3', 'C3', 'G2', 'C3', 'C3', 'C3', 'G2', 'C3', 'G2', 'C3', 'D3', 'G2', 'C3', 'C3', 'G2', 'C3'];

const JINGLE_BELLS_VALZER = (() => {
    const strofa = [['E5', 1], ['E5', 1], ['E5', 2], ['E5', 1], ['E5', 1], ['E5', 2], ['E5', 1], ['G5', 1], ['C5', 1.5], ['D5', 0.5], ['E5', 4]];
    return [...strofa,
        ['F5', 1], ['F5', 1], ['F5', 1.5], ['F5', 0.5], ['F5', 1], ['E5', 1], ['E5', 1], ['E5', 0.5], ['E5', 0.5], ['E5', 1], ['D5', 1], ['D5', 1], ['E5', 1], ['D5', 2], ['G5', 2],
        ...strofa,
        ['F5', 1], ['F5', 1], ['F5', 1], ['F5', 1], ['F5', 1], ['E5', 1], ['E5', 1], ['E5', 0.5], ['E5', 0.5], ['G5', 1], ['G5', 1], ['F5', 1], ['D5', 1], ['C5', 4]];
})();
const BASSI_JINGLE = ['C3', 'C3', 'C3', 'C3', 'F2', 'C3', 'D3', 'G2', 'C3', 'C3', 'C3', 'C3', 'F2', 'C3', 'G2', 'C3'];

// Suona una melodia con l'accompagnamento (una nota bassa per battuta da 4, "um-pa").
// strumento: 'carillon' (campanelline) o 'organo' (come nelle piste di pattinaggio). ripeti: ricomincia da capo
function suonaBrano({ melodia, bassi, battito, strumento, ripeti = false }, alla_fine = () => {}) {
    const Contesto = window.AudioContext || window.webkitAudioContext;
    if (!Contesto) return () => alla_fine();
    const contesto = new Contesto();
    const uscita = contesto.createGain();
    uscita.gain.value = 0.85;
    uscita.connect(contesto.destination);

    const nota = (n, t, durata, volume) => {
        const g = contesto.createGain();
        g.connect(uscita);
        const parziali = strumento === 'carillon' ? [[1, 1], [3, 0.22], [5.4, 0.07]] : [[1, 1], [2, 0.45], [3, 0.2], [4, 0.18]];
        if (strumento === 'carillon') {
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(volume, t + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.8, durata * 1.8));
        } else {
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(volume, t + 0.03);
            g.gain.setValueAtTime(volume * 0.9, t + durata * 0.85);
            g.gain.exponentialRampToValueAtTime(0.0001, t + durata + 0.08);
        }
        const fine = t + Math.max(0.9, durata * 1.9);
        parziali.forEach(([multiplo, peso]) => {
            const o = contesto.createOscillator();
            const p = contesto.createGain();
            o.type = 'sine';
            o.frequency.value = frequenza(n) * multiplo;
            p.gain.value = peso;
            o.connect(p).connect(g);
            o.start(t);
            o.stop(fine);
        });
    };
    const basso = (n, t, durata) => {
        const o = contesto.createOscillator();
        const g = contesto.createGain();
        o.type = 'triangle';
        o.frequency.value = frequenza(n);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
        o.connect(g).connect(uscita);
        o.start(t);
        o.stop(t + durata + 0.05);
    };

    let finito = false, timer = null;
    const giro = partenza => {
        let t = partenza;
        for (const [n, battiti] of melodia) {
            nota(n, t, battiti * battito, strumento === 'carillon' ? 0.2 : 0.09);
            t += battiti * battito;
        }
        // "Um" sulla prima battuta, "pa" sulla terza (un'ottava sopra)
        bassi.forEach((n, i) => {
            const tb = partenza + i * 4 * battito;
            basso(n, tb, battito * 1.2);
            basso(n.replace(/\d/, d => String(Number(d) + 1)), tb + 2 * battito, battito * 0.9);
        });
        timer = setTimeout(() => {
            if (finito) return;
            if (ripeti) giro(contesto.currentTime + 0.25);
            else ferma();
        }, (t - contesto.currentTime + 0.4) * 1000);
    };
    const ferma = () => {
        if (finito) return;
        finito = true;
        clearTimeout(timer);
        uscita.gain.setTargetAtTime(0.0001, contesto.currentTime, 0.12);
        setTimeout(() => contesto.close(), 600);
        alla_fine();
    };
    giro(contesto.currentTime + 0.1);
    return ferma;
}

// ---- La giostrina ----
const CAVALLI = [
    { corpo: '#fbf6ea', sella: '#c0392b', criniera: '#f4d03f' },
    { corpo: '#f2e1c8', sella: '#2d4f8a', criniera: '#8a5a2b' },
    { corpo: '#fbf6ea', sella: '#2e7d4a', criniera: '#e84393' },
    { corpo: '#d9c3a5', sella: '#f4d03f', criniera: '#5a3b2a' },
    { corpo: '#fbf6ea', sella: '#7d4e9e', criniera: '#6fd3ff' },
    { corpo: '#efe0cf', sella: '#e67e22', criniera: '#c0392b' }
];

// Un cavallino da giostra di profilo, che guarda a sinistra, con il palo dorato che lo attraversa
function disegnaCavallo(c) {
    const g = el('g', {});
    el('path', { d: 'M10 -2 q 12 2 14 14 q -8 -6 -14 -6 Z', fill: c.criniera }, g);
    el('path', { d: 'M8 4 l 10 12 l 4 -2 l -8 -12 Z M-8 4 l -4 14 l 4 1 l 4 -14 Z', fill: scurisci(c.corpo, 0.08) }, g);
    el('path', { d: 'M-12 2 l -12 -4 l -1 4 l 12 5 Z M4 6 l -2 12 l 4 0 l 2 -12 Z', fill: c.corpo }, g);
    el('ellipse', { cx: 0, cy: 0, rx: 17, ry: 9, fill: c.corpo, stroke: scurisci(c.corpo, 0.2), 'stroke-width': 0.8 }, g);
    el('path', { d: 'M-11 -4 Q-16 -16 -20 -22 L-14 -26 Q-6 -14 -4 -6 Z', fill: c.corpo }, g);
    el('path', { d: 'M-21 -22 q -8 2 -9 7 q 2 3 6 2 q 2 -3 7 -2 Z', fill: c.corpo, stroke: scurisci(c.corpo, 0.2), 'stroke-width': 0.6 }, g);
    el('path', { d: 'M-13 -27 q 6 6 7 18 q -4 -6 -10 -14 Z', fill: c.criniera }, g);
    el('circle', { cx: -22, cy: -20, r: 1.2, fill: '#2a1d14' }, g);
    el('path', { d: 'M-17 -26 l 1 -5 l 3 4', fill: c.corpo }, g);
    el('path', { d: 'M-6 -8 h 14 q 2 6 -2 8 h -12 q -3 -3 0 -8 Z', fill: c.sella }, g);
    el('path', { d: 'M-4 -8 h 10', stroke: '#e8c766', 'stroke-width': 1.4 }, g);
    el('path', { d: 'M-26 -18 L-6 -6', stroke: '#e8c766', 'stroke-width': 1 }, g);
    return g;
}

function disegnaGiostra(mondo, x, y, scala) {
    const giostra = el('g', {
        class: 'giostra', transform: `translate(${x} ${y}) scale(${scala})`, tabindex: 0, role: 'button',
        'aria-label': 'La giostrina: tocca per farla girare con la musica'
    }, mondo);
    el('circle', { class: 'luce-calda', cx: 0, cy: -110, r: 170, fill: 'url(#alone)', opacity: 0.45 }, giostra);
    el('ellipse', { cx: 0, cy: 6, rx: 132, ry: 20, fill: 'rgba(60,90,140,0.3)' }, giostra);
    // La pedana rotonda con il bordo dorato
    el('path', { d: 'M-120 -8 A120 22 0 0 0 120 -8 L120 4 A120 22 0 0 1 -120 4 Z', fill: '#7a4b2e' }, giostra);
    el('ellipse', { cx: 0, cy: -8, rx: 120, ry: 22, fill: '#a0663a' }, giostra);
    el('ellipse', { cx: 0, cy: -8, rx: 120, ry: 22, fill: 'none', stroke: '#e8c766', 'stroke-width': 3 }, giostra);
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI;
        el('circle', { class: 'lucina-giostra', cx: (Math.cos(a) * 120).toFixed(1), cy: (-1 + Math.sin(a) * 22).toFixed(1), r: 2.6, fill: COLORI_FESTA[i % COLORI_FESTA.length], style: `animation-delay:${(i % 3) * 0.3}s` }, giostra);
    }
    const dietro = el('g', {}, giostra);
    // La colonna centrale con gli specchi
    el('rect', { x: -18, y: -168, width: 36, height: 160, fill: '#c9a227' }, giostra);
    for (let k = 0; k < 5; k++) el('rect', { x: -12, y: -158 + k * 30, width: 24, height: 22, rx: 3, fill: '#dfeefc', stroke: '#8a6a2a', 'stroke-width': 1.5 }, giostra);
    const davanti = el('g', {}, giostra);
    // Il tetto a strisce rosse e bianche, con la balza e le lucine
    const punto = a => [Math.cos(a) * 128, -168 + Math.sin(a) * 24];
    for (let i = 0; i < 12; i++) {
        const [x1, y1] = punto((i / 12) * Math.PI), [x2, y2] = punto(((i + 1) / 12) * Math.PI);
        el('path', { d: `M0 -238 L${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} Z`, fill: i % 2 ? '#fbf6ea' : '#c0392b' }, giostra);
    }
    el('path', { d: 'M-128 -168 L0 -238 L128 -168', stroke: '#e8c766', 'stroke-width': 3, fill: 'none' }, giostra);
    for (let i = 0; i < 12; i++) {
        const [x1, y1] = punto((i / 12) * Math.PI), [x2, y2] = punto(((i + 1) / 12) * Math.PI);
        el('path', { d: `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${((x1 + x2) / 2).toFixed(1)} ${((y1 + y2) / 2 + 16).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} Z`, fill: i % 2 ? '#c0392b' : '#2e6b4a', stroke: '#e8c766', 'stroke-width': 1.2 }, giostra);
        el('circle', { class: 'lucina-giostra', cx: x1.toFixed(1), cy: (y1 + 1).toFixed(1), r: 3, fill: '#fff3b0', style: `animation-delay:${(i % 2) * 0.5}s` }, giostra);
    }
    // In cima: la palla dorata e la bandierina
    el('path', { d: 'M0 -238 V-268', stroke: '#8a6a2a', 'stroke-width': 2.5 }, giostra);
    el('circle', { cx: 0, cy: -240, r: 7, fill: '#e8c766' }, giostra);
    el('path', { class: 'bandierina', d: 'M0 -268 l 22 6 l -22 6 Z', fill: '#c0392b' }, giostra);
    // La neve sul tetto
    el('path', { d: 'M-40 -216 Q-10 -232 0 -238 Q 14 -232 44 -214 Q 20 -220 4 -218 Q -16 -222 -40 -216 Z', fill: '#fbfdff' }, giostra);
    el('text', { x: 0, y: -186, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#8a1d22' }, giostra).textContent = 'GIOSTRA';

    // I cavalli girano attorno alla colonna, salendo e scendendo sui loro pali
    const cavalli = CAVALLI.map((c, i) => {
        const posto = el('g', {});
        const palo = el('path', { stroke: '#e8c766', 'stroke-width': 3 }, posto);
        const figura = disegnaCavallo(c);
        posto.append(figura);
        return { posto, palo, figura, fase: (i / CAVALLI.length) * Math.PI * 2 };
    });
    let tempo = 0, ultimo = 0;
    anima(giostra, t => {
        tempo += (t - ultimo) * (giostra.classList.contains('suona') ? 2.6 : 1);
        ultimo = t;
        for (const [i, c] of cavalli.entries()) {
            const a = c.fase + tempo * 0.45;
            const cx = Math.cos(a) * 92, profondita = Math.sin(a) * 15;
            const su = Math.sin(tempo * 2.2 + i * 1.3) * 10;
            const vicino = Math.sin(a) > 0;
            // Davanti vanno verso sinistra, dietro tornano verso destra
            const verso = vicino ? 1 : -1;
            const k = 1 + profondita / 120;
            c.palo.setAttribute('d', `M${cx.toFixed(1)} ${(-168 + profondita).toFixed(1)} V${(-8 + profondita).toFixed(1)}`);
            c.figura.setAttribute('transform', `translate(${cx.toFixed(1)} ${(-70 + profondita + su).toFixed(1)}) scale(${(verso * k * 1.5).toFixed(3)} ${(k * 1.5).toFixed(3)})`);
            const gruppo = vicino ? davanti : dietro;
            if (c.posto.parentNode !== gruppo) gruppo.append(c.posto);
        }
    });
    return giostra;
}

// ---- Il palazzetto del ghiaccio, visto da fuori ----
function disegnaPalaghiaccio(mondo, x, y, scala) {
    const p = el('g', {
        class: 'palaghiaccio', transform: `translate(${x} ${y}) scale(${scala})`, tabindex: 0, role: 'button',
        'aria-label': 'Il palazzetto del ghiaccio: entra a pattinare con la musica'
    }, mondo);
    el('ellipse', { class: 'alone', cx: 0, cy: -90, rx: 260, ry: 150, fill: 'url(#alone)', opacity: 0.6 }, p);
    el('ellipse', { cx: 0, cy: 4, rx: 200, ry: 16, fill: 'rgba(60,90,140,0.3)' }, p);
    // Muri e tetto ad arco, con le nervature
    el('rect', { x: -180, y: -120, width: 360, height: 120, fill: '#2d4f8a' }, p);
    el('rect', { x: -180, y: -120, width: 360, height: 120, fill: 'url(#ombra-muro)' }, p);
    el('path', { d: 'M-190 -118 Q0 -250 190 -118 Z', fill: '#a9bddf' }, p);
    for (let i = -3; i <= 3; i++) el('path', { d: `M${i * 50} -118 Q${i * 42} ${-180 - (3 - Math.abs(i)) * 14} ${i * 30} ${-150 - (3 - Math.abs(i)) * 18}`, stroke: '#8ea4cc', 'stroke-width': 3, fill: 'none' }, p);
    el('path', { d: 'M-150 -146 Q0 -260 150 -146 Q 80 -196 0 -200 Q -80 -196 -150 -146 Z', fill: '#fbfdff' }, p);
    el('path', { d: 'M-194 -116 Q0 -252 194 -116', stroke: '#fbfdff', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, p);
    for (let i = 0; i <= 14; i++) {
        const t = i / 14, lx = -186 + 372 * t, ly = -118 - 4 * 132 * t * (1 - t);
        el('circle', { class: 'lucina-mercato', cx: lx.toFixed(1), cy: (ly + 4).toFixed(1), r: 3.2, fill: COLORI_FESTA[i % COLORI_FESTA.length], style: `animation-delay:${((i % 3) * 0.4).toFixed(1)}s` }, p);
    }
    // Bandierine sul tetto
    [-80, 0, 80].forEach((bx, i) => {
        const by = -118 - 4 * 132 * ((bx + 186) / 372) * (1 - (bx + 186) / 372);
        el('path', { d: `M${bx} ${by} V${by - 34}`, stroke: '#5d3a22', 'stroke-width': 2.5 }, p);
        el('path', { class: 'bandierina', d: `M${bx} ${by - 34} l 22 6 l -22 6 Z`, fill: ['#c0392b', '#f4d03f', '#2e7d4a'][i] }, p);
    });
    // L'insegna
    el('rect', { x: -112, y: -146, width: 224, height: 34, rx: 6, fill: '#c0392b', stroke: '#e8c766', 'stroke-width': 3 }, p);
    el('text', { x: 0, y: -122, 'text-anchor': 'middle', 'font-size': 21, 'font-weight': 'bold', 'letter-spacing': 2, 'font-family': 'Georgia, serif', fill: '#fffaf0' }, p).textContent = 'PALAGHIACCIO';
    // Le vetrate illuminate, con le sagome dei pattinatori che scivolano dentro
    [-150, -95, 55, 110].forEach(vx => {
        el('rect', { x: vx, y: -100, width: 40, height: 62, rx: 4, fill: '#bfe8ff' }, p);
        el('rect', { x: vx, y: -100, width: 40, height: 62, rx: 4, fill: 'url(#alone)', opacity: 0.5 }, p);
        el('path', { d: `M${vx + 20} -100 V-38 M${vx} -70 h40`, stroke: '#e8eef8', 'stroke-width': 3 }, p);
    });
    const sagome = el('g', { class: 'sagome-pattinatori' }, p);
    [[-140, 0], [-80, 1.5], [70, 0.8], [118, 2.2]].forEach(([sx, ritardo]) => {
        el('path', { d: `M${sx} -44 l 4 -12 l -3 -8 a 3 3 0 1 1 5 0 l 4 8 l 6 6 l -6 -2 l -2 8 Z`, fill: '#2d4f8a', opacity: 0.6, style: `animation-delay:${ritardo}s` }, sagome);
    });
    // L'ingresso con la pensilina e il fiocco di neve
    el('rect', { x: -36, y: -78, width: 72, height: 78, rx: 6, fill: '#e8eef8' }, p);
    el('rect', { x: -30, y: -72, width: 60, height: 72, fill: '#ffe9a8' }, p);
    el('path', { d: 'M0 -72 V0', stroke: '#c9a227', 'stroke-width': 2 }, p);
    el('path', { d: 'M-46 -80 h92 l -8 -14 h-76 Z', fill: '#c0392b' }, p);
    el('path', { d: 'M-46 -80 h92', stroke: '#fbfdff', 'stroke-width': 4 }, p);
    const fiocco = el('g', { transform: 'translate(0 -48)', stroke: '#2d4f8a', 'stroke-width': 2, 'stroke-linecap': 'round' }, p);
    for (let i = 0; i < 6; i++) el('path', { d: 'M0 0 V-12 M0 -8 l -3 -3 M0 -8 l 3 -3', transform: `rotate(${i * 60})` }, fiocco);
    el('path', { d: 'M-200 2 q 20 -14 40 -6 q 20 -10 40 2 Z M120 2 q 20 -12 40 -4 q 20 -8 40 2 Z', fill: '#fbfdff' }, p);
    return p;
}

// ---- Dentro il palazzetto: la pista coperta con tanti pattinatori e la musica ----
const PATTINATORI_PISTA = [
    ...PATTINATORI,
    { giacca: '#e84393', pantaloni: '#2c2c3a', cappello: '#fbfdff', sciarpa: '#6fd3ff', pelle: '#e3b393', velocita: 0.29, fase: 1.2 },
    { giacca: '#f4d03f', pantaloni: '#34495e', cappello: '#2e86de', sciarpa: '#c0392b', pelle: '#f5dccb', velocita: 0.35, fase: 5.0, piccolo: true },
    { giacca: '#16a085', pantaloni: '#4a3426', cappello: '#e67e22', sciarpa: '#fbfdff', pelle: '#c48a66', velocita: 0.26, fase: 0.6 },
    { giacca: '#8e2433', pantaloni: '#2c3e66', cappello: '#f4d03f', sciarpa: '#2e7d5b', pelle: '#f2d2bd', velocita: 0.31, fase: 3.8 }
];

function creaPalaghiaccio({ onEsci }) {
    const nodo = Object.assign(document.createElement('div'), { className: 'interno pista', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'Dentro il palazzetto del ghiaccio: la pista con i pattinatori' });
    const esci = Object.assign(document.createElement('button'), { type: 'button', className: 'esci', textContent: '← Torna al villaggio' });
    const musica = Object.assign(document.createElement('button'), { type: 'button', className: 'musica-pista', textContent: '🔇 Spegni la musica' });
    nodo.append(svg, esci, musica);
    esci.addEventListener('click', onEsci);
    nodo.addEventListener('keydown', evento => { if (evento.key === 'Escape') onEsci(); });

    const defs = el('defs', {}, svg);
    const ghiaccio = el('radialGradient', { id: 'ghiaccio-pista', cx: '50%', cy: '40%', r: '65%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#f4fbff' }, ghiaccio);
    el('stop', { offset: '70%', 'stop-color': '#d3e9f8' }, ghiaccio);
    el('stop', { offset: '100%', 'stop-color': '#a9cbe6' }, ghiaccio);
    const faro = el('linearGradient', { id: 'faro-pista', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff6c8', 'stop-opacity': 0.55 }, faro);
    el('stop', { offset: '100%', 'stop-color': '#fff6c8', 'stop-opacity': 0 }, faro);

    // Soffitto con le travi, spalti pieni di gente, festoni
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: '#141c40' }, svg);
    for (let i = -6; i <= 6; i++) el('path', { d: `M${800 + i * 140} -40 L${800 + i * 200} 250`, stroke: '#26346a', 'stroke-width': 8 }, svg);
    el('path', { d: 'M-600 120 H2200 M-600 40 H2200', stroke: '#26346a', 'stroke-width': 6 }, svg);
    for (let fila = 0; fila < 5; fila++) {
        const y = 240 + fila * 38;
        el('rect', { x: -1400, y, width: 4400, height: 38, fill: fila % 2 ? '#2a3a7a' : '#324690' }, svg);
        for (let x = -200 + (fila % 2) * 18; x < 1800; x += 36) {
            el('circle', { cx: x, cy: y + 12, r: 9, fill: ['#f2d2bd', '#e3b393', '#c48a66', '#f5dccb', '#9c6a4b'][(x / 36 + fila) & 3] }, svg);
            el('path', { d: `M${x - 11} ${y + 38} q 11 -20 22 0 Z`, fill: COLORI_FESTA[((x / 36) + fila * 2) % 5 | 0] }, svg);
        }
    }
    // Festone di bandierine sopra la pista
    el('path', { d: 'M-200 210 Q400 290 800 230 Q1200 290 1800 210', stroke: '#e8c766', 'stroke-width': 2, fill: 'none' }, svg);
    for (let i = 0; i < 28; i++) {
        const t = i / 27, bx = -200 + 2000 * t;
        const by = t < 0.5 ? 210 + 80 * Math.sin(t * 2 * Math.PI) * 0.5 : 230 + 60 * Math.sin((t - 0.5) * 2 * Math.PI) * 0.5;
        el('path', { d: `M${bx - 14} ${by} l 14 26 l 14 -26 Z`, fill: COLORI_FESTA[i % 5] }, svg);
    }
    // I fari che si muovono sulla pista
    [[300, 0], [800, 1.3], [1300, 2.6]].forEach(([fx, ritardo]) => {
        const f = el('g', { class: 'faro-pista', style: `animation-delay:-${ritardo}s`, 'data-x': fx }, svg);
        el('path', { d: `M${fx - 16} 0 L${fx - 190} 820 L${fx + 190} 820 L${fx + 16} 0 Z`, fill: 'url(#faro-pista)' }, f);
        el('rect', { x: fx - 22, y: -10, width: 44, height: 22, rx: 6, fill: '#3a3a44' }, svg);
    });
    // La balaustra in fondo, con le stelline disegnate
    el('rect', { x: -1400, y: 430, width: 4400, height: 46, fill: '#f4f7fd' }, svg);
    el('rect', { x: -1400, y: 452, width: 4400, height: 6, fill: '#c0392b' }, svg);
    for (let x = -200; x < 1800; x += 160) el('path', { d: stellaPiccola(x, 444, 9), fill: '#2d4f8a', opacity: 0.6 }, svg);
    // Il ghiaccio
    el('rect', { x: -1400, y: 476, width: 4400, height: 1200, fill: 'url(#ghiaccio-pista)' }, svg);
    [[800, 660, 560, 150], [800, 660, 420, 110], [800, 660, 680, 190]].forEach(([cx, cy, rx, ry]) => {
        el('ellipse', { cx, cy, rx, ry, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, opacity: 0.6, 'stroke-dasharray': '60 30 120 40' }, svg);
    });
    el('ellipse', { cx: 800, cy: 660, rx: 70, ry: 20, fill: 'none', stroke: '#c0392b', 'stroke-width': 3, opacity: 0.4 }, svg);
    el('path', { d: 'M800 476 V900', stroke: '#c0392b', 'stroke-width': 4, opacity: 0.25 }, svg);

    // I pattinatori, più grandi quando sono più vicini
    const pista = el('g', {}, svg);
    const figure = PATTINATORI_PISTA.map(c => ({ ...c, nodo: disegnaPattinatore(c) }));
    figure.forEach(f => pista.append(f.nodo));
    const disponi = t => {
        for (const [i, f] of figure.entries()) {
            const a = f.fase + t * f.velocita * 1.3;
            const raggio = f.piccolo ? 0.82 : 1;
            const x = 800 + Math.cos(a) * 560 * raggio, y = 650 + Math.sin(a) * 150 * raggio;
            const verso = Math.sin(a) > 0 ? 1 : -1;
            const k = (2.2 + (y - 500) / 260 * 1.6) * (f.piccolo ? 0.8 : 1);
            giraFigura(f.nodo, x + Math.sin(t * 3 + i) * 3 * verso, y, k, verso);
        }
        [...pista.children]
            .sort((p1, p2) => p1.transform.baseVal.consolidate().matrix.f - p2.transform.baseVal.consolidate().matrix.f)
            .forEach(n => pista.append(n));
    };
    disponi(0);
    // La balaustra davanti
    el('path', { d: 'M-1400 862 H3000 V1500 H-1400 Z', fill: '#f4f7fd' }, svg);
    el('rect', { x: -1400, y: 876, width: 4400, height: 6, fill: '#c0392b' }, svg);
    const scritta = el('g', {}, svg);
    el('rect', { x: 540, y: 60, width: 520, height: 70, rx: 14, fill: '#c0392b', stroke: '#e8c766', 'stroke-width': 4 }, scritta);
    el('text', { x: 800, y: 108, 'text-anchor': 'middle', 'font-size': 38, 'font-weight': 'bold', 'letter-spacing': 3, 'font-family': 'Georgia, serif', fill: '#fffaf0' }, scritta).textContent = '⛸ PALAGHIACCIO ⛸';

    // Animazione e musica solo mentre si è dentro
    let ferma = null, giro = null, inizio = 0;
    const ballo = adesso => {
        disponi((adesso - inizio) / 1000);
        giro = requestAnimationFrame(ballo);
    };
    const accendi = () => {
        ferma?.();
        ferma = suonaBrano({ melodia: JINGLE_BELLS_VALZER, bassi: BASSI_JINGLE, battito: 0.32, strumento: 'organo', ripeti: true });
        musica.textContent = '🔇 Spegni la musica';
    };
    const spegni = () => {
        ferma?.();
        ferma = null;
        musica.textContent = '🎵 Accendi la musica';
    };
    musica.addEventListener('click', () => (ferma ? spegni() : accendi()));
    // Il tour del palazzetto con Brina, l'elfa istruttrice
    const tour = creaTourGhiaccio(nodo);
    const bottoneTour = Object.assign(document.createElement('button'), { type: 'button', className: 'musica-pista bottone-tour-ghiaccio', textContent: '⛸ Fai il tour con l\'elfa' });
    nodo.append(bottoneTour);
    bottoneTour.addEventListener('click', () => tour.apri());

    return {
        nodo,
        mostra() {
            nodo.hidden = false;
            accendi();
            if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
                inizio = performance.now();
                giro = requestAnimationFrame(ballo);
            }
            requestAnimationFrame(() => {
                nodo.classList.add('visibile');
                esci.focus({ preventScroll: true });
            });
        },
        nascondi() {
            spegni();
            tour.chiudi();
            cancelAnimationFrame(giro);
            nodo.classList.remove('visibile');
            nodo.hidden = true;
        }
    };
}

function stellaPiccola(cx, cy, r) {
    return 'M' + Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
        return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
    }).join(' L') + ' Z';
}

// L'insegna ad arco all'ingresso del luna park
function disegnaInsegnaLuna(mondo, x, y, scala) {
    const g = el('g', { transform: `translate(${x} ${y}) scale(${scala})`, 'pointer-events': 'none' }, mondo);
    [-110, 110].forEach(px => {
        el('rect', { x: px - 6, y: -170, width: 12, height: 170, fill: '#fbf6ea' }, g);
        for (let k = 0; k < 7; k++) el('path', { d: `M${px - 6} ${-160 + k * 24} l12 -10 v8 l-12 10 Z`, fill: '#c0392b' }, g);
        el('circle', { cx: px, cy: -176, r: 8, fill: '#e8c766' }, g);
    });
    el('path', { d: 'M-122 -150 Q0 -230 122 -150 L118 -122 Q0 -196 -118 -122 Z', fill: '#2d4f8a', stroke: '#e8c766', 'stroke-width': 3 }, g);
    const arco = el('path', { id: 'arco-luna', d: 'M-104 -142 Q0 -206 104 -142', fill: 'none' }, g);
    const testo = el('text', { 'font-size': 13, 'font-weight': 'bold', 'letter-spacing': 0.6, 'font-family': 'Georgia, serif', fill: '#ffe9a8' }, g);
    el('textPath', { href: '#arco-luna', startOffset: '50%', 'text-anchor': 'middle' }, testo).textContent = "LUNA PARK D'INVERNO";
    for (let i = 0; i <= 12; i++) {
        const t = i / 12, lx = -122 + 244 * t, ly = -150 - 4 * 40 * t * (1 - t);
        el('circle', { class: 'lucina-mercato', cx: lx.toFixed(1), cy: (ly - 4).toFixed(1), r: 3.4, fill: COLORI_FESTA[i % 5], style: `animation-delay:${((i % 3) * 0.4).toFixed(1)}s` }, g);
    }
    arco.setAttribute('stroke', 'none');
    return g;
}

// ========== IL QUARTIERE DI BABBO NATALE ==========
// Subito dopo la stazione: l'ufficio postale (con la letterina), il laboratorio degli elfi e la stalla delle renne

// Un elfo in piedi, visto di fronte: giacchetta, cappello a punta col sonaglio, orecchie a punta.
// Restituisce il braccio destro, che le animazioni fanno lavorare
function disegnaElfo(genitore, x, y, k, { giacca = '#2e7d5b', cappello = '#c0392b', pelle = '#f6c9a8', capelli = '#c9984a' } = {}) {
    const g = el('g', { transform: `translate(${x} ${y}) scale(${k})` }, genitore);
    el('ellipse', { cx: 0, cy: 2, rx: 22, ry: 5, fill: 'rgba(0,0,0,0.25)' }, g);
    el('path', { d: 'M-12 -30 v26 h-8 q -6 0 -4 4 h14 Z M12 -30 v26 h8 q 6 0 4 4 h-14 Z', fill: '#7a3c12' }, g);
    el('path', { d: 'M-10 -34 h8 v28 h-8 Z M2 -34 h8 v28 h-8 Z', fill: '#fbfdff' }, g);
    el('path', { d: 'M-10 -26 h8 M-10 -18 h8 M2 -26 h8 M2 -18 h8', stroke: '#d63031', 'stroke-width': 3 }, g);
    el('path', { d: 'M-20 -32 q -4 -30 6 -44 h28 q 10 14 6 44 Z', fill: giacca }, g);
    el('path', { d: 'M-20 -34 l5 6 5 -6 5 6 5 -6 5 6 5 -6 5 6 5 -6', stroke: '#d63031', 'stroke-width': 3, fill: 'none' }, g);
    el('rect', { x: -19, y: -48, width: 38, height: 6, fill: '#3a2a22' }, g);
    el('rect', { x: -4, y: -49, width: 8, height: 8, fill: 'none', stroke: '#e2b93b', 'stroke-width': 2 }, g);
    el('path', { d: 'M-16 -74 q -10 14 -8 30', stroke: giacca, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('circle', { cx: -24, cy: -42, r: 5, fill: pelle }, g);
    const braccio = el('g', { class: 'braccio-elfo' }, g);
    el('path', { d: 'M16 -74 q 12 8 14 24', stroke: giacca, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round' }, braccio);
    el('circle', { cx: 30, cy: -48, r: 5, fill: pelle }, braccio);
    el('path', { d: 'M-16 -78 q 16 10 32 0 l -4 -6 h-24 Z', fill: '#d63031' }, g);
    el('circle', { cx: 0, cy: -96, r: 17, fill: pelle }, g);
    el('path', { d: 'M-16 -98 l -14 -10 8 16 Z M16 -98 l 14 -10 -8 16 Z', fill: pelle }, g);
    el('path', { d: 'M-15 -104 q 15 -10 30 0 q -4 -6 -15 -6 q -11 0 -15 6 Z', fill: capelli }, g);
    el('circle', { cx: -6, cy: -97, r: 2.2, fill: '#3b2412' }, g);
    el('circle', { cx: 6, cy: -97, r: 2.2, fill: '#3b2412' }, g);
    el('circle', { cx: -10, cy: -90, r: 3, fill: '#f4a0a0', opacity: 0.6 }, g);
    el('circle', { cx: 10, cy: -90, r: 3, fill: '#f4a0a0', opacity: 0.6 }, g);
    el('path', { d: 'M-5 -88 q 5 5 10 0', stroke: '#7a3c12', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M-18 -106 L8 -150 L18 -106 Z', fill: cappello }, g);
    el('rect', { x: -19, y: -110, width: 38, height: 7, rx: 3.5, fill: '#fbfdff' }, g);
    el('circle', { cx: 8, cy: -152, r: 5, fill: '#e2b93b' }, g);
    return { g, braccio };
}

// ---------- L'ufficio postale di Babbo Natale ----------
function disegnaPosta(mondo, x, y, scala) {
    const p = el('g', {
        class: 'posta', transform: `translate(${x} ${y}) scale(${scala})`, tabindex: 0, role: 'button',
        'aria-label': "L'ufficio postale di Babbo Natale: entra a scrivere la letterina"
    }, mondo);
    el('ellipse', { class: 'alone', cx: 0, cy: -70, rx: 190, ry: 130, fill: 'url(#alone)', opacity: 0.55 }, p);
    el('ellipse', { cx: 0, cy: 4, rx: 140, ry: 13, fill: 'rgba(60,90,140,0.3)' }, p);
    el('rect', { x: -110, y: -118, width: 220, height: 118, fill: '#a3242c' }, p);
    el('rect', { x: -110, y: -118, width: 220, height: 118, fill: 'url(#tex-mattoni)' }, p);
    el('rect', { x: -110, y: -118, width: 220, height: 118, fill: 'url(#ombra-muro)' }, p);
    el('rect', { x: -110, y: -14, width: 220, height: 14, fill: '#8b8e9e' }, p);
    // Tetto con la neve e l'insegna
    el('path', { d: 'M-126 -116 L0 -186 L126 -116 Z', fill: '#2e5b3f' }, p);
    el('path', { d: 'M-130 -114 L0 -190 L130 -114', stroke: '#fbfdff', 'stroke-width': 9, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, p);
    el('rect', { x: -94, y: -150, width: 188, height: 30, rx: 5, fill: '#fbf6ea', stroke: '#c9a227', 'stroke-width': 3 }, p);
    el('text', { x: 0, y: -137, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 'bold', 'letter-spacing': 1.5, 'font-family': 'Georgia, serif', fill: '#a3242c' }, p).textContent = 'UFFICIO POSTALE';
    el('text', { x: 0, y: -124, 'text-anchor': 'middle', 'font-size': 10, 'font-style': 'italic', 'font-family': 'Georgia, serif', fill: '#2e5b3f' }, p).textContent = 'di Babbo Natale';
    // Vetrine accese e porta
    [-86, 46].forEach(fx => {
        el('rect', { x: fx - 4, y: -102, width: 48, height: 56, rx: 4, fill: '#fbf6ea' }, p);
        el('rect', { x: fx, y: -98, width: 40, height: 48, fill: 'url(#vetro-acceso)' }, p);
        el('path', { d: `M${fx + 20} -98 v48 M${fx} -74 h40`, stroke: '#fbf6ea', 'stroke-width': 3 }, p);
        el('path', { d: `M${fx - 2} -48 q 22 -8 44 0`, stroke: '#2e6b3f', 'stroke-width': 5, fill: 'none' }, p);
    });
    el('rect', { x: -20, y: -66, width: 40, height: 66, rx: 16, fill: '#fbf6ea' }, p);
    el('rect', { x: -16, y: -62, width: 32, height: 62, rx: 14, fill: '#5d3a22' }, p);
    el('rect', { class: 'luce-porta', x: -16, y: -62, width: 32, height: 62, rx: 14, filter: 'url(#bagliore)', opacity: 0.6 }, p);
    // Un'enorme busta sopra la porta
    el('rect', { x: -16, y: -88, width: 32, height: 20, rx: 2, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 1.5 }, p);
    el('path', { d: 'M-16 -88 l16 11 l16 -11', stroke: '#c9a227', 'stroke-width': 1.5, fill: 'none' }, p);
    el('circle', { cx: 0, cy: -77, r: 3, fill: '#c0392b' }, p);
    // La cassetta rossa delle letterine, con le buste che volano verso il Polo Nord
    const cassetta = el('g', { transform: 'translate(-150 0)' }, p);
    el('rect', { x: -4, y: -40, width: 8, height: 40, fill: '#2a2a2e' }, cassetta);
    el('path', { d: 'M-22 -40 v-44 q 22 -20 44 0 v44 Z', fill: '#d62c2c', stroke: '#8a1d22', 'stroke-width': 2 }, cassetta);
    el('rect', { x: -14, y: -78, width: 28, height: 5, rx: 2, fill: '#2a2a2e' }, cassetta);
    el('text', { x: 0, y: -56, 'text-anchor': 'middle', 'font-size': 8, 'font-weight': 'bold', fill: '#fffaf0', 'font-family': 'Georgia, serif' }, cassetta).textContent = 'LETTERE';
    el('path', { d: 'M-24 -86 q 24 -24 48 0', stroke: '#fbfdff', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, cassetta);
    for (let i = 0; i < 4; i++) {
        const busta = el('g', { class: 'busta-vola', style: `animation-delay:${(i * 1.6).toFixed(1)}s` }, cassetta);
        el('rect', { x: -8, y: -96, width: 16, height: 11, rx: 1.5, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 1 }, busta);
        el('path', { d: 'M-8 -96 l8 6 l8 -6', stroke: '#c9a227', 'stroke-width': 1, fill: 'none' }, busta);
        el('circle', { cx: 0, cy: -90, r: 1.6, fill: '#c0392b' }, busta);
    }
    el('path', { d: 'M-120 2 q 16 -12 32 -4 q 16 -8 30 2 Z M80 2 q 16 -10 30 -4 q 16 -8 30 2 Z', fill: '#fbfdff' }, p);
    return p;
}

// Dentro l'ufficio postale: chi riceve il calendario scrive la letterina, chi lo prepara le legge
// La letterina di Babbo Natale quando chi prepara il calendario non ne ha scritta una
const LETTERA_BABBO = "Ho saputo che stai facendo un viaggio speciale nel mio villaggio! Ogni giorno si apre una casa con una sorpresa: aprile una alla volta, senza fretta. Gli elfi lavorano nel laboratorio, le renne si allenano per la grande notte… e il 24 dicembre ti aspetto nella mia casa in piazza. Ti auguro un Natale pieno di sorrisi!";

function creaPosta({ onEsci, onSpedisci, modifica, lettere, destinatario = '', letteraBabbo = '' }) {
    const nodo = Object.assign(document.createElement('div'), { className: 'interno posta-dentro', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice', role: 'img', 'aria-label': "Dentro l'ufficio postale di Babbo Natale" });
    const esci = Object.assign(document.createElement('button'), { type: 'button', className: 'esci', textContent: '← Torna al villaggio' });
    const foglio = Object.assign(document.createElement('div'), { className: 'letterina' });
    nodo.append(svg, foglio, esci);
    esci.addEventListener('click', onEsci);
    nodo.addEventListener('keydown', evento => {
        if (evento.key !== 'Escape') return;
        if (!letteraAperta.hidden) chiudiLettera();
        else onEsci();
    });

    // Il sacco della posta con il nome di chi riceve il calendario: dentro c'è la letterina di Babbo Natale per lui
    const sacco = Object.assign(document.createElement('button'), { type: 'button', className: 'sacco-per-te' });
    const avviso = Object.assign(document.createElement('span'), { className: 'avviso-sacco', textContent: "C'è posta per te!" });
    const disegnoSacco = el('svg', { viewBox: '0 0 160 190', 'aria-hidden': 'true' });
    el('ellipse', { cx: 80, cy: 182, rx: 62, ry: 7, fill: 'rgba(0,0,0,0.3)' }, disegnoSacco);
    el('path', { d: 'M28 182 Q8 120 34 70 Q52 52 80 52 Q108 52 126 70 Q152 120 132 182 Z', fill: '#c9a27c' }, disegnoSacco);
    el('path', { d: 'M40 176 Q26 124 44 84', stroke: '#e3c49a', 'stroke-width': 6, fill: 'none', opacity: 0.6, 'stroke-linecap': 'round' }, disegnoSacco);
    el('path', { d: 'M120 176 Q134 124 116 84', stroke: '#a07c55', 'stroke-width': 6, fill: 'none', opacity: 0.6, 'stroke-linecap': 'round' }, disegnoSacco);
    [[58, 40, -14, '#fffaf0'], [86, 34, 10, '#fde7c8'], [72, 46, 2, '#e8f1ff']].forEach(([bx, by, r, c]) => {
        const busta = el('g', { transform: `rotate(${r} ${bx} ${by})` }, disegnoSacco);
        el('rect', { x: bx - 20, y: by - 13, width: 40, height: 26, rx: 2, fill: c, stroke: '#c9a227', 'stroke-width': 1.5 }, busta);
        el('path', { d: `M${bx - 20} ${by - 13} l20 14 l20 -14`, stroke: '#c9a227', 'stroke-width': 1.5, fill: 'none' }, busta);
    });
    el('path', { d: 'M40 70 Q80 84 120 70 Q80 64 40 70 Z', fill: '#a07c55' }, disegnoSacco);
    el('path', { d: 'M44 72 Q80 88 116 72', stroke: '#c0392b', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, disegnoSacco);
    el('path', { d: 'M80 78 q -16 18 -22 30 M80 78 q 10 20 8 34', stroke: '#c0392b', 'stroke-width': 4, fill: 'none' }, disegnoSacco);
    el('rect', { x: 46, y: 106, width: 70, height: 38, rx: 6, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 2.5, transform: 'rotate(-6 81 125)' }, disegnoSacco);
    el('circle', { cx: 52, cy: 113, r: 3, fill: '#c9a227' }, disegnoSacco);
    const perChi = el('text', { x: 81, y: 122, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#3a2416', transform: 'rotate(-6 81 125)' }, disegnoSacco);
    const nomeSacco = el('text', { x: 81, y: 137, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#a3242c', transform: 'rotate(-6 81 125)' }, disegnoSacco);
    perChi.textContent = 'PER';
    el('text', { x: 80, y: 168, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 'bold', 'letter-spacing': 1, 'font-family': 'Georgia, serif', fill: '#7a2a2f' }, disegnoSacco).textContent = 'POLO NORD';
    sacco.append(avviso, disegnoSacco);

    const letteraAperta = Object.assign(document.createElement('div'), { className: 'lettera-babbo', hidden: true });
    letteraAperta.setAttribute('role', 'dialog');
    letteraAperta.setAttribute('aria-label', 'La letterina di Babbo Natale');
    const saluto = document.createElement('h3');
    const corpoLettera = Object.assign(document.createElement('p'), { className: 'testo-lettera-babbo' });
    const firmaBabbo = Object.assign(document.createElement('p'), { className: 'firma-lettera-babbo', textContent: 'Con tanto affetto, Babbo Natale 🎅' });
    const chiudi = Object.assign(document.createElement('button'), { type: 'button', className: 'spedisci', textContent: 'Chiudi la letterina' });
    letteraAperta.append(saluto, corpoLettera, firmaBabbo, chiudi);
    nodo.append(sacco, letteraAperta);

    function aggiornaSacco() {
        const nome = destinatario.trim();
        nomeSacco.textContent = (nome || 'TE').toUpperCase().slice(0, 14);
        sacco.setAttribute('aria-label', `Il sacco della posta per ${nome || 'te'}: tocca per aprire la letterina di Babbo Natale`);
        saluto.textContent = nome ? `Ciao ${nome}!` : 'Ciao!';
        corpoLettera.textContent = letteraBabbo.trim() || LETTERA_BABBO;
    }
    function chiudiLettera() {
        letteraAperta.hidden = true;
        letteraAperta.classList.remove('apre');
        sacco.focus({ preventScroll: true });
    }
    sacco.addEventListener('click', () => {
        aggiornaSacco();
        sacco.classList.add('aperto');
        letteraAperta.hidden = false;
        requestAnimationFrame(() => letteraAperta.classList.add('apre'));
        chiudi.focus({ preventScroll: true });
    });
    chiudi.addEventListener('click', chiudiLettera);
    aggiornaSacco();

    // Lo sfondo: casellari pieni di lettere, sacchi del Polo Nord, finestra con la neve
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: '#4a2c1c' }, svg);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#tex-assi)', opacity: 0.6 }, svg);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#tavole-parete)' }, svg);
    el('circle', { cx: 800, cy: 380, r: 640, fill: 'url(#alone)', opacity: 0.35 }, svg);
    [[60, 120], [1200, 120]].forEach(([cx, cy]) => {
        el('rect', { x: cx - 10, y: cy - 10, width: 360, height: 400, rx: 6, fill: '#6d4630' }, svg);
        for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
            const bx = cx + c * 85, by = cy + r * 76;
            el('rect', { x: bx, y: by, width: 76, height: 66, fill: '#2a180e' }, svg);
            if ((r * 4 + c) % 3 !== 1) {
                el('rect', { x: bx + 10, y: by + 26, width: 56, height: 36, rx: 2, fill: ['#fffaf0', '#fde7c8', '#e8f1ff'][(r + c) % 3], transform: `rotate(${(r * 7 + c * 5) % 9 - 4} ${bx + 38} ${by + 44})` }, svg);
                el('path', { d: `M${bx + 10} ${by + 26} l28 16 l28 -16`, stroke: '#c9a227', 'stroke-width': 2, fill: 'none', transform: `rotate(${(r * 7 + c * 5) % 9 - 4} ${bx + 38} ${by + 44})` }, svg);
            }
        }
    });
    el('path', { d: 'M560 60 h480 v220 h-480 Z', fill: '#efe6d2' }, svg);
    el('rect', { x: 574, y: 74, width: 452, height: 192, fill: '#16245c' }, svg);
    for (let i = 0; i < 22; i++) el('circle', { class: 'fiocco-finestra', cx: 580 + ((i * 97) % 440), cy: 80, r: 2 + (i % 3), fill: '#fff', style: `animation-delay:-${(i * 0.37 % 5).toFixed(2)}s;animation-duration:${(4 + (i % 4)).toFixed(1)}s` }, svg);
    el('path', { d: 'M800 74 v192 M574 170 h452', stroke: '#efe6d2', 'stroke-width': 8 }, svg);
    el('text', { x: 800, y: 330, 'text-anchor': 'middle', 'font-size': 40, 'font-family': "'Brush Script MT', cursive", fill: '#ffd36b' }, svg).textContent = 'Posta per il Polo Nord';
    [[150, 780, '#c9a27c'], [340, 800, '#b8925f'], [1260, 790, '#c9a27c'], [1450, 805, '#b8925f']].forEach(([sx, sy, colore]) => {
        el('path', { d: `M${sx - 80} ${sy} q -10 -120 40 -150 q 40 -14 80 0 q 50 30 40 150 Z`, fill: colore }, svg);
        el('path', { d: `M${sx - 26} ${sy - 150} q 26 -20 52 0`, stroke: '#8a5a2b', 'stroke-width': 6, fill: 'none' }, svg);
        el('text', { x: sx, y: sy - 60, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#7a2a2f' }, svg).textContent = 'POLO NORD';
        for (let b = 0; b < 3; b++) el('rect', { x: sx - 40 + b * 26, y: sy - 168 - (b % 2) * 8, width: 30, height: 20, rx: 2, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 1.5, transform: `rotate(${b * 12 - 12} ${sx - 25 + b * 26} ${sy - 158})` }, svg);
    });
    el('rect', { x: -1400, y: 820, width: 4400, height: 700, fill: '#5d3a22' }, svg);
    el('rect', { x: -1400, y: 820, width: 4400, height: 700, fill: 'url(#tavole-pavimento)' }, svg);
    el('rect', { x: -1400, y: 812, width: 4400, height: 14, fill: '#8a5a3c' }, svg);
    // Allo sportello c'è un elfo che accoglie chi entra
    disegnaElfo(svg, 1400, 700, 1.7, { giacca: '#a3242c', cappello: '#2e7d4a', capelli: '#c9984a' }).braccio.classList.add('saluta');
    el('rect', { x: 1160, y: 640, width: 460, height: 200, fill: '#8a5a3c' }, svg);
    el('rect', { x: 1160, y: 640, width: 460, height: 200, fill: 'url(#tex-assi)' }, svg);
    el('rect', { x: 1145, y: 624, width: 490, height: 22, rx: 4, fill: '#a0663a' }, svg);
    el('rect', { x: 1250, y: 690, width: 280, height: 46, rx: 8, fill: '#a3242c', stroke: '#e8c766', 'stroke-width': 3 }, svg);
    el('text', { x: 1390, y: 721, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 'bold', 'letter-spacing': 2, 'font-family': 'Georgia, serif', fill: '#ffe9a8' }, svg).textContent = 'SPORTELLO';
    // Timbro e pila di buste sul bancone
    el('rect', { x: 1190, y: 600, width: 40, height: 26, rx: 3, fill: '#5d3a22' }, svg);
    el('rect', { x: 1200, y: 586, width: 20, height: 16, rx: 3, fill: '#c0392b' }, svg);
    [0, 1, 2].forEach(k => el('rect', { x: 1540 - k * 4, y: 606 - k * 8, width: 56, height: 18, rx: 2, fill: ['#fffaf0', '#fde7c8', '#e8f1ff'][k], stroke: '#c9a227', 'stroke-width': 1.5 }, svg));
    const fumettoElfo = el('g', {}, svg);
    el('rect', { x: 1190, y: 250, width: 400, height: 168, rx: 30, fill: '#fffdf6', stroke: '#c9a227', 'stroke-width': 3 }, fumettoElfo);
    el('path', { d: 'M1370 412 L1392 452 L1410 412 Z', fill: '#fffdf6', stroke: '#c9a227', 'stroke-width': 3, 'stroke-linejoin': 'round' }, fumettoElfo);
    el('rect', { x: 1366, y: 404, width: 48, height: 12, fill: '#fffdf6' }, fumettoElfo);
    ['Benvenuti alla posta', 'del Polo Nord! Scrivete', 'qui la letterina: la porto', 'io a Babbo Natale!'].forEach((riga, i) => {
        el('text', { x: 1390, y: 292 + i * 34, 'text-anchor': 'middle', 'font-size': 25, 'font-family': 'Georgia, serif', fill: '#3b2416' }, fumettoElfo).textContent = riga;
    });

    const scrivi = () => {
        foglio.replaceChildren();
        foglio.classList.remove('spedita');
        if (modifica) {
            foglio.append(
                Object.assign(document.createElement('h3'), { textContent: '✉️ Le letterine a Babbo Natale' }),
                Object.assign(document.createElement('p'), { className: 'nota-letterina', textContent: 'Qui chi riceve il calendario può scrivere la sua letterina. Le letterine arrivano a te: le trovi qui e nel pannello.' })
            );
            const elenco = document.createElement('div');
            elenco.className = 'elenco-letterine';
            if (!lettere.length) elenco.append(Object.assign(document.createElement('p'), { className: 'nota-letterina', textContent: 'Ancora nessuna letterina.' }));
            [...lettere].reverse().forEach(l => {
                const voce = document.createElement('article');
                voce.append(
                    Object.assign(document.createElement('p'), { className: 'testo-letterina', textContent: l.testo }),
                    Object.assign(document.createElement('p'), { className: 'firma-letterina', textContent: `${l.firma || 'Senza firma'} · ${new Date(l.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}` })
                );
                elenco.append(voce);
            });
            foglio.append(elenco);
            return;
        }
        const titolo = Object.assign(document.createElement('h3'), { textContent: 'Caro Babbo Natale,' });
        const testo = Object.assign(document.createElement('textarea'), { rows: 4, maxLength: 1000, placeholder: 'Scrivi qui la tua letterina...' });
        testo.setAttribute('aria-label', 'La tua letterina');
        const firma = Object.assign(document.createElement('input'), { maxLength: 40, placeholder: 'La tua firma' });
        firma.setAttribute('aria-label', 'La tua firma');
        const spedisci = Object.assign(document.createElement('button'), { type: 'button', className: 'spedisci', textContent: '📮 Spedisci la letterina' });
        const stato = Object.assign(document.createElement('p'), { className: 'nota-letterina' });
        spedisci.addEventListener('click', async () => {
            if (!testo.value.trim()) {
                stato.textContent = 'Scrivi qualcosa prima di spedire!';
                testo.focus();
                return;
            }
            spedisci.disabled = true;
            spedisci.textContent = 'Spedisco...';
            try {
                await onSpedisci(testo.value.trim(), firma.value.trim());
                foglio.classList.add('spedita');
                setTimeout(() => {
                    foglio.classList.remove('spedita');
                    foglio.replaceChildren(
                        Object.assign(document.createElement('h3'), { textContent: '✉️ Letterina spedita!' }),
                        Object.assign(document.createElement('p'), { className: 'nota-letterina', textContent: 'È già in viaggio verso il Polo Nord. Babbo Natale la leggerà davanti al camino! ✨' })
                    );
                    const ancora = Object.assign(document.createElement('button'), { type: 'button', className: 'spedisci', textContent: "Scrivi un'altra letterina" });
                    ancora.addEventListener('click', scrivi);
                    foglio.append(ancora);
                }, 1100);
            } catch (errore) {
                stato.textContent = errore.message || 'La letterina non è partita: riprova.';
                spedisci.disabled = false;
                spedisci.textContent = '📮 Spedisci la letterina';
            }
        });
        foglio.append(titolo, testo, firma, spedisci, stato);
    };

    return {
        nodo,
        mostra() {
            scrivi();
            nodo.hidden = false;
            requestAnimationFrame(() => {
                nodo.classList.add('visibile');
                (foglio.querySelector('textarea') ?? esci).focus({ preventScroll: true });
            });
        },
        nascondi() {
            letteraAperta.hidden = true;
            letteraAperta.classList.remove('apre');
            nodo.classList.remove('visibile');
            nodo.hidden = true;
        },
        aggiornaLettere(nuove) {
            lettere = nuove ?? [];
        },
        impostaSacco(nome, lettera) {
            destinatario = nome ?? '';
            letteraBabbo = lettera ?? '';
            aggiornaSacco();
        }
    };
}

// ---------- Il laboratorio degli elfi ----------
const GIOCATTOLI = [
    // Orsacchiotto
    g => {
        el('circle', { cx: 0, cy: -22, r: 16, fill: '#a0663a' }, g);
        el('circle', { cx: 0, cy: -46, r: 12, fill: '#a0663a' }, g);
        [-10, 10].forEach(ox => el('circle', { cx: ox, cy: -56, r: 5, fill: '#a0663a' }, g));
        el('ellipse', { cx: 0, cy: -42, rx: 5, ry: 4, fill: '#e3c49a' }, g);
        el('circle', { cx: -4, cy: -48, r: 1.6, fill: '#2a1d14' }, g);
        el('circle', { cx: 4, cy: -48, r: 1.6, fill: '#2a1d14' }, g);
        el('path', { d: 'M-8 -36 l8 4 8 -4 v4 l-8 -2 -8 2 Z', fill: '#c0392b' }, g);
    },
    // Trenino
    g => {
        el('rect', { x: -26, y: -32, width: 30, height: 22, rx: 3, fill: '#c0392b' }, g);
        el('rect', { x: 4, y: -24, width: 22, height: 14, rx: 3, fill: '#2d4f8a' }, g);
        el('rect', { x: -22, y: -44, width: 10, height: 12, fill: '#2a2a2e' }, g);
        [-18, -2, 16].forEach(cx => el('circle', { cx, cy: -8, r: 6, fill: '#2a2a2e', stroke: '#e8c766', 'stroke-width': 2 }, g));
    },
    // Palla a spicchi
    g => {
        el('circle', { cx: 0, cy: -20, r: 18, fill: '#f4d03f' }, g);
        el('path', { d: 'M-18 -20 h36 M0 -38 v36', stroke: '#c0392b', 'stroke-width': 5 }, g);
        el('circle', { cx: -6, cy: -27, r: 4, fill: '#fff', opacity: 0.6 }, g);
    },
    // Tamburo
    g => {
        el('rect', { x: -18, y: -36, width: 36, height: 30, fill: '#c0392b' }, g);
        el('path', { d: 'M-18 -36 l12 30 l12 -30 l12 30', stroke: '#e8c766', 'stroke-width': 2, fill: 'none' }, g);
        el('ellipse', { cx: 0, cy: -36, rx: 18, ry: 6, fill: '#fbf6ea', stroke: '#8a5a3c', 'stroke-width': 2 }, g);
        el('path', { d: 'M-12 -50 l10 12 M14 -52 l-8 14', stroke: '#8a5a3c', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    },
    // Cavallo a dondolo
    g => {
        el('path', { d: 'M-28 -4 q 28 12 56 0', stroke: '#8a5a3c', 'stroke-width': 5, fill: 'none' }, g);
        el('path', { d: 'M-14 -8 v-12 M14 -8 v-12', stroke: '#8a5a3c', 'stroke-width': 4 }, g);
        el('ellipse', { cx: 0, cy: -26, rx: 20, ry: 9, fill: '#fbf6ea' }, g);
        el('path', { d: 'M-14 -30 l-8 -18 l10 -2 l6 16 Z', fill: '#fbf6ea' }, g);
        el('path', { d: 'M-20 -48 q 8 10 6 18', stroke: '#c0392b', 'stroke-width': 4, fill: 'none' }, g);
    }
];
const CARTE_PACCHI = [['#c0392b', '#f4d03f'], ['#2e7d4a', '#fbf6ea'], ['#2d4f8a', '#e84393'], ['#f4d03f', '#c0392b'], ['#7d4e9e', '#7dff9a']];

function pacco(g, [carta, nastro], w = 40, h = 32) {
    el('rect', { x: -w / 2, y: -h, width: w, height: h, rx: 3, fill: carta }, g);
    el('rect', { x: -4, y: -h, width: 8, height: h, fill: nastro }, g);
    el('rect', { x: -w / 2, y: -h / 2 - 4, width: w, height: 8, fill: nastro }, g);
    el('path', { d: `M0 ${-h} q -14 -14 -16 -2 q 2 6 16 2 q 14 4 16 -2 q -2 -12 -16 2 Z`, fill: nastro }, g);
}

function disegnaLaboratorio(mondo, x, y, scala) {
    const l = el('g', {
        class: 'laboratorio', transform: `translate(${x} ${y}) scale(${scala})`, tabindex: 0, role: 'button',
        'aria-label': 'Il laboratorio degli elfi: entra a vedere come nascono i regali'
    }, mondo);
    el('ellipse', { class: 'alone', cx: 0, cy: -90, rx: 260, ry: 160, fill: 'url(#alone)', opacity: 0.55 }, l);
    el('ellipse', { cx: 0, cy: 4, rx: 200, ry: 16, fill: 'rgba(60,90,140,0.3)' }, l);
    el('rect', { x: -170, y: -140, width: 340, height: 140, fill: '#8a5a3c' }, l);
    el('rect', { x: -170, y: -140, width: 340, height: 140, fill: 'url(#tex-assi)' }, l);
    el('rect', { x: -170, y: -140, width: 340, height: 140, fill: 'url(#ombra-muro)' }, l);
    // Tetto con due comignoli che fanno fumo colorato
    el('path', { d: 'M-190 -136 L0 -232 L190 -136 Z', fill: '#2d4f8a' }, l);
    el('path', { d: 'M-190 -136 L0 -232 L190 -136 Z', fill: 'url(#tex-tegole)' }, l);
    el('path', { d: 'M-196 -132 L0 -236 L196 -132', stroke: '#fbfdff', 'stroke-width': 10, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, l);
    [[-110, '#ff9de2'], [100, '#7dd3ff']].forEach(([cx, colore], i) => {
        el('rect', { x: cx - 12, y: -210 + Math.abs(cx) * 0.2, width: 24, height: 50, fill: '#a3242c' }, l);
        el('rect', { x: cx - 15, y: -214 + Math.abs(cx) * 0.2, width: 30, height: 8, fill: '#fbfdff' }, l);
        const fumo = el('g', { class: 'fumo-colorato' }, l);
        for (let k = 0; k < 3; k++) el('circle', { cx, cy: -222 + Math.abs(cx) * 0.2, r: 9, fill: colore, opacity: 0.8, style: `animation-delay:${(k * 1.1 + i * 0.5).toFixed(1)}s` }, fumo);
    });
    // Insegna con la ruota dentata
    el('rect', { x: -120, y: -176, width: 240, height: 32, rx: 6, fill: '#2e7d4a', stroke: '#e8c766', 'stroke-width': 3 }, l);
    el('text', { x: 0, y: -154, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 'bold', 'letter-spacing': 1, 'font-family': 'Georgia, serif', fill: '#fffaf0' }, l).textContent = 'LABORATORIO DEGLI ELFI';
    const ruota = el('g', { class: 'ingranaggio' }, el('g', { transform: 'translate(0 -200)' }, l));
    el('circle', { r: 14, fill: '#e8c766' }, ruota);
    for (let i = 0; i < 8; i++) el('rect', { x: -3, y: -19, width: 6, height: 8, fill: '#e8c766', transform: `rotate(${i * 45})` }, ruota);
    el('circle', { r: 5, fill: '#2d4f8a' }, ruota);
    // Finestre accese con le sagome degli elfi al lavoro e il portone
    [-140, -80, 50, 110].forEach((fx, i) => {
        el('rect', { x: fx - 3, y: -122, width: 36, height: 46, rx: 3, fill: '#fbf6ea' }, l);
        el('rect', { x: fx, y: -119, width: 30, height: 40, fill: 'url(#vetro-acceso)' }, l);
        el('path', { d: `M${fx + 8} -79 q 7 -18 14 0 Z M${fx + 15} -98 l -6 -12 l 12 0 Z`, fill: '#2e7d4a', opacity: 0.55, class: i % 2 ? 'sagoma-elfo' : '' }, l);
    });
    el('path', { d: 'M-36 0 V-70 Q0 -100 36 -70 V0 Z', fill: '#fbf6ea' }, l);
    el('path', { d: 'M-30 0 V-68 Q0 -94 30 -68 V0 Z', fill: '#5d3a22' }, l);
    el('path', { d: 'M0 -90 V0 M-30 -40 h60', stroke: '#3a2416', 'stroke-width': 3 }, l);
    // Il nastro trasportatore che esce di lato, con i pacchi che scorrono
    el('rect', { x: 170, y: -40, width: 110, height: 12, rx: 6, fill: '#3a3a44' }, l);
    [182, 206, 230, 254, 270].forEach(cx => el('circle', { cx, cy: -34, r: 5, fill: '#8d98b8' }, l));
    const fila = el('g', { 'clip-path': 'url(#nastro-fuori)' }, l);
    const clip = el('clipPath', { id: 'nastro-fuori' }, l);
    el('rect', { x: 170, y: -100, width: 120, height: 70 }, clip);
    for (let i = 0; i < 3; i++) {
        const g = el('g', { class: 'pacco-nastro', style: `animation-delay:-${(i * 1.4).toFixed(1)}s` }, fila);
        const dentro = el('g', { transform: 'translate(170 -40) scale(0.6)' }, g);
        pacco(dentro, CARTE_PACCHI[i]);
    }
    [[300, 2, 0], [330, 2, 1], [316, -24, 2], [350, 2, 3]].forEach(([px, py, i]) => pacco(el('g', { transform: `translate(${px} ${py}) scale(0.7)` }, l), CARTE_PACCHI[i]));
    // Bastoncini di zucchero ai lati del portone
    [-50, 50].forEach(px => {
        el('path', { d: `M${px} 0 V-60 a8 8 0 0 ${px < 0 ? 0 : 1} ${px < 0 ? -16 : 16} 0`, stroke: '#fff', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, l);
        el('path', { d: `M${px} 0 V-60 a8 8 0 0 ${px < 0 ? 0 : 1} ${px < 0 ? -16 : 16} 0`, stroke: '#d62c2c', 'stroke-width': 7, fill: 'none', 'stroke-dasharray': '6 6' }, l);
    });
    el('path', { d: 'M-180 2 q 20 -14 40 -6 q 20 -10 40 2 Z', fill: '#fbfdff' }, l);
    return l;
}

function creaLaboratorio({ onEsci }) {
    const nodo = Object.assign(document.createElement('div'), { className: 'interno laboratorio-dentro', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'Dentro il laboratorio degli elfi: i giocattoli diventano regali' });
    const esci = Object.assign(document.createElement('button'), { type: 'button', className: 'esci', textContent: '← Torna al villaggio' });
    nodo.append(svg, esci);
    esci.addEventListener('click', onEsci);
    nodo.addEventListener('keydown', evento => { if (evento.key === 'Escape') onEsci(); });

    const defs = el('defs', {}, svg);
    const sinistra = el('clipPath', { id: 'nastro-entrata' }, defs);
    el('rect', { x: -400, y: 300, width: 1110, height: 400 }, sinistra);
    const destra = el('clipPath', { id: 'nastro-uscita' }, defs);
    el('rect', { x: 890, y: 300, width: 1200, height: 400 }, destra);

    // Pareti di legno, finestra con la neve, mensole piene di giocattoli, lucine
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: '#6d4630' }, svg);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#tex-assi)', opacity: 0.7 }, svg);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#tavole-parete)' }, svg);
    el('circle', { cx: 800, cy: 400, r: 700, fill: 'url(#alone)', opacity: 0.3 }, svg);
    el('rect', { x: 620, y: 70, width: 360, height: 180, rx: 8, fill: '#efe6d2' }, svg);
    el('rect', { x: 634, y: 84, width: 332, height: 152, fill: '#16245c' }, svg);
    for (let i = 0; i < 16; i++) el('circle', { class: 'fiocco-finestra', cx: 640 + ((i * 71) % 320), cy: 90, r: 2 + (i % 3), fill: '#fff', style: `animation-delay:-${(i * 0.41 % 5).toFixed(2)}s;animation-duration:${(4 + (i % 3)).toFixed(1)}s` }, svg);
    el('path', { d: 'M800 84 v152 M634 160 h332', stroke: '#efe6d2', 'stroke-width': 7 }, svg);
    el('rect', { x: 560, y: 262, width: 480, height: 44, rx: 8, fill: '#a3242c', stroke: '#e8c766', 'stroke-width': 3 }, svg);
    el('text', { x: 800, y: 293, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 'bold', 'letter-spacing': 2, 'font-family': 'Georgia, serif', fill: '#fffaf0' }, svg).textContent = 'LABORATORIO DEGLI ELFI';
    [[60, 160], [60, 290], [1180, 160], [1180, 290]].forEach(([mx, my], i) => {
        el('rect', { x: mx, y: my, width: 360, height: 12, fill: '#8a5a3c' }, svg);
        for (let k = 0; k < 4; k++) {
            const g = el('g', { transform: `translate(${mx + 50 + k * 86} ${my}) scale(1.1)` }, svg);
            if ((k + i) % 2) GIOCATTOLI[(k + i) % GIOCATTOLI.length](g);
            else pacco(g, CARTE_PACCHI[(k + i) % CARTE_PACCHI.length], 44, 40);
        }
    });
    el('path', { d: 'M-200 40 q 150 50 300 0 q 150 50 300 0 q 150 50 300 0 q 150 50 300 0 q 150 50 300 0 q 150 50 300 0', fill: 'none', stroke: '#1f5c34', 'stroke-width': 14 }, svg);
    for (let i = 0; i < 24; i++) el('circle', { class: 'pallina', cx: -170 + i * 75, cy: 50 + Math.sin(((i * 75 + 30) % 300) / 300 * Math.PI) * 24, r: 7, fill: COLORI_FESTA[i % 5], filter: 'url(#bagliore)', style: `animation-delay:${((i * 0.3) % 2).toFixed(1)}s` }, svg);
    // Pavimento
    el('rect', { x: -1400, y: 700, width: 4400, height: 800, fill: '#5d3a22' }, svg);
    el('rect', { x: -1400, y: 700, width: 4400, height: 800, fill: 'url(#tex-assi)', opacity: 0.5 }, svg);
    el('rect', { x: -1400, y: 700, width: 4400, height: 800, fill: 'url(#tavole-pavimento)' }, svg);

    // Il nastro trasportatore: i giocattoli entrano nell'impacchettatrice ed escono incartati
    el('rect', { x: -400, y: 560, width: 2400, height: 26, rx: 13, fill: '#3a3a44' }, svg);
    for (let x = -380; x < 2000; x += 46) el('circle', { class: 'rullo', cx: x, cy: 573, r: 9, fill: '#8d98b8', stroke: '#5d6280', 'stroke-width': 2 }, svg);
    el('path', { d: 'M-400 586 H2000 V610 H-400 Z', fill: '#26262b' }, svg);
    [0, 400, 1200, 1600].forEach(gx => el('rect', { x: gx - 8, y: 586, width: 16, height: 120, fill: '#26262b' }, svg));
    const entrata = el('g', { 'clip-path': 'url(#nastro-entrata)' }, svg);
    for (let i = 0; i < 5; i++) {
        const g = el('g', { class: 'su-nastro', style: `animation-delay:-${(i * 2).toFixed(1)}s` }, entrata);
        GIOCATTOLI[i](el('g', { transform: 'translate(-200 560) scale(1.6)' }, g));
    }
    const uscita = el('g', { 'clip-path': 'url(#nastro-uscita)' }, svg);
    for (let i = 0; i < 5; i++) {
        const g = el('g', { class: 'su-nastro-uscita', style: `animation-delay:-${(i * 2 + 1).toFixed(1)}s` }, uscita);
        pacco(el('g', { transform: 'translate(-200 560) scale(1.3)' }, g), CARTE_PACCHI[i]);
    }
    // L'impacchettatrice, con gli ingranaggi che girano
    el('rect', { x: 700, y: 400, width: 200, height: 200, rx: 14, fill: '#c0392b', stroke: '#8a1d22', 'stroke-width': 4 }, svg);
    el('rect', { x: 716, y: 520, width: 168, height: 56, rx: 6, fill: '#2a180e' }, svg);
    el('text', { x: 800, y: 440, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#ffe9a8' }, svg).textContent = 'IMPACCHETTATRICE';
    [[760, 480, 22], [830, 476, 16]].forEach(([gx, gy, r], i) => {
        const ingranaggio = el('g', { class: i ? 'ingranaggio inverso' : 'ingranaggio' }, el('g', { transform: `translate(${gx} ${gy})` }, svg));
        el('circle', { r, fill: '#e8c766' }, ingranaggio);
        for (let k = 0; k < 8; k++) el('rect', { x: -4, y: -r - 6, width: 8, height: 10, fill: '#e8c766', transform: `rotate(${k * 45})` }, ingranaggio);
        el('circle', { r: r * 0.35, fill: '#8a1d22' }, ingranaggio);
    });
    el('circle', { class: 'lucina-mercato', cx: 880, cy: 418, r: 7, fill: '#7dff9a' }, svg);
    el('circle', { class: 'lucina-mercato', cx: 860, cy: 418, r: 7, fill: '#ff5a4f', style: 'animation-delay:0.4s' }, svg);

    // Gli elfi al lavoro
    const banco = (bx, by, w) => {
        el('rect', { x: bx - w / 2, y: by - 70, width: w, height: 14, fill: '#a0663a' }, svg);
        el('path', { d: `M${bx - w / 2 + 10} ${by - 56} v56 M${bx + w / 2 - 10} ${by - 56} v56`, stroke: '#6d4630', 'stroke-width': 10 }, svg);
    };
    banco(230, 820, 240);
    GIOCATTOLI[4](el('g', { transform: 'translate(190 750) scale(1.5)' }, svg));
    const martello = disegnaElfo(svg, 300, 830, 1.5, { giacca: '#2e7d5b', cappello: '#c0392b' });
    el('path', { d: 'M30 -48 l 18 -18 M42 -72 l 14 12', stroke: '#6d4630', 'stroke-width': 4, 'stroke-linecap': 'round' }, martello.braccio);
    el('rect', { x: 38, y: -80, width: 22, height: 10, rx: 2, fill: '#5d6280', transform: 'rotate(40 49 -75)' }, martello.braccio);
    martello.braccio.classList.add('martella');
    // Elfo che legge la lista dei bambini buoni
    const lettore = disegnaElfo(svg, 1360, 830, 1.5, { giacca: '#c0392b', cappello: '#2e7d5b', capelli: '#5a3b2a' });
    el('path', { d: 'M1388 755 h70 v120 q -36 10 -70 0 Z', fill: '#fbf6ea', stroke: '#c9a227', 'stroke-width': 2 }, svg);
    el('text', { x: 1423, y: 778, 'text-anchor': 'middle', 'font-size': 8.5, 'font-weight': 'bold', fill: '#a3242c', 'font-family': 'Georgia, serif' }, svg).textContent = 'BAMBINI BUONI';
    for (let k = 0; k < 7; k++) el('path', { d: `M1396 ${792 + k * 11} h54`, stroke: '#7a6a5a', 'stroke-width': 2 }, svg);
    for (let k = 0; k < 7; k++) el('path', { d: `M1398 ${789 + k * 11} l3 3 l5 -6`, stroke: '#2e7d4a', 'stroke-width': 2, fill: 'none' }, svg);
    lettore.braccio.classList.add('saluta');
    // Elfo che mette il fiocco ai pacchi appena usciti
    const fiocco = disegnaElfo(svg, 1050, 830, 1.4, { giacca: '#7d4e9e', cappello: '#f4d03f', capelli: '#2b1d14' });
    fiocco.braccio.classList.add('martella');
    pacco(el('g', { transform: 'translate(1110 780) scale(1.2)' }, svg), CARTE_PACCHI[3]);
    // Pila di regali finiti
    [[1500, 860, 0], [1560, 860, 1], [1530, 808, 2], [1460, 860, 4]].forEach(([px, py, i]) => pacco(el('g', { transform: `translate(${px} ${py}) scale(1.6)` }, svg), CARTE_PACCHI[i]));

    // Il tour in minibus con Fiocco, l'elfo autista
    const tour = creaTour(nodo);
    const bottoneTour = Object.assign(document.createElement('button'), { type: 'button', className: 'ricomincia bottone-tour', textContent: '🚌 Fai il tour con l\'elfo' });
    nodo.append(bottoneTour);
    bottoneTour.addEventListener('click', () => tour.apri());
    esci.addEventListener('click', () => tour.chiudi());

    return {
        nodo,
        mostra() {
            nodo.hidden = false;
            requestAnimationFrame(() => {
                nodo.classList.add('visibile');
                esci.focus({ preventScroll: true });
            });
        },
        nascondi() {
            nodo.classList.remove('visibile');
            nodo.hidden = true;
        }
    };
}

// ---------- La stalla delle renne ----------
const RENNE_STALLA = [
    {
        nome: 'Cometa', pelo: '#8a5a36', collare: '#c0392b',
        storia: "Sono Cometa, la più veloce della squadra! Mi chiamano così perché quando corro nel cielo lascio dietro di me una scia di stelline. Il mio cibo preferito? Licheni croccanti con una spolverata di neve fresca."
    },
    {
        nome: 'Ballerino', pelo: '#a0703f', collare: '#2d4f8a',
        storia: "Ciao, sono Ballerino! Prima di ogni partenza faccio una piroetta sul ghiaccio: porta fortuna a tutta la squadra. Gli elfi dicono che sono il più elegante della stalla… e io non li contraddico!"
    },
    {
        nome: 'Rudolph', pelo: '#7a4b2e', collare: '#2e7d4a', naso: true,
        storia: "Sono Rudolph, quello col naso rosso! Da piccolo il mio naso luminoso mi faceva sentire diverso. Poi una notte di nebbia fittissima Babbo Natale mi ha chiesto di guidare la slitta: il mio naso illuminava la strada! Da allora sono sempre il primo della fila."
    },
    {
        nome: 'Fulmine', pelo: '#94643c', collare: '#f4d03f',
        storia: "Sono Fulmine, la renna più forte del Polo Nord! Tiro la slitta anche quando il sacco dei regali è pieno fino all'orlo. Il mio segreto? Una carota a colazione e tanta allegria."
    },
    {
        nome: 'Cupido', pelo: '#a8794a', collare: '#e84393',
        storia: "Io sono Cupido, la renna più affettuosa! Il mio compito è controllare che ogni regalo parta con tanto amore dentro. Dicono che chi mi fa una carezza abbia fortuna per tutto l'anno."
    }
];

function disegnaStalla(mondo, x, y, scala) {
    const s = el('g', {
        class: 'stalla', transform: `translate(${x} ${y}) scale(${scala})`, tabindex: 0, role: 'button',
        'aria-label': 'La stalla delle renne: entra a salutare Rudolph e le sue amiche'
    }, mondo);
    el('ellipse', { class: 'alone', cx: 0, cy: -70, rx: 200, ry: 120, fill: 'url(#alone)', opacity: 0.45 }, s);
    el('ellipse', { cx: 0, cy: 4, rx: 150, ry: 13, fill: 'rgba(60,90,140,0.3)' }, s);
    // Fienile rosso con il tetto a mansarda
    el('path', { d: 'M-120 0 V-100 L-96 -150 L0 -186 L96 -150 L120 -100 V0 Z', fill: '#a3242c' }, s);
    el('path', { d: 'M-120 0 V-100 L-96 -150 L0 -186 L96 -150 L120 -100 V0 Z', fill: 'url(#tex-assi)' }, s);
    el('path', { d: 'M-130 -96 L-102 -154 L0 -194 L102 -154 L130 -96', stroke: '#fbfdff', 'stroke-width': 10, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M-120 -100 L-96 -150 L0 -186 L96 -150 L120 -100', stroke: '#5d3a22', 'stroke-width': 4, fill: 'none' }, s);
    // Portone con le croci bianche
    el('rect', { x: -48, y: -84, width: 96, height: 84, fill: '#8a1d22', stroke: '#fbf6ea', 'stroke-width': 5 }, s);
    el('path', { d: 'M0 -84 V0 M-48 -84 L0 0 M0 -84 L-48 0 M48 -84 L0 0 M0 -84 L48 0', stroke: '#fbf6ea', 'stroke-width': 4 }, s);
    // Finestra del fienile con il fieno
    el('rect', { x: -22, y: -150, width: 44, height: 40, fill: '#3a2416', stroke: '#fbf6ea', 'stroke-width': 4 }, s);
    el('path', { d: 'M-20 -112 q 6 -18 12 -4 q 4 -16 10 -2 q 6 -14 12 0 q 4 -10 6 4 Z', fill: '#e8c766' }, s);
    // Due renne che si affacciano dalle finestrelle
    [[-90, '#8a5a36', false], [90, '#7a4b2e', true]].forEach(([fx, pelo, naso]) => {
        el('rect', { x: fx - 22, y: -86, width: 44, height: 38, fill: '#2a180e', stroke: '#fbf6ea', 'stroke-width': 4 }, s);
        const testa = el('g', { class: 'renna-affacciata', transform: `translate(${fx} -60)` }, s);
        el('path', { d: 'M-6 -16 q -10 -12 -16 -14 M-11 -24 l -6 -2 M6 -16 q 10 -12 16 -14 M11 -24 l 6 -2', stroke: '#d9c3a0', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }, testa);
        el('ellipse', { cx: -12, cy: -8, rx: 6, ry: 3, fill: pelo, transform: 'rotate(-20 -12 -8)' }, testa);
        el('ellipse', { cx: 12, cy: -8, rx: 6, ry: 3, fill: pelo, transform: 'rotate(20 12 -8)' }, testa);
        el('ellipse', { cx: 0, cy: 0, rx: 11, ry: 14, fill: pelo }, testa);
        el('ellipse', { cx: 0, cy: 8, rx: 8, ry: 6, fill: '#d9c3a5' }, testa);
        el('circle', { cx: -4, cy: -3, r: 1.8, fill: '#2a1d14' }, testa);
        el('circle', { cx: 4, cy: -3, r: 1.8, fill: '#2a1d14' }, testa);
        el('circle', { cx: 0, cy: 9, r: naso ? 4 : 3, fill: naso ? '#ff3b30' : '#2a1d14', ...(naso ? { filter: 'url(#bagliore)' } : {}) }, testa);
    });
    // Insegna, balle di fieno e staccionata
    el('rect', { x: -86, y: -214, width: 172, height: 26, rx: 5, fill: '#fbf6ea', stroke: '#c9a227', 'stroke-width': 3 }, s);
    el('text', { x: 0, y: -196, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 'bold', 'letter-spacing': 1, 'font-family': 'Georgia, serif', fill: '#a3242c' }, s).textContent = 'STALLA DELLE RENNE';
    [[-150, 0], [-128, -22], [150, 0]].forEach(([bx, by]) => {
        el('rect', { x: bx - 22, y: by - 22, width: 44, height: 24, rx: 5, fill: '#e8c766' }, s);
        el('path', { d: `M${bx - 18} ${by - 14} h36 M${bx - 18} ${by - 6} h36`, stroke: '#c9a227', 'stroke-width': 2 }, s);
    });
    el('path', { d: 'M180 -2 h60 M180 -22 h60 M186 2 v-34 M212 2 v-34 M238 2 v-34', stroke: '#8a5a3c', 'stroke-width': 5 }, s);
    el('path', { d: 'M-130 2 q 16 -12 32 -4 q 16 -8 30 2 Z M90 2 q 16 -10 30 -4 q 16 -8 30 2 Z', fill: '#fbfdff' }, s);
    return s;
}

// Una grande testa di renna che si affaccia dal box: si può toccare e fa sì con la testa
function testaRenna(genitore, x, y, { pelo, collare, naso, nome }) {
    const r = el('g', { class: 'renna-box', transform: `translate(${x} ${y}) scale(1.45)`, tabindex: 0, role: 'button', 'aria-label': `${nome}: tocca per salutarla` }, genitore);
    const muove = el('g', { class: 'testa-renna' }, r);
    el('path', { d: 'M-30 60 q -6 -60 10 -90 h40 q 16 30 10 90 Z', fill: pelo }, muove);
    el('path', { d: 'M-24 10 q 24 14 48 0', stroke: collare, 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, muove);
    [-14, 0, 14].forEach(cx => el('circle', { cx, cy: 18, r: 5, fill: '#f4d03f', stroke: '#b8860b', 'stroke-width': 1.5 }, muove));
    // Corna ramificate
    el('path', { d: 'M-14 -76 q -14 -30 -40 -40 M-28 -98 l -18 -4 M-40 -110 l -6 -14 M14 -76 q 14 -30 40 -40 M28 -98 l 18 -4 M40 -110 l 6 -14', stroke: '#d9c3a0', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, muove);
    el('ellipse', { cx: -30, cy: -58, rx: 14, ry: 6, fill: pelo, transform: 'rotate(-25 -30 -58)' }, muove);
    el('ellipse', { cx: 30, cy: -58, rx: 14, ry: 6, fill: pelo, transform: 'rotate(25 30 -58)' }, muove);
    el('ellipse', { cx: 0, cy: -46, rx: 26, ry: 34, fill: pelo }, muove);
    el('ellipse', { cx: 0, cy: -24, rx: 19, ry: 14, fill: '#d9c3a5' }, muove);
    const occhi = el('g', { class: 'occhi-renna' }, muove);
    el('ellipse', { cx: -10, cy: -54, rx: 4, ry: 5, fill: '#2a1d14' }, occhi);
    el('ellipse', { cx: 10, cy: -54, rx: 4, ry: 5, fill: '#2a1d14' }, occhi);
    el('circle', { cx: -9, cy: -56, r: 1.4, fill: '#fff' }, occhi);
    el('circle', { cx: 11, cy: -56, r: 1.4, fill: '#fff' }, occhi);
    el('circle', { cx: 0, cy: -26, r: naso ? 9 : 7, fill: naso ? '#ff3b30' : '#2a1d14', class: naso ? 'naso-rudolph' : '', ...(naso ? { filter: 'url(#bagliore)' } : {}) }, muove);
    el('path', { d: 'M-6 -14 q 6 5 12 0', stroke: '#5a3b2a', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, muove);
    // Un ciuffo di fieno in bocca che mastica
    el('path', { class: 'fieno-bocca', d: 'M4 -12 l 18 6 M6 -10 l 16 10 M5 -11 l 20 2', stroke: '#e8c766', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, muove);
    const cuore = el('text', { class: 'cuore-renna', x: 0, y: -120, 'text-anchor': 'middle', 'font-size': 28 }, r);
    cuore.textContent = '❤️';
    return r;
}

function creaStalla({ onEsci, onTocco, onScegliRenna = () => {} }) {
    const nodo = Object.assign(document.createElement('div'), { className: 'interno stalla-dentro', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'Dentro la stalla delle renne' });
    const esci = Object.assign(document.createElement('button'), { type: 'button', className: 'esci', textContent: '← Torna al villaggio' });
    nodo.append(svg, esci);
    esci.addEventListener('click', onEsci);
    nodo.addEventListener('keydown', evento => { if (evento.key === 'Escape') onEsci(); });

    // Travi di legno, lanterne, finimenti con i campanelli, la slitta di Babbo Natale in un angolo
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: '#5d3a22' }, svg);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#tex-assi)', opacity: 0.8 }, svg);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#tavole-parete)' }, svg);
    el('path', { d: 'M-200 90 H1800 M-200 160 H1800', stroke: '#3a2416', 'stroke-width': 22 }, svg);
    for (let x = 0; x <= 1600; x += 400) el('path', { d: `M${x} 90 V620`, stroke: '#3a2416', 'stroke-width': 26 }, svg);
    [200, 800, 1400].forEach(lx => {
        el('path', { d: `M${lx} 160 v40`, stroke: '#2a2a2e', 'stroke-width': 3 }, svg);
        el('circle', { class: 'luce-calda', cx: lx, cy: 230, r: 150, fill: 'url(#alone)', opacity: 0.55 }, svg);
        el('path', { d: `M${lx - 14} 200 h28 l -4 40 h-20 Z`, fill: '#ffd36b', stroke: '#2a2a2e', 'stroke-width': 3, filter: 'url(#bagliore)' }, svg);
    });
    el('text', { x: 800, y: 70, 'text-anchor': 'middle', 'font-size': 40, 'font-family': "'Brush Script MT', cursive", fill: '#ffd36b' }, svg).textContent = 'La stalla delle renne';
    // Finimenti appesi con i campanelli
    [[110, 230], [1490, 230]].forEach(([fx, fy]) => {
        el('path', { d: `M${fx - 50} ${fy} q 50 70 100 0`, stroke: '#a3242c', 'stroke-width': 12, fill: 'none' }, svg);
        for (let k = 0; k < 5; k++) el('circle', { cx: fx - 40 + k * 20, cy: fy + 32 - Math.abs(k - 2) * 8, r: 8, fill: '#f4d03f', stroke: '#b8860b', 'stroke-width': 2 }, svg);
    });
    // Pavimento di paglia
    el('rect', { x: -1400, y: 620, width: 4400, height: 900, fill: '#c9a24a' }, svg);
    for (let i = 0; i < 120; i++) el('path', { d: `M${(i * 137) % 1800 - 100} ${640 + (i * 53) % 260} l ${(i % 2 ? 1 : -1) * 22} -6`, stroke: '#e8c766', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);

    // I cinque box con le porte a metà, il nome sopra e la renna affacciata
    const renne = [];
    const vuoti = [];
    RENNE_STALLA.forEach((renna, i) => {
        const bx = 160 + i * 320;
        const box = el('g', {}, svg);
        el('rect', { x: bx - 140, y: 300, width: 280, height: 330, fill: '#3a2416' }, box);
        el('rect', { x: bx - 120, y: 238, width: 240, height: 40, rx: 6, fill: '#fbf6ea', stroke: '#c9a227', 'stroke-width': 3 }, box);
        el('text', { x: bx, y: 267, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: renna.naso ? '#c0392b' : '#3a2416' }, box).textContent = renna.nome;
        const testa = testaRenna(box, bx, 492, renna);
        renne.push(testa);
        // Il cartello che compare quando le renne sono partite
        const vuoto = el('g', { class: 'box-vuoto', display: 'none' }, box);
        el('text', { x: bx, y: 470, 'text-anchor': 'middle', 'font-size': 60 }, vuoto).textContent = '🛷';
        vuoti.push(vuoto);
        // La porta a metà, con la X
        el('rect', { x: bx - 140, y: 500, width: 280, height: 130, fill: '#8a5a3c', stroke: '#5d3a22', 'stroke-width': 6 }, box);
        el('path', { d: `M${bx - 136} 504 L${bx + 136} 626 M${bx + 136} 504 L${bx - 136} 626`, stroke: '#5d3a22', 'stroke-width': 8 }, box);
        el('rect', { x: bx - 150, y: 490, width: 300, height: 16, fill: '#a0663a' }, box);
        // Il secchio con le carote
        el('path', { d: `M${bx + 70} 700 l 8 -50 h44 l 8 50 Z`, fill: '#8d98b8' }, box);
        [0, 12, 24].forEach(dx => el('path', { d: `M${bx + 84 + dx} 650 l 6 -26 l 6 26 Z`, fill: '#e67e22' }, box));
    });
    const partite = el('g', { display: 'none' }, svg);
    el('rect', { x: 400, y: 720, width: 800, height: 90, rx: 16, fill: '#fbf6ea', stroke: '#c9a227', 'stroke-width': 4 }, partite);
    el('text', { x: 800, y: 758, 'text-anchor': 'middle', 'font-size': 28, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#a3242c' }, partite).textContent = 'Siamo partite con Babbo Natale!';
    el('text', { x: 800, y: 792, 'text-anchor': 'middle', 'font-size': 22, 'font-style': 'italic', 'font-family': 'Georgia, serif', fill: '#3a2416' }, partite).textContent = 'Torniamo dopo aver portato tutti i regali 🎁';
    const cartello = el('g', {}, svg);
    el('rect', { x: 450, y: 740, width: 700, height: 70, rx: 14, fill: '#fbf6ea', stroke: '#c9a227', 'stroke-width': 3 }, cartello);
    el('text', { x: 800, y: 784, 'text-anchor': 'middle', 'font-size': 22, 'font-style': 'italic', 'font-family': 'Georgia, serif', fill: '#3a2416' }, cartello).textContent = 'Donato, Donnola, Freccia e Saltarello sono fuori ad allenarsi!';

    // Il fumetto con la storia della renna toccata
    const storia = Object.assign(document.createElement('div'), { className: 'storia-renna', hidden: true });
    storia.setAttribute('role', 'dialog');
    const nomeStoria = document.createElement('h3');
    const testoStoria = Object.assign(document.createElement('p'), { className: 'testo-storia' });
    const chiudiStoria = Object.assign(document.createElement('button'), { type: 'button', className: 'chiudi-storia', textContent: 'Ciao ciao! 👋' });
    const scegliStoria = Object.assign(document.createElement('button'), { type: 'button', className: 'chiudi-storia scegli-renna' });
    let rennaInStoria = null;
    scegliStoria.addEventListener('click', () => {
        onScegliRenna(rennaInStoria);
        testoStoria.textContent = 'Evviva! Ti aspetto fuori con la slitta: da ora ti porto io di casa in casa!';
        scegliStoria.hidden = true;
    });
    const bottoniStoria = Object.assign(document.createElement('div'), { className: 'bottoni-storia' });
    bottoniStoria.append(scegliStoria, chiudiStoria);
    storia.append(nomeStoria, testoStoria, bottoniStoria);
    nodo.append(storia);
    const nascondiStoria = () => { storia.hidden = true; storia.classList.remove('apre'); };
    chiudiStoria.addEventListener('click', nascondiStoria);
    storia.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') {
            evento.stopPropagation();
            nascondiStoria();
        }
    });

    // Toccata, la renna fa sì con la testa, suonano i campanelli, spunta un cuore e racconta la sua storia
    renne.forEach((r, i) => {
        const saluta = () => {
            const renna = RENNE_STALLA[i];
            nomeStoria.textContent = `${renna.naso ? '🔴' : '🦌'} ${renna.nome}`;
            testoStoria.textContent = renna.storia;
            // Cometa e Rudolph possono tirare la slitta del passeggero
            rennaInStoria = { Cometa: 'cometa', Rudolph: 'rudolph' }[renna.nome] ?? null;
            scegliStoria.hidden = !rennaInStoria;
            scegliStoria.textContent = `🛷 Scelgo ${renna.nome} per la mia slitta`;
            storia.setAttribute('aria-label', `La storia di ${renna.nome}`);
            storia.hidden = false;
            requestAnimationFrame(() => storia.classList.add('apre'));
            onTocco();
            r.classList.remove('saluta');
            r.getBBox();
            r.classList.add('saluta');
            setTimeout(() => r.classList.remove('saluta'), 1300);
        };
        r.addEventListener('click', saluta);
        r.addEventListener('keydown', evento => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                saluta();
            }
        });
    });

    return {
        nodo,
        // La notte del 24 le renne sono partite con la slitta
        mostra(sonoPartite) {
            nascondiStoria();
            renne.forEach(r => r.setAttribute('display', sonoPartite ? 'none' : 'inline'));
            vuoti.forEach(v => v.setAttribute('display', sonoPartite ? 'inline' : 'none'));
            partite.setAttribute('display', sonoPartite ? 'inline' : 'none');
            cartello.setAttribute('display', sonoPartite ? 'none' : 'inline');
            nodo.hidden = false;
            requestAnimationFrame(() => {
                nodo.classList.add('visibile');
                esci.focus({ preventScroll: true });
            });
        },
        nascondi() {
            nodo.classList.remove('visibile');
            nodo.hidden = true;
        }
    };
}

// ---------- Il mercatino degli addobbi ----------
// Due bancarelle nel quartiere di Babbo Natale: dentro, gli addobbi si "pagano" con un sorriso
// e si appendono all'alberello

const ADDOBBI = [
    { tipo: 'palla', colore: '#e0262f', prezzo: 'un sorriso 😊' },
    { tipo: 'stella', colore: '#f4d03f', prezzo: 'un abbraccio 🤗' },
    { tipo: 'campanella', colore: '#e8c766', prezzo: 'una canzone 🎵' },
    { tipo: 'palla', colore: '#3f7fd6', prezzo: 'un bacio 😘' },
    { tipo: 'bastoncino', colore: '#d62c2c', prezzo: 'una risata 😄' },
    { tipo: 'fiocco', colore: '#dff3ff', prezzo: 'un grazie 🙏' },
    { tipo: 'cuore', colore: '#e84393', prezzo: 'una carezza 🥰' },
    { tipo: 'palla', colore: '#2e7d4a', prezzo: 'un sorriso 😊' }
];

// Un addobbo centrato in (0,0), alto circa 34
function disegnaAddobbo(g, { tipo, colore }) {
    if (tipo === 'palla') {
        el('rect', { x: -4, y: -20, width: 8, height: 6, rx: 1, fill: '#c9a227' }, g);
        el('path', { d: 'M0 -20 q -4 -6 0 -9 q 4 3 0 9', stroke: '#c9a227', 'stroke-width': 1.5, fill: 'none' }, g);
        el('circle', { cx: 0, cy: 0, r: 15, fill: colore }, g);
        el('path', { d: 'M-15 0 q 15 7 30 0', stroke: '#fff3c4', 'stroke-width': 2, fill: 'none', opacity: 0.7 }, g);
        el('circle', { cx: -5, cy: -6, r: 4, fill: '#fff', opacity: 0.55 }, g);
    } else if (tipo === 'stella') {
        el('path', { d: stellaPiccola(0, 0, 17), fill: colore, stroke: '#c9a227', 'stroke-width': 1.5 }, g);
        el('circle', { cx: -3, cy: -4, r: 3, fill: '#fff', opacity: 0.6 }, g);
    } else if (tipo === 'campanella') {
        el('path', { d: 'M-14 8 Q-14 -14 0 -16 Q14 -14 14 8 Q16 12 18 12 H-18 Q-16 12 -14 8 Z', fill: colore, stroke: '#b8860b', 'stroke-width': 1.5 }, g);
        el('circle', { cx: 0, cy: 14, r: 4, fill: '#b8860b' }, g);
        el('path', { d: 'M-6 -18 q 6 -8 12 0', stroke: '#c0392b', 'stroke-width': 4, fill: 'none' }, g);
    } else if (tipo === 'bastoncino') {
        el('path', { d: 'M4 18 V-6 q 0 -12 -10 -12 q -10 0 -10 10', stroke: '#fff', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, g);
        el('path', { d: 'M4 18 V-6 q 0 -12 -10 -12 q -10 0 -10 10', stroke: colore, 'stroke-width': 7, fill: 'none', 'stroke-dasharray': '5 6' }, g);
    } else if (tipo === 'fiocco') {
        const f = el('g', { stroke: colore, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
        for (let i = 0; i < 6; i++) el('path', { d: 'M0 0 V-16 M0 -10 l -5 -5 M0 -10 l 5 -5', transform: `rotate(${i * 60})`, fill: 'none' }, f);
        el('circle', { r: 3, fill: '#bfe3ff' }, g);
    } else {
        el('path', { d: 'M0 14 C -22 0 -16 -18 0 -8 C 16 -18 22 0 0 14 Z', fill: colore, stroke: '#a3242c', 'stroke-width': 1.5 }, g);
        el('circle', { cx: -6, cy: -6, r: 3, fill: '#fff', opacity: 0.55 }, g);
    }
}

function disegnaMercatinoAddobbi(mondo, x, y, scala) {
    const m = el('g', { class: 'mercatino-addobbi', transform: `translate(${x} ${y}) scale(${scala})` }, mondo);
    [
        { nome: 'Addobbi', tetto: '#7d4e9e', banco: 'addobbi', venditore: { giacca: '#2e7d5b', cappello: '#c0392b', pelle: '#f6c9a8' }, dx: -64, dy: 0 },
        { nome: 'Candele', tetto: '#b5651d', banco: 'candele', venditore: { giacca: '#c0392b', cappello: '#2e7d4a', pelle: '#e3b393' }, dx: 64, dy: -10 }
    ].forEach(b => {
        const g = disegnaBancarella(m, 0, b);
        g.setAttribute('transform', `translate(${b.dx} ${b.dy}) scale(0.92)`);
        g.classList.add('negozio');
        Object.assign(g.dataset, { cx: x + b.dx * scala, cy: y + (b.dy - 50) * scala, larghezza: 140 * scala });
        g.setAttribute('tabindex', 0);
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `Bancarella degli ${b.nome.toLowerCase()}: entra a scegliere gli addobbi per il tuo albero`);
    });
    return m;
}

// Dentro la bancarella degli addobbi: si sceglie un addobbo e lo si appende all'alberello
function creaNegozio({ onEsci, onTocco }) {
    const nodo = Object.assign(document.createElement('div'), { className: 'interno negozio-dentro', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': "Dentro la bancarella degli addobbi, con l'alberello da decorare" });
    const esci = Object.assign(document.createElement('button'), { type: 'button', className: 'esci', textContent: '← Torna al villaggio' });
    const ricomincia = Object.assign(document.createElement('button'), { type: 'button', className: 'ricomincia', textContent: '🔄 Ricomincia l\'albero' });
    nodo.append(svg, esci, ricomincia);
    esci.addEventListener('click', onEsci);
    nodo.addEventListener('keydown', evento => { if (evento.key === 'Escape') onEsci(); });

    // Pareti di legno, lucine, ghirlande appese e mensole piene di addobbi
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: '#4a2c1c' }, svg);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#tex-assi)', opacity: 0.7 }, svg);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#tavole-parete)' }, svg);
    el('circle', { cx: 700, cy: 400, r: 700, fill: 'url(#alone)', opacity: 0.35 }, svg);
    el('path', { d: 'M-200 60 q 150 50 300 0 q 150 50 300 0 q 150 50 300 0 q 150 50 300 0 q 150 50 300 0 q 150 50 300 0', fill: 'none', stroke: '#1f5c34', 'stroke-width': 14 }, svg);
    for (let i = 0; i < 24; i++) el('circle', { class: 'pallina', cx: -170 + i * 75, cy: 70 + Math.sin(((i * 75 + 30) % 300) / 300 * Math.PI) * 24, r: 7, fill: COLORI_FESTA[i % 5], filter: 'url(#bagliore)', style: `animation-delay:${((i * 0.3) % 2).toFixed(1)}s` }, svg);
    [[120, 150], [120, 280], [540, 150], [540, 280]].forEach(([mx, my], m) => {
        el('rect', { x: mx - 20, y: my, width: 380, height: 12, fill: '#8a5a3c' }, svg);
        for (let k = 0; k < 7; k++) {
            const g = el('g', { transform: `translate(${mx + 10 + k * 52} ${my - 22}) scale(0.95)` }, svg);
            disegnaAddobbo(g, ADDOBBI[(k + m * 3) % ADDOBBI.length]);
        }
    });
    // Corone appese alla parete
    [[1000, 190], [1540, 190]].forEach(([cx, cy]) => {
        el('circle', { cx, cy, r: 46, fill: 'none', stroke: '#1f5c34', 'stroke-width': 22 }, svg);
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            el('circle', { cx: cx + Math.cos(a) * 46, cy: cy + Math.sin(a) * 46, r: 5, fill: i % 2 ? '#e0262f' : '#f4d03f' }, svg);
        }
        el('path', { d: `M${cx} ${cy + 46} l -16 22 l 10 2 Z M${cx} ${cy + 46} l 16 22 l -10 2 Z`, fill: '#c0392b' }, svg);
    });
    // La lavagnetta dei prezzi
    el('rect', { x: 960, y: 270, width: 300, height: 120, rx: 8, fill: '#8a5a3c' }, svg);
    el('rect', { x: 972, y: 282, width: 276, height: 96, rx: 4, fill: '#24302a' }, svg);
    el('text', { x: 1110, y: 322, 'text-anchor': 'middle', 'font-size': 30, 'font-family': "'Brush Script MT', cursive", fill: '#fdf6dc' }, svg).textContent = 'Addobbi di Natale';
    el('text', { x: 1110, y: 360, 'text-anchor': 'middle', 'font-size': 20, 'font-style': 'italic', 'font-family': 'Georgia, serif', fill: '#ffd36b' }, svg).textContent = 'si paga con un sorriso!';

    // L'elfo venditore, con il fumetto
    disegnaElfo(svg, 300, 600, 1.7, { giacca: '#2e7d5b', cappello: '#c0392b' }).braccio.classList.add('saluta');
    const fumetto = el('g', {}, svg);
    el('rect', { x: 380, y: 360, width: 360, height: 92, rx: 26, fill: '#fffdf6', stroke: '#c9a227', 'stroke-width': 3 }, fumetto);
    el('path', { d: 'M400 440 L360 470 L430 446 Z', fill: '#fffdf6', stroke: '#c9a227', 'stroke-width': 3, 'stroke-linejoin': 'round' }, fumetto);
    const righe = [0, 1].map(i => el('text', { x: 560, y: 398 + i * 32, 'text-anchor': 'middle', 'font-size': 22, 'font-family': 'Georgia, serif', fill: '#3b2416' }, fumetto));
    const dice = (a, b) => { righe[0].textContent = a; righe[1].textContent = b; };

    // Il bancone con la tovaglia e gli addobbi in vendita, ognuno con il cartellino del prezzo
    el('rect', { x: -1400, y: 600, width: 4400, height: 900, fill: '#6d4630' }, svg);
    el('rect', { x: -1400, y: 600, width: 4400, height: 900, fill: 'url(#tavole-pavimento)' }, svg);
    el('rect', { x: -1400, y: 588, width: 4400, height: 26, fill: '#8a5a3c' }, svg);
    el('rect', { x: -1400, y: 612, width: 4400, height: 70, fill: '#2e5b3f' }, svg);
    el('path', { d: 'M-1400 682 H3000', stroke: '#e8c766', 'stroke-width': 4, 'stroke-dasharray': '14 10' }, svg);
    // Candele accese sul bancone
    [[60, 560], [1000, 560]].forEach(([cx, cy]) => {
        el('circle', { class: 'luce-calda', cx, cy: cy - 40, r: 60, fill: 'url(#alone)', opacity: 0.7 }, svg);
        el('rect', { x: cx - 10, y: cy - 30, width: 20, height: 58, rx: 3, fill: '#fbf6ea' }, svg);
        el('path', { class: 'fiamma', d: `M${cx} ${cy - 54} q 9 12 0 24 q -9 -12 0 -24 Z`, fill: '#ffb347', filter: 'url(#bagliore)' }, svg);
    });
    const inVendita = ADDOBBI.map((addobbo, i) => {
        const x = 150 + i * 106, y = 740;
        const g = el('g', { class: 'addobbo-vendita', transform: `translate(${x} ${y})`, tabindex: 0, role: 'button', 'aria-label': `${addobbo.tipo}: costa ${addobbo.prezzo}. Tocca per appenderlo all'albero` }, svg);
        el('circle', { r: 40, fill: '#ffffff', opacity: 0.08 }, g);
        const figura = el('g', { transform: 'scale(1.6)' }, g);
        disegnaAddobbo(figura, addobbo);
        el('path', { d: 'M0 40 v14', stroke: '#c9a227', 'stroke-width': 1.5 }, g);
        el('rect', { x: -48, y: 54, width: 96, height: 30, rx: 5, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 1.5 }, g);
        el('text', { x: 0, y: 74, 'text-anchor': 'middle', 'font-size': 13, 'font-family': 'Georgia, serif', fill: '#3b2416' }, g).textContent = addobbo.prezzo;
        return { g, addobbo, x, y };
    });

    // L'alberello da decorare, nel suo vaso
    const ax = 1340, base = 840;
    el('rect', { x: ax - 56, y: base - 70, width: 112, height: 80, rx: 10, fill: '#a3242c' }, svg);
    el('rect', { x: ax - 64, y: base - 80, width: 128, height: 18, rx: 6, fill: '#c0392b' }, svg);
    el('rect', { x: ax - 12, y: base - 110, width: 24, height: 34, fill: '#5d3a22' }, svg);
    [[base - 100, 170, 160], [base - 210, 140, 150], [base - 310, 105, 140]].forEach(([yb, w, h]) => {
        el('path', { d: `M${ax - w} ${yb} q ${w} 26 ${w * 2} 0 L${ax} ${yb - h} Z`, fill: '#1f6b3a' }, svg);
        el('path', { d: `M${ax} ${yb + 12} q ${w * 0.6} -2 ${w} -12 L${ax} ${yb - h} Z`, fill: '#175a30' }, svg);
    });
    const stella = el('path', { class: 'stella-alberello', d: stellaPiccola(ax, base - 455, 30), fill: '#8d8d6a' }, svg);
    const POSTI = [[-110, -130], [0, -112], [110, -130], [-60, -170], [60, -170], [-90, -235], [0, -222], [90, -235], [-50, -275], [50, -275], [-50, -330], [40, -340], [0, -380]]
        .map(([dx, dy]) => [ax + dx, base + dy]);
    const appesi = el('g', {}, svg);
    let pieni = 0;

    function appendi({ addobbo, x, y }) {
        onTocco();
        if (pieni >= POSTI.length) return dice('Il tuo albero è pieno!', 'Puoi ricominciare quando vuoi 🎄');
        const [px, py] = POSTI[pieni++];
        const g = el('g', { transform: `translate(${x} ${y - 30}) scale(1.6)` }, appesi);
        disegnaAddobbo(g, addobbo);
        dice('Grazie per ' + addobbo.prezzo.replace(/ \S+$/, '') + '!', pieni < POSTI.length ? 'Scegline un altro!' : 'Che albero meraviglioso! ✨');
        // L'addobbo vola dal bancone al ramo
        const inizio = performance.now();
        const vola = adesso => {
            const t = Math.min(1, (adesso - inizio) / 650);
            const e = t * t * (3 - 2 * t);
            const cx = x + (px - x) * e, cy = (y - 30) + (py - (y - 30)) * e - Math.sin(t * Math.PI) * 120;
            const k = 1.6 + (1.1 - 1.6) * e;
            g.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${k.toFixed(2)})`);
            if (t < 1) requestAnimationFrame(vola);
        };
        requestAnimationFrame(vola);
        setTimeout(() => g.setAttribute('transform', `translate(${px} ${py}) scale(1.1)`), 900);
        if (pieni === POSTI.length) stella.classList.add('accesa');
    }
    inVendita.forEach(voce => {
        voce.g.addEventListener('click', () => appendi(voce));
        voce.g.addEventListener('keydown', evento => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                appendi(voce);
            }
        });
    });
    ricomincia.addEventListener('click', () => {
        appesi.replaceChildren();
        pieni = 0;
        stella.classList.remove('accesa');
        dice('Scegli un addobbo', "e appendilo al tuo albero!");
    });
    dice('Scegli un addobbo', "e appendilo al tuo albero!");

    return {
        nodo,
        mostra() {
            nodo.hidden = false;
            requestAnimationFrame(() => {
                nodo.classList.add('visibile');
                esci.focus({ preventScroll: true });
            });
        },
        nascondi() {
            nodo.classList.remove('visibile');
            nodo.hidden = true;
        }
    };
}

// ========== LE RICETTE ==========
// Toccando il dolce sul tavolino del salotto (o il cibo delle nonne al mercatino) si apre la ricetta

const ATTENZIONE_CALDO = 'Olio e zucchero bollenti: meglio farlo insieme a un adulto.';

const RICETTE = {
    'Biscotti a stella': {
        tempo: '30 minuti + 30 di riposo',
        ingredienti: ['250 g di farina', '125 g di burro morbido', '100 g di zucchero', '1 uovo', 'la scorza di un limone', 'zucchero a velo'],
        passi: ['Lavora il burro con lo zucchero, poi aggiungi l\'uovo e la scorza di limone.', 'Unisci la farina e impasta fino a ottenere una palla liscia. Mettila in frigo per 30 minuti.', 'Stendi l\'impasto alto mezzo centimetro e ritaglia le stelle con lo stampino.', 'Cuoci a 180 °C per 10-12 minuti, finché i bordi sono dorati.', 'Quando sono fredde, spolverale di zucchero a velo.']
    },
    'Omini di pan di zenzero': {
        tempo: '40 minuti + 1 ora di riposo',
        ingredienti: ['300 g di farina', '100 g di burro', '100 g di zucchero di canna', '3 cucchiai di miele', '1 uovo', '2 cucchiaini di zenzero in polvere', '1 cucchiaino di cannella', '½ cucchiaino di bicarbonato', 'per la glassa: zucchero a velo e un albume'],
        passi: ['Sciogli a fuoco basso il burro con lo zucchero e il miele, poi lascia intiepidire.', 'Aggiungi l\'uovo, la farina, le spezie e il bicarbonato e impasta.', 'Avvolgi l\'impasto nella pellicola e lascialo in frigo per un\'ora.', 'Stendilo alto mezzo centimetro e ritaglia gli omini.', 'Cuoci a 180 °C per 10 minuti. Da freddi, disegna occhi e bottoni con la glassa.']
    },
    'Bastoncini di zucchero': {
        tempo: '40 minuti',
        ingredienti: ['200 g di zucchero', '60 ml di acqua', '2 cucchiai di sciroppo di glucosio', 'qualche goccia di aroma di menta', 'colorante alimentare rosso'],
        passi: ['Cuoci zucchero, acqua e glucosio finché lo sciroppo arriva a 150 °C (serve il termometro da cucina).', 'Togli dal fuoco, aggiungi la menta e versa su un piano unto, dividendo in due parti.', 'Colora di rosso una parte e lascia l\'altra bianca.', 'Appena si possono maneggiare (con i guanti!), fai due cordoncini, attorcigliali insieme e piega la cima a bastone.'],
        nota: ATTENZIONE_CALDO
    },
    'Mandarini e noci': {
        tempo: '20 minuti',
        ingredienti: ['4 mandarini', '100 g di cioccolato fondente', '12 noci', '2 cucchiai di miele'],
        passi: ['Sbuccia i mandarini e dividili a spicchi.', 'Sciogli il cioccolato a bagnomaria.', 'Immergi metà di ogni spicchio nel cioccolato e appoggialo su carta da forno.', 'Sguscia le noci e passale nel miele.', 'Metti tutto in frigo per 10 minuti e servi in una ciotola, come si faceva una volta.']
    },
    'Cioccolata calda': {
        tempo: '10 minuti',
        ingredienti: ['500 ml di latte', '100 g di cioccolato fondente', '2 cucchiai di cacao amaro', '3 cucchiai di zucchero', '1 cucchiaio di amido di mais', 'panna montata'],
        passi: ['In un pentolino mescola cacao, zucchero e amido.', 'Aggiungi il latte freddo poco alla volta, mescolando bene per non fare grumi.', 'Scalda a fuoco basso e unisci il cioccolato a pezzetti.', 'Continua a mescolare per 5 minuti, finché diventa densa.', 'Versa nelle tazze e aggiungi un ciuffo di panna montata.']
    },
    'Torrone': {
        tempo: '1 ora e mezza',
        ingredienti: ['250 g di miele', '200 g di zucchero', '2 albumi', '400 g di mandorle pelate', '2 fogli di ostia', 'la scorza di un limone'],
        passi: ['Tosta le mandorle in forno a 160 °C per 10 minuti.', 'Scalda il miele a bagnomaria mescolando per circa un\'ora, finché diventa chiaro e denso.', 'Monta gli albumi a neve e uniscili al miele, sempre mescolando.', 'A parte cuoci lo zucchero con un goccio d\'acqua fino a sciroppo, poi uniscilo al composto con mandorle e scorza.', 'Stendi tra due fogli di ostia, schiaccia bene, lascia raffreddare e taglia a barrette.'],
        nota: ATTENZIONE_CALDO
    },
    'Ricciarelli': {
        tempo: '30 minuti + una notte di riposo',
        ingredienti: ['250 g di farina di mandorle', '200 g di zucchero a velo (e altro per rotolarli)', '2 albumi', 'la scorza grattugiata di un\'arancia', 'un pizzico di lievito per dolci'],
        passi: ['Monta gli albumi non troppo fermi.', 'Unisci la farina di mandorle, lo zucchero a velo, la scorza e il lievito.', 'Forma dei piccoli ovali e rotolali nello zucchero a velo.', 'Lasciali riposare su una teglia tutta la notte.', 'Cuoci a 160 °C per 12-15 minuti: devono restare morbidi e con le crepe in superficie.']
    },
    'Struffoli': {
        tempo: '1 ora',
        ingredienti: ['300 g di farina', '3 uova', '30 g di burro', '1 cucchiaio di zucchero', 'la scorza di un limone', 'olio per friggere', '200 g di miele', 'confettini colorati e canditi'],
        passi: ['Impasta farina, uova, burro, zucchero e scorza fino a una palla liscia.', 'Fai dei cordoncini sottili e tagliali a palline grandi come una nocciola.', 'Friggi le palline poco alla volta in olio caldo finché sono dorate.', 'Sciogli il miele in una pentola larga e mescolaci dentro gli struffoli.', 'Disponili a corona su un piatto e decora con confettini e canditi.'],
        nota: ATTENZIONE_CALDO
    },
    'Cavallucci': {
        tempo: '40 minuti',
        ingredienti: ['250 g di farina', '200 g di zucchero', '70 ml di acqua', '80 g di noci tritate', '50 g di canditi', '1 cucchiaino di semi di anice', 'un pizzico di cannella', 'un pizzico di bicarbonato'],
        passi: ['Sciogli lo zucchero nell\'acqua a fuoco basso.', 'Togli dal fuoco e aggiungi farina, noci, canditi, anice, cannella e bicarbonato.', 'Con le mani infarinate forma delle palline e schiacciale un po\'.', 'Cuoci a 160 °C per 15-20 minuti: devono restare chiari.']
    },
    'Roccocò': {
        tempo: '50 minuti',
        ingredienti: ['300 g di farina', '250 g di zucchero', '200 g di mandorle intere', '100 ml di succo d\'arancia', '1 cucchiaino di spezie miste (cannella, chiodi di garofano, noce moscata)', 'un pizzico di ammoniaca per dolci', '1 uovo per spennellare'],
        passi: ['Tosta le mandorle in forno per qualche minuto.', 'Impasta farina, zucchero, mandorle, succo d\'arancia, spezie e ammoniaca.', 'Fai dei cordoni grossi come un dito e chiudili ad anello.', 'Spennella con l\'uovo sbattuto.', 'Cuoci a 180 °C per circa 20 minuti: diventano belli croccanti.']
    },
    'Mostaccioli': {
        tempo: '50 minuti',
        ingredienti: ['300 g di farina', '150 g di miele', '80 g di zucchero', '30 g di cacao amaro', '80 ml di acqua o succo d\'arancia', '1 cucchiaino di spezie miste', 'un pizzico di ammoniaca per dolci', '200 g di cioccolato fondente per coprirli'],
        passi: ['Scalda un poco il miele con l\'acqua.', 'Impasta con farina, zucchero, cacao, spezie e ammoniaca.', 'Stendi alto un centimetro e taglia a rombi.', 'Cuoci a 180 °C per 15 minuti.', 'Da freddi, ricoprili di cioccolato fuso e lascialo indurire.']
    },
    'Castagne': {
        tempo: '35 minuti',
        ingredienti: ['500 g di castagne', 'un po\' di sale grosso', 'un canovaccio pulito'],
        passi: ['Incidi ogni castagna con un taglio a croce sulla parte bombata.', 'Mettile in una padella bucata sul fuoco vivo.', 'Fai saltare la padella ogni tanto per 25-30 minuti, finché la buccia si apre e si annerisce.', 'Avvolgile nel canovaccio per 5 minuti: si sbucciano meglio.', 'Mangiale calde calde!']
    },
    'Croccante': {
        tempo: '25 minuti',
        ingredienti: ['200 g di mandorle', '200 g di zucchero', 'qualche goccia di succo di limone', 'mezzo limone per stendere'],
        passi: ['Tosta le mandorle in una padella.', 'In un\'altra pentola scogli lo zucchero con il limone finché diventa un caramello color ambra.', 'Unisci le mandorle e mescola velocemente.', 'Versa su carta da forno e stendi con il mezzo limone.', 'Taglia a pezzetti quando è ancora tiepido.'],
        nota: ATTENZIONE_CALDO
    },
    'Panforte': {
        tempo: '1 ora',
        ingredienti: ['150 g di mandorle', '100 g di nocciole', '150 g di canditi', '80 g di farina', '100 g di miele', '100 g di zucchero', '1 cucchiaio di cacao', 'spezie: cannella, chiodi di garofano, noce moscata, un pizzico di pepe', 'un foglio di ostia'],
        passi: ['Tosta mandorle e nocciole e tritale grossolanamente.', 'Mescolale con canditi, farina, cacao e spezie.', 'Scalda miele e zucchero finché si sciolgono e versali sulla frutta secca.', 'Stendi il composto alto 2 cm in una tortiera foderata con l\'ostia.', 'Cuoci a 160 °C per 25 minuti e, da freddo, spolvera di zucchero a velo.']
    },
    'Cartellate': {
        tempo: '1 ora + una notte',
        ingredienti: ['500 g di farina', '100 ml di olio', '150 ml di vino bianco', 'un pizzico di sale', 'olio per friggere', 'vincotto o miele'],
        passi: ['Impasta farina, olio, vino e sale e stendi una sfoglia sottilissima.', 'Taglia delle strisce con la rotella dentellata.', 'Pizzica la striscia ogni 3 cm e arrotolala su sé stessa, come una rosa.', 'Lascia asciugare una notte, poi friggi fino a doratura.', 'Immergile nel vincotto o nel miele caldo.'],
        nota: ATTENZIONE_CALDO
    },
    'Susamielli': {
        tempo: '40 minuti',
        ingredienti: ['300 g di farina', '250 g di miele', '100 g di zucchero', '100 g di mandorle tritate', '1 cucchiaino di spezie miste', 'la scorza di un\'arancia', 'un pizzico di ammoniaca per dolci'],
        passi: ['Scalda il miele finché è fluido.', 'Impasta con farina, zucchero, mandorle, spezie, scorza e ammoniaca.', 'Fai dei bastoncini e piegali a forma di S.', 'Cuoci a 180 °C per 15 minuti.']
    },
    'Frutta martorana': {
        tempo: '1 ora',
        ingredienti: ['250 g di farina di mandorle', '250 g di zucchero a velo', '50 ml di acqua', 'colori alimentari', 'un pennellino'],
        passi: ['Sciogli lo zucchero nell\'acqua a fuoco basso.', 'Aggiungi la farina di mandorle e mescola finché la pasta si stacca dalla pentola.', 'Lavorala tiepida sul piano finché è liscia.', 'Modella piccoli frutti: arance, fragole, pere, ciliegie.', 'Lasciali asciugare e dipingili con i colori alimentari.']
    },
    'Pignolata': {
        tempo: '1 ora',
        ingredienti: ['300 g di farina', '4 uova', 'olio per friggere', 'per la glassa al cioccolato: 150 g di cioccolato fondente', 'per la glassa al limone: 200 g di zucchero a velo, 1 albume, succo di limone'],
        passi: ['Impasta farina e uova e fai tante palline piccole.', 'Friggile poco alla volta finché sono dorate e lasciale raffreddare.', 'Ricopri metà palline con il cioccolato fuso.', 'Ricopri le altre con la glassa al limone (zucchero a velo, albume e limone).', 'Disponile a piramide, metà nere e metà bianche.'],
        nota: ATTENZIONE_CALDO
    },
    'Zelten': {
        tempo: '1 ora + 2 ore di lievitazione',
        ingredienti: ['200 g di farina di segale', '100 g di farina 00', '150 g di fichi secchi', '100 g di uvetta', '100 g di noci', '100 g di datteri', '50 g di canditi', '150 ml di latte', '10 g di lievito di birra', '80 g di zucchero', 'un pizzico di cannella'],
        passi: ['Ammolla l\'uvetta e taglia a pezzetti fichi e datteri.', 'Sciogli il lievito nel latte tiepido.', 'Impasta farine, zucchero, cannella e latte, poi aggiungi tutta la frutta.', 'Forma delle pagnotte basse e decorale con mezze noci.', 'Lascia lievitare 2 ore e cuoci a 170 °C per circa 50 minuti.']
    },
    'Pandolce genovese': {
        tempo: '1 ora e mezza',
        ingredienti: ['500 g di farina', '150 g di burro', '150 g di zucchero', '1 uovo', '100 ml di latte', '1 bustina di lievito per dolci', '150 g di uvetta', '100 g di canditi', '50 g di pinoli', '1 cucchiaino di semi di finocchio', 'un cucchiaio di acqua di fiori d\'arancio'],
        passi: ['Lavora il burro con lo zucchero e l\'uovo.', 'Aggiungi farina, lievito, latte e acqua di fiori d\'arancio.', 'Unisci uvetta, canditi, pinoli e semi di finocchio.', 'Forma una pagnotta e incidi un triangolo sopra.', 'Cuoci a 180 °C per circa 50 minuti.']
    },
    'Panpepato': {
        tempo: '1 ora',
        ingredienti: ['200 g di miele', '100 g di mandorle', '100 g di nocciole', '100 g di noci', '50 g di uvetta', '50 g di canditi', '100 g di cioccolato fondente', '100 g di farina', '20 g di cacao', 'spezie e un pizzico di pepe'],
        passi: ['Tosta la frutta secca e tritala grossolanamente.', 'Sciogli il miele con il cioccolato.', 'Unisci frutta secca, uvetta, canditi, farina, cacao e spezie.', 'Forma delle pagnotte con le mani bagnate.', 'Cuoci a 160 °C per 25 minuti.']
    },
    'Tronchetto di Natale': {
        tempo: '1 ora',
        ingredienti: ['4 uova', '100 g di zucchero', '80 g di farina', '20 g di cacao', 'per la crema: 200 ml di panna e 100 g di cioccolato', 'per la copertura: 200 g di cioccolato e 100 ml di panna', 'zucchero a velo'],
        passi: ['Monta le uova con lo zucchero, poi aggiungi delicatamente farina e cacao.', 'Stendi su una teglia con carta da forno e cuoci a 200 °C per 8 minuti.', 'Arrotola subito la pasta calda in un canovaccio e lasciala raffreddare.', 'Srotolala, farcisci con la crema al cioccolato e riarrotola.', 'Ricopri con il cioccolato fuso con la panna, fai le righe della corteccia con una forchetta e spolvera la "neve".']
    },
    'Pandoro': {
        tempo: '20 minuti + 2 ore in frigo',
        ingredienti: ['1 pandoro', '250 g di mascarpone', '200 ml di panna', '60 g di zucchero', 'gocce di cioccolato', 'zucchero a velo'],
        passi: ['Monta la panna con lo zucchero e unisci il mascarpone.', 'Taglia il pandoro a fette orizzontali, seguendo le punte della stella.', 'Ricomponilo spalmando la crema tra una fetta e l\'altra e girando ogni fetta, così le punte formano un albero.', 'Aggiungi le gocce di cioccolato e lascia in frigo 2 ore.', 'Prima di servire, una nevicata di zucchero a velo.']
    },
    'Panettone': {
        tempo: '30 minuti + 3 ore in frigo',
        ingredienti: ['1 panettone', '250 g di mascarpone', '200 ml di panna', '60 g di zucchero', '50 g di gocce di cioccolato'],
        passi: ['Taglia il panettone a fette di un centimetro.', 'Fodera una ciotola con la pellicola e poi con le fette di panettone.', 'Monta la panna con lo zucchero, unisci mascarpone e gocce di cioccolato.', 'Riempi la ciotola con la crema e chiudi con altre fette.', 'Lascia in frigo 3 ore, poi capovolgi su un piatto: ecco lo zuccotto di panettone!']
    },
    // Le ricette delle nonne del mercatino
    'Caldarroste della nonna': {
        tempo: '35 minuti',
        ingredienti: ['castagne grosse e lucide', 'una padella con i buchi', 'un canovaccio umido'],
        passi: ['Incidi le castagne con un taglio a croce.', 'Mettile nella padella bucata sul fuoco e falle saltare spesso.', 'Dopo 25-30 minuti la buccia è scura e aperta.', 'Avvolgile nel canovaccio umido per qualche minuto: così la pellicina viene via da sola.', 'Servile nel cartoccio di carta, calde calde.']
    },
    'Cioccolata della nonna': {
        tempo: '15 minuti',
        ingredienti: ['1 litro di latte intero', '150 g di cioccolato fondente', '3 cucchiai di cacao amaro', '4 cucchiai di zucchero', '2 cucchiai di farina o fecola', 'panna da montare'],
        passi: ['Nel paiolo mescola cacao, zucchero e farina.', 'Aggiungi il latte un poco alla volta, mescolando con il cucchiaio di legno.', 'Metti sul fuoco basso e aggiungi il cioccolato a pezzi.', 'Mescola piano piano finché la cioccolata vela il cucchiaio.', 'Servila con la panna montata e un biscotto.']
    },
    'Frittelle della nonna': {
        tempo: '30 minuti + 1 ora e mezza di lievitazione',
        ingredienti: ['250 g di farina', '10 g di lievito di birra', '150 ml di latte tiepido', '2 uova', '50 g di zucchero', '50 g di uvetta', 'la scorza di un limone', 'olio per friggere', 'zucchero per spolverare'],
        passi: ['Sciogli il lievito nel latte tiepido.', 'Mescola con farina, uova, zucchero, scorza e uvetta fino a una pastella densa.', 'Copri e lascia lievitare un\'ora e mezza.', 'Con due cucchiai fai cadere delle palline nell\'olio caldo e friggi finché sono dorate.', 'Rotolale nello zucchero e mangiale tiepide.'],
        nota: ATTENZIONE_CALDO
    }
};

// Il suono dello scarto: un fruscio di carta e un arpeggio di campanelline che sale
function suonaMeraviglia() {
    const Contesto = window.AudioContext || window.webkitAudioContext;
    if (!Contesto) return;
    const contesto = new Contesto();
    const t0 = contesto.currentTime + 0.05;
    // Il fruscio della carta strappata
    const buffer = contesto.createBuffer(1, Math.ceil(contesto.sampleRate * 0.4), contesto.sampleRate);
    const dati = buffer.getChannelData(0);
    for (let i = 0; i < dati.length; i++) dati[i] = (Math.random() * 2 - 1) * (1 - i / dati.length);
    const rumore = contesto.createBufferSource();
    rumore.buffer = buffer;
    const filtro = contesto.createBiquadFilter();
    filtro.type = 'highpass';
    filtro.frequency.value = 1800;
    const gr = contesto.createGain();
    gr.gain.value = 0.12;
    rumore.connect(filtro).connect(gr).connect(contesto.destination);
    rumore.start(t0 + 0.4);
    // Le campanelline
    ['C6', 'E6', 'G6', 'C7', 'E7', 'G7'].forEach((nota, i) => {
        const t = t0 + 0.45 + i * 0.09;
        [[1, 0.16], [2.76, 0.05], [5.4, 0.02]].forEach(([multiplo, volume]) => {
            const o = contesto.createOscillator();
            const g = contesto.createGain();
            o.type = 'sine';
            o.frequency.value = frequenza(nota) * multiplo;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(volume, t + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
            o.connect(g).connect(contesto.destination);
            o.start(t);
            o.stop(t + 1.3);
        });
    });
    setTimeout(() => contesto.close(), 2600);
}

// La scheda della ricetta: un foglio di quaderno che compare sopra la stanza
function creaRicettario(nodo) {
    const scheda = Object.assign(document.createElement('div'), { className: 'scheda-ricetta', hidden: true });
    scheda.setAttribute('role', 'dialog');
    scheda.setAttribute('aria-label', 'Ricetta');
    nodo.append(scheda);
    const chiudi = () => {
        scheda.classList.remove('apre');
        scheda.hidden = true;
    };
    scheda.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') {
            evento.stopPropagation();
            chiudi();
        }
    });
    return {
        mostra(nome) {
            const r = RICETTE[nome];
            if (!r) return;
            const crea = (tag, testo, classe) => Object.assign(document.createElement(tag), { textContent: testo ?? '', className: classe ?? '' });
            const ingredienti = crea('ul');
            r.ingredienti.forEach(i => ingredienti.append(crea('li', i)));
            const passi = crea('ol');
            r.passi.forEach(p => passi.append(crea('li', p)));
            const bottone = crea('button', 'Chiudi la ricetta', 'chiudi-ricetta');
            bottone.type = 'button';
            bottone.addEventListener('click', chiudi);
            scheda.replaceChildren(
                crea('p', '📖 La ricetta', 'etichetta-ricetta'),
                crea('h3', nome.replace(' della nonna', '')),
                crea('p', `⏱ ${r.tempo}`, 'tempo-ricetta'),
                crea('h4', 'Ingredienti'), ingredienti,
                crea('h4', 'Come si fa'), passi,
                ...(r.nota ? [crea('p', `⚠️ ${r.nota}`, 'nota-ricetta')] : []),
                bottone
            );
            scheda.hidden = false;
            scheda.scrollTop = 0;
            requestAnimationFrame(() => scheda.classList.add('apre'));
            bottone.focus({ preventScroll: true });
        },
        nascondi: chiudi,
        aperta: () => !scheda.hidden
    };
}

// ---------- Il tour del laboratorio in minibus ----------
// Fiocco, l'elfo autista, accompagna in minibus lungo la fabbrica: dalla letterina alla slitta

const TAPPE_TOUR = [
    { titolo: 'Si parte!', testo: 'Ciao, sono Fiocco, l\'elfo autista! Allacciate le cinture: vi porto a vedere come nasce un regalo, dalla letterina fino alla slitta di Babbo Natale.' },
    { titolo: '1 · Le letterine', testo: 'Tutto comincia qui: gli elfi postini aprono le letterine una per una e scrivono sul grande registro i desideri di ognuno.' },
    { titolo: '2 · Il progetto', testo: 'Gli elfi progettisti disegnano il giocattolo sul foglio blu, con tutte le misure. Guardate: oggi tocca a un trenino!' },
    { titolo: '3 · La falegnameria', testo: 'Qui si costruiscono i pezzi: si sega il legno, si lima, si inchioda. Che profumo di bosco, vero?' },
    { titolo: '4 · I colori', testo: 'Ed ecco la stanza più allegra! I giocattoli prendono colore: rosso, verde, blu e un tocco d\'oro.' },
    { titolo: '5 · Il collaudo', testo: 'Ogni giocattolo viene provato con cura: il trenino deve fare il giro della pista senza fermarsi. Promosso!' },
    { titolo: '6 · L\'impacchettatrice', testo: 'Poi si incarta: carta colorata, nastro e un bel fiocco. La macchina fa tutto da sola… quasi!' },
    { titolo: '7 · La slitta', testo: 'Infine i pacchi vanno nei sacchi, città per città, e salgono sulla slitta di Babbo Natale. Il tour è finito: grazie per essere saliti!' }
];

// La fabbrica del tour del laboratorio, con il minibus di Fiocco
function disegnaFabbrica(svg, { centro, LUNGO, tappe }) {
    // La fabbrica lunghissima: pareti di legno, lucine, pavimento e la strada del minibus
    el('rect', { x: -400, y: -400, width: LUNGO + 800, height: 1700, fill: '#6d4630' }, svg);
    el('rect', { x: -400, y: -400, width: LUNGO + 800, height: 1700, fill: 'url(#tex-assi)', opacity: 0.7 }, svg);
    let festone = 'M-400 40';
    for (let x = -400; x < LUNGO + 400; x += 300) festone += ' q 150 50 300 0';
    el('path', { d: festone, fill: 'none', stroke: '#1f5c34', 'stroke-width': 14 }, svg);
    for (let x = -250, i = 0; x < LUNGO + 400; x += 75, i++) el('circle', { class: 'pallina', cx: x, cy: 52 + Math.sin(((x + 400) % 300) / 300 * Math.PI) * 22, r: 7, fill: COLORI_FESTA[i % 5], style: `animation-delay:${((i * 0.3) % 2).toFixed(1)}s` }, svg);
    el('rect', { x: -400, y: 690, width: LUNGO + 800, height: 700, fill: '#5d3a22' }, svg);
    el('rect', { x: -400, y: 740, width: LUNGO + 800, height: 80, fill: '#4a4a52' }, svg);
    el('path', { d: `M-400 780 H${LUNGO + 400}`, stroke: '#f4d03f', 'stroke-width': 5, 'stroke-dasharray': '40 30' }, svg);

    // I cartelli delle tappe
    tappe.forEach((tappa, i) => {
        const cx = centro(i) + 150;
        el('rect', { x: cx - 170, y: 110, width: 340, height: 54, rx: 10, fill: '#a3242c', stroke: '#e8c766', 'stroke-width': 3 }, svg);
        el('text', { x: cx, y: 146, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#fffaf0' }, svg).textContent = tappa.titolo;
    });

    const tavolo = (x, y, w) => {
        el('rect', { x: x - w / 2, y: y - 14, width: w, height: 14, fill: '#a0663a' }, svg);
        el('path', { d: `M${x - w / 2 + 12} ${y} v70 M${x + w / 2 - 12} ${y} v70`, stroke: '#6d4630', 'stroke-width': 10 }, svg);
    };
    const lettera = (x, y, r = 0) => {
        const g = el('g', { transform: `rotate(${r} ${x} ${y})` }, svg);
        el('rect', { x: x - 22, y: y - 14, width: 44, height: 28, rx: 2, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 1.5 }, g);
        el('path', { d: `M${x - 22} ${y - 14} l22 15 l22 -15`, stroke: '#c9a227', 'stroke-width': 1.5, fill: 'none' }, g);
    };

    // 0 · L'ingresso del tour
    {
        const cx = centro(0) + 150;
        el('path', { d: `M${cx - 220} 690 V360 Q${cx} 200 ${cx + 220} 360 V690 H${cx + 170} V380 Q${cx} 260 ${cx - 170} 380 V690 Z`, fill: '#2e7d4a', stroke: '#e8c766', 'stroke-width': 4 }, svg);
        el('text', { x: cx, y: 330, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#ffe9a8' }, svg).textContent = 'TOUR DEGLI ELFI';
        for (let k = 0; k < 9; k++) el('circle', { class: 'pallina', cx: cx - 200 + k * 50, cy: 372 - Math.sin((k / 8) * Math.PI) * 120, r: 8, fill: COLORI_FESTA[k % 5] }, svg);
    }
    // 1 · Le letterine: elfi postini che leggono e scrivono sul registro
    {
        const cx = centro(1) + 150;
        tavolo(cx, 620, 420);
        [[-150, 596, -8], [-90, 592, 6], [-30, 598, -3], [120, 594, 10]].forEach(([dx, y, r]) => lettera(cx + dx, y, r));
        el('rect', { x: cx + 20, y: 560, width: 80, height: 50, rx: 3, fill: '#8a1d22' }, svg);
        el('rect', { x: cx + 26, y: 566, width: 68, height: 38, fill: '#fbf6ea' }, svg);
        disegnaElfo(svg, cx - 110, 700, 1.5, { giacca: '#2e7d5b', cappello: '#c0392b' }).braccio.classList.add('saluta');
        disegnaElfo(svg, cx + 150, 700, 1.5, { giacca: '#7d4e9e', cappello: '#f4d03f', capelli: '#2b1d14' }).braccio.classList.add('martella');
        [[cx - 260, 690], [cx + 300, 690]].forEach(([sx, sy]) => {
            el('path', { d: `M${sx - 50} ${sy} q -8 -90 30 -110 q 20 -6 40 0 q 38 20 30 110 Z`, fill: '#c9a27c' }, svg);
            lettera(sx, sy - 115, -12);
            lettera(sx + 14, sy - 108, 14);
        });
    }
    // 2 · Il progetto: il tavolo da disegno con il foglio blu del trenino
    {
        const cx = centro(2) + 150;
        el('path', { d: `M${cx - 160} 640 L${cx - 120} 420 L${cx + 160} 420 L${cx + 200} 640 Z`, fill: '#a0663a' }, svg);
        el('path', { d: `M${cx - 140} 620 L${cx - 106} 440 L${cx + 146} 440 L${cx + 180} 620 Z`, fill: '#2d5fa8' }, svg);
        const progetto = el('g', { stroke: '#e8f1ff', 'stroke-width': 3, fill: 'none' }, svg);
        el('rect', { x: cx - 70, y: 500, width: 80, height: 60 }, progetto);
        el('rect', { x: cx + 10, y: 520, width: 70, height: 40 }, progetto);
        el('rect', { x: cx - 60, y: 470, width: 20, height: 30 }, progetto);
        [cx - 50, cx - 10, cx + 50].forEach(rx => el('circle', { cx: rx, cy: 574, r: 14 }, progetto));
        el('path', { d: `M${cx - 90} 600 h180 M${cx - 90} 594 v12 M${cx + 90} 594 v12`, stroke: '#e8f1ff', 'stroke-width': 2 }, svg);
        el('text', { x: cx, y: 616, 'text-anchor': 'middle', 'font-size': 14, fill: '#e8f1ff', 'font-family': 'Georgia, serif' }, svg).textContent = 'TRENINO · 30 cm';
        el('path', { d: `M${cx - 120} 640 v60 M${cx + 160} 640 v60`, stroke: '#6d4630', 'stroke-width': 10 }, svg);
        const matita = disegnaElfo(svg, cx + 280, 700, 1.5, { giacca: '#c0392b', cappello: '#2e7d4a' });
        el('path', { d: 'M30 -48 l 14 -16', stroke: '#f4d03f', 'stroke-width': 4, 'stroke-linecap': 'round' }, matita.braccio);
        matita.braccio.classList.add('martella');
        el('path', { d: `M${cx - 200} 300 v60 l -30 40 h60 Z`, fill: '#2a2a2e' }, svg);
        el('circle', { class: 'luce-calda', cx: cx - 200, cy: 430, r: 80, fill: 'url(#alone)', opacity: 0.6 }, svg);
    }
    // 3 · La falegnameria: si sega e si martella
    {
        const cx = centro(3) + 150;
        tavolo(cx, 620, 440);
        el('rect', { x: cx - 180, y: 582, width: 200, height: 24, fill: '#d9a066' }, svg);
        el('path', { d: `M${cx - 170} 590 h180 M${cx - 170} 598 h180`, stroke: '#b8803f', 'stroke-width': 1.5 }, svg);
        const sega = el('g', { class: 'sega' }, svg);
        el('path', { d: `M${cx - 60} 560 h90 l -6 22 h-84 Z`, fill: '#b8c2d8' }, sega);
        el('path', { d: `M${cx - 60} 582 l 6 6 l 6 -6 l 6 6 l 6 -6 l 6 6 l 6 -6 l 6 6 l 6 -6 l 6 6 l 6 -6 l 6 6 l 6 -6 l 6 6`, stroke: '#8d98b8', 'stroke-width': 2, fill: 'none' }, sega);
        el('rect', { x: cx + 30, y: 548, width: 34, height: 26, rx: 6, fill: '#c0392b' }, sega);
        for (let k = 0; k < 6; k++) el('circle', { class: 'segatura', cx: cx - 20 + k * 6, cy: 610, r: 3, fill: '#e3c49a', style: `animation-delay:${(k * 0.2).toFixed(1)}s` }, svg);
        disegnaElfo(svg, cx - 150, 700, 1.5, { giacca: '#2e7d5b', cappello: '#f4d03f' }).braccio.classList.add('martella');
        const martello = disegnaElfo(svg, cx + 230, 700, 1.5, { giacca: '#2d4f8a', cappello: '#c0392b', capelli: '#5a3b2a' });
        el('path', { d: 'M30 -48 l 18 -18', stroke: '#6d4630', 'stroke-width': 4, 'stroke-linecap': 'round' }, martello.braccio);
        el('rect', { x: 40, y: -76, width: 22, height: 10, rx: 2, fill: '#5d6280', transform: 'rotate(40 51 -71)' }, martello.braccio);
        martello.braccio.classList.add('martella');
        [[cx + 330, 690], [cx + 380, 690], [cx + 355, 660]].forEach(([px, py]) => el('rect', { x: px - 22, y: py - 30, width: 44, height: 30, fill: '#d9a066', stroke: '#b8803f', 'stroke-width': 2 }, svg));
    }
    // 4 · I colori: giocattoli che si colorano, barattoli e pennelli
    {
        const cx = centro(4) + 150;
        tavolo(cx, 620, 460);
        [0, 1, 2, 4].forEach((g, k) => GIOCATTOLI[g](el('g', { transform: `translate(${cx - 170 + k * 110} 606) scale(1.5)` }, svg)));
        ['#e0262f', '#2e7d4a', '#3f7fd6', '#f4d03f', '#e84393'].forEach((c, k) => {
            const bx = cx - 200 + k * 90;
            el('path', { d: `M${bx - 24} 690 l 4 -50 h40 l 4 50 Z`, fill: '#b8c2d8' }, svg);
            el('ellipse', { cx: bx, cy: 640, rx: 22, ry: 6, fill: c }, svg);
            el('path', { d: `M${bx - 16} 642 q 2 14 6 16`, stroke: c, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, svg);
        });
        const pittore = disegnaElfo(svg, cx + 300, 700, 1.5, { giacca: '#f4d03f', cappello: '#2d4f8a', capelli: '#c9984a' });
        el('path', { d: 'M30 -48 l 16 -20', stroke: '#8a5a3c', 'stroke-width': 4, 'stroke-linecap': 'round' }, pittore.braccio);
        el('circle', { cx: 46, cy: -68, r: 4, fill: '#e0262f' }, pittore.braccio);
        pittore.braccio.classList.add('martella');
    }
    // 5 · Il collaudo: il trenino gira sulla pista, l'elfo controlla
    {
        const cx = centro(5) + 150;
        el('ellipse', { cx, cy: 640, rx: 220, ry: 50, fill: 'none', stroke: '#8d98b8', 'stroke-width': 10 }, svg);
        el('ellipse', { cx, cy: 640, rx: 220, ry: 50, fill: 'none', stroke: '#6d4630', 'stroke-width': 4, 'stroke-dasharray': '6 10' }, svg);
        const giro = el('g', { class: 'trenino-collaudo' }, svg);
        el('animateMotion', { dur: '6s', repeatCount: 'indefinite', path: `M${cx + 220} 640 A220 50 0 1 1 ${cx - 220} 640 A220 50 0 1 1 ${cx + 220} 640`, rotate: 'auto' }, giro);
        GIOCATTOLI[1](el('g', { transform: 'translate(0 8) scale(1.1)' }, giro));
        const ispettore = disegnaElfo(svg, cx + 330, 700, 1.5, { giacca: '#16a085', cappello: '#c0392b' });
        el('rect', { x: 22, y: -64, width: 26, height: 32, rx: 2, fill: '#fbf6ea', stroke: '#8a5a3c', 'stroke-width': 2 }, ispettore.braccio);
        el('path', { d: 'M28 -48 l 5 6 l 9 -12', stroke: '#2e7d4a', 'stroke-width': 3, fill: 'none' }, ispettore.braccio);
        el('text', { x: cx + 330, y: 470, 'text-anchor': 'middle', 'font-size': 60, fill: '#7dff9a', class: 'promosso' }, svg).textContent = '✓';
        GIOCATTOLI[2](el('g', { class: 'palla-rimbalza', transform: `translate(${cx - 300} 690) scale(1.4)` }, svg));
    }
    // 6 · L'impacchettatrice
    {
        const cx = centro(6) + 150;
        el('rect', { x: cx - 120, y: 430, width: 240, height: 240, rx: 16, fill: '#c0392b', stroke: '#8a1d22', 'stroke-width': 4 }, svg);
        el('rect', { x: cx - 100, y: 590, width: 200, height: 70, rx: 8, fill: '#2a180e' }, svg);
        el('text', { x: cx, y: 470, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#ffe9a8' }, svg).textContent = 'IMPACCHETTATRICE';
        [[cx - 40, 530, 28], [cx + 44, 524, 20]].forEach(([gx, gy, r], i) => {
            const ingranaggio = el('g', { class: i ? 'ingranaggio inverso' : 'ingranaggio' }, el('g', { transform: `translate(${gx} ${gy})` }, svg));
            el('circle', { r, fill: '#e8c766' }, ingranaggio);
            for (let k = 0; k < 8; k++) el('rect', { x: -4, y: -r - 6, width: 8, height: 10, fill: '#e8c766', transform: `rotate(${k * 45})` }, ingranaggio);
            el('circle', { r: r * 0.35, fill: '#8a1d22' }, ingranaggio);
        });
        GIOCATTOLI[0](el('g', { transform: `translate(${cx - 230} 690) scale(1.6)` }, svg));
        [[cx + 200, 690, 0], [cx + 260, 690, 2], [cx + 230, 640, 4]].forEach(([px, py, i]) => pacco(el('g', { transform: `translate(${px} ${py}) scale(1.4)` }, svg), CARTE_PACCHI[i]));
    }
    // 7 · I sacchi delle città e la slitta di Babbo Natale
    {
        const cx = centro(7) + 150;
        ['ROMA', 'MILANO', 'NAPOLI', 'TORINO', 'PALERMO'].forEach((citta, k) => {
            const sx = cx - 260 + k * 85, sy = 690;
            el('path', { d: `M${sx - 36} ${sy} q -6 -70 22 -86 q 14 -4 28 0 q 28 16 22 86 Z`, fill: '#c9a27c' }, svg);
            el('rect', { x: sx - 30, y: sy - 50, width: 60, height: 18, rx: 3, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 1.5 }, svg);
            el('text', { x: sx, y: sy - 37, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#a3242c' }, svg).textContent = citta;
        });
        const slitta = el('g', { transform: `translate(${cx + 300} 640) scale(2.2)` }, svg);
        el('path', { d: 'M-50 -2 Q-56 -26 -40 -28 L-28 -20 L8 -20 Q20 -20 22 -8 L18 4 L-44 4 Z', fill: '#b3202b' }, slitta);
        el('path', { d: 'M-50 -2 Q-56 -26 -40 -28 L-28 -20 L8 -20 Q20 -20 22 -8', stroke: '#e8c766', 'stroke-width': 2.4, fill: 'none' }, slitta);
        el('path', { d: 'M-44 4 L-40 10 M14 4 L10 10 M-58 10 H22 Q34 10 32 0', stroke: '#e8c766', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, slitta);
        el('path', { d: 'M-40 -22 q -10 -22 6 -30 q 12 -4 18 6 q 6 14 -6 26 Z', fill: '#8a5a36' }, slitta);
        [[-36, -50, '#2e7d5b'], [-26, -54, '#f4d03f'], [-30, -46, '#c0392b'], [-16, -40, '#3f7fd6']].forEach(([x, y, c]) => el('rect', { x: x - 5, y: y - 5, width: 10, height: 9, fill: c }, slitta));
        disegnaElfo(svg, cx + 120, 700, 1.4, { giacca: '#a3242c', cappello: '#2e7d4a' }).braccio.classList.add('saluta');
    }

    // Il minibus di Fiocco: giallo, con la corona sul muso e l'elfo autista al volante
    const bus = el('g', {}, svg);
    el('ellipse', { cx: 0, cy: 8, rx: 190, ry: 14, fill: 'rgba(0,0,0,0.3)' }, bus);
    el('path', { d: 'M-180 -10 V-130 Q-180 -150 -160 -150 H120 Q160 -150 176 -110 L190 -60 V-10 Z', fill: '#f4c430', stroke: '#b8860b', 'stroke-width': 4 }, bus);
    el('rect', { x: -180, y: -40, width: 370, height: 16, fill: '#c0392b' }, bus);
    [-160, -100, -40, 20].forEach(fx => el('rect', { x: fx, y: -136, width: 50, height: 60, rx: 8, fill: '#bfe3ff', stroke: '#b8860b', 'stroke-width': 3 }, bus));
    el('path', { d: 'M88 -136 H130 Q156 -136 168 -104 L176 -76 H88 Z', fill: '#bfe3ff', stroke: '#b8860b', 'stroke-width': 3 }, bus);
    // Fiocco al volante
    el('circle', { cx: 122, cy: -96, r: 15, fill: '#f6c9a8' }, bus);
    el('path', { d: 'M108 -104 L132 -140 L138 -104 Z', fill: '#c0392b' }, bus);
    el('rect', { x: 106, y: -108, width: 34, height: 6, rx: 3, fill: '#fbfdff' }, bus);
    el('circle', { cx: 132, cy: -142, r: 4, fill: '#e2b93b' }, bus);
    el('circle', { cx: 128, cy: -97, r: 2, fill: '#3b2412' }, bus);
    el('path', { d: 'M124 -90 q 5 4 10 0', stroke: '#7a3c12', 'stroke-width': 1.6, fill: 'none' }, bus);
    el('circle', { cx: 150, cy: -82, r: 10, fill: 'none', stroke: '#3a3a44', 'stroke-width': 3 }, bus);
    el('text', { x: -40, y: -50, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#8a1d22' }, bus).textContent = 'TOUR DEGLI ELFI';
    el('circle', { cx: 184, cy: -30, r: 7, fill: '#fff3b0' }, bus);
    el('circle', { cx: 178, cy: -64, r: 12, fill: 'none', stroke: '#1f5c34', 'stroke-width': 6 }, bus);
    el('circle', { cx: 178, cy: -52, r: 3, fill: '#c0392b' }, bus);
    const ruote = [-110, 110].map(rx => {
        const r = el('g', { class: 'ruota-bus' }, el('g', { transform: `translate(${rx} -6)` }, bus));
        el('circle', { r: 28, fill: '#2a2a2e' }, r);
        el('circle', { r: 13, fill: '#b8c2d8' }, r);
        el('path', { d: 'M-13 0 H13 M0 -13 V13', stroke: '#5d6280', 'stroke-width': 3 }, r);
        return r;
    });

    return bus;
}

function creaTour(contenitore, opzioni = {}) {
    const tappe = opzioni.tappe ?? TAPPE_TOUR;
    const nodo = Object.assign(document.createElement('div'), { className: 'tour', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': opzioni.etichetta ?? 'Il tour del laboratorio in minibus' });
    const pannello = Object.assign(document.createElement('div'), { className: 'tour-pannello' });
    const titolo = Object.assign(document.createElement('p'), { className: 'tour-titolo' });
    const testo = Object.assign(document.createElement('p'), { className: 'tour-testo' });
    const comandi = Object.assign(document.createElement('div'), { className: 'tour-comandi' });
    const indietro = Object.assign(document.createElement('button'), { type: 'button', textContent: '◀ Indietro' });
    const avanti = Object.assign(document.createElement('button'), { type: 'button', className: 'tour-avanti', textContent: 'Avanti ▶' });
    const esci = Object.assign(document.createElement('button'), { type: 'button', className: 'esci', textContent: '✕ Esci dal tour' });
    comandi.append(indietro, avanti);
    pannello.append(titolo, testo, comandi);
    nodo.append(svg, pannello, esci);
    contenitore.append(nodo);

    const PASSO = 1000, LUNGO = PASSO * tappe.length + 1200;
    const centro = i => 600 + i * PASSO;

    // La scena e il mezzo (minibus, rasaghiaccio…) li disegna chi usa il tour
    const bus = (opzioni.disegna ?? disegnaFabbrica)(svg, { centro, LUNGO, tappe });

    // Il viaggio: la vista e il minibus avanzano insieme da una tappa all'altra
    let tappa = 0, vista = centro(0) - 600, animazione = null;
    const posiziona = () => {
        svg.setAttribute('viewBox', `${vista.toFixed(1)} 0 1600 900`);
        bus.setAttribute('transform', `translate(${(vista + 330).toFixed(1)} 772)`);
    };
    const racconta = () => {
        titolo.textContent = tappe[tappa].titolo;
        testo.textContent = tappe[tappa].testo;
        indietro.disabled = tappa === 0;
        avanti.textContent = tappa === tappe.length - 1 ? 'Fine del tour 🎉' : 'Avanti ▶';
    };
    const vai = nuova => {
        tappa = Math.max(0, Math.min(tappe.length - 1, nuova));
        racconta();
        cancelAnimationFrame(animazione);
        const da = vista, a = centro(tappa) - 600;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            vista = a;
            return posiziona();
        }
        nodo.classList.add('in-viaggio');
        const inizio = performance.now();
        const passo = adesso => {
            const t = Math.min(1, (adesso - inizio) / 1800);
            vista = da + (a - da) * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
            posiziona();
            if (t < 1) animazione = requestAnimationFrame(passo);
            else nodo.classList.remove('in-viaggio');
        };
        animazione = requestAnimationFrame(passo);
    };
    avanti.addEventListener('click', () => (tappa === tappe.length - 1 ? chiudi() : vai(tappa + 1)));
    indietro.addEventListener('click', () => vai(tappa - 1));
    const chiudi = () => {
        cancelAnimationFrame(animazione);
        nodo.hidden = true;
    };
    esci.addEventListener('click', chiudi);
    nodo.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') {
            evento.stopPropagation();
            chiudi();
        }
        if (evento.key === 'ArrowRight') vai(tappa + 1);
        if (evento.key === 'ArrowLeft') vai(tappa - 1);
    });

    return {
        apri() {
            tappa = 0;
            vista = centro(0) - 600;
            posiziona();
            racconta();
            nodo.hidden = false;
            avanti.focus({ preventScroll: true });
        },
        chiudi,
        aperto: () => !nodo.hidden
    };
}

// ---------- Il tour del palaghiaccio ----------
// Brina, l'elfa istruttrice, guida la rasaghiaccio attraverso il palazzetto

const TAPPE_GHIACCIO = [
    { titolo: 'Benvenuti!', testo: 'Ciao, sono Brina, l\'elfa istruttrice! Salite sulla mia rasaghiaccio: vi faccio scoprire tutti i segreti del palazzetto del ghiaccio.' },
    { titolo: '1 · Il noleggio pattini', testo: 'Prima di tutto i pattini! Qui si sceglie il numero giusto e si allacciano ben stretti, così la caviglia sta dritta.' },
    { titolo: '2 · La scuola', testo: 'Chi è alle prime armi impara qui, appoggiandosi al pinguino: ginocchia piegate, piccoli passi e… si scivola!' },
    { titolo: '3 · La rasaghiaccio', testo: 'Questa macchina che guido lima il ghiaccio rovinato dai pattini e stende un velo d\'acqua che gela subito. Guardate: la pista torna liscia come uno specchio!' },
    { titolo: '4 · Il pattinaggio artistico', testo: 'I campioni fanno salti e piroette a tempo di musica. I giudici alzano i cartellini con i voti: che giravolta!' },
    { titolo: '5 · L\'hockey', testo: 'Qui si gioca a hockey: con il bastone si colpisce il disco, che scivola velocissimo sul ghiaccio verso la porta. Gooool!' },
    { titolo: '6 · Il bar del palazzetto', testo: 'Dopo tanto pattinare ci vuole una pausa: cioccolata calda, biscotti e una sciarpa per scaldarsi.' },
    { titolo: '7 · La premiazione', testo: 'E per finire, la premiazione: oggi una medaglia per tutti quelli che hanno fatto il giro con me. Grazie e alla prossima pattinata!' }
];

function disegnaPalazzettoTour(svg, { centro, LUNGO, tappe }) {
    // Il palazzetto: spalti pieni di gente, fari, balaustra e una pista lunghissima
    el('rect', { x: -400, y: -400, width: LUNGO + 800, height: 1700, fill: '#141c40' }, svg);
    for (let x = -400; x < LUNGO + 400; x += 220) el('path', { d: `M${x} -20 L${x + 140} 220`, stroke: '#26346a', 'stroke-width': 8 }, svg);
    for (let fila = 0; fila < 5; fila++) {
        const y = 250 + fila * 40;
        el('rect', { x: -400, y, width: LUNGO + 800, height: 40, fill: fila % 2 ? '#2a3a7a' : '#324690' }, svg);
        for (let x = -380 + (fila % 2) * 18, k = 0; x < LUNGO + 400; x += 36, k++) {
            el('circle', { cx: x, cy: y + 13, r: 9, fill: ['#f2d2bd', '#e3b393', '#c48a66', '#f5dccb'][(k + fila) % 4] }, svg);
            el('path', { d: `M${x - 11} ${y + 40} q 11 -20 22 0 Z`, fill: COLORI_FESTA[(k + fila * 2) % 5] }, svg);
        }
    }
    let festone = 'M-400 210';
    for (let x = -400; x < LUNGO + 400; x += 300) festone += ' q 150 40 300 0';
    el('path', { d: festone, stroke: '#e8c766', 'stroke-width': 2, fill: 'none' }, svg);
    for (let x = -390, i = 0; x < LUNGO + 400; x += 60, i++) el('path', { d: `M${x - 12} ${214 + Math.sin(((x + 400) % 300) / 300 * Math.PI) * 18} l 12 22 l 12 -22 Z`, fill: COLORI_FESTA[i % 5] }, svg);
    el('rect', { x: -400, y: 450, width: LUNGO + 800, height: 50, fill: '#f4f7fd' }, svg);
    el('rect', { x: -400, y: 474, width: LUNGO + 800, height: 7, fill: '#c0392b' }, svg);
    el('rect', { x: -400, y: 500, width: LUNGO + 800, height: 900, fill: '#dcecf9' }, svg);
    for (let x = -400; x < LUNGO + 400; x += 260) el('path', { d: `M${x} 560 q 130 -14 260 0`, stroke: '#ffffff', 'stroke-width': 3, fill: 'none', opacity: 0.7 }, svg);

    // I cartelli delle tappe
    tappe.forEach((tappa, i) => {
        const cx = centro(i) + 150;
        el('rect', { x: cx - 190, y: 110, width: 380, height: 54, rx: 10, fill: '#2d4f8a', stroke: '#e8c766', 'stroke-width': 3 }, svg);
        el('text', { x: cx, y: 146, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#fffaf0' }, svg).textContent = tappa.titolo;
    });

    const pattinatore = (x, y, k, verso, colori, classe = '') => {
        const g = disegnaPattinatore(colori);
        if (classe) g.classList.add(classe);
        svg.append(g);
        giraFigura(g, x, y, k, verso);
        return g;
    };
    const P = PATTINATORI_PISTA;

    // 0 · L'ingresso
    {
        const cx = centro(0) + 150;
        el('path', { d: `M${cx - 230} 700 V420 Q${cx} 260 ${cx + 230} 420 V700 H${cx + 180} V440 Q${cx} 320 ${cx - 180} 440 V700 Z`, fill: '#2d4f8a', stroke: '#e8c766', 'stroke-width': 4 }, svg);
        el('text', { x: cx, y: 400, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#ffe9a8' }, svg).textContent = '⛸ PALAGHIACCIO ⛸';
        for (let k = 0; k < 9; k++) el('circle', { class: 'pallina', cx: cx - 210 + k * 52, cy: 432 - Math.sin((k / 8) * Math.PI) * 110, r: 8, fill: COLORI_FESTA[k % 5] }, svg);
        pattinatore(cx + 280, 700, 3, 1, P[0]);
    }
    // 1 · Il noleggio pattini: bancone, scaffale con i pattini e i numeri
    {
        const cx = centro(1) + 150;
        el('rect', { x: cx - 230, y: 340, width: 300, height: 220, rx: 8, fill: '#6d4630' }, svg);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
            const sx = cx - 210 + c * 72, sy = 360 + r * 66;
            el('rect', { x: sx, y: sy, width: 64, height: 56, fill: '#3b2416' }, svg);
            el('path', { d: `M${sx + 10} ${sy + 40} v-22 h18 v14 h20 q 6 0 6 8 Z`, fill: ['#fbfdff', '#c0392b', '#2d4f8a'][(r + c) % 3] }, svg);
            el('path', { d: `M${sx + 8} ${sy + 46} h46`, stroke: '#b8c2d8', 'stroke-width': 3 }, svg);
            el('text', { x: sx + 52, y: sy + 16, 'text-anchor': 'end', 'font-size': 12, 'font-weight': 'bold', fill: '#ffe9a8' }, svg).textContent = String(28 + r * 4 + c);
        }
        el('rect', { x: cx - 260, y: 560, width: 420, height: 140, fill: '#8a5a3c' }, svg);
        el('rect', { x: cx - 270, y: 548, width: 440, height: 18, rx: 4, fill: '#a0663a' }, svg);
        el('rect', { x: cx - 170, y: 600, width: 240, height: 40, rx: 8, fill: '#2d4f8a', stroke: '#e8c766', 'stroke-width': 2 }, svg);
        el('text', { x: cx - 50, y: 627, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 'bold', fill: '#fffaf0', 'font-family': 'Georgia, serif' }, svg).textContent = 'NOLEGGIO PATTINI';
        disegnaElfo(svg, cx + 280, 700, 1.5, { giacca: '#2d4f8a', cappello: '#c0392b' }).braccio.classList.add('saluta');
    }
    // 2 · La scuola: i principianti con il pinguino d'appoggio
    {
        const cx = centro(2) + 150;
        const pinguino = (x, y) => {
            const g = el('g', { transform: `translate(${x} ${y})` }, svg);
            el('path', { d: 'M-16 -60 h32', stroke: '#c0392b', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
            el('path', { d: 'M-12 -58 v14 M12 -58 v14', stroke: '#c0392b', 'stroke-width': 4 }, g);
            el('ellipse', { cx: 0, cy: -24, rx: 22, ry: 26, fill: '#1d1d24' }, g);
            el('ellipse', { cx: 0, cy: -18, rx: 14, ry: 19, fill: '#fbfdff' }, g);
            el('circle', { cx: -6, cy: -38, r: 3, fill: '#fff' }, g);
            el('circle', { cx: 6, cy: -38, r: 3, fill: '#fff' }, g);
            el('circle', { cx: -6, cy: -38, r: 1.5, fill: '#111' }, g);
            el('circle', { cx: 6, cy: -38, r: 1.5, fill: '#111' }, g);
            el('path', { d: 'M-4 -32 h8 l-4 6 Z', fill: '#f39c12' }, g);
            el('path', { d: 'M-12 2 h10 M2 2 h10', stroke: '#f39c12', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
        };
        pinguino(cx - 150, 690);
        pattinatore(cx - 110, 700, 2.4, 1, P[5], 'traballa');
        pinguino(cx + 60, 690);
        pattinatore(cx + 100, 700, 2.4, 1, P[2], 'traballa');
        disegnaElfo(svg, cx + 300, 700, 1.5, { giacca: '#16a085', cappello: '#f4d03f' }).braccio.classList.add('saluta');
    }
    // 3 · La rasaghiaccio: ghiaccio rovinato da una parte, a specchio dall'altra
    {
        const cx = centro(3) + 150;
        for (let k = 0; k < 14; k++) el('path', { d: `M${cx - 300 + (k * 37) % 260} ${600 + (k * 23) % 90} l ${30 + (k % 3) * 10} ${(k % 2 ? 6 : -6)}`, stroke: '#a9c3df', 'stroke-width': 2.5 }, svg);
        el('text', { x: cx - 170, y: 590, 'text-anchor': 'middle', 'font-size': 18, 'font-style': 'italic', fill: '#5a7aa8', 'font-family': 'Georgia, serif' }, svg).textContent = 'prima: tutto graffiato';
        el('rect', { x: cx + 20, y: 560, width: 320, height: 140, rx: 10, fill: '#f4fbff' }, svg);
        el('path', { d: `M${cx + 40} 590 l 120 -20 M${cx + 70} 620 l 160 -26 M${cx + 200} 660 l 110 -18`, stroke: '#ffffff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.95 }, svg);
        el('text', { x: cx + 180, y: 600, 'text-anchor': 'middle', 'font-size': 18, 'font-style': 'italic', fill: '#2d4f8a', 'font-family': 'Georgia, serif' }, svg).textContent = 'dopo: uno specchio!';
        for (let k = 0; k < 5; k++) el('path', { class: 'scintilla-ghiaccio', d: stellaPiccola(cx + 60 + k * 60, 640 + (k % 2) * 30, 9), fill: '#ffffff', style: `animation-delay:${(k * 0.4).toFixed(1)}s` }, svg);
    }
    // 4 · Il pattinaggio artistico: la campionessa fa la piroetta, i giudici votano
    {
        const cx = centro(4) + 150;
        el('circle', { class: 'luce-calda', cx: cx - 60, cy: 600, r: 160, fill: 'url(#alone)', opacity: 0.7 }, svg);
        const g = el('g', { class: 'piroetta-tour' }, el('g', { transform: `translate(${cx - 60} 700)` }, svg));
        const figura = disegnaPattinatore(P[4]);
        g.append(figura);
        giraFigura(figura, 0, 0, 3, 1);
        el('rect', { x: cx + 140, y: 600, width: 240, height: 70, rx: 6, fill: '#8a5a3c' }, svg);
        ['6.0', '5.9', '6.0'].forEach((voto, k) => {
            el('rect', { x: cx + 158 + k * 74, y: 540, width: 56, height: 46, rx: 4, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 2 }, svg);
            el('text', { x: cx + 186 + k * 74, y: 572, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 'bold', fill: '#a3242c', 'font-family': 'Georgia, serif' }, svg).textContent = voto;
        });
    }
    // 5 · L'hockey: due giocatori, il disco e la porta
    {
        const cx = centro(5) + 150;
        el('path', { d: `M${cx + 260} 700 v-90 h90 v90`, stroke: '#c0392b', 'stroke-width': 8, fill: 'none' }, svg);
        for (let k = 0; k < 5; k++) el('path', { d: `M${cx + 268 + k * 18} 616 v80 M${cx + 266} ${630 + k * 16} h80`, stroke: '#ffffff', 'stroke-width': 1.5, opacity: 0.7 }, svg);
        const giocatore = (x, verso, colori) => {
            const g = pattinatore(x, 700, 2.6, verso, colori);
            el('path', { d: 'M-18 -40 L-34 -6 l -14 2', stroke: '#6d4630', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g);
        };
        giocatore(cx - 200, -1, P[1]);
        giocatore(cx + 40, 1, P[7]);
        el('ellipse', { class: 'disco-hockey', cx: cx - 90, cy: 694, rx: 12, ry: 5, fill: '#1d1d24' }, svg);
    }
    // 6 · Il bar del palazzetto
    {
        const cx = centro(6) + 150;
        el('rect', { x: cx - 260, y: 420, width: 520, height: 70, rx: 10, fill: '#a3242c', stroke: '#e8c766', 'stroke-width': 3 }, svg);
        el('text', { x: cx, y: 467, 'text-anchor': 'middle', 'font-size': 32, 'font-weight': 'bold', 'letter-spacing': 3, fill: '#fffaf0', 'font-family': 'Georgia, serif' }, svg).textContent = '☕ BAR DEL GHIACCIO';
        el('rect', { x: cx - 250, y: 600, width: 500, height: 100, fill: '#8a5a3c' }, svg);
        el('rect', { x: cx - 260, y: 588, width: 520, height: 18, rx: 4, fill: '#a0663a' }, svg);
        [-180, -90, 0].forEach((dx, k) => {
            const tx = cx + dx;
            el('path', { d: `M${tx - 26} 588 l 4 -44 h44 l 4 44 Z`, fill: ['#c0392b', '#fbf6ea', '#2e7d4a'][k] }, svg);
            el('ellipse', { cx: tx, cy: 544, rx: 26, ry: 7, fill: '#fffdf6' }, svg);
            el('path', { class: 'vapore-tazza', d: `M${tx - 6} 530 q -6 -12 0 -24 q 6 -12 0 -24`, stroke: '#ffffff', 'stroke-width': 4, fill: 'none', opacity: 0.8, style: `animation-delay:${k * 0.5}s` }, svg);
        });
        [[90, 580], [130, 580], [110, 566]].forEach(([dx, y]) => el('circle', { cx: cx + dx, cy: y, r: 14, fill: '#d9a066', stroke: '#b8803f', 'stroke-width': 2 }, svg));
        disegnaElfo(svg, cx + 210, 600, 1.4, { giacca: '#7d4e9e', cappello: '#c0392b' }).braccio.classList.add('saluta');
    }
    // 7 · La premiazione: il podio, le medaglie e i coriandoli
    {
        const cx = centro(7) + 150;
        [[0, 140, '1', '#f4d03f'], [-150, 100, '2', '#d9dde8'], [150, 70, '3', '#d9a066']].forEach(([dx, h, n, oro]) => {
            el('rect', { x: cx + dx - 70, y: 700 - h, width: 140, height: h, fill: '#fbf6ea', stroke: '#c9a227', 'stroke-width': 3 }, svg);
            el('text', { x: cx + dx, y: 700 - h + 50, 'text-anchor': 'middle', 'font-size': 40, 'font-weight': 'bold', fill: '#a3242c', 'font-family': 'Georgia, serif' }, svg).textContent = n;
            const g = pattinatore(cx + dx, 700 - h, 2.2, 1, P[{ 1: 3, 2: 6, 3: 0 }[n]]);
            el('circle', { cx: -6, cy: -38, r: 5, fill: oro, stroke: '#b8860b', 'stroke-width': 1 }, g);
        });
        for (let k = 0; k < 24; k++) el('rect', { class: 'coriandolo', x: cx - 300 + (k * 53) % 600, y: 260, width: 10, height: 6, fill: COLORI_FESTA[k % 5], style: `animation-delay:-${((k * 0.37) % 3).toFixed(2)}s` }, svg);
    }

    // La rasaghiaccio di Brina: una macchina bianca e blu che lascia la scia lucida
    const mezzo = el('g', {}, svg);
    el('rect', { x: -420, y: -24, width: 230, height: 30, rx: 12, fill: '#ffffff', opacity: 0.75 }, mezzo);
    el('ellipse', { cx: 0, cy: 8, rx: 190, ry: 14, fill: 'rgba(0,0,0,0.25)' }, mezzo);
    el('path', { d: 'M-190 -14 V-90 Q-190 -110 -170 -110 H60 V-150 Q60 -168 80 -168 H140 Q166 -168 172 -140 L186 -60 V-14 Z', fill: '#fbfdff', stroke: '#2d4f8a', 'stroke-width': 4 }, mezzo);
    el('rect', { x: -190, y: -56, width: 376, height: 22, fill: '#2d4f8a' }, mezzo);
    el('rect', { x: -170, y: -96, width: 200, height: 34, rx: 6, fill: '#bfe3ff', stroke: '#2d4f8a', 'stroke-width': 2 }, mezzo);
    el('text', { x: -70, y: -73, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#2d4f8a' }, mezzo).textContent = 'RASAGHIACCIO';
    el('path', { d: 'M76 -156 H136 Q156 -156 162 -134 L170 -100 H76 Z', fill: '#bfe3ff', stroke: '#2d4f8a', 'stroke-width': 3 }, mezzo);
    // Brina alla guida: capelli castani raccolti, berretto azzurro col pompon
    el('circle', { cx: 116, cy: -120, r: 15, fill: '#f2d2bd' }, mezzo);
    el('path', { d: 'M100 -124 Q102 -140 116 -140 Q132 -140 132 -124 Q124 -132 116 -131 Q106 -132 100 -124 Z', fill: '#8a5a2b' }, mezzo);
    el('path', { d: 'M100 -128 L114 -158 L132 -128 Z', fill: '#6fd3ff' }, mezzo);
    el('rect', { x: 98, y: -132, width: 36, height: 6, rx: 3, fill: '#fbfdff' }, mezzo);
    el('circle', { cx: 114, cy: -160, r: 5, fill: '#fbfdff' }, mezzo);
    el('circle', { cx: 122, cy: -121, r: 2, fill: '#3b2412' }, mezzo);
    el('path', { d: 'M117 -113 q 5 4 10 0', stroke: '#7a3c12', 'stroke-width': 1.6, fill: 'none' }, mezzo);
    el('circle', { cx: 150, cy: -104, r: 10, fill: 'none', stroke: '#3a3a44', 'stroke-width': 3 }, mezzo);
    el('rect', { x: -200, y: -20, width: 30, height: 14, rx: 4, fill: '#8d98b8' }, mezzo);
    el('circle', { cx: 180, cy: -30, r: 7, fill: '#fff3b0' }, mezzo);
    [-110, 110].forEach(rx => {
        const r = el('g', { class: 'ruota-bus' }, el('g', { transform: `translate(${rx} -6)` }, mezzo));
        el('circle', { r: 26, fill: '#2a2a2e' }, r);
        el('circle', { r: 12, fill: '#b8c2d8' }, r);
        el('path', { d: 'M-12 0 H12 M0 -12 V12', stroke: '#5d6280', 'stroke-width': 3 }, r);
    });
    return mezzo;
}

function creaTourGhiaccio(contenitore) {
    return creaTour(contenitore, { tappe: TAPPE_GHIACCIO, etichetta: 'Il tour del palaghiaccio sulla rasaghiaccio', disegna: disegnaPalazzettoTour });
}

// ========== IL GRAN FINALE DEL 24 ==========
// La signora Natale accoglie alla porta, offre la cioccolata calda in cucina,
// poi arriva Babbo Natale con l'ultimo dono e si esce a guardare i fuochi d'artificio

// La signora Natale in piedi, per affacciarsi alla porta di casa
function disegnaSignoraNatale(genitore, x, y, k) {
    const g = el('g', { class: 'signora-natale', transform: `translate(${x} ${y}) scale(${k})`, 'pointer-events': 'none' }, genitore);
    el('ellipse', { cx: 0, cy: 2, rx: 26, ry: 5, fill: 'rgba(0,0,0,0.25)' }, g);
    el('path', { d: 'M-22 0 Q-24 -40 -14 -70 H14 Q24 -40 22 0 Z', fill: '#b03030' }, g);
    el('path', { d: 'M-12 -2 Q-14 -36 -8 -62 H8 Q14 -36 12 -2 Z', fill: '#fbf6ea' }, g);
    el('path', { d: 'M-12 -10 q 12 5 24 0', stroke: '#d63031', 'stroke-width': 2, 'stroke-dasharray': '3 3', fill: 'none' }, g);
    el('path', { d: 'M-22 -2 q 22 6 44 0', stroke: '#fbfdff', 'stroke-width': 4, fill: 'none' }, g);
    el('path', { d: 'M-16 -70 Q0 -60 16 -70 Q20 -62 14 -56 Q0 -50 -14 -56 Q-20 -62 -16 -70 Z', fill: '#2e7d4a' }, g);
    el('path', { class: 'braccio-signora', d: 'M14 -66 q 14 6 18 -14', stroke: '#b03030', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('circle', { cx: 32, cy: -82, r: 4, fill: '#f6c9a8' }, g);
    el('path', { d: 'M-14 -66 q -8 14 -2 24', stroke: '#b03030', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('circle', { cx: 0, cy: -84, r: 13, fill: '#f6c9a8' }, g);
    el('path', { d: 'M-14 -86 q 0 -14 14 -14 q 14 0 14 14 q -6 -8 -14 -8 q -8 0 -14 8 Z', fill: '#eeeeee' }, g);
    el('circle', { cx: 0, cy: -102, r: 7, fill: '#eeeeee' }, g);
    [-5, 5].forEach(ox => el('circle', { cx: ox, cy: -85, r: 4, fill: 'none', stroke: '#8a6d1d', 'stroke-width': 1.2 }, g));
    el('path', { d: 'M-4 -78 q 4 3 8 0', stroke: '#7a3c12', 'stroke-width': 1.4, fill: 'none' }, g);
    el('circle', { cx: -8, cy: -80, r: 2, fill: '#f4a0a0', opacity: 0.6 }, g);
    el('circle', { cx: 8, cy: -80, r: 2, fill: '#f4a0a0', opacity: 0.6 }, g);
    return g;
}

function creaCucinaNatale({ onDono, onFine, onTocco }) {
    const nodo = Object.assign(document.createElement('div'), { className: 'interno cucina-natale', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'Nella cucina della casa di Babbo Natale' });
    const fumetto = Object.assign(document.createElement('div'), { className: 'guida-fumetto fumetto-cucina' });
    const faccia = Object.assign(document.createElement('span'), { className: 'guida-faccia' });
    const nome = Object.assign(document.createElement('p'), { className: 'guida-nome' });
    const testo = Object.assign(document.createElement('p'), { className: 'guida-testo' });
    const bottoni = Object.assign(document.createElement('div'), { className: 'guida-bottoni' });
    const azione = Object.assign(document.createElement('button'), { type: 'button', className: 'guida-avanti' });
    bottoni.append(azione);
    const testa = document.createElement('div');
    testa.append(nome, testo);
    fumetto.append(faccia, testa, bottoni);
    nodo.append(svg, fumetto);

    // La cucina: carta da parati, finestra con la neve, camino acceso, tavola apparecchiata
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: '#7a2a2a' }, svg);
    for (let x = -1400; x < 3000; x += 60) el('path', { d: `M${x} -600 V700`, stroke: '#8e3434', 'stroke-width': 18 }, svg);
    el('circle', { cx: 800, cy: 420, r: 720, fill: 'url(#alone)', opacity: 0.35 }, svg);
    el('rect', { x: 980, y: 120, width: 300, height: 220, rx: 8, fill: '#efe6d2' }, svg);
    el('rect', { x: 994, y: 134, width: 272, height: 192, fill: '#16245c' }, svg);
    for (let i = 0; i < 16; i++) el('circle', { class: 'fiocco-finestra', cx: 1000 + ((i * 67) % 260), cy: 140, r: 2 + (i % 3), fill: '#fff', style: `animation-delay:-${(i * 0.41 % 5).toFixed(2)}s;animation-duration:${(4 + (i % 3)).toFixed(1)}s` }, svg);
    el('path', { d: 'M1130 134 v192 M994 230 h272', stroke: '#efe6d2', 'stroke-width': 7 }, svg);
    el('path', { d: 'M980 120 q 150 40 300 0', stroke: '#1f5c34', 'stroke-width': 14, fill: 'none' }, svg);
    // Il camino
    el('rect', { x: 120, y: 330, width: 340, height: 370, fill: '#8b5e3c' }, svg);
    el('rect', { x: 100, y: 310, width: 380, height: 34, rx: 6, fill: '#a0663a' }, svg);
    el('path', { d: 'M180 700 V470 Q290 400 400 470 V700 Z', fill: '#2a1a12' }, svg);
    el('circle', { class: 'luce-calda', cx: 290, cy: 620, r: 160, fill: 'url(#alone)', opacity: 0.8 }, svg);
    [[260, 0], [290, 0.3], [320, 0.15]].forEach(([fx, ritardo]) => el('path', { class: 'fiamma', d: `M${fx - 26} 690 Q${fx - 30} 630 ${fx} 590 Q${fx + 30} 630 ${fx + 26} 690 Z`, fill: '#ff8c32', style: `animation-delay:${ritardo}s` }, svg));
    [[150, '#c0392b'], [240, '#2e7d4a'], [330, '#c0392b'], [420, '#2e7d4a']].forEach(([cx, c]) => {
        el('path', { d: `M${cx - 14} 344 v40 q 0 16 16 16 h12 q 10 0 10 -10 q 0 -8 -10 -8 h-6 v-38 Z`, fill: c }, svg);
        el('rect', { x: cx - 18, y: 340, width: 32, height: 12, rx: 4, fill: '#fbf6ea' }, svg);
    });
    // Il pavimento e la porta da cui entrerà Babbo Natale
    el('rect', { x: -1400, y: 700, width: 4400, height: 800, fill: '#5d3a22' }, svg);
    el('rect', { x: -1400, y: 700, width: 4400, height: 800, fill: 'url(#tex-assi)', opacity: 0.5 }, svg);
    el('rect', { x: -1400, y: 700, width: 4400, height: 800, fill: 'url(#tavole-pavimento)' }, svg);
    el('rect', { x: 1360, y: 330, width: 200, height: 370, rx: 10, fill: '#efe6d2' }, svg);
    const porta = el('rect', { class: 'porta-cucina', x: 1374, y: 344, width: 172, height: 356, rx: 6, fill: '#6d4630' }, svg);
    el('circle', { cx: 1400, cy: 530, r: 7, fill: '#e2b93b' }, svg);
    // La tavola con la cioccolata e i biscotti
    el('ellipse', { cx: 760, cy: 780, rx: 300, ry: 30, fill: 'rgba(0,0,0,0.25)' }, svg);
    el('rect', { x: 500, y: 600, width: 520, height: 26, rx: 6, fill: '#a0663a' }, svg);
    el('rect', { x: 500, y: 612, width: 520, height: 70, fill: '#c0392b' }, svg);
    el('path', { d: 'M500 612 H1020 V690 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 q -20 14 -40 0 Z', fill: 'url(#quadretti-bancone)' }, svg);
    el('path', { d: 'M540 690 v90 M980 690 v90', stroke: '#6d4630', 'stroke-width': 14 }, svg);
    const tazza = el('g', { class: 'tazza-finale' }, svg);
    el('path', { d: 'M780 600 l 6 -70 h80 l 6 70 Z', fill: '#c0392b' }, tazza);
    el('path', { d: 'M866 548 q 34 0 32 26 q -2 22 -30 20', stroke: '#c0392b', 'stroke-width': 10, fill: 'none' }, tazza);
    el('ellipse', { cx: 826, cy: 530, rx: 40, ry: 10, fill: '#5a2c14' }, tazza);
    el('path', { d: 'M790 528 q 12 -30 26 -14 q 10 -24 22 -6 q 14 -16 24 18 Z', fill: '#fffdf6' }, tazza);
    for (let i = 0; i < 3; i++) el('path', { class: 'vapore-tazza', d: `M${806 + i * 18} 494 q -8 -16 0 -32 q 8 -16 0 -32`, stroke: '#ffffff', 'stroke-width': 5, fill: 'none', opacity: 0.8, style: `animation-delay:${i * 0.5}s` }, tazza);
    el('ellipse', { cx: 660, cy: 598, rx: 70, ry: 12, fill: '#fbf6ea', stroke: '#d8cdb5', 'stroke-width': 2 }, svg);
    [[630, 588], [660, 584], [690, 588], [645, 576], [675, 576]].forEach(([bx, by]) => {
        el('circle', { cx: bx, cy: by, r: 14, fill: '#d9a066', stroke: '#b8803f', 'stroke-width': 2 }, svg);
        el('path', { d: stellaPiccola(bx, by, 6), fill: '#fbf6ea' }, svg);
    });
    // La signora Natale seduta alla tavola, sulla sua sedia di legno
    el('rect', { x: 452, y: 400, width: 18, height: 300, rx: 6, fill: '#6d4630' }, svg);
    el('rect', { x: 618, y: 400, width: 18, height: 300, rx: 6, fill: '#6d4630' }, svg);
    el('rect', { x: 452, y: 410, width: 184, height: 22, rx: 8, fill: '#8a5a3c' }, svg);
    el('rect', { x: 452, y: 460, width: 184, height: 16, rx: 6, fill: '#8a5a3c' }, svg);
    el('rect', { x: 440, y: 600, width: 210, height: 22, rx: 6, fill: '#a0663a' }, svg);
    const signora = el('g', { transform: 'translate(545 640) scale(1.3)' }, svg);
    disegnaPersonaggio(signora, 'mamma');
    // Babbo Natale entra dalla porta con l'ultimo dono
    const babbo = el('g', { class: 'babbo-arriva', transform: 'translate(1180 700) scale(1.2)' }, svg);
    disegnaPersonaggio(babbo, 'babbo');
    const dono = el('g', { transform: 'translate(-70 -110) scale(1.4)' }, babbo);
    pacco(dono, ['#f4d03f', '#c0392b'], 46, 40);

    let passo = 0;
    const SIGNORA = { faccia: '🤶', nome: 'La signora Natale' };
    const BABBO = { faccia: '🎅', nome: 'Babbo Natale' };
    function dice(chi, frase, bottone) {
        faccia.textContent = chi.faccia;
        nome.textContent = chi.nome;
        testo.textContent = frase;
        azione.textContent = bottone;
        azione.focus({ preventScroll: true });
    }
    azione.addEventListener('click', () => {
        passo++;
        if (passo === 1) {
            tazza.classList.add('bevuta');
            dice(SIGNORA, 'Ecco, bevila finché è calda! Senti? Sono i campanelli della slitta… sta arrivando!', 'Ascolto… 🔔');
            onTocco();
            setTimeout(() => {
                nodo.classList.add('arriva-babbo');
                porta.classList.add('aperta');
                dice(BABBO, 'Ho, ho, ho! Eccoti finalmente! Ho tenuto per te l\'ultimo dono, il più speciale di tutti.', '🎁 Apri l\'ultimo dono');
            }, 1600);
        } else if (passo === 2) {
            onDono();
            dice(BABBO, 'Buon Natale! Grazie per aver fatto tutto il viaggio nel mio villaggio. Ora usciamo: guarda che sorpresa nel cielo…', '✨ Esci a vedere il cielo');
        } else if (passo === 3) {
            onFine();
        }
    });

    return {
        nodo,
        mostra() {
            passo = 0;
            nodo.classList.remove('arriva-babbo');
            porta.classList.remove('aperta');
            tazza.classList.remove('bevuta');
            dice(SIGNORA, 'Siediti vicino al camino: la cioccolata è appena fatta! Babbo Natale sta finendo l\'ultimo giro e torna tra poco.', '☕ Bevo la cioccolata');
            nodo.hidden = false;
            requestAnimationFrame(() => nodo.classList.add('visibile'));
        },
        nascondi() {
            nodo.classList.remove('visibile');
            nodo.hidden = true;
        }
    };
}

// Altezza della strada in ogni punto, per mettere le case ai suoi lati
function profiloStrada(mondo) {
    const traccia = el('path', { d: STRADA, fill: 'none' }, mondo);
    const lunghezza = traccia.getTotalLength();
    const punti = [];
    for (let l = 0; l <= lunghezza; l += 10) punti.push(traccia.getPointAtLength(l));
    traccia.remove();
    return x => punti.reduce((vicino, p) => (Math.abs(p.x - x) < Math.abs(vicino.x - x) ? p : vicino)).y;
}

function disegnaPaese(mondo) {
    disegnaTerreno(mondo);
    disegnaNeveCheCresce(mondo);
    disegnaBrillantini(mondo);
    // Di notte la neve si fa più scura e blu: le luci delle case e dei lampioni risaltano
    el('rect', { class: 'buio-terra', x: -300, y: 530, width: MONDO + 800, height: 420, fill: '#0b1440', 'pointer-events': 'none' }, mondo);
    const yStrada = profiloStrada(mondo);

    const elementi = [];
    DIETRO.forEach((x, i) => elementi.push({ x, y: yStrada(x) - 62 - caso() * 22, tipo: 'casa', forma: TIPI_DIETRO[i % TIPI_DIETRO.length] }));
    DAVANTI.forEach((x, i) => elementi.push({ x, y: yStrada(x) + 88 + caso() * 18, tipo: 'casa', forma: TIPI_DAVANTI[i % TIPI_DAVANTI.length] }));
    // Da sinistra a destra: 1, 2, 3...
    [...elementi].sort((a, b) => a.x - b.x).forEach((elemento, i) => { elemento.giorno = i + 1; });
    elementi.push({ x: PIAZZA.x - 70, y: PIAZZA.y, tipo: 'albero' }, { x: PIAZZA.x + 100, y: PIAZZA.y - 18, tipo: 'casaBabbo' });

    // Lampioni lungo la strada, pupazzi e qualche abete
    for (let x = 250; x < MONDO; x += 420) {
        const libero = (x < 2120 || x > 2960) && (x < sposta(3700) || x > sposta(4300));
        if (Math.abs(x - PIAZZA.x) > 260 && libero) elementi.push({ x, y: yStrada(x) + 44, tipo: 'lampione' });
    }
    elementi.push({ x: PIAZZA.x - 210, y: PIAZZA.y + 30, tipo: 'pupazzo' }, { x: 920, y: 640, tipo: 'pupazzo' });
    elementi.push({ x: PIAZZA.x - 60, y: PIAZZA.y + 118, tipo: 'cartello' });
    elementi.push({ x: 0, y: 692, tipo: 'nebbia' });
    elementi.push({ x: PIAZZA.x + 180, y: PIAZZA.y + 66, tipo: 'coro' });
    // Pattinatori sul laghetto e mercatino vicino al ruscello
    elementi.push({ x: 700, y: 612, tipo: 'pattinatori' }, { x: sposta(2764), y: 836, tipo: 'mercatino' });
    // Il quartiere di Babbo Natale, subito dopo la stazione
    elementi.push({ x: 2265, y: 812, tipo: 'posta' }, { x: 2540, y: 648, tipo: 'laboratorio' }, { x: 2815, y: 818, tipo: 'stalla' });
    elementi.push({ x: 2540, y: 840, tipo: 'addobbi' });
    // Il luna park d'inverno, in fondo al paese
    elementi.push({ x: sposta(3745), y: 768, tipo: 'insegnaLuna' }, { x: sposta(4120), y: 650, tipo: 'palaghiaccio' }, { x: sposta(3960), y: 832, tipo: 'giostra' });
    [[3860, 600], [4330, 630], [4380, 880], [3700, 900]].forEach(([x, y]) => elementi.push({ x: sposta(x), y, tipo: 'abete' }));
    [[60, 640], [880, 600], [1680, 610], [2760, 600], [3000, 650], [3600, 640], [450, 880], [1880, 880], [3060, 900], [3300, 890], [2390, 600], [2960, 610]]
        .forEach(([x, y], i) => elementi.push({ x: i < 10 ? sposta(x) : x, y, tipo: 'abete' }));
    elementi.push({ x: STAZIONE.x, y: STAZIONE.y, tipo: 'stazione' }, { x: 0, y: BINARI_Y, tipo: 'treno' });

    // Le renne: una piccola mandria vicino al laghetto con un cucciolo, altre in giro per il paese.
    // Quella col naso rosso sta vicino alla piazza
    [
        { x: 960, y: 662, percorso: 260, durata: 30, ritardo: 4 },
        { x: 560, y: 668, percorso: 120, durata: 24, ritardo: 6, collare: '#8e5ea2' },
        { x: 735, y: 674, percorso: 0, piccola: true, collare: '#f4d03f' },
        { x: 2250, y: 650, percorso: 60, durata: 18, ritardo: 9 },
        { x: 3000, y: 842, percorso: 0, collare: '#c9a227' },
        { x: 1590, y: 806, percorso: 180, durata: 22, ritardo: 11, naso: '#e74c3c', collare: '#2e7d5b' },
        { x: 2205, y: 845, percorso: 0 },
        { x: 3180, y: 720, percorso: 220, durata: 28, ritardo: 17, collare: '#3a5ba0' }
    ].forEach(renna => elementi.push({ ...renna, x: sposta(renna.x), tipo: 'renna' }));

    // Da dietro in avanti, così le cose vicine coprono quelle lontane
    elementi.sort((a, b) => a.y - b.y);
    for (const elemento of elementi) {
        const { x, y, tipo, giorno, forma } = elemento;
        const scala = scalaPer(y);
        if (tipo === 'casa') disegnaCasa(mondo, giorno, x, y, scala, forma);
        else if (tipo === 'albero') disegnaAlbero(mondo, x, y, scala * 1.15);
        else if (tipo === 'casaBabbo') disegnaCasaBabbo(mondo, x, y, scala * 1.3);
        else if (tipo === 'lampione') disegnaLampione(mondo, x, y, scala);
        else if (tipo === 'pupazzo') disegnaPupazzo(mondo, x, y, scala);
        else if (tipo === 'stazione') disegnaStazione(mondo, x, y, 0.62);
        else if (tipo === 'treno') disegnaTrenino(mondo);
        else if (tipo === 'nebbia') disegnaNebbia(mondo, y);
        else if (tipo === 'pattinatori') disegnaPattinatori(mondo, x, y);
        else if (tipo === 'mercatino') disegnaMercatino(mondo, x, y, 0.86);
        else if (tipo === 'giostra') disegnaGiostra(mondo, x, y, scala * 0.95);
        else if (tipo === 'posta') disegnaPosta(mondo, x, y, scala * 0.95);
        else if (tipo === 'addobbi') disegnaMercatinoAddobbi(mondo, x, y, 0.8);
        else if (tipo === 'laboratorio') disegnaLaboratorio(mondo, x, y, scala * 1.1);
        else if (tipo === 'stalla') disegnaStalla(mondo, x, y, scala * 0.95);
        else if (tipo === 'palaghiaccio') disegnaPalaghiaccio(mondo, x, y, scala * 1.05);
        else if (tipo === 'insegnaLuna') disegnaInsegnaLuna(mondo, x, y, scala * 0.8);
        else if (tipo === 'coro') disegnaCoro(mondo, x, y, scala * 1.25);
        else if (tipo === 'cartello') disegnaCartelloNatale(mondo, x, y, scala * 0.9);
        else if (tipo === 'renna') disegnaRenna(mondo, x, y, scala * (elemento.piccola ? 0.55 : 0.82), elemento);
        else disegnaAbete(mondo, x, y, scala * 1.4, '#24533f');
    }
}

// ========== NEVE ==========

function avviaNeve(canvas) {
    const ctx = canvas.getContext('2d');
    const fiocchi = Array.from({ length: 240 }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 2.2, v: 0.0006 + Math.random() * 0.0012, o: Math.random() * Math.PI * 2 }));
    const ferma = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function disegna(tempo) {
        if (canvas.closest('.scena.dentro, .scena.vista-3d')) return requestAnimationFrame(disegna);
        const { width, height } = canvas.getBoundingClientRect();
        if (canvas.width !== Math.round(width)) { canvas.width = width; canvas.height = height; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        const quanti = Math.round(70 + 170 * Number(canvas.dataset.quanta ?? 0.5));
        for (const f of fiocchi.slice(0, quanti)) {
            if (!ferma) {
                f.y += f.v;
                f.x += Math.sin(tempo / 1500 + f.o) * 0.0003;
                if (f.y > 1) { f.y = -0.02; f.x = Math.random(); }
            }
            ctx.beginPath();
            ctx.arc(f.x * canvas.width, f.y * canvas.height, f.r, 0, Math.PI * 2);
            ctx.fill();
        }
        requestAnimationFrame(disegna);
    }
    requestAnimationFrame(disegna);
}

// ========== IL DIPINTO DEL GIORNO ==========
// Sopra il camino c'è un quadro diverso per ogni giorno, sempre a tema natalizio.
// Ogni dipinto si disegna in uno spazio di 192 × 96

const NOTTE = '#16245c';

function cielo(g, colore = NOTTE, stelle = 14) {
    el('rect', { width: 192, height: 96, fill: colore }, g);
    for (let i = 0; i < stelle; i++) el('circle', { cx: 6 + ((i * 53) % 180), cy: 6 + ((i * 29) % 44), r: 0.9 + (i % 3) * 0.4, fill: '#fff', opacity: 0.85 }, g);
}

function neve(g, y = 72, colore = '#eef3ff') {
    el('path', { d: `M0 ${y} q 48 -10 96 0 q 48 10 96 -2 V96 H0 Z`, fill: colore }, g);
}

function abete(g, x, y, s, colore = '#1f5e43') {
    el('path', { d: `M${x} ${y - 30 * s} l${12 * s} ${16 * s} h${-5 * s} l${9 * s} ${12 * s} h${-32 * s} l${9 * s} ${-12 * s} h${-5 * s} Z`, fill: colore }, g);
    el('rect', { x: x - 2 * s, y: y - 2 * s, width: 4 * s, height: 4 * s, fill: '#4a2c1c' }, g);
}

function stellaPunte(g, x, y, r, colore = '#ffe066') {
    let d = '';
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.45 : r;
        d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)} `;
    }
    el('path', { d: d + 'Z', fill: colore }, g);
}

const QUADRI = [
    { nome: 'Casetta nella neve', disegna(g) {
        cielo(g); el('circle', { cx: 160, cy: 18, r: 9, fill: '#fdf6d8' }, g); neve(g, 70);
        el('rect', { x: 70, y: 52, width: 44, height: 26, fill: '#9b1d2a' }, g);
        el('path', { d: 'M64 54 L92 34 L120 54 Z', fill: '#eef3ff' }, g);
        el('rect', { x: 78, y: 60, width: 9, height: 9, fill: '#ffd36b' }, g); el('rect', { x: 97, y: 60, width: 9, height: 9, fill: '#ffd36b' }, g);
        abete(g, 30, 80, 1); abete(g, 158, 82, 0.9);
    } },
    { nome: 'Babbo Natale', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#f3e3c4' }, g);
        el('path', { d: 'M66 40 Q 96 2 128 40 Z', fill: '#c0392b' }, g);
        el('path', { d: 'M118 30 q 18 0 22 14', stroke: '#c0392b', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, g);
        el('circle', { cx: 141, cy: 46, r: 6, fill: '#fbfdff' }, g);
        el('rect', { x: 62, y: 38, width: 70, height: 10, rx: 5, fill: '#fbfdff' }, g);
        el('circle', { cx: 97, cy: 58, r: 15, fill: '#f6c9a8' }, g);
        el('path', { d: 'M76 60 q 21 46 42 0 q -4 10 -21 10 q -17 0 -21 -10 Z', fill: '#fbfdff' }, g);
        el('circle', { cx: 91, cy: 55, r: 2, fill: '#3b2412' }, g); el('circle', { cx: 103, cy: 55, r: 2, fill: '#3b2412' }, g);
        el('circle', { cx: 97, cy: 61, r: 3, fill: '#e58a8a' }, g);
        el('path', { d: 'M86 66 q 11 -6 22 0', stroke: '#fbfdff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
    } },
    { nome: 'Renna col naso rosso', disegna(g) {
        cielo(g, '#22357a'); el('circle', { cx: 30, cy: 22, r: 11, fill: '#fdf6d8' }, g);
        el('path', { d: 'M78 96 q 2 -30 18 -40 q 16 10 18 40 Z', fill: '#8a5a3c' }, g);
        el('ellipse', { cx: 96, cy: 52, rx: 16, ry: 18, fill: '#8a5a3c' }, g);
        el('ellipse', { cx: 96, cy: 64, rx: 9, ry: 7, fill: '#c8a27a' }, g);
        el('circle', { cx: 96, cy: 64, r: 5, fill: '#e74c3c', filter: 'url(#bagliore)' }, g);
        el('circle', { cx: 89, cy: 48, r: 2, fill: '#1a1a1a' }, g); el('circle', { cx: 103, cy: 48, r: 2, fill: '#1a1a1a' }, g);
        el('path', { d: 'M86 38 q -14 -14 -12 -30 M80 26 l -10 -4 M78 16 l -8 -8 M106 38 q 14 -14 12 -30 M112 26 l 10 -4 M114 16 l 8 -8', stroke: '#d8c3a0', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g);
    } },
    { nome: 'Pupazzo di neve', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#9fb4dc' }, g); neve(g, 74);
        el('circle', { cx: 96, cy: 72, r: 18, fill: '#fbfdff' }, g); el('circle', { cx: 96, cy: 46, r: 13, fill: '#fbfdff' }, g);
        el('rect', { x: 86, y: 26, width: 20, height: 8, fill: '#222' }, g); el('rect', { x: 82, y: 33, width: 28, height: 4, fill: '#222' }, g);
        el('path', { d: 'M96 47 l 10 2 -10 2 Z', fill: '#f39c12' }, g);
        el('circle', { cx: 92, cy: 43, r: 1.5, fill: '#222' }, g); el('circle', { cx: 100, cy: 43, r: 1.5, fill: '#222' }, g);
        el('path', { d: 'M84 57 q 12 5 24 0 l 4 14 -6 1 -4 -10', fill: '#c0392b' }, g);
        for (let i = 0; i < 16; i++) el('circle', { cx: 8 + ((i * 41) % 178), cy: 6 + ((i * 23) % 60), r: 1.6, fill: '#fff' }, g);
    } },
    { nome: 'Albero di Natale', disegna(g) {
        cielo(g); neve(g, 80);
        el('path', { d: 'M96 12 L130 80 H62 Z', fill: '#1f6b4a' }, g);
        el('path', { d: 'M74 58 q 22 8 44 -4 M80 42 q 16 6 32 -3 M86 28 q 10 4 20 -2', stroke: '#e2b93b', 'stroke-width': 2, fill: 'none' }, g);
        [[86, 66, '#e74c3c'], [108, 70, '#5dade2'], [96, 50, '#f4d03f'], [104, 38, '#e74c3c'], [88, 36, '#af7ac5'], [118, 62, '#f4d03f']].forEach(([x, y, c]) => el('circle', { cx: x, cy: y, r: 3, fill: c }, g));
        stellaPunte(g, 96, 12, 8);
    } },
    { nome: 'Stella cometa', disegna(g) {
        cielo(g, '#0f1a45', 20);
        el('path', { d: 'M150 22 L20 60 L150 28 Z', fill: '#ffe9a8', opacity: 0.55 }, g);
        stellaPunte(g, 152, 24, 10);
        el('path', { d: 'M0 80 q 50 -16 100 -4 q 50 10 92 -6 V96 H0 Z', fill: '#1d2b4a' }, g);
        el('path', { d: 'M70 80 l 14 -12 14 12 Z', fill: '#2b2015' }, g);
    } },
    { nome: 'Angioletto', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#f6e9cf' }, g);
        el('ellipse', { cx: 76, cy: 50, rx: 20, ry: 12, fill: '#fbfdff', stroke: '#e3d5b8', transform: 'rotate(-25 76 50)' }, g);
        el('ellipse', { cx: 116, cy: 50, rx: 20, ry: 12, fill: '#fbfdff', stroke: '#e3d5b8', transform: 'rotate(25 116 50)' }, g);
        el('path', { d: 'M96 40 L118 90 H74 Z', fill: '#fbfdff', stroke: '#e3d5b8' }, g);
        el('circle', { cx: 96, cy: 34, r: 10, fill: '#f6c9a8' }, g);
        el('path', { d: 'M86 32 q 10 -12 20 0', fill: '#f4d03f' }, g);
        el('ellipse', { cx: 96, cy: 20, rx: 10, ry: 3, fill: 'none', stroke: '#e2b93b', 'stroke-width': 2.5 }, g);
        stellaPunte(g, 40, 22, 5); stellaPunte(g, 156, 30, 4);
    } },
    { nome: 'Corona dell\'Avvento', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#5a1d27' }, g);
        el('ellipse', { cx: 96, cy: 72, rx: 60, ry: 14, fill: 'none', stroke: '#2e6b3f', 'stroke-width': 12 }, g);
        [[62, '#8e5ea2'], [84, '#8e5ea2'], [108, '#ff8fb1'], [130, '#8e5ea2']].forEach(([x, c]) => {
            el('rect', { x: x - 5, y: 40, width: 10, height: 30, fill: c }, g);
            el('circle', { cx: x, cy: 34, r: 7, fill: 'url(#alone)' }, g);
            el('path', { d: `M${x} 30 q -4 6 0 10 q 4 -4 0 -10 Z`, fill: '#ffd36b' }, g);
        });
        [50, 74, 118, 142].forEach(x => el('circle', { cx: x, cy: 74, r: 3, fill: '#d63031' }, g));
    } },
    { nome: 'Slitta davanti alla luna', disegna(g) {
        cielo(g, '#1b2a6b'); el('circle', { cx: 110, cy: 44, r: 30, fill: '#fdf6d8' }, g);
        el('path', { d: 'M60 52 h28 q 6 0 6 -8 v-4 h-8 v4 h-20 Z M58 56 h40', fill: '#2b1d14', stroke: '#2b1d14', 'stroke-width': 2 }, g);
        [104, 124, 144].forEach(x => el('path', { d: `M${x} 48 h12 l4 -6 2 2 -3 5 v6 h-2 v-4 h-10 v4 h-2 Z M${x + 15} 42 l2 -6 M${x + 17} 42 l4 -4`, fill: '#2b1d14', stroke: '#2b1d14', 'stroke-width': 1 }, g));
        el('path', { d: 'M94 48 L104 50', stroke: '#2b1d14', 'stroke-width': 1 }, g);
        el('path', { d: 'M0 86 q 96 -12 192 0 V96 H0 Z', fill: '#eef3ff' }, g);
    } },
    { nome: 'Campane', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#2e6b3f' }, g);
        [[78, -12], [114, 12]].forEach(([x, giro]) => {
            const b = el('g', { transform: `rotate(${giro} ${x} 40)` }, g);
            el('path', { d: `M${x - 18} 70 q 0 -36 18 -40 q 18 4 18 40 Z`, fill: '#e2b93b', stroke: '#a8801c', 'stroke-width': 2 }, b);
            el('circle', { cx: x, cy: 72, r: 5, fill: '#a8801c' }, b);
        });
        el('path', { d: 'M96 26 l -14 -10 v18 Z M96 26 l 14 -10 v18 Z', fill: '#d63031' }, g);
        el('circle', { cx: 96, cy: 26, r: 4, fill: '#a8231a' }, g);
    } },
    { nome: 'Pacchi regalo', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#f3e3c4' }, g);
        [[46, 50, 40, 40, '#c0392b', '#f4d03f'], [90, 38, 48, 52, '#2e7d5b', '#e74c3c'], [140, 58, 32, 32, '#3a5ba0', '#fbfdff'], [104, 18, 24, 20, '#8e5ea2', '#f4d03f']].forEach(([x, y, w, h, c, n]) => {
            el('rect', { x, y, width: w, height: h, fill: c }, g);
            el('rect', { x: x + w / 2 - 3, y, width: 6, height: h, fill: n }, g);
            el('path', { d: `M${x + w / 2} ${y} q -8 -8 -11 -1 q 3 4 11 1 q 8 -8 11 -1 q -3 4 -11 1`, fill: n }, g);
        });
    } },
    { nome: 'Cerbiatto nel bosco', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#c8d6ef' }, g); neve(g, 76);
        abete(g, 22, 80, 1.3, '#2f5a5c'); abete(g, 52, 74, 0.9, '#3d6b6c'); abete(g, 160, 80, 1.4, '#2f5a5c'); abete(g, 136, 72, 0.8, '#3d6b6c');
        el('path', { d: 'M80 64 q 14 -8 30 -2 l 6 -10 4 2 -4 12 v14 h-3 v-10 h-22 v10 h-3 v-12 Z', fill: '#a0663a' }, g);
        el('path', { d: 'M116 52 l 4 -6 M118 50 l 4 -2', stroke: '#a0663a', 'stroke-width': 2 }, g);
        [[88, 66], [96, 64], [104, 66]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 1.4, fill: '#f6efe0' }, g));
    } },
    { nome: 'Chiesetta innevata', disegna(g) {
        cielo(g); neve(g, 70);
        el('rect', { x: 80, y: 50, width: 40, height: 30, fill: '#efe6d2' }, g);
        el('path', { d: 'M76 52 L100 36 L124 52 Z', fill: '#9b1d2a' }, g);
        el('rect', { x: 92, y: 18, width: 16, height: 34, fill: '#efe6d2' }, g);
        el('path', { d: 'M90 20 L100 6 L110 20 Z', fill: '#9b1d2a' }, g);
        el('path', { d: 'M100 4 v-4 M98 2 h4', stroke: '#e2b93b', 'stroke-width': 1.5 }, g);
        el('path', { d: 'M96 80 v-12 q 4 -6 8 0 v12 Z', fill: '#ffd36b' }, g);
        el('rect', { x: 97, y: 26, width: 6, height: 8, rx: 3, fill: '#ffd36b' }, g);
    } },
    { nome: 'Agrifoglio', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#f6efe0' }, g);
        const foglia = (x, y, giro) => el('path', { d: 'M0 0 q 8 -8 6 -16 q 6 2 8 -6 q 4 6 10 2 q -2 8 6 12 q -8 2 -6 10 q -8 -4 -12 4 q -4 -6 -12 -6 Z', fill: '#2e6b3f', transform: `translate(${x} ${y}) rotate(${giro}) scale(1.6)` }, g);
        foglia(70, 56, -30); foglia(122, 56, 210); foglia(96, 40, 90);
        [[92, 52], [100, 52], [96, 59]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 5, fill: '#d63031' }, g));
    } },
    { nome: 'Calza della Befana', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#2e6b3f' }, g);
        el('path', { d: 'M82 14 h28 v44 q 0 12 -10 18 l -16 8 q -14 4 -18 -6 q -2 -8 8 -12 l 8 -4 Z', fill: '#c0392b' }, g);
        el('rect', { x: 78, y: 10, width: 36, height: 12, rx: 3, fill: '#fbfdff' }, g);
        el('path', { d: 'M106 10 V0 a6 6 0 0 1 12 0', fill: 'none', stroke: '#fbfdff', 'stroke-width': 4 }, g);
        el('path', { d: 'M106 10 V0 a6 6 0 0 1 12 0', fill: 'none', stroke: '#d63031', 'stroke-width': 4, 'stroke-dasharray': '3 3' }, g);
    } },
    { nome: 'Casetta di pan di zenzero', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#f3e3c4' }, g);
        el('rect', { x: 68, y: 44, width: 56, height: 40, fill: '#b5652f' }, g);
        el('path', { d: 'M60 46 L96 16 L132 46 Z', fill: '#8a4b2a' }, g);
        el('path', { d: 'M60 46 q 6 6 12 0 q 6 6 12 0 q 6 6 12 0 q 6 6 12 0 q 6 6 12 0 q 6 6 12 0', fill: 'none', stroke: '#fbfdff', 'stroke-width': 3 }, g);
        el('path', { d: 'M88 84 v-16 q 8 -10 16 0 v16 Z', fill: '#6b3e1f', stroke: '#fbfdff', 'stroke-width': 2 }, g);
        [[76, 54, '#e74c3c'], [116, 54, '#2ecc71'], [96, 30, '#f4d03f'], [80, 74, '#5dade2'], [112, 74, '#ff8fb1']].forEach(([x, y, c]) => el('circle', { cx: x, cy: y, r: 3.5, fill: c }, g));
    } },
    { nome: 'Pettirosso sul ramo', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#dbe6f7' }, g);
        el('path', { d: 'M0 70 q 60 -10 192 -6', stroke: '#5d3a22', 'stroke-width': 6, fill: 'none' }, g);
        el('path', { d: 'M10 66 q 50 -10 100 -6', stroke: '#fbfdff', 'stroke-width': 3, fill: 'none' }, g);
        el('ellipse', { cx: 98, cy: 54, rx: 18, ry: 13, fill: '#7a5236' }, g);
        el('ellipse', { cx: 92, cy: 58, rx: 10, ry: 8, fill: '#e2582a' }, g);
        el('circle', { cx: 84, cy: 46, r: 9, fill: '#7a5236' }, g);
        el('circle', { cx: 81, cy: 45, r: 1.6, fill: '#111' }, g);
        el('path', { d: 'M75 47 l -6 1 6 2 Z', fill: '#3b2412' }, g);
        el('path', { d: 'M114 52 l 12 -4 -4 8 Z', fill: '#5a3d29' }, g);
    } },
    { nome: 'Fiocco di neve', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#2a3f8f' }, g);
        const f = el('g', { transform: 'translate(96 48)', stroke: '#fbfdff', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, g);
        for (let i = 0; i < 6; i++) el('path', { d: 'M0 0 V-36 M0 -14 l-8 -8 M0 -14 l8 -8 M0 -26 l-6 -6 M0 -26 l6 -6', transform: `rotate(${i * 60})` }, f);
    } },
    { nome: 'Ghirlanda alla porta', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#efe6d2' }, g);
        el('rect', { x: 64, y: 4, width: 64, height: 92, fill: '#2e6b3f' }, g);
        el('path', { d: 'M70 10 h52 v80 h-52 Z M96 10 v80', fill: 'none', stroke: '#245637', 'stroke-width': 2 }, g);
        el('circle', { cx: 96, cy: 44, r: 18, fill: 'none', stroke: '#1d5e3f', 'stroke-width': 10 }, g);
        [[86, 34], [108, 40], [92, 58], [106, 54]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 2.5, fill: '#d63031' }, g));
        el('path', { d: 'M96 62 l -8 6 v-12 Z M96 62 l 8 6 v-12 Z', fill: '#c0392b' }, g);
        el('circle', { cx: 116, cy: 60, r: 2.5, fill: '#e2b93b' }, g);
    } },
    { nome: 'Re Magi', disegna(g) {
        cielo(g, '#1b1640', 16); stellaPunte(g, 160, 18, 8);
        el('path', { d: 'M0 78 q 60 -20 120 -6 q 40 8 72 -6 V96 H0 Z', fill: '#c9a46a' }, g);
        [36, 76, 116].forEach((x, i) => el('path', { d: `M${x} 70 q 4 -14 14 -12 q 4 -10 10 -2 l 6 -6 4 2 -6 8 v12 h-2 v-8 h-14 v8 h-2 Z M${x + 12} 58 l 2 -8 h4 l 2 8`, fill: '#2b2015', transform: `translate(0 ${-i * 4})` }, g));
    } },
    { nome: 'Villaggio di notte', disegna(g) {
        cielo(g, '#101a4a', 22); el('circle', { cx: 28, cy: 18, r: 8, fill: '#fdf6d8' }, g);
        el('path', { d: 'M0 96 V70 l 14 -10 14 10 V62 l 12 -10 12 10 v10 l 14 -12 14 12 V56 l 10 -14 10 14 v14 l 16 -12 16 12 V64 l 12 -10 12 10 V96 Z', fill: '#2a1d14' }, g);
        [[10, 76], [36, 70], [64, 76], [98, 64], [130, 74], [158, 70], [176, 76]].forEach(([x, y]) => el('rect', { x, y, width: 5, height: 5, fill: '#ffd36b' }, g));
        el('path', { d: 'M0 90 q 96 -6 192 0 V96 H0 Z', fill: '#eef3ff' }, g);
    } },
    { nome: 'Trenino nella neve', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#bcd0f0' }, g); neve(g, 74);
        el('path', { d: 'M0 76 H192', stroke: '#7a6a5a', 'stroke-width': 2 }, g);
        el('rect', { x: 110, y: 50, width: 40, height: 22, rx: 3, fill: '#c0392b' }, g);
        el('rect', { x: 134, y: 38, width: 16, height: 14, fill: '#a93226' }, g);
        el('rect', { x: 116, y: 40, width: 6, height: 10, fill: '#333' }, g);
        el('rect', { x: 62, y: 54, width: 40, height: 18, rx: 3, fill: '#2e7d5b' }, g);
        el('rect', { x: 14, y: 54, width: 40, height: 18, rx: 3, fill: '#3a5ba0' }, g);
        [24, 44, 72, 92, 120, 140].forEach(x => el('circle', { cx: x, cy: 74, r: 4, fill: '#222' }, g));
        [[119, 32, 5], [112, 22, 7], [102, 12, 9]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#fbfdff', opacity: 0.9 }, g));
    } },
    { nome: 'Bastoncini di zucchero', disegna(g) {
        el('rect', { width: 192, height: 96, fill: '#f6d5d9' }, g);
        [[76, -18], [116, 18]].forEach(([x, giro]) => {
            const b = el('g', { transform: `rotate(${giro} ${x} 50)` }, g);
            el('path', { d: `M${x} 90 V30 a14 14 0 0 1 28 0`, fill: 'none', stroke: '#fbfdff', 'stroke-width': 10, 'stroke-linecap': 'round' }, b);
            el('path', { d: `M${x} 90 V30 a14 14 0 0 1 28 0`, fill: 'none', stroke: '#d63031', 'stroke-width': 10, 'stroke-dasharray': '7 8' }, b);
        });
        el('path', { d: 'M96 56 l -12 -8 v16 Z M96 56 l 12 -8 v16 Z', fill: '#2e7d5b' }, g);
    } },
    { nome: 'Natività', disegna(g) {
        cielo(g, '#0f1a45', 18);
        el('path', { d: 'M150 14 L96 40', stroke: '#ffe9a8', 'stroke-width': 3, opacity: 0.6 }, g);
        stellaPunte(g, 150, 14, 10);
        el('path', { d: 'M0 84 q 96 -8 192 0 V96 H0 Z', fill: '#3b2a1a' }, g);
        el('path', { d: 'M56 84 V54 L96 34 L136 54 V84 Z', fill: '#2b1d14' }, g);
        el('path', { d: 'M64 84 V58 L96 42 L128 58 V84 Z', fill: '#ffcf6b', opacity: 0.85 }, g);
        el('path', { d: 'M76 84 q 0 -18 8 -22 q 8 4 6 22 Z', fill: '#3a5ba0' }, g);
        el('circle', { cx: 84, cy: 58, r: 5, fill: '#3a5ba0' }, g);
        el('path', { d: 'M108 84 q 0 -20 8 -24 q 8 4 6 24 Z', fill: '#6b3e1f' }, g);
        el('circle', { cx: 116, cy: 56, r: 5, fill: '#6b3e1f' }, g);
        el('path', { d: 'M90 84 h14 l -3 -8 h-8 Z', fill: '#8a5a3c' }, g);
        el('ellipse', { cx: 97, cy: 76, rx: 5, ry: 3, fill: '#fbfdff' }, g);
    } }
];

// Il quadro con la cornice dorata: cambia dipinto ogni giorno
function creaQuadro(genitore, defs) {
    const ritaglio = el('clipPath', { id: 'tela-quadro' }, defs);
    el('rect', { width: 192, height: 96 }, ritaglio);
    el('rect', { x: 1070, y: 90, width: 220, height: 124, rx: 5, fill: '#c9a227' }, genitore);
    el('rect', { x: 1076, y: 96, width: 208, height: 112, rx: 3, fill: 'none', stroke: '#a8801c', 'stroke-width': 2 }, genitore);
    const tela = el('g', { transform: 'translate(1084 104)', 'clip-path': 'url(#tela-quadro)' }, genitore);
    const titolo = el('title', {}, tela);
    return {
        mostra(giorno) {
            const quadro = QUADRI[(giorno - 1) % QUADRI.length];
            tela.replaceChildren(titolo);
            quadro.disegna(tela);
            titolo.textContent = quadro.nome;
        }
    };
}

// ========== IL DOLCE DEL GIORNO ==========
// Sul tavolino del salotto c'è un dolce di Natale diverso per ogni giorno, con il suo nome

const DOLCI = [
    { nome: 'Biscotti a stella', tipo: 'stelle' },
    { nome: 'Omini di pan di zenzero', tipo: 'omini' },
    { nome: 'Bastoncini di zucchero', tipo: 'bastoncini' },
    { nome: 'Mandarini e noci', tipo: 'mandarini' },
    { nome: 'Cioccolata calda', tipo: 'tazza' },
    { nome: 'Torrone', tipo: 'torrone' },
    { nome: 'Ricciarelli', tipo: 'ovali', colore: '#f3e6cf' },
    { nome: 'Struffoli', tipo: 'struffoli' },
    { nome: 'Cavallucci', tipo: 'tondi', colore: '#d9b98c' },
    { nome: 'Roccocò', tipo: 'anelli' },
    { nome: 'Mostaccioli', tipo: 'rombi' },
    { nome: 'Castagne', tipo: 'castagne' },
    { nome: 'Croccante', tipo: 'croccante' },
    { nome: 'Panforte', tipo: 'fetta', colore: '#6b3e1f' },
    { nome: 'Cartellate', tipo: 'rosette' },
    { nome: 'Susamielli', tipo: 'esse' },
    { nome: 'Frutta martorana', tipo: 'frutta' },
    { nome: 'Pignolata', tipo: 'pignolata' },
    { nome: 'Zelten', tipo: 'pagnotta', colore: '#5a3420' },
    { nome: 'Pandolce genovese', tipo: 'pagnotta', colore: '#c98a3c' },
    { nome: 'Panpepato', tipo: 'fetta', colore: '#3e2412' },
    { nome: 'Tronchetto di Natale', tipo: 'tronchetto' },
    { nome: 'Pandoro', tipo: 'pandoro' },
    { nome: 'Panettone', tipo: 'panettone' }
];

// Disegna il dolce con la base al punto (0, 0), sull'alzatina
function disegnaDolce(g, { tipo, colore }) {
    const zucchero = '#fbfdff';
    const cerchio = (cx, cy, r, fill, extra = {}) => el('circle', { cx, cy, r, fill, ...extra }, g);
    switch (tipo) {
        case 'stelle':
            [[-22, -10], [0, -22], [22, -10]].forEach(([x, y]) => {
                el('path', { d: `M${x} ${y - 14} l4 9 10 1 -8 6 3 10 -9 -5 -9 5 3 -10 -8 -6 10 -1 Z`, fill: '#d9a25b', stroke: '#fbfdff', 'stroke-width': 1.5 }, g);
            });
            break;
        case 'omini':
            [-16, 16].forEach(x => {
                el('path', { d: `M${x} -40 a7 7 0 1 1 0.1 0 Z M${x - 8} -32 h16 l8 6 -3 4 -5 -3 v8 l6 14 -5 3 -5 -12 -5 12 -5 -3 6 -14 v-8 l-5 3 -3 -4 Z`, fill: '#b5652f' }, g);
                el('path', { d: `M${x - 3} -42 h1 M${x + 2} -42 h1 M${x - 3} -37 q3 2 6 0`, stroke: zucchero, 'stroke-width': 1.4, fill: 'none' }, g);
                cerchio(x, -27, 1.6, '#e74c3c');
                cerchio(x, -21, 1.6, '#2e7d5b');
            });
            break;
        case 'bastoncini':
            [[-8, -12], [10, 12]].forEach(([x, giro]) => {
                const b = el('g', { transform: `translate(${x} 0) rotate(${giro})` }, g);
                el('path', { d: 'M0 0 V-38 a9 9 0 0 1 18 0', fill: 'none', stroke: '#fbfdff', 'stroke-width': 7, 'stroke-linecap': 'round' }, b);
                el('path', { d: 'M0 0 V-38 a9 9 0 0 1 18 0', fill: 'none', stroke: '#d63031', 'stroke-width': 7, 'stroke-dasharray': '5 6', 'stroke-linecap': 'butt' }, b);
            });
            break;
        case 'mandarini':
            [[-16, -12], [14, -12], [0, -28]].forEach(([x, y]) => {
                cerchio(x, y, 13, '#f39c12');
                el('path', { d: `M${x} ${y - 13} q 6 -6 12 -3 q -6 5 -12 3`, fill: '#2e7d5b' }, g);
            });
            [[-30, -6], [30, -6]].forEach(([x, y]) => el('ellipse', { cx: x, cy: y, rx: 8, ry: 7, fill: '#8a5a3c', stroke: '#5d3a22', 'stroke-width': 1.5 }, g));
            break;
        case 'tazza':
            el('path', { d: 'M-20 -44 h40 l-4 40 h-32 Z', fill: '#c0392b' }, g);
            el('path', { d: 'M20 -36 q 14 0 12 14 q -2 10 -14 8', fill: 'none', stroke: '#c0392b', 'stroke-width': 5 }, g);
            el('ellipse', { cx: 0, cy: -44, rx: 20, ry: 5, fill: '#5d3a22' }, g);
            [[-8, -47], [4, -48], [10, -45]].forEach(([x, y]) => el('rect', { x: x - 4, y: y - 4, width: 8, height: 7, rx: 2, fill: '#fbfdff' }, g));
            el('path', { class: 'vapore-tazza', d: 'M-6 -54 q -6 -8 0 -16 q 6 -8 0 -16 M6 -56 q -6 -8 0 -16', fill: 'none', stroke: '#fbfdff', 'stroke-width': 2.5, opacity: 0.7, 'stroke-linecap': 'round' }, g);
            break;
        case 'torrone':
            [0, -14, -28].forEach((y, i) => {
                el('rect', { x: -32 + i * 4, y: y - 13, width: 60, height: 13, rx: 2, fill: '#fbf6e8', stroke: '#e3cfa2', 'stroke-width': 1.5 }, g);
                [-20, -6, 8, 20].forEach(x => el('ellipse', { cx: x + i * 4, cy: y - 6.5, rx: 3.5, ry: 2.2, fill: '#c98a3c' }, g));
            });
            break;
        case 'ovali':
            [[-18, -8], [16, -8], [0, -22]].forEach(([x, y]) => {
                el('ellipse', { cx: x, cy: y, rx: 16, ry: 9, fill: colore, stroke: '#e3cfa2', 'stroke-width': 1 }, g);
                el('path', { d: `M${x - 8} ${y - 2} l4 3 M${x} ${y - 4} l3 4 M${x + 6} ${y - 1} l3 2`, stroke: '#d8c3a0', 'stroke-width': 1.2 }, g);
            });
            break;
        case 'struffoli':
            for (let i = 0; i < 34; i++) {
                const riga = Math.floor(Math.sqrt(i * 2));
                const larghezza = 34 - riga * 6;
                cerchio(((i * 7.3) % larghezza) - larghezza / 2 + 2, -6 - riga * 7, 5.2, '#e2a23b', { stroke: '#b8761c', 'stroke-width': 0.8 });
            }
            ['#e74c3c', '#2e7d5b', '#f4d03f', '#5dade2'].forEach((c, i) => [0, 1, 2].forEach(j => cerchio(-14 + i * 9 + j * 3, -12 - j * 9 - i * 2, 1.4, c)));
            break;
        case 'tondi':
            [[-18, -8], [16, -8], [0, -22]].forEach(([x, y]) => {
                el('ellipse', { cx: x, cy: y, rx: 15, ry: 10, fill: colore, stroke: '#b5965e', 'stroke-width': 1.2 }, g);
                el('path', { d: `M${x - 7} ${y} q 7 -5 14 0`, stroke: '#b5965e', 'stroke-width': 1.2, fill: 'none' }, g);
            });
            break;
        case 'anelli':
            [[-16, -8], [16, -8], [0, -24]].forEach(([x, y]) => {
                el('ellipse', { cx: x, cy: y, rx: 15, ry: 10, fill: 'none', stroke: '#8a4b2a', 'stroke-width': 8 }, g);
                el('circle', { cx: x - 4, cy: y - 7, r: 1.8, fill: '#e3cfa2' }, g);
            });
            break;
        case 'rombi':
            [[-18, -8], [16, -8], [0, -24]].forEach(([x, y]) => {
                el('path', { d: `M${x} ${y - 12} l14 12 -14 12 -14 -12 Z`, fill: '#3e2412', stroke: '#6b3e1f', 'stroke-width': 1.5 }, g);
                el('path', { d: `M${x - 6} ${y - 4} l6 -4`, stroke: '#8a5a3c', 'stroke-width': 1.5 }, g);
            });
            break;
        case 'castagne':
            [[-16, -8], [14, -8], [-2, -22], [26, -20]].forEach(([x, y]) => {
                el('path', { d: `M${x - 11} ${y + 6} q 0 -16 11 -18 q 11 2 11 18 Z`, fill: '#6b3e1f', stroke: '#3e2412', 'stroke-width': 1.2 }, g);
                el('path', { d: `M${x - 9} ${y + 3} h18`, stroke: '#d8b48a', 'stroke-width': 2 }, g);
            });
            break;
        case 'croccante':
            [[-30, -4, 18], [-6, -8, -10], [18, -4, 14], [-14, -22, 6], [8, -24, -16]].forEach(([x, y, giro]) => {
                el('path', { d: 'M0 0 l20 -4 4 12 -22 6 Z', fill: '#c98a3c', stroke: '#8a5a1c', 'stroke-width': 1.2, transform: `translate(${x} ${y}) rotate(${giro})` }, g);
            });
            break;
        case 'fetta':
            el('path', { d: 'M-34 -4 q 34 10 68 0 v-16 q -34 10 -68 0 Z', fill: colore }, g);
            el('ellipse', { cx: 0, cy: -20, rx: 34, ry: 8, fill: '#fbfdff' }, g);
            [-20, -6, 10, 22].forEach(x => el('ellipse', { cx: x, cy: -9, rx: 3, ry: 2, fill: '#e3cfa2' }, g));
            break;
        case 'rosette':
            [[-16, -10], [16, -10], [0, -26]].forEach(([x, y]) => {
                el('path', { d: `M${x} ${y} m-12 0 a12 12 0 1 0 24 0 a9 9 0 1 0 -18 0 a6 6 0 1 0 12 0`, fill: 'none', stroke: '#c98a3c', 'stroke-width': 5 }, g);
                el('circle', { cx: x, cy: y, r: 13, fill: 'rgba(160,82,30,0.35)' }, g);
            });
            break;
        case 'esse':
            [[-14, -12], [14, -12], [0, -28]].forEach(([x, y]) => {
                el('path', { d: `M${x + 9} ${y - 8} q -9 -8 -14 0 q -2 8 9 8 q 9 1 5 9 q -5 7 -14 0`, fill: 'none', stroke: '#c98a3c', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
            });
            break;
        case 'frutta':
            cerchio(-18, -10, 11, '#f39c12');
            el('ellipse', { cx: 6, cy: -9, rx: 13, ry: 9, fill: '#c0392b' }, g);
            el('path', { d: 'M22 -2 q 10 -20 -2 -26 q -10 8 2 26 Z', fill: '#f4d03f' }, g);
            [[-4, -26], [4, -28], [-2, -32]].forEach(([x, y]) => cerchio(x, y, 5, '#8e5ea2'));
            el('path', { d: 'M-18 -21 l3 -5 M6 -18 l2 -5', stroke: '#2e7d5b', 'stroke-width': 2 }, g);
            break;
        case 'pignolata':
            for (let i = 0; i < 28; i++) {
                const riga = Math.floor(Math.sqrt(i * 2));
                const larghezza = 40 - riga * 7;
                cerchio(((i * 6.1) % larghezza) - larghezza / 2 + 3, -6 - riga * 7, 5, i % 2 ? '#3e2412' : '#fbf6e8', { stroke: '#8a6d4c', 'stroke-width': 0.6 });
            }
            break;
        case 'pagnotta':
            el('path', { d: 'M-34 0 q 0 -34 34 -36 q 34 2 34 36 Z', fill: colore }, g);
            [[-14, -18], [4, -24], [16, -12], [-4, -10], [22, -22]].forEach(([x, y]) => el('ellipse', { cx: x, cy: y, rx: 3, ry: 2, fill: tipo === 'pagnotta' && colore === '#5a3420' ? '#c98a3c' : '#5a3420' }, g));
            el('path', { d: 'M-20 -28 q 20 -10 40 0', stroke: '#fbfdff', 'stroke-width': 2.5, fill: 'none', opacity: 0.6 }, g);
            break;
        case 'tronchetto':
            el('rect', { x: -38, y: -28, width: 76, height: 26, rx: 13, fill: '#5d3a22' }, g);
            el('ellipse', { cx: 38, cy: -15, rx: 9, ry: 13, fill: '#e8d2a8', stroke: '#5d3a22', 'stroke-width': 3 }, g);
            el('path', { d: 'M38 -15 m-5 0 a5 5 0 1 0 10 0', fill: 'none', stroke: '#8a5a3c', 'stroke-width': 1.5 }, g);
            el('path', { d: 'M-34 -22 q 20 4 40 -2 M-30 -12 q 24 4 52 -2', stroke: '#3e2412', 'stroke-width': 2, fill: 'none' }, g);
            el('path', { d: 'M-30 -28 q 10 -6 20 0 q 10 -6 20 0 q 10 -6 20 0', fill: zucchero }, g);
            el('path', { d: 'M-6 -34 l6 -8 6 8 Z', fill: '#2e7d5b' }, g);
            cerchio(4, -34, 3, '#d63031');
            break;
        case 'pandoro':
            el('path', { d: 'M-30 0 L-22 -16 L-30 -16 L-16 -34 L-22 -34 L-8 -54 L-12 -54 L0 -70 L12 -54 L8 -54 L22 -34 L16 -34 L30 -16 L22 -16 L30 0 Z', fill: '#f2c14e', stroke: '#d9a032', 'stroke-width': 1.5 }, g);
            el('path', { d: 'M-12 -54 L0 -70 L12 -54 Z M-22 -34 L-16 -34 L-8 -44 L8 -44 L16 -34 L22 -34 L12 -46 L0 -50 L-12 -46 Z', fill: zucchero, opacity: 0.9 }, g);
            break;
        case 'panettone':
            el('rect', { x: -28, y: -34, width: 56, height: 34, fill: '#c9a227' }, g);
            el('path', { d: 'M-28 -34 v34 M-14 -34 v34 M0 -34 v34 M14 -34 v34 M28 -34 v34', stroke: '#8a6d1d', 'stroke-width': 1.5 }, g);
            el('path', { d: 'M-32 -32 q 0 -34 32 -36 q 32 2 32 36 Z', fill: '#a8642a' }, g);
            el('path', { d: 'M-24 -46 q 24 -14 48 0', stroke: '#c98a3c', 'stroke-width': 4, fill: 'none' }, g);
            [[-14, -40], [6, -52], [16, -40], [-4, -46]].forEach(([x, y]) => el('ellipse', { cx: x, cy: y, rx: 2.5, ry: 2, fill: '#4a2c1c' }, g));
            el('path', { d: 'M-12 -60 l2 -3 M2 -64 l2 -3 M14 -58 l2 -3', stroke: zucchero, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, g);
            break;
    }
}

// Il tavolino tondo accanto alla poltrona, con l'alzatina e il cartellino del dolce
function creaTavolino(genitore, onRicetta = () => {}) {
    const tavolino = el('g', { class: 'tavolino-ricetta', transform: 'translate(1150 872) scale(1.35)', tabindex: 0, role: 'button', 'aria-label': 'Il dolce del giorno: tocca per la ricetta' }, genitore);
    let dolceDelGiorno = DOLCI[0].nome;
    const apriRicetta = evento => {
        evento.stopPropagation();
        onRicetta(dolceDelGiorno);
    };
    tavolino.addEventListener('click', apriRicetta);
    tavolino.addEventListener('keydown', evento => {
        if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault();
            apriRicetta(evento);
        }
    });
    el('ellipse', { cx: 0, cy: 4, rx: 90, ry: 12, fill: 'rgba(0,0,0,0.3)' }, tavolino);
    el('path', { d: 'M-6 -86 h12 l4 74 h-20 Z', fill: '#5d3a22' }, tavolino);
    el('path', { d: 'M-40 0 q 40 -22 80 0', fill: 'none', stroke: '#4a2c1c', 'stroke-width': 9, 'stroke-linecap': 'round' }, tavolino);
    el('ellipse', { cx: 0, cy: -90, rx: 92, ry: 20, fill: '#6d4630' }, tavolino);
    el('ellipse', { cx: 0, cy: -95, rx: 92, ry: 20, fill: '#8a5a3c' }, tavolino);
    el('ellipse', { cx: 0, cy: -96, rx: 78, ry: 15, fill: '#f7f1e3' }, tavolino);
    el('path', { d: 'M-78 -96 q 78 26 156 0', fill: 'none', stroke: '#c0392b', 'stroke-width': 3, 'stroke-dasharray': '6 5' }, tavolino);
    // Alzatina
    el('path', { d: 'M-4 -100 h8 l4 -16 h-16 Z', fill: '#dfe6f5' }, tavolino);
    el('ellipse', { cx: 0, cy: -101, rx: 14, ry: 4, fill: '#cfd8ec' }, tavolino);
    el('ellipse', { cx: 0, cy: -118, rx: 52, ry: 10, fill: '#eef3ff', stroke: '#cfd8ec', 'stroke-width': 2 }, tavolino);
    const dolce = el('g', { transform: 'translate(0 -120)' }, tavolino);
    // Cartellino col nome, appoggiato davanti
    const cartellino = el('g', { transform: 'translate(0 -66)' }, tavolino);
    const fondo = el('rect', { y: -15, height: 26, rx: 6, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 2 }, cartellino);
    const nome = el('text', { x: 0, y: 4, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#9b1d2a' }, cartellino);
    // Il bollino che invita a toccare: c'è la ricetta
    const bollino = el('g', { class: 'bollino-ricetta', transform: 'translate(70 -150)' }, tavolino);
    el('circle', { r: 17, fill: '#c0392b', stroke: '#e8c766', 'stroke-width': 2.5 }, bollino);
    el('text', { x: 0, y: 6, 'text-anchor': 'middle', 'font-size': 17 }, bollino).textContent = '📖';
    return {
        mostra(giorno) {
            const scelto = DOLCI[(giorno - 1) % DOLCI.length];
            dolceDelGiorno = scelto.nome;
            dolce.replaceChildren();
            disegnaDolce(dolce, scelto);
            nome.textContent = scelto.nome;
            const larghezza = scelto.nome.length * 8.4 + 22;
            fondo.setAttribute('x', -larghezza / 2);
            fondo.setAttribute('width', larghezza);
        }
    };
}

// ========== LA SALA D'ATTESA DELLA STAZIONE ==========
// Si entra cliccando la stazione: c'è il benvenuto e si parte per il viaggio

const BENVENUTO = [
    'Qua inizia il vostro viaggio:',
    'in ogni casa troverete dolci natalizi',
    'e regali, fino ad arrivare',
    'alla casa di Babbo Natale.',
    'Siete pronti a iniziare',
    'questo meraviglioso viaggio?'
];

// L'annuncio dell'altoparlante: il din-don della stazione e poi una voce che dà il benvenuto
const ANNUNCIO = 'Benvenuti al nostro villaggio! Fuori troverete i nostri elfi, che vi faranno fare il tour.';
function suonaDinDon() {
    const Contesto = window.AudioContext || window.webkitAudioContext;
    if (!Contesto) return Promise.resolve();
    const contesto = new Contesto();
    const t0 = contesto.currentTime + 0.05;
    ['G4', 'C5', 'E5', 'G5'].forEach((nota, i) => {
        const t = t0 + i * 0.42;
        [[1, 0.22], [2, 0.05], [3.01, 0.025]].forEach(([multiplo, volume]) => {
            const o = contesto.createOscillator();
            const g = contesto.createGain();
            o.type = 'sine';
            o.frequency.value = frequenza(nota) * multiplo;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(volume, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
            o.connect(g).connect(contesto.destination);
            o.start(t);
            o.stop(t + 1.7);
        });
    });
    setTimeout(() => contesto.close(), 3600);
    return new Promise(fatto => setTimeout(fatto, 1900));
}
function leggiAnnuncio(testo) {
    const sintesi = window.speechSynthesis;
    if (!sintesi || !window.SpeechSynthesisUtterance) return;
    sintesi.cancel();
    const frase = new SpeechSynthesisUtterance(testo);
    frase.lang = 'it-IT';
    frase.rate = 0.92;
    frase.pitch = 1.05;
    const voci = sintesi.getVoices().filter(v => v.lang?.toLowerCase().startsWith('it'));
    // Se c'è, una voce femminile come negli annunci delle stazioni
    frase.voice = voci.find(v => /alice|elsa|federica|isabella|female|donna/i.test(v.name)) ?? voci[0] ?? null;
    sintesi.speak(frase);
}

// Va a capo tra le parole, rispettando gli a capo scritti da chi prepara il calendario
function avvolgiTesto(testo, massimo) {
    const righe = [];
    for (const paragrafo of testo.split('\n')) {
        let riga = '';
        for (const parola of paragrafo.split(/\s+/).filter(Boolean)) {
            if (riga && (riga + ' ' + parola).length > massimo) {
                righe.push(riga);
                riga = parola;
            } else riga = riga ? `${riga} ${parola}` : parola;
        }
        righe.push(riga);
    }
    return righe;
}

function creaSala({ onParti, benvenuto = '' }) {
    const nodo = Object.assign(document.createElement('div'), { className: 'interno sala', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'La sala d\'attesa della stazione, con il messaggio di benvenuto' });
    // Si sceglie chi fa da guida nel tour in slitta
    const partenze = Object.assign(document.createElement('div'), { className: 'partenze' });
    const domanda = Object.assign(document.createElement('p'), { className: 'domanda-guida', textContent: 'Chi ti accompagna sulla slitta?' });
    const conElfo = Object.assign(document.createElement('button'), { type: 'button', className: 'partenza', textContent: '🧝‍♂️ Parto con l\'elfo' });
    const conElfa = Object.assign(document.createElement('button'), { type: 'button', className: 'partenza', textContent: '🧝‍♀️ Parto con l\'elfa' });
    partenze.append(domanda, conElfo, conElfa);
    // La scritta dell'annuncio, per chi ha l'audio spento
    const annuncio = Object.assign(document.createElement('p'), { className: 'annuncio-stazione', textContent: `📢 ${ANNUNCIO}` });
    annuncio.setAttribute('role', 'status');
    nodo.append(svg, annuncio, partenze);
    let timerAnnuncio = null, voltaAnnuncio = 0;
    async function faiAnnuncio() {
        const volta = ++voltaAnnuncio;
        annuncio.classList.remove('si-vede');
        clearTimeout(timerAnnuncio);
        await new Promise(fatto => setTimeout(fatto, 700));
        if (volta !== voltaAnnuncio || nodo.hidden) return;
        annuncio.classList.add('si-vede');
        try {
            await suonaDinDon();
            if (volta === voltaAnnuncio && !nodo.hidden) leggiAnnuncio(ANNUNCIO);
        } catch { /* senza audio resta la scritta */ }
        timerAnnuncio = setTimeout(() => annuncio.classList.remove('si-vede'), 9000);
    }
    const parti = conElfo;
    conElfo.addEventListener('click', () => onParti('elfo'));
    conElfa.addEventListener('click', () => onParti('elfa'));

    const defs = el('defs', {}, svg);
    const vetro = el('clipPath', { id: 'vetro-sala' }, defs);
    el('path', { d: 'M1186 440 V250 q 0 -80 92 -80 q 92 0 92 80 V440 Z' }, vetro);
    const ombra = el('radialGradient', { id: 'vignetta-sala', gradientUnits: 'userSpaceOnUse', cx: 800, cy: 470, r: 1000 }, defs);
    el('stop', { offset: '55%', 'stop-color': '#000', 'stop-opacity': 0 }, ombra);
    el('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': 0.6 }, ombra);

    // Piccoli disegni natalizi usati in tutta la sala
    const COLORI_LUCI = ['#ff5a4f', '#ffd36b', '#6fd3ff', '#7dff9a', '#ff9de2'];
    const stella = (cx, cy, r) => 'M' + Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
        return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
    }).join(' L') + ' Z';
    const lucina = (x, y, i, r = 5) => el('circle', { class: 'pallina', cx: x, cy: y, r, fill: COLORI_LUCI[i % COLORI_LUCI.length], filter: 'url(#bagliore)', style: `animation-delay:${((i * 0.37) % 2).toFixed(2)}s` }, svg);
    const fiocco = (x, y, s = 1) => {
        const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, svg);
        el('path', { d: 'M0 0 L-12 30 L-4 28 L-1 36 Z M0 0 L12 30 L4 28 L1 36 Z', fill: '#a3161f' }, g);
        el('path', { d: 'M0 0 C -30 -24 -40 6 0 0 Z M0 0 C 30 -24 40 6 0 0 Z', fill: '#d62c2c', stroke: '#a3161f', 'stroke-width': 2 }, g);
        el('circle', { cx: 0, cy: 0, r: 6, fill: '#c0392b' }, g);
    };
    const corona = (cx, cy, r) => {
        el('circle', { cx, cy, r, fill: 'none', stroke: '#1f5c34', 'stroke-width': r * 0.5 }, svg);
        for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2, rr = r + (i % 2 ? 5 : -5);
            el('ellipse', { cx: cx + Math.cos(a) * rr, cy: cy + Math.sin(a) * rr, rx: r * 0.22, ry: r * 0.1, transform: `rotate(${(a * 180 / Math.PI + 60).toFixed(0)} ${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)})`, fill: i % 3 ? '#2e7d4a' : '#3f9a5c' }, svg);
        }
        for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI * 2 + 0.3;
            el('circle', { cx: cx + Math.cos(a) * r, cy: cy + Math.sin(a) * r, r: Math.max(2.5, r * 0.09), fill: '#e0262f' }, svg);
        }
        fiocco(cx, cy + r, r / 40);
    };

    // Stanza in prospettiva, come il salotto, con i colori di una stazione d'altri tempi
    const FONDO = { x1: 220, x2: 1380, y1: 70, y2: 560 };
    const fuga = (x, y, k = 5) => [800 + (x - 800) * k, 330 + (y - 330) * k];
    const poligono = (punti, attributi) => el('path', { d: 'M' + punti.map(p => p.map(n => n.toFixed(1)).join(' ')).join(' L') + ' Z', ...attributi }, svg);
    poligono([[FONDO.x1, FONDO.y1], [FONDO.x2, FONDO.y1], fuga(FONDO.x2, FONDO.y1), fuga(FONDO.x1, FONDO.y1)], { fill: '#3b2416' });
    [[FONDO.x1, '#24473d'], [FONDO.x2, '#2b5347']].forEach(([bx, colore]) => {
        poligono([[bx, FONDO.y1], [bx, FONDO.y2], fuga(bx, FONDO.y2), fuga(bx, FONDO.y1)], { fill: colore });
        poligono([[bx, 440], [bx, FONDO.y2], fuga(bx, FONDO.y2), fuga(bx, 440)], { fill: '#5d3a22' });
    });
    el('rect', { x: FONDO.x1, y: FONDO.y1, width: FONDO.x2 - FONDO.x1, height: FONDO.y2 - FONDO.y1, fill: '#2f5d50' }, svg);
    // Carta da parati con stelline dorate
    for (let riga = 0, y = 104; y < 420; riga++, y += 62) {
        for (let x = FONDO.x1 + 30 + (riga % 2) * 35; x < FONDO.x2 - 20; x += 70) {
            el('path', { d: stella(x, y, 7), fill: '#e8c766', opacity: 0.22 }, svg);
        }
    }
    el('rect', { x: FONDO.x1, y: 440, width: FONDO.x2 - FONDO.x1, height: 120, fill: '#5d3a22' }, svg);
    el('rect', { x: FONDO.x1, y: 434, width: FONDO.x2 - FONDO.x1, height: 8, fill: '#8a5a3c' }, svg);
    // Pavimento a piastrelle
    poligono([[FONDO.x1, FONDO.y2], [FONDO.x2, FONDO.y2], fuga(FONDO.x2, FONDO.y2), fuga(FONDO.x1, FONDO.y2)], { fill: '#d9ccb2' });
    for (let bx = FONDO.x1; bx <= FONDO.x2; bx += 58) {
        const [fx, fy] = fuga(bx, FONDO.y2);
        el('path', { d: `M${bx} ${FONDO.y2} L${fx.toFixed(1)} ${fy.toFixed(1)}`, stroke: '#b8a989', 'stroke-width': 2 }, svg);
    }
    [592, 634, 690, 762, 856, 980].forEach(y => {
        const k = (y - 330) / (FONDO.y2 - 330);
        el('path', { d: `M${fuga(FONDO.x1, FONDO.y2, k)[0].toFixed(1)} ${y} H${fuga(FONDO.x2, FONDO.y2, k)[0].toFixed(1)}`, stroke: '#b8a989', 'stroke-width': 2 }, svg);
    });
    // Tappeto rosso che porta verso il cartellone
    const tappeto = (a, b, attributi) => poligono([[a, FONDO.y2], [b, FONDO.y2], fuga(b, FONDO.y2, 3), fuga(a, FONDO.y2, 3)], attributi);
    tappeto(736, 864, { fill: '#c9a227' });
    tappeto(742, 858, { fill: '#a3242c' });
    tappeto(752, 848, { fill: 'none', stroke: '#e8c766', 'stroke-width': 2, 'stroke-dasharray': '10 8' });

    // Ghirlanda con le lucine lungo il soffitto
    let ghirlanda = `M${FONDO.x1} 74`;
    for (let x = FONDO.x1; x < FONDO.x2; x += 116) ghirlanda += ' q 58 30 116 0';
    el('path', { d: ghirlanda, fill: 'none', stroke: '#1f5c34', 'stroke-width': 14, 'stroke-linecap': 'round' }, svg);
    el('path', { d: ghirlanda, fill: 'none', stroke: '#2e7d4a', 'stroke-width': 6, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }, svg);
    for (let i = 0, x = FONDO.x1 + 58; x < FONDO.x2; i++, x += 58) {
        lucina(x, i % 2 ? 76 : 90, i);
    }

    // Lampade appese al soffitto, con un fiocco rosso sul filo
    [520, 800, 1080].forEach(x => {
        el('path', { d: `M${x} 62 V128`, stroke: '#1a1a1a', 'stroke-width': 3 }, svg);
        el('circle', { class: 'luce-calda', cx: x, cy: 160, r: 90, fill: 'url(#alone)', opacity: 0.55 }, svg);
        el('path', { d: `M${x - 26} 150 q 26 -28 52 0 Z`, fill: '#2c2f45' }, svg);
        el('ellipse', { cx: x, cy: 152, rx: 12, ry: 6, fill: '#fff3b0', filter: 'url(#bagliore)' }, svg);
        if (x !== 800) fiocco(x, 108, 0.7);
    });

    // Stelle di carta appese al soffitto
    [[380, 128], [660, 112], [940, 112], [1220, 124]].forEach(([x, y], i) => {
        el('path', { d: `M${x} 62 V${y - 14}`, stroke: '#d8cdb5', 'stroke-width': 1.5 }, svg);
        el('path', { d: stella(x, y, 16), fill: i % 2 ? '#f4d03f' : '#fdf6dc', stroke: '#c9a227', 'stroke-width': 1.5, filter: 'url(#bagliore)' }, svg);
    });

    // Biglietteria
    el('rect', { x: 236, y: 230, width: 210, height: 330, fill: '#6d4630' }, svg);
    el('rect', { x: 236, y: 230, width: 210, height: 330, fill: 'url(#tex-assi)' }, svg);
    el('rect', { x: 226, y: 220, width: 230, height: 14, fill: '#4a2c1c' }, svg);
    el('rect', { x: 260, y: 186, width: 162, height: 34, rx: 4, fill: '#1f3d33', stroke: '#c9a227', 'stroke-width': 3 }, svg);
    el('text', { x: 341, y: 210, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 'bold', 'letter-spacing': 3, fill: '#ffe9a8', 'font-family': 'Georgia, serif' }, svg).textContent = 'BIGLIETTI';
    el('path', { d: 'M262 400 V300 q 0 -40 40 -40 h78 q 40 0 40 40 V400 Z', fill: 'url(#vetro-acceso)' }, svg);
    el('path', { d: 'M341 260 V400', stroke: '#4a2c1c', 'stroke-width': 4 }, svg);
    el('rect', { x: 248, y: 400, width: 186, height: 16, fill: '#8a5a3c' }, svg);
    el('rect', { x: 296, y: 380, width: 30, height: 20, fill: '#fbf6ea' }, svg);
    // Festone con le lucine sulla biglietteria, una corona e due calze appese al bancone
    el('path', { d: 'M226 228 q 38 24 77 0 q 38 24 77 0 q 38 24 76 0', fill: 'none', stroke: '#1f5c34', 'stroke-width': 10, 'stroke-linecap': 'round' }, svg);
    [245, 283, 322, 360, 398, 437].forEach((x, i) => lucina(x, i % 2 ? 240 : 232, i + 3, 4));
    corona(341, 486, 32);
    [[266, '#c0392b'], [404, '#2e7d4a']].forEach(([x, colore]) => {
        el('path', { d: `M${x} 422 v34 q 0 14 14 14 h12 q 10 0 10 -9 q 0 -8 -10 -9 h-6 v-30 Z`, fill: colore }, svg);
        el('rect', { x: x - 3, y: 414, width: 26, height: 12, rx: 4, fill: '#fbf6ea' }, svg);
    });

    // Orologio della stazione, con la sua coroncina
    el('circle', { cx: 800, cy: 112, r: 44, fill: 'none', stroke: '#1f5c34', 'stroke-width': 14 }, svg);
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        el('circle', { cx: 800 + Math.cos(a) * 46, cy: 112 + Math.sin(a) * 46, r: 4, fill: i % 2 ? '#e0262f' : '#3f9a5c' }, svg);
    }
    el('circle', { cx: 800, cy: 112, r: 36, fill: '#fdf6dc', stroke: '#2c2f45', 'stroke-width': 6 }, svg);
    for (let ora = 0; ora < 12; ora++) {
        const a = (ora / 12) * Math.PI * 2;
        el('path', { d: `M${800 + Math.sin(a) * 28} ${112 - Math.cos(a) * 28} L${800 + Math.sin(a) * 23} ${112 - Math.cos(a) * 23}`, stroke: '#2c2f45', 'stroke-width': 2 }, svg);
    }
    el('path', { d: 'M800 112 V92 M800 112 L814 118', stroke: '#1a1a1a', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);

    // Il cartellone con il benvenuto
    el('rect', { x: 488, y: 162, width: 624, height: 362, rx: 10, fill: '#c9a227' }, svg);
    el('rect', { x: 502, y: 176, width: 596, height: 334, rx: 6, fill: '#1f3d33' }, svg);
    el('path', { d: 'M488 170 q 78 40 156 0 q 78 40 156 0 q 78 40 156 0 q 78 40 156 0', fill: 'none', stroke: '#2e6b3f', 'stroke-width': 14, 'stroke-linecap': 'round' }, svg);
    for (let i = 0; i < 9; i++) el('circle', { class: 'pallina', cx: 505 + i * 74, cy: 178 + (i % 2) * 10, r: 6, fill: ['#e74c3c', '#f4d03f', '#5dade2'][i % 3], style: `animation-delay:${(i * 0.2).toFixed(1)}s` }, svg);
    fiocco(800, 170, 1.1);
    // Agrifoglio negli angoli bassi del cartellone
    [[506, 508, 1], [1094, 508, -1]].forEach(([x, y, verso]) => {
        el('path', { d: `M${x} ${y} q ${14 * verso} -22 ${36 * verso} -18 q ${-6 * verso} 18 ${-36 * verso} 18 Z M${x} ${y} q ${26 * verso} 4 ${30 * verso} 26 q ${-22 * verso} -2 ${-30 * verso} -26 Z`, fill: '#2e7d4a', stroke: '#1f5c34', 'stroke-width': 2 }, svg);
        [[0, 0], [7 * verso, -5], [7 * verso, 5]].forEach(([dx, dy]) => el('circle', { cx: x + dx, cy: y + dy, r: 5, fill: '#e0262f' }, svg));
    });
    el('text', { x: 800, y: 244, 'text-anchor': 'middle', 'font-size': 42, 'font-style': 'italic', 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#ffd36b' }, svg).textContent = 'Benvenuti nel nostro villaggio!';
    // Il testo del cartellone: quello del villaggio, oppure il benvenuto scritto da chi ha preparato il calendario
    const testoCartellone = el('g', {}, svg);
    function scriviBenvenuto(testo) {
        testoCartellone.replaceChildren();
        const proprio = (testo ?? '').trim();
        if (!proprio) {
            BENVENUTO.forEach((riga, i) => {
                el('text', { x: 800, y: 296 + i * 36 + (i >= 4 ? 10 : 0), 'text-anchor': 'middle', 'font-size': 27, 'font-family': 'Georgia, serif', fill: i >= 4 ? '#ffe9a8' : '#f3ead8', 'font-weight': i >= 4 ? 'bold' : 'normal' }, testoCartellone).textContent = riga;
            });
            return;
        }
        // Più è lungo, più le lettere si fanno piccole per stare nel cartellone
        let dimensione = 28, righe = avvolgiTesto(proprio, 36);
        if (righe.length > 6) { dimensione = 23; righe = avvolgiTesto(proprio, 44); }
        if (righe.length > 8) { dimensione = 19; righe = avvolgiTesto(proprio, 54).slice(0, 10); }
        const passo = dimensione * 1.32;
        const inizio = 382 - ((righe.length - 1) * passo) / 2 + dimensione * 0.35;
        righe.forEach((riga, i) => {
            el('text', { x: 800, y: (inizio + i * passo).toFixed(1), 'text-anchor': 'middle', 'font-size': dimensione, 'font-style': 'italic', 'font-family': 'Georgia, serif', fill: '#f3ead8' }, testoCartellone).textContent = riga;
        });
    }
    scriviBenvenuto(benvenuto);

    // Finestra ad arco con il treno fermo fuori e la neve
    el('path', { d: 'M1174 450 V250 q 0 -92 104 -92 q 104 0 104 92 V450 Z', fill: '#efe6d2' }, svg);
    const fuori = el('g', { 'clip-path': 'url(#vetro-sala)' }, svg);
    el('rect', { x: 1180, y: 160, width: 200, height: 290, fill: '#16245c' }, fuori);
    el('circle', { cx: 1330, cy: 220, r: 16, fill: '#fdf6d8' }, fuori);
    el('rect', { x: 1180, y: 400, width: 200, height: 50, fill: '#eef3ff' }, fuori);
    el('rect', { x: 1190, y: 360, width: 70, height: 34, rx: 4, fill: '#2e6b4a' }, fuori);
    el('rect', { x: 1268, y: 352, width: 80, height: 42, rx: 5, fill: '#c0392b' }, fuori);
    el('rect', { x: 1322, y: 330, width: 18, height: 24, fill: '#141414' }, fuori);
    [1204, 1240, 1284, 1328].forEach(x => el('circle', { cx: x, cy: 398, r: 8, fill: '#1c1c1c' }, fuori));
    [1200, 1214, 1232, 1280, 1298].forEach(x => el('rect', { x, y: 368, width: 10, height: 10, fill: '#ffd36b' }, fuori));
    for (let i = 0; i < 16; i++) el('circle', { class: 'fiocco-finestra', cx: 1186 + caso() * 190, cy: 160, r: 1.5 + caso() * 2, fill: '#fff', style: `animation-delay:-${(caso() * 6).toFixed(2)}s;animation-duration:${(4 + caso() * 3).toFixed(1)}s` }, fuori);
    el('path', { d: 'M1278 160 V450 M1182 320 H1374', stroke: '#efe6d2', 'stroke-width': 8 }, svg);
    // Festone con le lucine intorno all'arco, una corona sul vetro e due candele sul davanzale
    el('path', { d: 'M1174 450 V250 q 0 -92 104 -92 q 104 0 104 92 V450', fill: 'none', stroke: '#1f5c34', 'stroke-width': 12, 'stroke-linecap': 'round' }, svg);
    [[1174, 430], [1174, 380], [1174, 330], [1174, 280], [1180, 210], [1232, 164], [1278, 158], [1324, 164], [1376, 210], [1382, 280], [1382, 330], [1382, 380], [1382, 430]]
        .forEach(([x, y], i) => lucina(x, y, i + 1, 5));
    corona(1278, 256, 28);
    el('rect', { x: 1162, y: 446, width: 232, height: 12, rx: 3, fill: '#d8cdb5' }, svg);
    [1196, 1360].forEach(x => {
        el('circle', { class: 'luce-calda', cx: x, cy: 412, r: 40, fill: 'url(#alone)', opacity: 0.6 }, svg);
        el('rect', { x: x - 7, y: 418, width: 14, height: 28, rx: 2, fill: '#c0392b' }, svg);
        el('path', { d: `M${x} 404 q 6 8 0 14 q -6 -6 0 -14 Z`, fill: '#ffd36b', filter: 'url(#bagliore)' }, svg);
        el('path', { d: `M${x - 14} 446 q 6 -10 14 -6 q 8 -4 14 6`, fill: '#2e7d4a' }, svg);
    });

    // Stufa accesa nell'angolo, con il tubo
    el('path', { d: 'M1500 640 V80', stroke: '#2c2c2c', 'stroke-width': 18 }, svg);
    el('ellipse', { class: 'luce-calda', cx: 1490, cy: 700, rx: 200, ry: 90, fill: 'url(#luce-camino)' }, svg);
    el('rect', { x: 1446, y: 620, width: 100, height: 120, rx: 30, fill: '#2c2c2c' }, svg);
    el('rect', { x: 1470, y: 664, width: 52, height: 34, rx: 8, fill: '#ff8c32', filter: 'url(#bagliore)' }, svg);
    el('path', { d: 'M1452 740 v18 M1540 740 v18', stroke: '#1a1a1a', 'stroke-width': 8 }, svg);
    // Un bastoncino di zucchero appoggiato alla stufa
    el('path', { d: 'M1424 744 V668 q 0 -20 -18 -20 q -18 0 -18 18', fill: 'none', stroke: '#fff', 'stroke-width': 11, 'stroke-linecap': 'round' }, svg);
    el('path', { d: 'M1424 744 V668 q 0 -20 -18 -20 q -18 0 -18 18', fill: 'none', stroke: '#d62c2c', 'stroke-width': 11, 'stroke-dasharray': '7 9' }, svg);

    // Il grande albero di Natale nell'angolo, con i regali sotto
    let semeAlbero = 11;
    const casoAlbero = () => (semeAlbero = (semeAlbero * 16807) % 2147483647) / 2147483647;
    const albero = el('g', { transform: 'translate(132 826) scale(1.2) translate(0 -826)' }, svg);
    el('circle', { class: 'luce-calda', cx: 0, cy: 600, r: 260, fill: 'url(#alone)', opacity: 0.45 }, albero);
    el('ellipse', { cx: 0, cy: 826, rx: 140, ry: 16, fill: 'rgba(0,0,0,0.3)' }, albero);
    el('rect', { x: -16, y: 780, width: 32, height: 44, fill: '#5b3a24' }, albero);
    const PIANI = [[800, 132, 190], [710, 106, 165], [622, 82, 145], [540, 58, 125]];
    PIANI.forEach(([y, w, h]) => {
        el('path', { d: `M${-w} ${y} q ${w} 24 ${w * 2} 0 L0 ${y - h} Z`, fill: '#1f6b3a' }, albero);
        el('path', { d: `M0 ${y + 12} q ${w * 0.6} -2 ${w} -12 L0 ${y - h} Z`, fill: '#175a30' }, albero);
    });
    // Fili dorati
    [[770, 112], [684, 92], [598, 70], [520, 48]].forEach(([y, w]) => {
        el('path', { d: `M${-w} ${y - 40} q ${w} 50 ${w * 2} 10`, fill: 'none', stroke: '#f4d03f', 'stroke-width': 3, opacity: 0.9 }, albero);
    });
    // Palline e lucine sparse sui rami
    for (let i = 0; i < 46; i++) {
        const [y0, w, h] = PIANI[i % PIANI.length];
        const t = 0.2 + casoAlbero() * 0.75;
        const y = y0 - h + h * t, mezza = w * t * 0.92;
        const x = (casoAlbero() * 2 - 1) * mezza;
        if (i % 2) {
            el('circle', { cx: x, cy: y, r: 7, fill: ['#e0262f', '#f4d03f', '#3f7fd6', '#e8e8f0', '#c0392b'][i % 5] }, albero);
            el('circle', { cx: x - 2, cy: y - 2, r: 2.2, fill: '#fff', opacity: 0.8 }, albero);
        } else {
            el('circle', { class: 'pallina', cx: x, cy: y, r: 4, fill: COLORI_LUCI[i % COLORI_LUCI.length], filter: 'url(#bagliore)', style: `animation-delay:${((i * 0.29) % 2).toFixed(2)}s` }, albero);
        }
    }
    el('path', { d: stella(0, 410, 28), fill: '#ffd36b', stroke: '#e0a800', 'stroke-width': 2, filter: 'url(#bagliore)' }, albero);
    // Pacchi regalo sotto l'albero
    [[-128, 778, 54, 44, '#c0392b', '#f4d03f'], [-76, 790, 44, 34, '#2e6fb5', '#fdf6dc'], [28, 772, 60, 50, '#2e7d4a', '#e0262f'], [84, 796, 38, 28, '#f4d03f', '#c0392b']]
        .forEach(([x, y, w, h, colore, nastro]) => {
            el('rect', { x, y, width: w, height: h, rx: 3, fill: colore }, albero);
            el('rect', { x: x + w / 2 - 4, y, width: 8, height: h, fill: nastro }, albero);
            el('rect', { x, y: y + h / 2 - 4, width: w, height: 8, fill: nastro }, albero);
            el('path', { d: `M${x + w / 2} ${y} q -14 -14 -16 -2 q 2 6 16 2 q 14 4 16 -2 q -2 -12 -16 2 Z`, fill: nastro }, albero);
        });

    // Panche di legno con un fiocco rosso, una valigia e un sacco di regali
    const panca = x => {
        const p = el('g', { transform: `translate(${x} 800)` }, svg);
        el('ellipse', { cx: 0, cy: 6, rx: 150, ry: 12, fill: 'rgba(0,0,0,0.25)' }, p);
        el('path', { d: 'M-120 0 v-60 M120 0 v-60 M-110 -60 v-70 M110 -60 v-70', stroke: '#2c2c2c', 'stroke-width': 8 }, p);
        [-64, -50].forEach(y => el('rect', { x: -136, y, width: 272, height: 12, rx: 4, fill: '#8a5a3c' }, p));
        [-130, -112, -94].forEach(y => el('rect', { x: -126, y, width: 252, height: 12, rx: 4, fill: '#a0663a' }, p));
        // Rametto di pino lungo lo schienale
        el('path', { d: 'M-120 -132 q 60 14 120 0 q 60 14 120 0', fill: 'none', stroke: '#1f5c34', 'stroke-width': 9, 'stroke-linecap': 'round' }, p);
        [-90, -30, 30, 90].forEach((dx, i) => el('circle', { cx: dx, cy: -126, r: 4, fill: i % 2 ? '#f4d03f' : '#e0262f' }, p));
    };
    panca(420);
    panca(1180);
    fiocco(300, 668, 0.8);
    fiocco(1060, 668, 0.8);
    el('rect', { x: 560, y: 740, width: 80, height: 58, rx: 8, fill: '#7a4b2e' }, svg);
    el('path', { d: 'M580 740 v-12 h40 v12 M560 760 h80', stroke: '#4a2c1c', 'stroke-width': 4, fill: 'none' }, svg);
    el('path', { d: 'M1000 800 q -36 0 -30 -50 q 6 -30 30 -36 q 24 6 30 36 q 6 50 -30 50 Z', fill: '#a0663a' }, svg);
    el('path', { d: 'M988 716 q 12 -10 24 0', stroke: '#c0392b', 'stroke-width': 5, fill: 'none' }, svg);
    [[984, 712, '#e74c3c'], [1000, 704, '#2e7d5b'], [1016, 712, '#f4d03f']].forEach(([x, y, c]) => el('rect', { x: x - 8, y: y - 8, width: 16, height: 14, fill: c }, svg));

    el('rect', { x: -2200, y: -1000, width: 6000, height: 2600, fill: 'url(#vignetta-sala)', 'pointer-events': 'none' }, svg);

    return {
        nodo,
        mostra() {
            nodo.hidden = false;
            requestAnimationFrame(() => {
                nodo.classList.add('visibile');
                parti.focus({ preventScroll: true });
            });
            faiAnnuncio();
        },
        nascondi() {
            nodo.classList.remove('visibile');
            nodo.hidden = true;
            voltaAnnuncio++;
            clearTimeout(timerAnnuncio);
            annuncio.classList.remove('si-vede');
            try { window.speechSynthesis?.cancel(); } catch { /* niente voce */ }
        },
        impostaBenvenuto: scriviBenvenuto
    };
}

// ========== I PERSONAGGI SULLA POLTRONA ==========
// Ogni giorno sulla poltrona del salotto siede un personaggio del Natale, con una frase

const FRASI = [
    ['babbo', 'Ho, ho, ho! Benvenuti! Da oggi ogni giorno si apre una casa: siete pronti?'],
    ['elfo', 'Shh! Sto finendo di incartare i regali… ne ho fatti mille e uno!'],
    ['pupazzo', 'Brrr, che bel freddo! Qui dentro però si sta proprio bene.'],
    ['mamma', 'Ho sfornato i biscotti: prendetene uno, ma solo uno!'],
    ['renna', 'Mi sto allenando a volare: domani provo a fare il giro del villaggio!'],
    ['zenzero', 'Non mangiatemi! Sono qui solo per farvi gli auguri.'],
    ['angelo', 'Ogni gesto gentile accende una stella nel cielo.'],
    ['befana', 'Sono arrivata un po\' in anticipo… volevo vedere il villaggio!'],
    ['elfo', 'Il laboratorio di Babbo Natale è pieno di giocattoli. Che confusione!'],
    ['pupazzo', 'Mi hanno messo una carota per naso. Vi piace?'],
    ['mamma', 'Stasera cioccolata calda per tutti, con la panna!'],
    ['renna', 'Sapete che dall\'alto riconosco ogni camino del mondo?'],
    ['angelo', 'Oggi è Santa Lucia: porta luce e dolcetti, tenete gli occhi aperti!'],
    ['zenzero', 'Ho le scarpe di glassa nuove. Guardate come brillano!'],
    ['befana', 'La mia scopa è velocissima, ma la slitta di Babbo Natale di più!'],
    ['elfo', 'Chi ha scritto la letterina a Babbo Natale? La porto io, di corsa!'],
    ['mamma', 'Babbo Natale russa come un trenino… ma non ditelo a nessuno!'],
    ['pupazzo', 'Se nevica ancora, domani avrò un fratellino!'],
    ['renna', 'Il mio naso si accende quando sono felice. Oggi è acceso!'],
    ['zenzero', 'Mancano pochi giorni a Natale: avete già fatto l\'albero?'],
    ['angelo', 'È la notte più lunga dell\'anno: guardate quante stelle!'],
    ['befana', 'Ho riempito le calze… di carbone dolce, naturalmente!'],
    ['elfo', 'Domani è la vigilia! Le renne sono già pronte a partire.'],
    ['babbo', 'Buona vigilia! Grazie per aver viaggiato con noi. Buon Natale a tutti!']
];

const NOMI_PERSONAGGI = {
    babbo: 'Babbo Natale', mamma: 'Mamma Natale', elfo: "L'elfo", befana: 'La Befana',
    pupazzo: 'Il pupazzo di neve', renna: 'La renna', angelo: "L'angioletto", zenzero: "L'omino di pan di zenzero"
};

// Disegna il personaggio seduto: il sedile della poltrona è all'altezza y = -78
function disegnaPersonaggio(g, tipo) {
    const pelle = '#f6c9a8';
    const forma = (d, fill, extra = {}) => el('path', { d, fill, ...extra }, g);
    const tondo = (cx, cy, r, fill, extra = {}) => el('circle', { cx, cy, r, fill, ...extra }, g);
    const viso = (y = -192, occhi = '#3b2412') => {
        tondo(-8, y - 2, 2.6, occhi);
        tondo(8, y - 2, 2.6, occhi);
        tondo(-13, y + 7, 4, '#f4a0a0', { opacity: 0.6 });
        tondo(13, y + 7, 4, '#f4a0a0', { opacity: 0.6 });
        forma(`M-6 ${y + 9} q 6 6 12 0`, 'none', { stroke: '#7a3c12', 'stroke-width': 2, 'stroke-linecap': 'round' });
    };
    const seduto = (abito, gambe, scarpe) => {
        forma('M-26 -84 h20 v52 h-20 Z M6 -84 h20 v52 h-20 Z', gambe);
        el('ellipse', { cx: -16, cy: -30, rx: 14, ry: 8, fill: scarpe }, g);
        el('ellipse', { cx: 16, cy: -30, rx: 14, ry: 8, fill: scarpe }, g);
        forma('M-38 -80 q -6 -52 12 -92 h52 q 18 40 12 92 Z', abito);
        forma('M-34 -160 q -18 34 -6 72 M34 -160 q 18 34 6 72', 'none', { stroke: abito, 'stroke-width': 15, 'stroke-linecap': 'round' });
    };

    switch (tipo) {
        case 'babbo':
            seduto('#c0392b', '#c0392b', '#1a1a1a');
            forma('M-4 -172 h8 v92 h-8 Z', '#fbfdff');
            el('rect', { x: -38, y: -118, width: 76, height: 10, fill: '#1a1a1a' }, g);
            el('rect', { x: -8, y: -120, width: 16, height: 14, fill: 'none', stroke: '#e2b93b', 'stroke-width': 3 }, g);
            tondo(-40, -88, 8, '#fbfdff'); tondo(40, -88, 8, '#fbfdff');
            tondo(0, -194, 24, pelle);
            forma('M-24 -192 q -4 40 24 48 q 28 -8 24 -48 q -10 14 -24 12 q -14 2 -24 -12 Z', '#fbfdff');
            viso(-198);
            forma('M-14 -184 q 7 -6 14 0 q 7 -6 14 0 q -7 8 -14 2 q -7 6 -14 -2 Z', '#fbfdff');
            forma('M-26 -210 Q 0 -250 26 -210 Z', '#c0392b');
            forma('M18 -232 q 16 4 16 22', 'none', { stroke: '#c0392b', 'stroke-width': 9, 'stroke-linecap': 'round' });
            tondo(34, -206, 7, '#fbfdff');
            el('rect', { x: -28, y: -214, width: 56, height: 10, rx: 5, fill: '#fbfdff' }, g);
            break;
        case 'mamma':
            seduto('#b03030', '#f3e6d6', '#5d3a22');
            forma('M-24 -150 h48 l6 70 h-60 Z', '#fbf6ea');
            forma('M-24 -150 q 24 10 48 0', 'none', { stroke: '#d63031', 'stroke-width': 3 });
            tondo(0, -194, 24, pelle);
            forma('M-26 -196 q 2 -30 26 -30 q 24 0 26 30 q -10 -14 -26 -14 q -16 0 -26 14 Z', '#eeeeee');
            tondo(0, -226, 10, '#eeeeee');
            viso(-194);
            el('circle', { cx: -9, cy: -196, r: 7, fill: 'none', stroke: '#8a6d1d', 'stroke-width': 1.6 }, g);
            el('circle', { cx: 9, cy: -196, r: 7, fill: 'none', stroke: '#8a6d1d', 'stroke-width': 1.6 }, g);
            tondo(-40, -88, 8, pelle); tondo(40, -88, 8, pelle);
            break;
        case 'elfo':
            seduto('#2e7d5b', '#fbfdff', '#7a3c12');
            forma('M-26 -74 h20 M-26 -60 h20 M-26 -46 h20 M6 -74 h20 M6 -60 h20 M6 -46 h20', 'none', { stroke: '#d63031', 'stroke-width': 6 });
            forma('M-30 -170 l8 10 8 -10 8 10 8 -10 8 10 8 -10 8 10 v-6 h-56 Z', '#d63031');
            tondo(0, -194, 22, pelle);
            forma('M-22 -196 l-16 -14 10 20 Z M22 -196 l16 -14 -10 20 Z', pelle);
            viso(-194);
            forma('M-24 -208 L10 -262 L26 -208 Z', '#2e7d5b');
            tondo(10, -264, 6, '#e2b93b');
            tondo(-40, -88, 7, pelle); tondo(40, -88, 7, pelle);
            break;
        case 'befana':
            forma('M40 -40 L70 -250', 'none', { stroke: '#7a4b2e', 'stroke-width': 6 });
            forma('M56 -40 l14 -40 14 40 Z', '#c9a46a');
            seduto('#3d3a4a', '#3d3a4a', '#1a1a1a');
            forma('M-30 -170 q 30 30 60 0 l8 40 q -38 20 -76 0 Z', '#7a3c8a');
            el('rect', { x: -26, y: -130, width: 14, height: 12, fill: '#c0392b' }, g);
            el('rect', { x: 10, y: -110, width: 14, height: 12, fill: '#2e7d5b' }, g);
            tondo(0, -194, 23, '#efc8a4');
            viso(-196);
            forma('M-2 -194 q 8 8 2 16 q -4 -2 -2 -16 Z', '#e0b08c');
            forma('M-28 -192 q 0 -42 28 -42 q 28 0 28 42 q -6 -24 -28 -26 q -22 2 -28 26 Z', '#5a2d6b');
            forma('M-26 -176 l-8 22 8 -4 Z M26 -176 l8 22 -8 -4 Z', '#5a2d6b');
            tondo(-40, -88, 7, '#efc8a4'); tondo(40, -88, 7, '#efc8a4');
            break;
        case 'pupazzo':
            tondo(0, -110, 44, '#fbfdff', { stroke: '#cdd8ee', 'stroke-width': 2 });
            tondo(0, -186, 28, '#fbfdff', { stroke: '#cdd8ee', 'stroke-width': 2 });
            [-124, -104].forEach(y => tondo(0, y, 4, '#222'));
            tondo(-9, -192, 3, '#222'); tondo(9, -192, 3, '#222');
            forma('M0 -186 l 20 4 -20 4 Z', '#f39c12');
            forma('M-8 -174 q 8 5 16 0', 'none', { stroke: '#222', 'stroke-width': 2, 'stroke-dasharray': '1 3', 'stroke-linecap': 'round' });
            forma('M-26 -164 q 26 12 52 0 l 4 10 q -30 12 -60 0 Z M14 -158 l 6 34 -10 2 -4 -30', '#c0392b');
            el('rect', { x: -22, y: -238, width: 44, height: 28, fill: '#222' }, g);
            el('rect', { x: -32, y: -214, width: 64, height: 7, fill: '#222' }, g);
            forma('M-42 -120 l -24 -24 M-56 -134 l -6 -10 M42 -120 l 24 -24 M56 -134 l 6 -10', 'none', { stroke: '#6b4a32', 'stroke-width': 4, 'stroke-linecap': 'round' });
            break;
        case 'renna':
            seduto('#8a5a3c', '#7a5236', '#2a1d14');
            forma('M-20 -150 q 20 20 40 0 v60 q -20 10 -40 0 Z', '#c8a27a');
            el('ellipse', { cx: 0, cy: -194, rx: 22, ry: 26, fill: '#8a5a3c' }, g);
            el('ellipse', { cx: 0, cy: -178, rx: 13, ry: 10, fill: '#c8a27a' }, g);
            tondo(0, -182, 6, '#e74c3c', { filter: 'url(#bagliore)' });
            tondo(-9, -200, 2.6, '#1a1a1a'); tondo(9, -200, 2.6, '#1a1a1a');
            forma('M-20 -206 l-14 -8 6 12 Z M20 -206 l14 -8 -6 12 Z', '#6b4a32');
            forma('M-10 -216 q -16 -20 -10 -44 M-18 -240 l -12 -6 M-14 -252 l -6 -12 M10 -216 q 16 -20 10 -44 M18 -240 l 12 -6 M14 -252 l 6 -12', 'none', { stroke: '#d8c3a0', 'stroke-width': 5, 'stroke-linecap': 'round' });
            forma('M-24 -168 q 24 12 48 0 l 2 8 q -26 12 -52 0 Z', '#2e7d5b');
            break;
        case 'angelo':
            el('ellipse', { cx: -44, cy: -150, rx: 30, ry: 18, fill: '#fbfdff', stroke: '#e3d5b8', transform: 'rotate(-30 -44 -150)' }, g);
            el('ellipse', { cx: 44, cy: -150, rx: 30, ry: 18, fill: '#fbfdff', stroke: '#e3d5b8', transform: 'rotate(30 44 -150)' }, g);
            seduto('#fbfdff', '#fbf6ea', '#e2b93b');
            forma('M-38 -80 h76', 'none', { stroke: '#e2b93b', 'stroke-width': 4 });
            tondo(0, -194, 23, pelle);
            forma('M-24 -196 q -4 -30 24 -30 q 28 0 24 30 q -6 -14 -12 -10 q -6 -10 -12 -4 q -6 -10 -12 0 q -6 -6 -12 14 Z', '#f4d03f');
            viso(-192);
            el('ellipse', { cx: 0, cy: -234, rx: 20, ry: 5, fill: 'none', stroke: '#e2b93b', 'stroke-width': 4 }, g);
            tondo(-40, -88, 7, pelle); tondo(40, -88, 7, pelle);
            break;
        case 'zenzero':
            forma('M-26 -84 h20 v52 h-20 Z M6 -84 h20 v52 h-20 Z', '#b5652f');
            forma('M-38 -80 q -6 -52 12 -92 h52 q 18 40 12 92 Z', '#b5652f');
            forma('M-34 -160 q -18 34 -6 72 M34 -160 q 18 34 6 72', 'none', { stroke: '#b5652f', 'stroke-width': 15, 'stroke-linecap': 'round' });
            forma('M-30 -40 q 4 -4 8 0 q 4 -4 8 0 M10 -40 q 4 -4 8 0 q 4 -4 8 0 M-44 -96 q 4 -4 8 0 M36 -96 q 4 -4 8 0', 'none', { stroke: '#fbfdff', 'stroke-width': 2.5 });
            [[0, -150, '#e74c3c'], [0, -128, '#2ecc71'], [0, -106, '#f4d03f']].forEach(([x, y, c]) => tondo(x, y, 5, c));
            tondo(0, -194, 24, '#b5652f');
            tondo(-8, -198, 3, '#fbfdff'); tondo(8, -198, 3, '#fbfdff');
            forma('M-9 -186 q 9 8 18 0', 'none', { stroke: '#fbfdff', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
            forma('M-22 -212 q 22 -12 44 0', 'none', { stroke: '#fbfdff', 'stroke-width': 2.5, 'stroke-dasharray': '4 4' });
            break;
    }
}

// Il personaggio sulla poltrona e il suo fumetto. La frase va a capo da sola
function creaPersonaggio(poltrona) {
    const posto = el('g', { transform: 'translate(0 -78) scale(1.2) translate(0 78)' }, poltrona);
    const fumetto = el('g', { class: 'fumetto' });
    return {
        posto,
        mostra(giorno) {
            const [tipo, frase] = FRASI[(giorno - 1) % FRASI.length];
            posto.replaceChildren();
            disegnaPersonaggio(posto, tipo);

            const righe = [];
            frase.split(' ').forEach(parola => {
                const ultima = righe[righe.length - 1];
                if (ultima && (ultima + ' ' + parola).length <= 21) righe[righe.length - 1] = ultima + ' ' + parola;
                else righe.push(parola);
            });
            const altezza = 52 + righe.length * 29;
            const sopra = 590 - altezza;
            const [sinistra, destra, sotto] = [1318, 1596, 590];
            // Il fumetto va sopra a tutto il resto della stanza
            poltrona.ownerSVGElement.append(fumetto);
            fumetto.replaceChildren();
            el('path', { d: `M${sinistra + 12} ${sopra} H${destra - 12} q 12 0 12 12 V${sotto - 12} q 0 12 -12 12 H1500 l-36 34 8 -34 H${sinistra + 12} q -12 0 -12 -12 V${sopra + 12} q 0 -12 12 -12 Z`, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 3 }, fumetto);
            el('text', { x: sinistra + 14, y: sopra + 26, 'font-size': 17, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#9b1d2a' }, fumetto).textContent = NOMI_PERSONAGGI[tipo];
            righe.forEach((riga, i) => {
                el('text', { x: sinistra + 14, y: sopra + 56 + i * 29, 'font-size': 23, 'font-family': 'Georgia, serif', fill: '#3b2a1a' }, fumetto).textContent = riga;
            });
        }
    };
}

// ========== DENTRO LA CASA ==========

// Colori del pacco regalo: carta e nastro cambiano da un giorno all'altro
const CARTE_REGALO = [
    { carta: '#c0392b', nastro: '#f4d03f' },
    { carta: '#2e7d5b', nastro: '#e74c3c' },
    { carta: '#3a5ba0', nastro: '#ffd36b' },
    { carta: '#8e5ea2', nastro: '#f7f1e3' },
    { carta: '#f3efe6', nastro: '#c0392b' }
];

// Il salotto con il camino, dove si scarta il regalo del giorno
function creaInterno({ onScarta, onEsci }) {
    const nodo = Object.assign(document.createElement('div'), { className: 'interno', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'Il salotto della casa, con il camino acceso e un regalo' });
    const esci = Object.assign(document.createElement('button'), { type: 'button', className: 'esci', textContent: '← Torna al villaggio' });
    nodo.append(svg, esci);

    const defs = el('defs', {}, svg);
    const parati = el('pattern', { id: 'carta-parati', width: 60, height: 60, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 30, height: 60, fill: 'rgba(255,255,255,0.05)' }, parati);
    el('path', { d: 'M45 12 l4 8 -4 8 -4 -8 Z M15 42 l4 8 -4 8 -4 -8 Z', fill: 'rgba(255,215,130,0.18)' }, parati);
    const caldo = el('radialGradient', { id: 'luce-camino', cx: '50%', cy: '50%', r: '50%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffb347', 'stop-opacity': 0.55 }, caldo);
    el('stop', { offset: '100%', 'stop-color': '#ffb347', 'stop-opacity': 0 }, caldo);
    const raggi = el('radialGradient', { id: 'luce-regalo', cx: '50%', cy: '50%', r: '50%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff6c8', 'stop-opacity': 1 }, raggi);
    el('stop', { offset: '100%', 'stop-color': '#ffd36b', 'stop-opacity': 0 }, raggi);

    // La stanza in prospettiva: parete di fondo, pareti laterali, soffitto e pavimento.
    // Pareti, soffitto e pavimento escono dal riquadro: così riempiono anche gli schermi molto larghi o stretti
    const FONDO = { x1: 220, x2: 1380, y1: 70, y2: 560 };
    const fuga = (x, y, k = 5) => [800 + (x - 800) * k, 330 + (y - 330) * k];
    const poligono = (punti, attributi) => el('path', { d: 'M' + punti.map(p => p.map(n => n.toFixed(1)).join(' ')).join(' L') + ' Z', ...attributi }, svg);

    const sfumaParete = el('linearGradient', { id: 'ombra-parete', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#000', 'stop-opacity': 0.45 }, sfumaParete);
    el('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': 0.05 }, sfumaParete);
    const vignetta = el('radialGradient', { id: 'vignetta', gradientUnits: 'userSpaceOnUse', cx: 800, cy: 470, r: 1000 }, defs);
    el('stop', { offset: '55%', 'stop-color': '#000', 'stop-opacity': 0 }, vignetta);
    el('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': 0.6 }, vignetta);
    const focolare = el('radialGradient', { id: 'focolare', cx: '50%', cy: '95%', r: '75%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ff8c32' }, focolare);
    el('stop', { offset: '45%', 'stop-color': '#5a1a08' }, focolare);
    el('stop', { offset: '100%', 'stop-color': '#120604' }, focolare);
    const cielo = el('linearGradient', { id: 'notte-finestra', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#0d1640' }, cielo);
    el('stop', { offset: '100%', 'stop-color': '#3a4f99' }, cielo);
    const brina = el('radialGradient', { id: 'brina', cx: '0%', cy: '100%', r: '60%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': 0.8 }, brina);
    el('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': 0 }, brina);
    const vetroFinestra = el('clipPath', { id: 'vetro-finestra' }, defs);
    el('rect', { x: 282, y: 152, width: 226, height: 236 }, vetroFinestra);

    // Soffitto con le travi
    poligono([[FONDO.x1, FONDO.y1], [FONDO.x2, FONDO.y1], fuga(FONDO.x2, FONDO.y1), fuga(FONDO.x1, FONDO.y1)], { fill: '#4a2e1c' });
    for (let i = 0; i <= 6; i++) {
        const bx = FONDO.x1 + (i * (FONDO.x2 - FONDO.x1)) / 6;
        poligono([[bx - 9, FONDO.y1], [bx + 9, FONDO.y1], fuga(bx + 9, FONDO.y1), fuga(bx - 9, FONDO.y1)], { fill: '#2a1a10' });
    }
    // Pareti laterali: la sinistra in ombra, la destra scaldata dal camino
    [[FONDO.x1, '#5a1d27', 'url(#ombra-parete)'], [FONDO.x2, '#6e2430', 'rgba(255,150,60,0.12)']].forEach(([bx, colore, luce]) => {
        const parete = [[bx, FONDO.y1], [bx, FONDO.y2], fuga(bx, FONDO.y2), fuga(bx, FONDO.y1)];
        poligono(parete, { fill: colore });
        poligono(parete, { fill: 'url(#carta-parati)' });
        poligono(parete, { fill: luce });
        poligono([[bx, 450], [bx, FONDO.y2], fuga(bx, FONDO.y2), fuga(bx, 450)], { fill: '#4a2c1c' });
        poligono([[bx, 444], [bx, 452], fuga(bx, 452), fuga(bx, 444)], { fill: '#7a4b2e' });
    });
    // Parete di fondo con la boiserie
    el('rect', { x: FONDO.x1, y: FONDO.y1, width: FONDO.x2 - FONDO.x1, height: FONDO.y2 - FONDO.y1, fill: '#6e2430' }, svg);
    el('rect', { x: FONDO.x1, y: FONDO.y1, width: FONDO.x2 - FONDO.x1, height: FONDO.y2 - FONDO.y1, fill: 'url(#carta-parati)' }, svg);
    el('rect', { x: FONDO.x1, y: 450, width: FONDO.x2 - FONDO.x1, height: 110, fill: '#4a2c1c' }, svg);
    for (let x = FONDO.x1 + 14; x < FONDO.x2 - 60; x += 96) el('rect', { x, y: 466, width: 80, height: 80, rx: 3, fill: 'none', stroke: '#3a2114', 'stroke-width': 3 }, svg);
    el('rect', { x: FONDO.x1, y: 444, width: FONDO.x2 - FONDO.x1, height: 8, fill: '#7a4b2e' }, svg);
    el('rect', { x: FONDO.x1, y: FONDO.y1 - 8, width: FONDO.x2 - FONDO.x1, height: 16, fill: '#2a1a10' }, svg);
    el('path', { d: `M${FONDO.x1} ${FONDO.y1} V${FONDO.y2} M${FONDO.x2} ${FONDO.y1} V${FONDO.y2}`, stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 6 }, svg);

    // Pavimento a listoni che si allontana verso il fondo
    poligono([[FONDO.x1, FONDO.y2], [FONDO.x2, FONDO.y2], fuga(FONDO.x2, FONDO.y2), fuga(FONDO.x1, FONDO.y2)], { fill: '#8a5a3c' });
    for (let bx = FONDO.x1; bx <= FONDO.x2; bx += 48) {
        const [fx, fy] = fuga(bx, FONDO.y2);
        el('path', { d: `M${bx} ${FONDO.y2} L${fx.toFixed(1)} ${fy.toFixed(1)}`, stroke: '#6d4630', 'stroke-width': 2 }, svg);
    }
    [592, 634, 690, 762, 856, 980].forEach(y => {
        const k = (y - 330) / (FONDO.y2 - 330);
        const [sx] = fuga(FONDO.x1, FONDO.y2, k);
        const [dx] = fuga(FONDO.x2, FONDO.y2, k);
        el('path', { d: `M${sx.toFixed(1)} ${y} H${dx.toFixed(1)}`, stroke: '#6d4630', 'stroke-width': 1.5, opacity: 0.6 }, svg);
    });
    el('ellipse', { class: 'luce-calda', cx: 1160, cy: 640, rx: 560, ry: 170, fill: 'url(#luce-camino)' }, svg);

    // Finestra con i vetri ghiacciati e la neve che cade fuori
    el('rect', { x: 262, y: 132, width: 266, height: 276, rx: 6, fill: '#f3ead8' }, svg);
    el('rect', { x: 282, y: 152, width: 226, height: 236, fill: 'url(#notte-finestra)' }, svg);
    const fuori = el('g', { 'clip-path': 'url(#vetro-finestra)' }, svg);
    for (let i = 0; i < 18; i++) el('circle', { cx: 290 + caso() * 210, cy: 160 + caso() * 120, r: 0.8 + caso() * 1.4, fill: '#fff', opacity: 0.9 }, fuori);
    el('circle', { cx: 450, cy: 200, r: 20, fill: '#fdf6d8' }, fuori);
    el('path', { d: 'M282 340 L330 300 L360 322 L410 280 L460 318 L508 296 V388 H282 Z', fill: '#8fa6d8' }, fuori);
    el('path', { d: 'M282 388 V360 q 50 -26 110 -8 q 60 -22 116 4 V388 Z', fill: '#eef3ff' }, fuori);
    for (let i = 0; i < 22; i++) {
        el('circle', { class: 'fiocco-finestra', cx: 286 + caso() * 220, cy: 140, r: 1.5 + caso() * 2, fill: '#fff', style: `animation-delay:-${(caso() * 6).toFixed(2)}s;animation-duration:${(4 + caso() * 3).toFixed(1)}s` }, fuori);
    }
    el('path', { d: 'M395 152 V388 M282 270 H508', stroke: '#f3ead8', 'stroke-width': 9 }, svg);
    [[282, 388, 0], [508, 388, 90], [282, 152, 270], [508, 152, 180]].forEach(([cx, cy, giro]) => {
        el('rect', { x: cx - 70, y: cy - 70, width: 140, height: 140, fill: 'url(#brina)', transform: `rotate(${giro} ${cx} ${cy})`, 'clip-path': 'url(#vetro-finestra)' }, svg);
    });
    el('rect', { x: 250, y: 404, width: 290, height: 14, rx: 3, fill: '#d8ccb4' }, svg);
    // Candela sul davanzale
    el('rect', { x: 444, y: 372, width: 12, height: 32, rx: 2, fill: '#f6efe0' }, svg);
    el('circle', { cx: 450, cy: 362, r: 22, fill: 'url(#alone)', opacity: 0.8 }, svg);
    el('path', { class: 'candela', d: 'M450 356 q -5 8 0 14 q 5 -6 0 -14 Z', fill: '#ffd36b' }, svg);
    // Tende di velluto con le pieghe, raccolte da un cordone dorato
    [[236, 1], [554, -1]].forEach(([x, verso]) => {
        el('path', { d: `M${x - 18 * verso} 112 H${x + 44 * verso} q ${-10 * verso} 120 ${-26 * verso} 160 q ${16 * verso} 60 ${10 * verso} 170 H${x - 18 * verso} Z`, fill: '#9b1d2a' }, svg);
        el('path', { d: `M${x - 4 * verso} 116 q ${6 * verso} 150 0 320 M${x + 12 * verso} 116 q ${4 * verso} 120 ${-8 * verso} 160`, stroke: '#6f121c', 'stroke-width': 4, fill: 'none' }, svg);
        el('ellipse', { cx: x + 12 * verso, cy: 272, rx: 16, ry: 5, fill: '#c9a227' }, svg);
    });
    el('rect', { x: 210, y: 104, width: 370, height: 12, rx: 6, fill: '#c9a227' }, svg);

    // Cartello con la data, appeso al centro
    el('path', { d: 'M800 72 L700 92 M800 72 L900 92', stroke: '#c9a227', 'stroke-width': 3 }, svg);
    el('rect', { x: 660, y: 90, width: 280, height: 110, rx: 10, fill: '#c9a227' }, svg);
    el('rect', { x: 672, y: 102, width: 256, height: 86, rx: 6, fill: '#fffaf0' }, svg);
    const data = el('text', { x: 800, y: 160, 'text-anchor': 'middle', 'font-size': 46, 'font-style': 'italic', 'font-family': 'Georgia, serif', fill: '#9b1d2a' }, svg);

    // Quadro sopra il camino: un dipinto natalizio diverso ogni giorno
    const quadro = creaQuadro(svg, defs);

    // Camino in pietra
    el('ellipse', { cx: 1160, cy: 400, rx: 380, ry: 260, fill: 'url(#luce-camino)', opacity: 0.6, class: 'luce-calda' }, svg);
    el('path', { d: 'M950 560 H1370 L1394 604 H926 Z', fill: '#7d7067' }, svg);
    el('path', { d: 'M950 560 H1370 L1394 604 H926 Z', fill: 'url(#tex-pietra)' }, svg);
    el('rect', { x: 980, y: 276, width: 360, height: 284, fill: '#9c8f86' }, svg);
    el('rect', { x: 980, y: 276, width: 360, height: 284, fill: 'url(#tex-pietra)' }, svg);
    el('rect', { x: 980, y: 276, width: 360, height: 284, fill: 'url(#ombra-muro)' }, svg);
    el('path', { d: 'M1066 560 V420 q 0 -60 94 -60 q 94 0 94 60 V560 Z', fill: '#6d625b' }, svg);
    el('path', { d: 'M1078 560 V424 q 0 -50 82 -50 q 82 0 82 50 V560 Z', fill: 'url(#focolare)' }, svg);
    // Alari, ceppi, braci e fiamme
    el('path', { d: 'M1100 556 V530 l -6 -6 M1220 556 V530 l 6 -6', stroke: '#141414', 'stroke-width': 5, fill: 'none' }, svg);
    el('ellipse', { class: 'brace', cx: 1160, cy: 552, rx: 74, ry: 9, fill: '#ff7a1a', filter: 'url(#bagliore)' }, svg);
    el('rect', { x: 1092, y: 528, width: 136, height: 18, rx: 9, fill: '#5d3a22', transform: 'rotate(-5 1160 537)' }, svg);
    el('rect', { x: 1096, y: 534, width: 128, height: 17, rx: 8.5, fill: '#6d4630', transform: 'rotate(6 1160 542)' }, svg);
    el('ellipse', { cx: 1226, cy: 532, rx: 6, ry: 8, fill: '#c8a27a', stroke: '#8a6d4c', 'stroke-width': 1.5 }, svg);
    const fuoco = el('g', { class: 'fuoco', transform: 'translate(-40 -66)' }, svg);
    [['#e25822', 'M1140 610 q -10 -70 30 -120 q 0 60 30 70 q 10 -60 40 -90 q 10 80 40 100 q 10 -30 0 -60 q 40 40 20 100 Z'],
        ['#f39c12', 'M1160 610 q 0 -50 25 -80 q 5 40 20 50 q 10 -40 30 -60 q 5 50 20 70 q 10 -10 10 -30 q 15 30 -5 50 Z'],
        ['#ffe066', 'M1180 610 q 5 -30 20 -50 q 5 25 15 30 q 5 -20 15 -30 q 5 30 -5 50 Z']]
        .forEach(([colore, d], i) => el('path', { class: 'fiamma', d, fill: colore, style: `animation-delay:${i * 0.15}s` }, fuoco));
    for (let i = 0; i < 7; i++) {
        el('circle', { class: 'favilla', cx: 1130 + caso() * 60, cy: 500, r: 1.6 + caso() * 1.4, fill: '#ffd36b', style: `--sale:${(-60 - caso() * 70).toFixed(0)}px;animation-delay:-${(caso() * 3).toFixed(2)}s` }, svg);
    }
    // Mensola con candele, orologio, ghirlanda e calze
    el('rect', { x: 958, y: 254, width: 404, height: 24, rx: 3, fill: '#5d3a22' }, svg);
    el('rect', { x: 958, y: 254, width: 404, height: 5, rx: 2, fill: '#8a5a3c' }, svg);
    [[1000, 0], [1320, 0.7]].forEach(([cx, ritardo]) => {
        el('rect', { x: cx - 6, y: 218, width: 12, height: 36, rx: 2, fill: '#f6efe0' }, svg);
        el('circle', { cx, cy: 208, r: 24, fill: 'url(#alone)', opacity: 0.8 }, svg);
        el('path', { class: 'candela', d: `M${cx} 202 q -5 8 0 14 q 5 -6 0 -14 Z`, fill: '#ffd36b', style: `animation-delay:${ritardo}s` }, svg);
    });
    el('path', { d: 'M1136 254 V236 q 0 -16 24 -16 q 24 0 24 16 V254 Z', fill: '#6d4630' }, svg);
    el('circle', { cx: 1160, cy: 238, r: 10, fill: '#fdf6dc', stroke: '#c9a227', 'stroke-width': 2 }, svg);
    el('path', { d: 'M1160 238 V231 M1160 238 L1165 240', stroke: '#222', 'stroke-width': 1.5 }, svg);
    el('path', { d: 'M962 272 q 50 28 100 0 q 50 28 100 0 q 50 28 100 0 q 50 28 100 0', fill: 'none', stroke: '#2e6b3f', 'stroke-width': 12, 'stroke-linecap': 'round' }, svg);
    for (let i = 0; i < 9; i++) el('circle', { class: 'pallina', cx: 980 + i * 46, cy: 282 + (i % 2) * 6, r: 5, fill: ['#e74c3c', '#f4d03f', '#5dade2'][i % 3], style: `animation-delay:${(i * 0.2).toFixed(1)}s` }, svg);
    [1032, 1160, 1288].forEach((x, i) => {
        const colore = ['#c0392b', '#2e7d5b', '#c0392b'][i];
        el('path', { d: `M${x - 16} 286 V340 q 0 20 24 20 h20 q 13 0 13 -13 q 0 -13 -15 -13 h-11 V286 Z`, fill: colore }, svg);
        el('path', { d: `M${x - 16} 300 h31 M${x - 16} 318 h31`, stroke: '#f7f1e3', 'stroke-width': 3, opacity: 0.6 }, svg);
        el('rect', { x: x - 20, y: 280, width: 36, height: 15, rx: 4, fill: '#f7f1e3' }, svg);
    });

    // Tappeto con la frangia
    el('ellipse', { cx: 800, cy: 800, rx: 400, ry: 90, fill: '#7d2026' }, svg);
    el('ellipse', { cx: 800, cy: 800, rx: 372, ry: 76, fill: 'none', stroke: '#d4a84b', 'stroke-width': 5 }, svg);
    el('ellipse', { cx: 800, cy: 800, rx: 300, ry: 56, fill: 'none', stroke: '#2e6b3f', 'stroke-width': 4, 'stroke-dasharray': '18 10' }, svg);
    el('ellipse', { cx: 800, cy: 800, rx: 200, ry: 34, fill: 'none', stroke: '#d4a84b', 'stroke-width': 3 }, svg);
    for (let a = 0; a < 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const [cx, cy] = [800 + Math.cos(t) * 400, 800 + Math.sin(t) * 90];
        el('path', { d: `M${cx.toFixed(1)} ${cy.toFixed(1)} l ${(Math.cos(t) * 10).toFixed(1)} ${(Math.sin(t) * 5).toFixed(1)}`, stroke: '#e8d9b8', 'stroke-width': 2 }, svg);
    }

    // Il gatto rosso tigrato che dorme acciambellato davanti al fuoco
    const peloGatto = el('radialGradient', { id: 'pelo-gatto', cx: '62%', cy: '28%', r: '78%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#f2b268' }, peloGatto);
    el('stop', { offset: '55%', 'stop-color': '#d4823a' }, peloGatto);
    el('stop', { offset: '100%', 'stop-color': '#a35a20' }, peloGatto);
    const gatto = el('g', { transform: 'translate(1100 654) scale(1.1)' }, svg);
    el('ellipse', { cx: 4, cy: 5, rx: 66, ry: 9, fill: 'rgba(0,0,0,0.28)' }, gatto);
    const respiro = el('g', { class: 'respiro' }, gatto);
    const striscia = { stroke: '#a3551a', 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round', opacity: 0.85 };

    // Corpo acciambellato, più chiaro dal lato del camino
    el('path', { d: 'M-44 0 C -52 -20, -36 -44, -4 -46 C 30 -48, 58 -34, 58 -14 C 58 2, 40 6, 10 6 C -14 6, -38 6, -44 0 Z', fill: 'url(#pelo-gatto)' }, respiro);
    el('path', { d: 'M-10 -45 C 20 -48, 50 -38, 57 -18', stroke: '#ffd29a', 'stroke-width': 3, fill: 'none', opacity: 0.7, 'stroke-linecap': 'round' }, respiro);
    // Coscia posteriore con gli anelli tigrati
    el('ellipse', { cx: 32, cy: -16, rx: 22, ry: 18, fill: 'url(#pelo-gatto)' }, respiro);
    el('path', { d: 'M20 -32 q 12 -4 22 4 M14 -22 q 14 -6 28 4 M16 -10 q 12 -4 24 2', ...striscia }, respiro);
    // Strisce che seguono la curva della schiena
    el('path', { d: 'M-24 -40 q 6 12 2 26 M-12 -45 q 6 14 2 30 M0 -46 q 6 14 2 32 M50 -32 q -4 8 -2 16', ...striscia }, respiro);

    // Coda che avvolge il corpo, con la punta più scura
    el('path', { d: 'M56 -6 C 60 8, 30 14, 0 12 C -22 11, -38 9, -46 4', fill: 'none', stroke: '#c8752c', 'stroke-width': 10, 'stroke-linecap': 'round' }, respiro);
    el('path', { d: 'M56 -6 C 60 8, 30 14, 0 12 C -22 11, -38 9, -46 4', fill: 'none', stroke: '#9a4f18', 'stroke-width': 10, 'stroke-dasharray': '5 9', opacity: 0.8 }, respiro);
    el('path', { d: 'M-34 8 C -40 7, -44 6, -46 4', fill: 'none', stroke: '#7a3c12', 'stroke-width': 10, 'stroke-linecap': 'round' }, respiro);

    // Zampe anteriori con le punte bianche, sotto la testa
    el('ellipse', { cx: -44, cy: 1, rx: 14, ry: 5.5, fill: '#e09a55' }, respiro);
    el('ellipse', { cx: -55, cy: 1, rx: 5.5, ry: 4.5, fill: '#fbf3e6' }, respiro);
    el('ellipse', { cx: -50, cy: -3, rx: 5, ry: 4, fill: '#fbf3e6' }, respiro);

    // Testa appoggiata sulle zampe
    const testa = el('g', { transform: 'translate(-44 -14) rotate(-8)' }, respiro);
    el('path', { d: 'M-16 -10 L-14 -31 L-2 -17 Z', fill: '#c8752c' }, testa);
    el('path', { d: 'M-13 -12 L-12.5 -25 L-5 -16 Z', fill: '#e8a0a0' }, testa);
    el('path', { d: 'M4 -17 L16 -31 L19 -8 Z', fill: '#b9692a' }, testa);
    el('path', { d: 'M7 -16 L15 -25 L16.5 -11 Z', fill: '#d98f8f' }, testa);
    el('ellipse', { cx: 0, cy: 0, rx: 22, ry: 17.5, fill: 'url(#pelo-gatto)' }, testa);
    el('path', { d: 'M-20 6 q -4 4 -2 8 q 4 -1 6 -4 M20 4 q 5 3 3 8 q -4 -1 -6 -4', fill: '#d4823a' }, testa);
    el('path', { d: 'M-5 -15 l1 7 M1 -16 l0 7 M7 -15 l-1 7', stroke: '#a3551a', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, testa);
    el('ellipse', { cx: -5, cy: 7, rx: 10, ry: 6.5, fill: '#f6dbb5' }, testa);
    el('path', { d: 'M-8 2 h5 l-2.5 3 Z', fill: '#e58a8a' }, testa);
    el('path', { d: 'M-5.5 5 v2 M-5.5 7 q -3 2 -5 0 M-5.5 7 q 3 2 5 0', stroke: '#7a3c12', 'stroke-width': 1, fill: 'none' }, testa);
    // Occhi chiusi a mezzaluna, con le ciglia
    el('path', { d: 'M-15 -4 q 4.5 3.5 9 0 M3 -5 q 4.5 3.5 9 0', stroke: '#3b2412', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }, testa);
    el('path', { d: 'M-13 -2.5 l-1 2 M-9 -1.5 v2 M5 -3.5 l-1 2 M9 -2.5 v2', stroke: '#3b2412', 'stroke-width': 0.9 }, testa);
    // Baffi
    el('path', { d: 'M-13 6 l-20 -3 M-13 8 l-20 2 M-12 10 l-17 6 M3 6 l14 -4 M3 8 l15 1', stroke: '#fbf3e6', 'stroke-width': 0.9, opacity: 0.85, 'stroke-linecap': 'round' }, testa);

    const ricettario = creaRicettario(nodo);
    const tavolino = creaTavolino(svg, nome => ricettario.mostra(nome));

    // Poltrona di velluto con la coperta a quadri
    const poltrona = el('g', { transform: 'translate(1430 840)' }, svg);
    el('ellipse', { cx: 0, cy: 6, rx: 150, ry: 18, fill: 'rgba(0,0,0,0.3)' }, poltrona);
    el('path', { d: 'M-118 0 v18 M118 0 v18 M-90 0 v14 M90 0 v14', stroke: '#3b2412', 'stroke-width': 9, 'stroke-linecap': 'round' }, poltrona);
    el('path', { d: 'M-104 -170 q 0 -60 104 -60 q 104 0 104 60 V-60 H-104 Z', fill: '#7d2026' }, poltrona);
    el('path', { d: 'M-104 -170 q 0 -60 104 -60 q 104 0 104 60 V-60 H-104 Z', fill: 'url(#cilindro)' }, poltrona);
    el('path', { d: 'M-60 -200 v120 M0 -214 v134 M60 -200 v120', stroke: '#5c141b', 'stroke-width': 3, opacity: 0.6 }, poltrona);
    el('rect', { x: -112, y: -78, width: 224, height: 72, rx: 14, fill: '#8e2b2b' }, poltrona);
    el('rect', { x: -96, y: -92, width: 192, height: 30, rx: 14, fill: '#a33a3a' }, poltrona);
    const personaggio = creaPersonaggio(poltrona);
    [-1, 1].forEach(verso => {
        el('rect', { x: verso > 0 ? 96 : -136, y: -128, width: 40, height: 122, rx: 18, fill: '#6f1b22' }, poltrona);
        el('rect', { x: verso > 0 ? 96 : -136, y: -128, width: 40, height: 122, rx: 18, fill: 'url(#cilindro)' }, poltrona);
    });
    // Coperta a quadri appoggiata sul bracciolo
    el('path', { d: 'M-140 -132 q 30 -12 60 0 L-70 -30 q -30 10 -60 0 Z', fill: '#2e6b3f' }, poltrona);
    el('path', { d: 'M-128 -134 L-118 -24 M-104 -138 L-98 -26 M-84 -134 L-80 -30 M-136 -100 q 30 -8 62 0 M-132 -64 q 30 -8 60 0', stroke: '#c0392b', 'stroke-width': 4, fill: 'none' }, poltrona);
    el('path', { d: 'M-130 -24 v8 M-118 -22 v8 M-106 -22 v8 M-94 -24 v8 M-82 -26 v8', stroke: '#e8d9b8', 'stroke-width': 2 }, poltrona);

    // Albero di Natale nell'angolo con le lucine e i pacchetti
    const albero = el('g', { transform: 'translate(300 800) scale(1.3)' }, svg);
    el('ellipse', { cx: 0, cy: 4, rx: 150, ry: 18, fill: 'rgba(0,0,0,0.3)' }, albero);
    el('ellipse', { class: 'luce-calda', cx: 0, cy: -190, rx: 230, ry: 270, fill: 'url(#alone)', opacity: 0.55 }, albero);
    el('ellipse', { class: 'luce-calda', cx: 0, cy: 6, rx: 210, ry: 34, fill: 'url(#alone)', opacity: 0.6 }, albero);
    el('rect', { x: -14, y: -40, width: 28, height: 40, fill: '#5d4037' }, albero);
    el('path', { d: 'M-46 0 l 6 -34 h80 l 6 34 Z', fill: '#a5402d' }, albero);
    el('rect', { x: -48, y: -40, width: 96, height: 8, rx: 3, fill: '#c9a227' }, albero);
    const ramo = (y, larghezza, altezza, colore) => {
        let d = `M0 ${y - altezza}`;
        const punte = 7;
        for (let i = 0; i <= punte; i++) {
            const x = larghezza / 2 - (i * larghezza) / punte;
            d += ` L${x.toFixed(1)} ${y - (i % 2 ? 10 : 0)}`;
        }
        el('path', { d: d + ' Z', fill: colore }, albero);
        el('path', { d: `M0 ${y - altezza} L${(-larghezza / 2).toFixed(1)} ${y}`, stroke: 'rgba(0,0,0,0.2)', 'stroke-width': larghezza / 6, opacity: 0.4 }, albero);
    };
    ramo(-34, 250, 130, '#1d5e3f');
    ramo(-110, 210, 120, '#20684a');
    ramo(-180, 170, 110, '#22704f');
    ramo(-246, 120, 100, '#257a56');
    ramo(-306, 76, 80, '#288260');
    el('path', { d: 'M-110 -70 q 110 40 220 -14 M-100 -112 q 100 34 196 -10 M-88 -150 q 90 30 176 -12 M-74 -188 q 74 28 150 -8 M-62 -222 q 64 24 124 -10 M-40 -284 q 40 14 80 -6', stroke: '#e2b93b', 'stroke-width': 3.5, fill: 'none', opacity: 0.95 }, albero);
    el('path', { d: 'M-104 -92 q 104 -30 208 6 M-80 -170 q 80 -24 160 4 M-52 -254 q 52 -16 104 4', stroke: '#d63031', 'stroke-width': 2.5, fill: 'none', 'stroke-dasharray': '1 5', 'stroke-linecap': 'round' }, albero);
    ['#e74c3c', '#f4d03f', '#5dade2', '#af7ac5', '#e74c3c', '#f4d03f', '#5dade2', '#e74c3c', '#f4d03f', '#af7ac5', '#5dade2', '#f4d03f', '#e74c3c', '#5dade2'].forEach((colore, i) => {
        const livello = i / 14;
        el('circle', { class: 'pallina', cx: Math.sin(i * 2.4) * (100 - livello * 80), cy: -50 - livello * 300, r: 6.5, fill: colore, style: `animation-delay:${(i * 0.25).toFixed(2)}s` }, albero);
    });
    // Tanti addobbi: palline col riflesso, campanelle, bastoncini di zucchero, stelline e fiocchi
    const colori = ['#e74c3c', '#f4d03f', '#5dade2', '#af7ac5', '#2ecc71', '#ff8fb1', '#e2b93b', '#c0392b'];
    for (let i = 0; i < 42; i++) {
        const livello = (i + 0.5) / 42;
        const y = -48 - livello * 300;
        const mezzaLarghezza = 118 * (1 - livello * 0.88);
        const x = (caso() * 2 - 1) * mezzaLarghezza * 0.82;
        const colore = colori[i % colori.length];
        const tipo = ['pallina', 'pallina', 'campanella', 'pallina', 'bastoncino', 'pallina', 'stellina', 'fiocco'][i % 8];
        const g = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, albero);
        if (tipo === 'pallina') {
            const r = 4.5 + caso() * 3.5;
            el('path', { d: `M0 ${-r - 3} v3`, stroke: '#c9a227', 'stroke-width': 1.5 }, g);
            el('circle', { cx: 0, cy: 0, r, fill: colore }, g);
            el('circle', { cx: -r * 0.35, cy: -r * 0.35, r: r * 0.32, fill: '#fff', opacity: 0.7 }, g);
        } else if (tipo === 'campanella') {
            el('path', { d: 'M-6 4 q 0 -12 6 -12 q 6 0 6 12 Z', fill: '#e2b93b', stroke: '#a8801c', 'stroke-width': 1 }, g);
            el('circle', { cx: 0, cy: 5, r: 2, fill: '#a8801c' }, g);
        } else if (tipo === 'bastoncino') {
            el('path', { d: 'M0 8 V-4 a4 4 0 0 1 8 0', fill: 'none', stroke: '#fbfdff', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
            el('path', { d: 'M0 8 V-4 a4 4 0 0 1 8 0', fill: 'none', stroke: '#d63031', 'stroke-width': 3.5, 'stroke-dasharray': '2.5 3' }, g);
        } else if (tipo === 'stellina') {
            el('path', { d: 'M0 -7 l2 5 5 0.5 -4 3 1.5 5 -4.5 -3 -4.5 3 1.5 -5 -4 -3 5 -0.5 Z', fill: '#ffe066', filter: 'url(#bagliore)' }, g);
        } else {
            el('path', { d: 'M0 0 l-8 -5 v10 Z M0 0 l8 -5 v10 Z', fill: '#d63031' }, g);
            el('circle', { cx: 0, cy: 0, r: 2.5, fill: '#a8231a' }, g);
        }
    }

    // Fili di lucine lungo i festoni: si accendono a ritmi diversi
    [[-110, -70, 0, -30, 110, -84], [-100, -112, -2, -78, 96, -122], [-88, -150, 0, -120, 88, -162], [-74, -188, 1, -160, 76, -196],
        [-62, -222, 0, -198, 62, -232], [-40, -284, 0, -270, 40, -290]].forEach(([x0, y0, x1, y1, x2, y2], filo) => {
        for (let t = 0.03; t < 1; t += 0.065) {
            const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2;
            const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
            el('circle', { class: 'lucina-albero', cx: x.toFixed(1), cy: y.toFixed(1), r: 3.4, fill: '#fff3b0', filter: 'url(#bagliore)', style: `animation-delay:${((t * 10 + filo * 3) * 0.17).toFixed(2)}s` }, albero);
        }
    });
    const stella = el('g', { class: 'stella-albero', transform: 'translate(0 -396)' }, albero);
    for (let i = 0; i < 8; i++) el('path', { d: 'M-3 0 L0 -46 L3 0 Z', fill: '#fff3b0', opacity: 0.55, transform: `rotate(${i * 45})` }, stella);
    el('circle', { cx: 0, cy: -392, r: 44, fill: 'url(#alone)' }, albero);
    el('path', { d: 'M0 -414 l8 16 18 3 -13 12 3 18 -16 -9 -16 9 3 -18 -13 -12 18 -3 Z', fill: '#ffe066', filter: 'url(#bagliore)' }, albero);
    // Pacchetti sotto l'albero
    [[-110, -2, 60, 44, '#2e7d5b', '#f4d03f'], [70, -2, 70, 52, '#3a5ba0', '#e74c3c'], [-40, 4, 44, 30, '#f3efe6', '#c0392b']].forEach(([px, py, w, h, carta, nastro]) => {
        el('rect', { x: px, y: py - h, width: w, height: h, rx: 3, fill: carta }, albero);
        el('rect', { x: px, y: py - h, width: w, height: h, rx: 3, fill: 'url(#ombra-muro)' }, albero);
        el('rect', { x: px + w / 2 - 4, y: py - h, width: 8, height: h, fill: nastro }, albero);
        el('path', { d: `M${px + w / 2} ${py - h} q -12 -12 -16 -2 q 4 6 16 2 q 12 -12 16 -2 q -4 6 -16 2`, fill: nastro }, albero);
    });

    // Gli angoli della stanza un po' più in ombra
    el('rect', { x: -2200, y: -1000, width: 6000, height: 2600, fill: 'url(#vignetta)', 'pointer-events': 'none' }, svg);

    const invito = el('text', { class: 'invito', x: 800, y: 530, 'text-anchor': 'middle', 'font-size': 40, 'font-weight': 'bold', 'font-family': 'Georgia, serif', fill: '#ffe9a8', stroke: '#3a1d10', 'stroke-width': 7, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, svg);
    invito.textContent = 'Clicca il regalo per aprirlo';

    const regalo = el('g', { class: 'regalo', transform: 'translate(800 800)', tabindex: 0, role: 'button', 'aria-label': 'Apri il regalo' }, svg);
    el('ellipse', { class: 'luce-regalo', cx: 0, cy: -170, rx: 260, ry: 220, fill: 'url(#luce-regalo)' }, regalo);
    // Raggi di luce che girano piano dietro al regalo aperto
    const raggiRegalo = el('g', { class: 'raggi-regalo' }, el('g', { transform: 'translate(0 -170)' }, regalo));
    for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, b = a + 0.12;
        el('path', { d: `M0 0 L${(Math.cos(a) * 460).toFixed(1)} ${(Math.sin(a) * 460).toFixed(1)} L${(Math.cos(b) * 460).toFixed(1)} ${(Math.sin(b) * 460).toFixed(1)} Z`, fill: '#fff3c4', opacity: i % 2 ? 0.22 : 0.35 }, raggiRegalo);
    }
    // Stelline e coriandoli che esplodono in alto e poi ricadono
    let semeFesta = 21;
    const casoFesta = () => (semeFesta = (semeFesta * 16807) % 2147483647) / 2147483647;
    const festaRegalo = el('g', { class: 'festa-regalo' }, regalo);
    for (let i = 0; i < 64; i++) {
        const angolo = -Math.PI * (0.08 + casoFesta() * 0.84);
        const distanza = 180 + casoFesta() * 320;
        const stile = `--dx:${(Math.cos(angolo) * distanza).toFixed(0)}px;--dy:${(Math.sin(angolo) * distanza).toFixed(0)}px;--r:${(casoFesta() * 720 - 360).toFixed(0)}deg;animation-delay:${(casoFesta() * 0.2).toFixed(2)}s`;
        const colore = ['#ffe066', '#ff5a4f', '#6fd3ff', '#7dff9a', '#ff9de2', '#ffffff'][i % 6];
        if (i % 3 === 0) el('path', { class: 'coriandolo-regalo', d: stellaPiccola(0, -160, 9 + casoFesta() * 6), fill: colore, style: stile }, festaRegalo);
        else el('rect', { class: 'coriandolo-regalo', x: -5, y: -164, width: 10, height: 7, rx: 1.5, fill: colore, style: stile }, festaRegalo);
    }
    const scintille = el('g', { class: 'scintille' }, regalo);
    for (let i = 0; i < 30; i++) {
        const angolo = -Math.PI * (0.05 + caso() * 0.9);
        const distanza = 160 + caso() * 220;
        el('circle', {
            class: 'scintilla', cx: 0, cy: -160, r: 3 + caso() * 5,
            fill: ['#ffe066', '#ffffff', '#ffb347', '#ff7675'][i % 4],
            style: `--dx:${(Math.cos(angolo) * distanza).toFixed(0)}px;--dy:${(Math.sin(angolo) * distanza).toFixed(0)}px;animation-delay:${(caso() * 0.15).toFixed(2)}s`
        }, scintille);
    }
    const scatola = el('g', { class: 'scatola' }, regalo);
    el('ellipse', { cx: 0, cy: 4, rx: 140, ry: 16, fill: 'rgba(0,0,0,0.3)' }, scatola);
    // La scatola di cartone che resta quando la carta si strappa, con la luce che esce da dentro
    const interna = el('g', { class: 'scatola-interna' }, scatola);
    el('rect', { x: -110, y: -150, width: 220, height: 150, rx: 6, fill: '#e9d4ad' }, interna);
    el('rect', { x: -110, y: -150, width: 220, height: 18, fill: '#c9a27c' }, interna);
    el('path', { d: 'M-60 -100 l 30 22 M40 -60 l 26 -18 M-20 -40 l 10 18', stroke: '#b8925f', 'stroke-width': 2 }, interna);
    const carta = el('rect', { class: 'carta-intera', x: -110, y: -150, width: 220, height: 150, rx: 6 }, scatola);
    el('rect', { class: 'carta-intera', x: -110, y: -150, width: 220, height: 150, rx: 6, fill: 'url(#ombra-muro)' }, scatola);
    const nastroBase = el('rect', { class: 'carta-intera', x: -16, y: -150, width: 32, height: 150 }, scatola);
    // I pezzi di carta strappata, con i bordi frastagliati: compaiono al posto della carta e volano via
    const pezzi = [
        'M-110 -150 H4 L-6 -128 L7 -104 L-3 -82 L-14 -70 L-40 -82 L-70 -68 L-110 -78 Z',
        'M4 -150 H110 V-80 L80 -66 L50 -80 L20 -68 L-3 -82 L7 -104 L-6 -128 Z',
        'M-110 -78 L-70 -68 L-40 -82 L-14 -70 L-3 -82 L8 -60 L-4 -36 L6 -14 L-2 0 H-110 Z',
        'M-3 -82 L20 -68 L50 -80 L80 -66 L110 -80 V0 H-2 L6 -14 L-4 -36 L8 -60 Z'
    ].map((d, i) => {
        const pezzo = el('g', { class: `pezzo-carta pezzo-${i + 1}` }, scatola);
        el('path', { class: 'colore-carta', d }, pezzo);
        el('path', { d, fill: 'url(#ombra-muro)' }, pezzo);
        el('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 1.5, opacity: 0.5 }, pezzo);
        return pezzo;
    });
    const coperchio = el('g', { class: 'coperchio' }, scatola);
    const cartaCoperchio = el('rect', { x: -124, y: -190, width: 248, height: 44, rx: 6 }, coperchio);
    const nastroCoperchio = el('rect', { x: -16, y: -190, width: 32, height: 44 }, coperchio);
    const fiocco = el('g', { class: 'fiocco-regalo' }, coperchio);
    const anelli = [
        el('path', { d: 'M0 -192 q -70 -60 -80 -20 q -6 30 80 20 Z' }, fiocco),
        el('path', { d: 'M0 -192 q 70 -60 80 -20 q 6 30 -80 20 Z' }, fiocco),
        el('circle', { cx: 0, cy: -194, r: 13 }, fiocco)
    ];

    let scartato = false;
    let giornoMostrato = null;

    function scarta() {
        if (scartato) return;
        scartato = true;
        suonaMeraviglia();
        nodo.classList.add('trema');
        setTimeout(() => {
            nodo.classList.remove('trema');
            nodo.classList.add('scartato');
        }, 450);
        setTimeout(() => onScarta(giornoMostrato), 2000);
    }

    regalo.addEventListener('click', scarta);
    regalo.addEventListener('keydown', evento => {
        if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault();
            scarta();
        }
    });
    esci.addEventListener('click', onEsci);
    nodo.addEventListener('keydown', evento => {
        if (evento.key !== 'Escape') return;
        if (ricettario.aperta()) ricettario.nascondi();
        else if (!scartato) onEsci();
    });

    return {
        nodo,
        mostra(giorno) {
            const { carta: colore, nastro } = CARTE_REGALO[giorno % CARTE_REGALO.length];
            carta.setAttribute('fill', colore);
            pezzi.forEach(pezzo => pezzo.querySelector('.colore-carta').setAttribute('fill', colore));
            cartaCoperchio.setAttribute('fill', scurisci(colore, 0.08));
            [nastroBase, nastroCoperchio, ...anelli].forEach(parte => parte.setAttribute('fill', nastro));
            data.textContent = `${giorno} dicembre`;
            ricettario.nascondi();
            tavolino.mostra(giorno);
            quadro.mostra(giorno);
            personaggio.mostra(giorno);
            giornoMostrato = giorno;
            scartato = false;
            nodo.classList.remove('scartato', 'trema');
            nodo.hidden = false;
            requestAnimationFrame(() => {
                nodo.classList.add('visibile');
                regalo.focus({ preventScroll: true });
            });
        },
        nascondi() {
            nodo.classList.remove('visibile', 'scartato');
            nodo.hidden = true;
        },
        aperto: () => !nodo.hidden
    };
}

// ========== ESPLORAZIONE ==========

// Disegna il villaggio nel contenitore e avvisa quando si apre una casa
// Con modifica: true è il villaggio di chi prepara il calendario: tutte le case si aprono
// e quelle con la sorpresa già pronta hanno le finestre accese
// ========== DENTRO LA BANCARELLA: LE NONNE CHE CUCINANO ==========
// Cliccando una bancarella del mercatino ci si avvicina e si vede la nonna che cucina come una volta

const CUCINE = {
    castagne: {
        insegna: ['Caldarroste', 'come una volta'],
        frase: ['Caldarroste calde calde,', 'come le facevo', 'da bambina!'],
        nonna: { vestito: '#3b3f58', scialle: '#8e2433', pelle: '#f0cfb6', capo: 'fazzoletto', fazzoletto: '#c0392b' }
    },
    cioccolata: {
        insegna: ['Cioccolata calda', 'con la panna'],
        frase: ['Si mescola piano piano', 'col cucchiaio di legno,', 'così viene densa!'],
        nonna: { vestito: '#5b3a6b', scialle: '#2e6b4a', pelle: '#e3b393', capo: 'chignon' }
    },
    frittelle: {
        insegna: ['Frittelle', 'della nonna'],
        frase: ['Zucchero sopra', 'e mangiatele', 'finché sono calde!'],
        nonna: { vestito: '#2d4f8a', scialle: '#b5651d', pelle: '#c48a66', capo: 'chignon' }
    }
};

function creaBancone({ onEsci }) {
    const nodo = Object.assign(document.createElement('div'), { className: 'interno bancone', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'Dentro la bancarella: la nonna che cucina' });
    const esci = Object.assign(document.createElement('button'), { type: 'button', className: 'esci', textContent: '← Torna al villaggio' });
    const libro = Object.assign(document.createElement('button'), { type: 'button', className: 'ricomincia libro-ricetta', textContent: '📖 La ricetta della nonna' });
    nodo.append(svg, esci, libro);
    const ricettario = creaRicettario(nodo);
    let cucinaAperta = 'castagne';
    libro.addEventListener('click', () => ricettario.mostra({ castagne: 'Caldarroste della nonna', cioccolata: 'Cioccolata della nonna', frittelle: 'Frittelle della nonna' }[cucinaAperta]));
    esci.addEventListener('click', onEsci);
    nodo.addEventListener('keydown', evento => {
        if (evento.key !== 'Escape') return;
        if (ricettario.aperta()) ricettario.nascondi();
        else onEsci();
    });

    const defs = el('defs', {}, svg);
    const quadretti = el('pattern', { id: 'quadretti-bancone', width: 40, height: 40, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 40, height: 40, fill: '#fbf6ea' }, quadretti);
    el('rect', { width: 20, height: 20, fill: '#c0392b', opacity: 0.8 }, quadretti);
    el('rect', { x: 20, y: 20, width: 20, height: 20, fill: '#c0392b', opacity: 0.8 }, quadretti);
    el('rect', { x: 20, width: 20, height: 20, fill: '#c0392b', opacity: 0.35 }, quadretti);
    el('rect', { y: 20, width: 20, height: 20, fill: '#c0392b', opacity: 0.35 }, quadretti);
    const fuoco = el('radialGradient', { id: 'luce-fuoco' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffb347', 'stop-opacity': 0.75 }, fuoco);
    el('stop', { offset: '100%', 'stop-color': '#ff7a1a', 'stop-opacity': 0 }, fuoco);
    const vignetta = el('radialGradient', { id: 'vignetta-bancone', gradientUnits: 'userSpaceOnUse', cx: 800, cy: 450, r: 950 }, defs);
    el('stop', { offset: '55%', 'stop-color': '#000', 'stop-opacity': 0 }, vignetta);
    el('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': 0.6 }, vignetta);

    const p = (d, attributi, genitore = svg) => el('path', { d, ...attributi }, genitore);

    // ---- Il fondo della casetta: assi di legno, mensole con i vasetti, lucine ----
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: '#3b2416' }, svg);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#tex-assi)', opacity: 0.7 }, svg);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#tavole-parete)' }, svg);
    for (let x = -1400; x < 3000; x += 120) p(`M${x} -600 V1500`, { stroke: '#2a180e', 'stroke-width': 4 });
    el('circle', { cx: 800, cy: 420, r: 700, fill: 'url(#alone)', opacity: 0.35 }, svg);
    [[80, 400, 330], [1200, 1520, 330], [80, 400, 470], [1200, 1520, 470]].forEach(([x1, x2, y], i) => {
        el('rect', { x: x1, y, width: x2 - x1, height: 14, fill: '#8a5a3c' }, svg);
        for (let k = 0; k < 4; k++) {
            const vx = x1 + 30 + k * ((x2 - x1 - 60) / 3);
            const colore = ['#c0392b', '#e8a33d', '#6b3a1f', '#7d9b3a'][(k + i) % 4];
            el('rect', { x: vx - 22, y: y - 62, width: 44, height: 62, rx: 8, fill: colore, opacity: 0.85 }, svg);
            el('rect', { x: vx - 22, y: y - 62, width: 44, height: 62, rx: 8, fill: '#ffffff', opacity: 0.12 }, svg);
            el('rect', { x: vx - 25, y: y - 74, width: 50, height: 14, rx: 3, fill: 'url(#quadretti-bancone)' }, svg);
            el('rect', { x: vx - 16, y: y - 42, width: 32, height: 20, rx: 2, fill: '#fbf6ea' }, svg);
        }
    });
    // Festone con le lucine in alto
    p('M-200 70 q 150 60 300 0 q 150 60 300 0 q 150 60 300 0 q 150 60 300 0 q 150 60 300 0 q 150 60 300 0', { fill: 'none', stroke: '#1f5c34', 'stroke-width': 16, 'stroke-linecap': 'round' });
    for (let i = 0; i < 24; i++) {
        const x = -170 + i * 75, y = 70 + Math.sin(((i * 75 + 30) % 300) / 300 * Math.PI) * 30;
        el('circle', { class: 'pallina', cx: x, cy: y + 8, r: 8, fill: COLORI_FESTA[i % COLORI_FESTA.length], filter: 'url(#bagliore)', style: `animation-delay:${((i * 0.3) % 2).toFixed(1)}s` }, svg);
    }

    // ---- La lavagnetta con il nome e il fumetto della nonna ----
    const lavagna = el('g', {}, svg);
    el('rect', { x: 100, y: 130, width: 380, height: 160, rx: 10, fill: '#8a5a3c' }, lavagna);
    el('rect', { x: 114, y: 144, width: 352, height: 132, rx: 4, fill: '#24302a' }, lavagna);
    const insegna1 = el('text', { x: 290, y: 206, 'text-anchor': 'middle', 'font-size': 40, 'font-family': "'Brush Script MT', cursive", fill: '#fdf6dc' }, lavagna);
    const insegna2 = el('text', { x: 290, y: 250, 'text-anchor': 'middle', 'font-size': 26, 'font-family': 'Georgia, serif', 'font-style': 'italic', fill: '#ffd36b' }, lavagna);

    const fumetto = el('g', { class: 'fumetto-nonna' }, svg);
    el('rect', { x: 1000, y: 110, width: 470, height: 170, rx: 36, fill: '#fffdf6', stroke: '#c9a227', 'stroke-width': 4 }, fumetto);
    p('M1060 270 L1000 330 L1110 272 Z', { fill: '#fffdf6', stroke: '#c9a227', 'stroke-width': 4, 'stroke-linejoin': 'round' }, fumetto);
    el('rect', { x: 1052, y: 262, width: 70, height: 14, fill: '#fffdf6' }, fumetto);
    const righe = [0, 1, 2].map(i => el('text', { x: 1235, y: 170 + i * 42, 'text-anchor': 'middle', 'font-size': 32, 'font-family': 'Georgia, serif', fill: '#3b2416' }, fumetto));

    // ---- La nonna: vestito, scialle, grembiule, occhiali e capelli bianchi ----
    function disegnaNonna(genitore, n, mani) {
        const g = el('g', {}, genitore);
        p('M640 620 Q630 430 700 392 Q800 360 900 392 Q970 430 960 620 Z', { fill: n.vestito }, g);
        // Braccia (dietro al grembiule, davanti al corpo) fino alle mani
        const spalle = [[700, 420], [900, 420]];
        mani.forEach(([mx, my], i) => {
            const [sx, sy] = spalle[i];
            const gomito = [(sx + mx) / 2 + (i ? 40 : -40), Math.max(sy, my) + 60];
            p(`M${sx} ${sy} Q${gomito[0]} ${gomito[1]} ${mx} ${my}`, { fill: 'none', stroke: n.vestito, 'stroke-width': 40, 'stroke-linecap': 'round' }, g);
            p(`M${(sx + mx) / 2 + (i ? 30 : -30)} ${Math.max(sy, my) + 40} Q${(gomito[0] + mx) / 2} ${(gomito[1] + my) / 2} ${mx + (i ? -14 : 14)} ${my + 6}`, { fill: 'none', stroke: scurisci(n.vestito, 0.25), 'stroke-width': 6, opacity: 0.6 }, g);
            el('circle', { cx: mx, cy: my, r: 19, fill: n.pelle }, g);
            p(`M${mx - 12} ${my - 4} q 12 -8 24 0`, { stroke: scurisci(n.pelle, 0.25), 'stroke-width': 2, fill: 'none' }, g);
        });
        // Grembiule bianco con il pizzo e la tasca
        p('M712 470 Q800 492 888 470 L900 620 L700 620 Z', { fill: '#fbf6ea' }, g);
        p('M712 470 Q800 492 888 470', { fill: 'none', stroke: '#e6dcc4', 'stroke-width': 8, 'stroke-dasharray': '6 6' }, g);
        el('rect', { x: 760, y: 540, width: 80, height: 50, rx: 8, fill: '#f1e8d2', stroke: '#e0d4b6', 'stroke-width': 2 }, g);
        // Scialle di lana sulle spalle, con le frange
        p('M686 398 Q800 480 914 398 Q940 440 905 478 Q800 530 695 478 Q660 440 686 398 Z', { fill: n.scialle }, g);
        p('M700 470 Q800 520 900 470', { fill: 'none', stroke: scurisci(n.scialle, 0.3), 'stroke-width': 3, 'stroke-dasharray': '4 8' }, g);
        for (let i = 0; i < 12; i++) p(`M${712 + i * 16} ${488 + Math.sin(i / 11 * Math.PI) * 22} v14`, { stroke: n.scialle, 'stroke-width': 3 }, g);
        el('circle', { cx: 800, cy: 432, r: 10, fill: '#c9a227' }, g);
        // Collo e testa
        el('rect', { x: 780, y: 350, width: 40, height: 40, fill: scurisci(n.pelle, 0.08) }, g);
        el('ellipse', { cx: 742, cy: 305, rx: 10, ry: 16, fill: n.pelle }, g);
        el('ellipse', { cx: 858, cy: 305, rx: 10, ry: 16, fill: n.pelle }, g);
        el('ellipse', { cx: 800, cy: 300, rx: 60, ry: 66, fill: n.pelle }, g);
        if (n.capo === 'fazzoletto') {
            // Fazzoletto a pois annodato sotto il mento
            p('M736 312 Q726 222 800 218 Q874 222 864 312 Q850 262 800 258 Q750 262 736 312 Z', { fill: n.fazzoletto }, g);
            for (let i = 0; i < 9; i++) el('circle', { cx: 752 + (i % 5) * 24, cy: 238 + Math.floor(i / 5) * 18, r: 4, fill: '#fbf6ea' }, g);
            p('M738 312 Q745 360 790 368 L810 368 Q855 360 862 312', { fill: 'none', stroke: n.fazzoletto, 'stroke-width': 12 }, g);
            p('M800 366 l-22 26 l18 4 Z M800 366 l22 26 l-18 4 Z', { fill: n.fazzoletto }, g);
            p('M752 270 q 12 -10 26 -6 M822 264 q 14 -4 26 6', { stroke: '#e3e3ea', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, g);
        } else {
            // Capelli bianchi raccolti nello chignon, con la forcina
            p('M740 300 Q732 232 800 228 Q868 232 860 300 Q852 262 828 252 Q800 268 772 252 Q748 262 740 300 Z', { fill: '#e3e3ea' }, g);
            p('M770 246 q 30 -14 60 0', { stroke: '#c8c8d2', 'stroke-width': 3, fill: 'none' }, g);
            el('circle', { cx: 800, cy: 214, r: 30, fill: '#d4d4de' }, g);
            p('M782 204 q 18 -10 36 0 M784 222 q 16 6 32 0', { stroke: '#bdbdc8', 'stroke-width': 3, fill: 'none' }, g);
            p('M822 194 l 16 -10', { stroke: '#8a6a2a', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
        }
        // Occhiali tondi, occhi sorridenti, guance rosse e sorriso
        [776, 824].forEach(x => {
            el('circle', { cx: x, cy: 300, r: 18, fill: '#ffffff', opacity: 0.18, stroke: '#8a6a2a', 'stroke-width': 3.5 }, g);
            p(`M${x - 9} 302 q 9 -9 18 0`, { stroke: '#3a2a22', 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round' }, g);
            p(`M${x + (x < 800 ? -24 : 18)} 296 l ${x < 800 ? -6 : 6} -3 M${x + (x < 800 ? -24 : 18)} 304 l ${x < 800 ? -6 : 6} 3`, { stroke: scurisci(n.pelle, 0.3), 'stroke-width': 2 }, g);
        });
        p('M794 300 h12 M758 300 h-16 M842 300 h16', { stroke: '#8a6a2a', 'stroke-width': 3 }, g);
        p('M800 306 q -6 18 2 22', { stroke: scurisci(n.pelle, 0.25), 'stroke-width': 3, fill: 'none' }, g);
        el('circle', { cx: 760, cy: 330, r: 12, fill: '#e8848a', opacity: 0.45 }, g);
        el('circle', { cx: 840, cy: 330, r: 12, fill: '#e8848a', opacity: 0.45 }, g);
        p('M772 338 Q800 364 828 338', { stroke: '#7a3a2a', 'stroke-width': 4, fill: '#a8444c', 'stroke-linecap': 'round' }, g);
        p('M778 342 Q800 356 822 342', { stroke: '#fff', 'stroke-width': 3, fill: 'none', opacity: 0.8 }, g);
        return g;
    }

    // ---- Il bancone con la tovaglia a quadretti ----
    function bancone(genitore) {
        el('rect', { x: -1400, y: 600, width: 4400, height: 900, fill: '#6d4630' }, genitore);
        el('rect', { x: -1400, y: 600, width: 4400, height: 900, fill: 'url(#tex-assi)' }, genitore);
        el('rect', { x: -1400, y: 588, width: 4400, height: 26, fill: '#8a5a3c' }, genitore);
        p('M-1400 612 H3000 V700 ' + Array.from({ length: 110 }, (_, i) => `q -20 18 -40 0`).join(' ') + ' Z', { fill: 'url(#quadretti-bancone)' }, genitore);
    }

    // Il fuoco di legna nel braciere di ferro
    function braciere(genitore) {
        el('ellipse', { class: 'luce-fuoco', cx: 800, cy: 560, rx: 330, ry: 190, fill: 'url(#luce-fuoco)' }, genitore);
        p('M650 540 L950 540 L920 606 L680 606 Z', { fill: '#2a2a2e' }, genitore);
        for (let i = 0; i < 7; i++) el('circle', { class: 'brace', cx: 690 + i * 37, cy: 574, r: 7, fill: '#ff8c32', style: `animation-delay:${(i * 0.23).toFixed(2)}s` }, genitore);
        p('M670 540 L700 522 M760 540 L780 518 M830 540 L800 520 M900 540 L875 522', { stroke: '#5d3a22', 'stroke-width': 12, 'stroke-linecap': 'round' }, genitore);
        el('ellipse', { cx: 800, cy: 540, rx: 150, ry: 12, fill: '#ff7a1a', filter: 'url(#bagliore)' }, genitore);
        [[720, 0], [770, 0.3], [820, 0.15], [870, 0.45], [795, 0.6]].forEach(([x, ritardo], i) => {
            p(`M${x - 22} 540 Q${x - 26} ${505 - (i % 2) * 14} ${x} ${478 - (i % 3) * 10} Q${x + 26} ${505 - (i % 2) * 14} ${x + 22} 540 Z`, { class: 'fiamma', fill: i % 2 ? '#ffb347' : '#ff7a1a', style: `animation-delay:${ritardo}s` }, genitore);
            p(`M${x - 10} 540 Q${x - 10} 520 ${x} 508 Q${x + 10} 520 ${x + 10} 540 Z`, { class: 'fiamma', fill: '#ffe08a', style: `animation-delay:${ritardo + 0.2}s` }, genitore);
        });
    }

    function fumo(genitore, x, y, quanti = 6, colore = '#e8edf6') {
        for (let i = 0; i < quanti; i++) {
            el('circle', { class: 'fumo-grande', cx: x + (i % 3 - 1) * 50, cy: y, r: 26 + (i % 2) * 10, fill: colore, style: `animation-delay:${(i * 0.55).toFixed(2)}s` }, genitore);
        }
    }

    const scene = {};

    // ===== Caldarroste nella padella bucata =====
    {
        const g = scene.castagne = el('g', {}, svg);
        disegnaNonna(g, CUCINE.castagne.nonna, [[640, 560], [1110, 458]]);
        bancone(g);
        braciere(g);
        // Padella bucata che la nonna scuote: le castagne saltano
        const padella = el('g', { class: 'padella' }, g);
        p('M968 498 L1110 456', { stroke: '#2b2b2b', 'stroke-width': 16, 'stroke-linecap': 'round' }, padella);
        p('M1070 468 L1120 453', { stroke: '#6d4630', 'stroke-width': 22, 'stroke-linecap': 'round' }, padella);
        el('ellipse', { cx: 800, cy: 500, rx: 176, ry: 38, fill: '#2b2b2b' }, padella);
        el('ellipse', { cx: 800, cy: 496, rx: 160, ry: 28, fill: '#3d3d42' }, padella);
        for (let i = 0; i < 18; i++) el('circle', { cx: 670 + (i % 9) * 32, cy: 488 + Math.floor(i / 9) * 14, r: 3, fill: '#1a1a1a' }, padella);
        const posti = [[700, 496], [736, 488], [772, 500], [808, 486], [844, 498], [880, 490], [918, 498], [720, 508], [790, 512], [860, 510], [752, 478], [826, 474], [896, 478]];
        posti.forEach(([x, y], i) => {
            const c = el('g', { class: 'castagna', style: `animation-delay:${((i * 0.17) % 1).toFixed(2)}s` }, padella);
            el('ellipse', { cx: x, cy: y, rx: 17, ry: 12, fill: i % 3 ? '#6b3a1f' : '#5a2f17' }, c);
            el('ellipse', { cx: x - 4, cy: y - 4, rx: 7, ry: 3, fill: '#a0663a', opacity: 0.7 }, c);
            p(`M${x - 6} ${y - 3} l 12 6 M${x + 6} ${y - 3} l -12 6`, { stroke: '#f0cf8a', 'stroke-width': 3, 'stroke-linecap': 'round' }, c);
        });
        fumo(g, 690, 450, 6);
        for (let i = 0; i < 8; i++) el('circle', { class: 'scintilla', cx: 720 + i * 22, cy: 520, r: 3, fill: '#ffb347', style: `animation-delay:${(i * 0.37).toFixed(2)}s` }, g);
        // Cesto di castagne crude e cartocci di carta già pronti
        p('M300 600 Q300 520 400 516 Q500 520 500 600 Z', { fill: '#b5853f' }, g);
        for (let i = 0; i < 4; i++) p(`M${306 + i * 2} ${590 - i * 18} Q400 ${580 - i * 22} ${494 - i * 2} ${590 - i * 18}`, { stroke: '#8a6a2a', 'stroke-width': 3, fill: 'none' }, g);
        for (let i = 0; i < 9; i++) el('ellipse', { cx: 340 + (i % 5) * 30, cy: 516 - Math.floor(i / 5) * 14, rx: 15, ry: 11, fill: '#6b3a1f' }, g);
        [[1220, '#efe3c2'], [1330, '#e6d6ae']].forEach(([x, c]) => {
            p(`M${x - 40} 500 L${x + 40} 500 L${x} 600 Z`, { fill: c, stroke: '#c9b48a', 'stroke-width': 2 }, g);
            p(`M${x - 34} 510 h68 M${x - 26} 530 h52`, { stroke: '#9a9a9a', 'stroke-width': 2, opacity: 0.5 }, g);
            [[-18, 494], [2, 488], [20, 494]].forEach(([dx, y]) => el('ellipse', { cx: x + dx, cy: y, rx: 14, ry: 10, fill: '#6b3a1f' }, g));
        });
    }

    // ===== Cioccolata nel paiolo di rame =====
    {
        const g = scene.cioccolata = el('g', {}, svg);
        disegnaNonna(g, CUCINE.cioccolata.nonna, [[620, 580], [1004, 318]]);
        bancone(g);
        // Fornello di ghisa con il fuocherello
        el('ellipse', { class: 'luce-fuoco', cx: 800, cy: 590, rx: 300, ry: 140, fill: 'url(#luce-fuoco)' }, g);
        el('rect', { x: 670, y: 548, width: 260, height: 60, rx: 6, fill: '#26262b' }, g);
        el('rect', { x: 760, y: 562, width: 80, height: 36, rx: 6, fill: '#ff8c32', class: 'brace' }, g);
        p('M760 580 h80', { stroke: '#26262b', 'stroke-width': 4 }, g);
        // Il paiolo di rame
        p('M636 400 L964 400 Q972 540 900 552 L700 552 Q628 540 636 400 Z', { fill: '#b8652f' }, g);
        p('M660 410 Q656 520 700 540', { stroke: '#e8a06a', 'stroke-width': 10, fill: 'none', opacity: 0.6, 'stroke-linecap': 'round' }, g);
        p('M940 410 Q944 520 900 540', { stroke: '#7a3a18', 'stroke-width': 10, fill: 'none', opacity: 0.5, 'stroke-linecap': 'round' }, g);
        el('ellipse', { cx: 800, cy: 400, rx: 166, ry: 30, fill: '#d98a4e' }, g);
        el('ellipse', { cx: 800, cy: 402, rx: 150, ry: 23, fill: '#4a2412' }, g);
        const vortice = el('g', { class: 'vortice' }, g);
        p('M800 402 m -90 0 a 90 14 0 1 1 180 0 a 60 10 0 1 1 -120 0 a 30 6 0 1 1 60 0', { stroke: '#7a4426', 'stroke-width': 4, fill: 'none' }, vortice);
        p('M640 400 q -30 -6 -34 18 M960 400 q 30 -6 34 18', { stroke: '#8a4a22', 'stroke-width': 8, fill: 'none' }, g);
        // Il cucchiaio di legno che mescola
        const cucchiaio = el('g', { class: 'mestolo' }, g);
        p('M806 398 L1004 318', { stroke: '#c9955a', 'stroke-width': 14, 'stroke-linecap': 'round' }, cucchiaio);
        el('ellipse', { cx: 800, cy: 402, rx: 22, ry: 10, fill: '#b07a44' }, cucchiaio);
        fumo(g, 690, 380, 5, '#f4efe8');
        // Tazze con la panna e il biscotto, latte e cioccolato a pezzi
        [1180, 1300, 1420].forEach((x, i) => {
            p(`M${x - 40} 520 L${x + 40} 520 L${x + 34} 596 Q${x} 606 ${x - 34} 596 Z`, { fill: ['#c0392b', '#fbf6ea', '#2e6b4a'][i] }, g);
            p(`M${x + 38} 536 q 26 0 24 22 q -2 20 -26 18`, { stroke: ['#c0392b', '#e6dcc4', '#2e6b4a'][i], 'stroke-width': 9, fill: 'none' }, g);
            el('ellipse', { cx: x, cy: 520, rx: 40, ry: 9, fill: '#5a2c14' }, g);
            p(`M${x - 34} 518 q 10 -26 22 -14 q 8 -22 20 -6 q 14 -14 22 16 Z`, { fill: '#fffdf6' }, g);
            el('circle', { cx: x + 6, cy: 494, r: 3, fill: '#8a4a22' }, g);
            p(`M${x - 6} 470 q -6 -12 0 -24 q 6 -12 0 -24`, { class: 'vapore-tazza', stroke: '#ffffff', 'stroke-width': 4, fill: 'none', opacity: 0.8, style: `animation-delay:${i * 0.5}s` }, g);
        });
        p('M300 600 L300 470 Q300 452 318 452 L382 452 Q400 452 400 470 L400 600 Z', { fill: '#eef3fb', stroke: '#c9d3e6', 'stroke-width': 3 }, g);
        p('M318 452 l -8 -24 h80 l -8 24', { fill: '#eef3fb', stroke: '#c9d3e6', 'stroke-width': 3 }, g);
        el('rect', { x: 316, y: 500, width: 68, height: 30, rx: 4, fill: '#2d4f8a' }, g);
        el('text', { x: 350, y: 521, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 'bold', fill: '#fff', 'font-family': 'Georgia, serif' }, g).textContent = 'LATTE';
        p('M440 600 L560 600 L548 572 L452 572 Z', { fill: '#efe3c2' }, g);
        [[460, 560], [496, 552], [530, 562]].forEach(([x, y]) => el('rect', { x, y, width: 32, height: 22, rx: 3, fill: '#5a2c14', transform: `rotate(${x % 7 - 3} ${x} ${y})` }, g));
    }

    // ===== Frittelle nella padella di ferro =====
    {
        const g = scene.frittelle = el('g', {}, svg);
        disegnaNonna(g, CUCINE.frittelle.nonna, [[470, 452], [1060, 352]]);
        bancone(g);
        braciere(g);
        // La padella di ferro con l'olio che sfrigola
        p('M626 466 L974 466 L944 548 L656 548 Z', { fill: '#2f2f33' }, g);
        p('M974 470 L1060 452', { stroke: '#2f2f33', 'stroke-width': 14, 'stroke-linecap': 'round' }, g);
        el('ellipse', { cx: 800, cy: 466, rx: 174, ry: 26, fill: '#3d3d42' }, g);
        el('ellipse', { cx: 800, cy: 468, rx: 160, ry: 20, fill: '#e0a94a' }, g);
        el('ellipse', { cx: 760, cy: 464, rx: 70, ry: 6, fill: '#ffe08a', opacity: 0.6 }, g);
        for (let i = 0; i < 14; i++) el('circle', { class: 'bolla', cx: 660 + (i * 23) % 290, cy: 470 + (i % 3) * 4, r: 3 + (i % 3), fill: '#fff3c4', style: `animation-delay:${(i * 0.21).toFixed(2)}s` }, g);
        [[700, 462], [760, 470], [826, 462], [884, 470], [790, 456]].forEach(([x, y], i) => {
            const f = el('g', { class: 'frittella', style: `animation-delay:${(i * 0.4).toFixed(1)}s` }, g);
            el('ellipse', { cx: x, cy: y, rx: 28, ry: 14, fill: i % 2 ? '#d4882e' : '#e09a3a' }, f);
            el('ellipse', { cx: x - 6, cy: y - 5, rx: 12, ry: 5, fill: '#f4c26a', opacity: 0.8 }, f);
        });
        // La schiumarola con una frittella appena tirata su
        p('M900 440 L1060 352', { stroke: '#8d98b8', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
        el('ellipse', { cx: 892, cy: 444, rx: 34, ry: 12, fill: '#b8c2d8' }, g);
        el('ellipse', { cx: 892, cy: 436, rx: 22, ry: 13, fill: '#d4882e' }, g);
        fumo(g, 690, 430, 5, '#f4efe8');
        // Il piatto di frittelle e lo zucchero che scende dal setaccio della nonna
        el('ellipse', { cx: 420, cy: 588, rx: 120, ry: 22, fill: '#fbf6ea', stroke: '#d8cdb5', 'stroke-width': 3 }, g);
        [[370, 566], [420, 570], [470, 566], [395, 546], [445, 546], [420, 526]].forEach(([x, y]) => {
            el('circle', { cx: x, cy: y, r: 24, fill: '#d4882e' }, g);
            el('circle', { cx: x - 5, cy: y - 8, r: 10, fill: '#fdf6ea', opacity: 0.85 }, g);
        });
        el('ellipse', { cx: 466, cy: 452, rx: 40, ry: 12, fill: '#b8c2d8', stroke: '#8d98b8', 'stroke-width': 3 }, g);
        p('M426 452 q 40 22 80 0', { fill: '#d4dbea' }, g);
        for (let i = 0; i < 14; i++) el('circle', { class: 'zucchero', cx: 436 + (i * 7) % 60, cy: 466, r: 2.6, fill: '#ffffff', style: `animation-delay:${(i * 0.13).toFixed(2)}s` }, g);
        // La ciotola con l'impasto
        p('M1180 600 Q1180 520 1290 516 Q1400 520 1400 600 Z', { fill: '#d98a4e' }, g);
        el('ellipse', { cx: 1290, cy: 518, rx: 110, ry: 18, fill: '#f3e3b8' }, g);
        p('M1300 512 L1400 420', { stroke: '#c9955a', 'stroke-width': 12, 'stroke-linecap': 'round' }, g);
    }

    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#vignetta-bancone)', 'pointer-events': 'none' }, svg);

    return {
        nodo,
        mostra(tipo) {
            const cucina = CUCINE[tipo] ?? CUCINE.castagne;
            cucinaAperta = CUCINE[tipo] ? tipo : 'castagne';
            ricettario.nascondi();
            Object.entries(scene).forEach(([nome, g]) => g.setAttribute('display', nome === tipo ? 'inline' : 'none'));
            insegna1.textContent = cucina.insegna[0];
            insegna2.textContent = cucina.insegna[1];
            righe.forEach((riga, i) => { riga.textContent = cucina.frase[i] ?? ''; });
            nodo.hidden = false;
            requestAnimationFrame(() => {
                nodo.classList.add('visibile');
                esci.focus({ preventScroll: true });
            });
        },
        nascondi() {
            nodo.classList.remove('visibile');
            nodo.hidden = true;
        }
    };
}

// ========== GIORNO E NOTTE ==========
// Il cielo segue l'ora vera in Italia: alba, giorno, tramonto e notte (con l'aurora)

// ========== IL PAESE IN 3D ==========
// Una seconda "facciata" del villaggio: le case sono le stesse 24, con gli stessi colori.
// Toccando una casa si entra dalla stessa porta del villaggio disegnato (regalo, sorpresa, date).

let promessaThree = null;
function caricaThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    promessaThree ??= new Promise((risolvi, rifiuta) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        s.onload = () => (window.THREE ? risolvi(window.THREE) : rifiuta(new Error('3D non disponibile')));
        s.onerror = () => {
            promessaThree = null;
            rifiuta(new Error('3D non disponibile'));
        };
        document.head.append(s);
    });
    return promessaThree;
}

// I colori del cielo e delle luci nei quattro momenti della giornata
const LUCI_3D = {
    notte: { alto: '#050920', basso: '#2a3a86', nebbia: '#24306e', emisfero: 0.55, cieloLuce: '#9fb3ff', sole: '#b9c8ff', forza: 0.55, terra: '#eef3ff', buio: true },
    alba: { alto: '#34407e', basso: '#ffd2a6', nebbia: '#e9c4c0', emisfero: 0.55, cieloLuce: '#ffd9c9', sole: '#ffc7a0', forza: 0.65, terra: '#f3ecf2', buio: false },
    giorno: { alto: '#3f7fd0', basso: '#d9eafb', nebbia: '#dce8f8', emisfero: 0.55, cieloLuce: '#ffffff', sole: '#fff1d6', forza: 0.7, terra: '#dfe7f6', buio: false },
    tramonto: { alto: '#262a66', basso: '#ffa860', nebbia: '#c98a8f', emisfero: 0.5, cieloLuce: '#ffc9a8', sole: '#ffb27a', forza: 0.6, terra: '#efe2ea', buio: true }
};

function creaPaese3D(contenitore, { onCasa, onSpeciale, onSlitta = () => {}, statoCasa, momento, trova }) {
    const T = window.THREE;
    const telefono = matchMedia('(pointer: coarse)').matches || innerWidth < 700;
    const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = Object.assign(document.createElement('canvas'), { className: 'paese-3d' });
    canvas.setAttribute('aria-label', 'Il villaggio in 3D: trascina per girare intorno, tocca una casa per entrare');
    const renderer = new T.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, telefono ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    const scena = new T.Scene();
    const camera = new T.PerspectiveCamera(45, 1, 0.1, 500);
    let s3 = 7;
    const caso = () => (s3 = (s3 * 16807) % 2147483647) / 2147483647;

    // ---- Texture disegnate al volo ----
    const tela = (lato, disegna) => {
        const c = document.createElement('canvas');
        c.width = c.height = lato;
        disegna(c.getContext('2d'));
        return new T.CanvasTexture(c);
    };
    const ALONE = tela(128, g => {
        const sf = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        sf.addColorStop(0, 'rgba(255,255,255,1)');
        sf.addColorStop(0.25, 'rgba(255,255,255,0.55)');
        sf.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = sf;
        g.fillRect(0, 0, 128, 128);
    });
    const alone = (colore, scala, opacita = 0.6) => {
        const s = new T.Sprite(new T.SpriteMaterial({ map: ALONE, color: colore, transparent: true, opacity: opacita, blending: T.AdditiveBlending, depthWrite: false }));
        s.scale.set(scala, scala, 1);
        return s;
    };
    const numero = n => tela(128, g => {
        g.fillStyle = '#c9a227';
        g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fffaf0';
        g.beginPath(); g.arc(64, 64, 50, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#b22222';
        g.font = 'bold 62px Georgia, serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(n, 64, 68);
    });

    // ---- Cielo, nebbia, luci ----
    const cieloMat = new T.ShaderMaterial({
        side: T.BackSide, depthWrite: false,
        uniforms: { alto: { value: new T.Color() }, basso: { value: new T.Color() } },
        vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 alto; uniform vec3 basso; varying vec3 p; void main(){ float t = smoothstep(-0.05, 0.55, p.y); gl_FragColor = vec4(mix(basso, alto, t), 1.0); }'
    });
    scena.add(new T.Mesh(new T.SphereGeometry(400, 32, 16), cieloMat));
    scena.fog = new T.Fog('#24306e', 70, 260);
    const emisfero = new T.HemisphereLight('#9fb3ff', '#2b3366', 0.55);
    scena.add(emisfero);
    const sole = new T.DirectionalLight('#b9c8ff', 0.55);
    sole.position.set(-60, 80, -40);
    sole.castShadow = true;
    sole.shadow.mapSize.set(telefono ? 1024 : 2048, telefono ? 1024 : 2048);
    Object.assign(sole.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 10, far: 220 });
    sole.shadow.bias = -0.0008;
    scena.add(sole);

    const stelle = [];
    for (let i = 0; i < 1600; i++) {
        const a = caso() * Math.PI * 2, h = 0.08 + caso() * 0.9, r = Math.sqrt(1 - h * h);
        stelle.push(Math.cos(a) * r * 380, h * 380, Math.sin(a) * r * 380);
    }
    const stelleGeo = new T.BufferGeometry();
    stelleGeo.setAttribute('position', new T.Float32BufferAttribute(stelle, 3));
    const cieloStellato = new T.Points(stelleGeo, new T.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.9, fog: false }));
    scena.add(cieloStellato);
    const luna = new T.Mesh(new T.SphereGeometry(9, 24, 16), new T.MeshBasicMaterial({ color: '#fdf6d8', fog: false }));
    luna.position.set(-150, 170, -260);
    scena.add(luna);
    const aloneLuna = alone('#fff3c0', 90, 0.45);
    aloneLuna.material.fog = false;
    aloneLuna.position.copy(luna.position);
    scena.add(aloneLuna);

    // ---- Terreno: piatto in paese, colline e montagne intorno ----
    const altezza = (x, z) => {
        const r = Math.hypot(x, z);
        if (r < 64) return 0;
        return (r - 64) * 0.22 * (0.65 + 0.35 * Math.sin(Math.atan2(z, x) * 3 + r * 0.05)) + Math.sin(x * 0.08) * Math.cos(z * 0.07) * 1.5;
    };
    const terraGeo = new T.PlaneGeometry(460, 460, telefono ? 90 : 150, telefono ? 90 : 150);
    terraGeo.rotateX(-Math.PI / 2);
    const pos = terraGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, altezza(pos.getX(i), pos.getZ(i)));
    terraGeo.computeVertexNormals();
    const terra = new T.Mesh(terraGeo, new T.MeshStandardMaterial({ color: '#eef3ff', roughness: 0.95 }));
    terra.receiveShadow = true;
    scena.add(terra);
    for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2 + caso() * 0.2, r = 190 + caso() * 40, h = 45 + caso() * 55;
        const monte = new T.Mesh(new T.ConeGeometry(h * 0.85, h, 7), new T.MeshStandardMaterial({ color: '#7d8fc8', roughness: 1, flatShading: true }));
        monte.position.set(Math.cos(a) * r, h / 2 - 4, Math.sin(a) * r);
        const cima = new T.Mesh(new T.ConeGeometry(h * 0.33, h * 0.39, 7), new T.MeshStandardMaterial({ color: '#f4f8ff', roughness: 0.9, flatShading: true }));
        cima.position.y = h * 0.31;
        monte.add(cima);
        scena.add(monte);
    }
    const pietra = new T.MeshStandardMaterial({ color: '#c9d4ee', roughness: 1 });
    const piazza = new T.Mesh(new T.CircleGeometry(11, 48), pietra);
    piazza.rotation.x = -Math.PI / 2;
    piazza.position.y = 0.02;
    piazza.receiveShadow = true;
    scena.add(piazza);
    const stradaMat = new T.MeshStandardMaterial({ color: '#b5c2e2', roughness: 1 });
    const strada = new T.Mesh(new T.RingGeometry(27.5, 31, 96), stradaMat);
    strada.rotation.x = -Math.PI / 2;
    strada.position.y = 0.03;
    strada.receiveShadow = true;
    scena.add(strada);
    for (let i = 0; i < 4; i++) {
        const viale = new T.Mesh(new T.PlaneGeometry(3, 17), stradaMat);
        viale.rotation.x = -Math.PI / 2;
        const a = i * Math.PI / 2 + Math.PI / 4;
        viale.rotation.z = -a + Math.PI / 2;
        viale.position.set(Math.cos(a) * 19.5, 0.025, Math.sin(a) * 19.5);
        viale.receiveShadow = true;
        scena.add(viale);
    }

    // ---- Abeti ----
    const verdi = ['#1f5e43', '#24684b', '#1b513b'].map(c => new T.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true }));
    const neveMat = new T.MeshStandardMaterial({ color: '#f7faff', roughness: 0.85, flatShading: true });
    const legnoMat = new T.MeshStandardMaterial({ color: '#4a3426', roughness: 1 });
    const scatola = (w, h, d, materiale, x, y, z) => {
        const m = new T.Mesh(new T.BoxGeometry(w, h, d), materiale);
        m.position.set(x, y, z);
        return m;
    };
    function abete(x, z, k) {
        const g = new T.Group();
        const tronco = new T.Mesh(new T.CylinderGeometry(0.25 * k, 0.32 * k, 1.2 * k, 6), legnoMat);
        tronco.position.y = 0.6 * k;
        g.add(tronco);
        const verde = verdi[Math.floor(caso() * 3)];
        [[1.9, 2.4, 1.9], [1.45, 2.1, 3.1], [0.95, 1.8, 4.2]].forEach(([r, h, y]) => {
            const c = new T.Mesh(new T.ConeGeometry(r * k, h * k, 8), verde);
            c.position.y = y * k;
            c.castShadow = true;
            g.add(c);
            const n = new T.Mesh(new T.ConeGeometry(r * k * 0.55, h * k * 0.32, 8), neveMat);
            n.position.y = (y + h * 0.36) * k;
            g.add(n);
        });
        g.position.set(x, altezza(x, z), z);
        g.rotation.y = caso() * Math.PI;
        scena.add(g);
    }
    for (let i = 0; i < (telefono ? 70 : 120); i++) {
        const a = caso() * Math.PI * 2, r = 67 + caso() * 75;
        abete(Math.cos(a) * r, Math.sin(a) * r, 0.9 + caso() * 1.1);
    }

    // Insegne di legno con la scritta dorata
    function cartello(testo, largo, sfondo = '#7b2d26') {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 128;
        const g = c.getContext('2d');
        g.fillStyle = '#c9a227';
        g.fillRect(0, 0, 512, 128);
        g.fillStyle = sfondo;
        g.fillRect(8, 8, 496, 112);
        let misura = 56;
        g.font = `bold ${misura}px Georgia, serif`;
        while (g.measureText(testo).width > 470 && misura > 20) g.font = `bold ${(misura -= 2)}px Georgia, serif`;
        g.fillStyle = '#fff4dc';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(testo, 256, 68);
        return new T.Mesh(new T.PlaneGeometry(largo, largo / 4), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c) }));
    }

    // ---- Le 24 case, con i colori del villaggio disegnato ----
    const LUCINE = COLORI_FESTA.map(c => new T.MeshBasicMaterial({ color: c }));
    const case3D = [];
    function prisma(larghezza, alto, profondo, materiale) {
        const forma = new T.Shape();
        forma.moveTo(-larghezza / 2, 0);
        forma.lineTo(larghezza / 2, 0);
        forma.lineTo(0, alto);
        forma.closePath();
        const geo = new T.ExtrudeGeometry(forma, { depth: profondo, bevelEnabled: false });
        geo.translate(0, 0, -profondo / 2);
        const m = new T.Mesh(geo, materiale);
        m.castShadow = true;
        return m;
    }
    function casa(giorno, x, z) {
        const g = new T.Group();
        g.userData.giorno = giorno;
        const w = 4 + caso() * 1.4, h = 3 + caso() * 1.4, d = 3.6 + caso() * 0.8, rh = 2 + caso() * 0.6;
        // La 24 è la casa di Babbo Natale: rossa con il tetto verde, come nel villaggio disegnato
        const { muro, tetto } = giorno === 24 ? { muro: '#c0392b', tetto: '#2e5b3f' } : COLORI[(giorno * 5) % COLORI.length];
        const corpo = scatola(w, h, d, new T.MeshStandardMaterial({ color: muro, roughness: 0.85 }), 0, h / 2, 0);
        corpo.castShadow = corpo.receiveShadow = true;
        g.add(corpo);
        const tettoM = prisma(w + 0.8, rh, d + 0.7, new T.MeshStandardMaterial({ color: tetto, roughness: 0.8 }));
        tettoM.position.y = h;
        g.add(tettoM);
        const neve = prisma(w + 0.35, rh + 0.05, d + 0.85, neveMat);
        neve.position.y = h + 0.14;
        g.add(neve);
        const comignolo = scatola(0.6, 1.4, 0.6, new T.MeshStandardMaterial({ color: '#8a4b3a', roughness: 1 }), w * 0.22, h + rh * 0.75, -d * 0.15);
        comignolo.castShadow = true;
        g.add(comignolo, scatola(0.75, 0.22, 0.75, neveMat, w * 0.22, h + rh * 0.75 + 0.8, -d * 0.15));
        // Porta che si apre girando sui cardini
        const cardine = new T.Group();
        cardine.position.set(-0.48, 0, d / 2 + 0.04);
        const anta = scatola(0.95, 1.6, 0.12, new T.MeshStandardMaterial({ color: scurisci(tetto, 0.05), roughness: 0.7 }), 0.48, 0.8, 0);
        const ghirlanda = new T.Mesh(new T.TorusGeometry(0.24, 0.07, 8, 18), new T.MeshStandardMaterial({ color: '#2e6b3f' }));
        ghirlanda.position.set(0.48, 1.2, 0.09);
        cardine.add(anta, ghirlanda);
        g.add(cardine);
        const vano = scatola(0.9, 1.55, 0.05, new T.MeshBasicMaterial({ color: '#ffcf73' }), 0, 0.78, d / 2 + 0.01);
        g.add(vano);
        // Finestre: spente, accese piano o accese di festa
        const vetro = new T.MeshStandardMaterial({ color: '#1a2142', emissive: '#ffb347', emissiveIntensity: 0.04, roughness: 0.3 });
        const cornice = new T.MeshStandardMaterial({ color: '#fbf6ea', roughness: 0.8 });
        [[-w / 4 - 0.15, h * 0.62, d / 2 + 0.04, 0], [w / 4 + 0.15, h * 0.62, d / 2 + 0.04, 0], [w / 2 + 0.04, h * 0.55, 0, Math.PI / 2], [-w / 2 - 0.04, h * 0.55, 0, -Math.PI / 2]].forEach(([fx, fy, fz, ry]) => {
            const f = new T.Group();
            f.add(scatola(0.95, 1.05, 0.08, cornice, 0, 0, 0), scatola(0.75, 0.85, 0.1, vetro, 0, 0, 0.01), scatola(0.06, 0.85, 0.12, cornice, 0, 0, 0.02), scatola(0.75, 0.06, 0.12, cornice, 0, 0, 0.02), scatola(1.05, 0.12, 0.25, neveMat, 0, -0.56, 0.08));
            f.position.set(fx, fy, fz);
            f.rotation.y = ry;
            g.add(f);
        });
        const targa = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), new T.MeshBasicMaterial({ map: numero(giorno), transparent: true }));
        targa.position.set(0, h + rh * 0.38, (d + 0.7) / 2 + 0.02);
        g.add(targa);
        const lucine = new T.Group();
        for (let i = 0; i <= 12; i++) {
            const t = i / 12;
            const l = new T.Mesh(new T.SphereGeometry(0.09, 8, 6), LUCINE[i % LUCINE.length]);
            l.position.set(-(w + 0.8) / 2 + (w + 0.8) * t, h - 0.03 + rh * (1 - Math.abs(2 * t - 1)), (d + 0.7) / 2 + 0.08);
            lucine.add(l);
        }
        g.add(lucine);
        const bagliore = alone('#ffb347', 6, 0.5);
        bagliore.position.set(0, 1.2, d / 2 + 1.2);
        g.add(bagliore);
        // La stella che indica la casa di oggi
        const stellaOggi = new T.Group();
        stellaOggi.add(new T.Mesh(geoStella(0.7), new T.MeshBasicMaterial({ color: '#ffe066' })), alone('#ffd36b', 5, 0.85));
        stellaOggi.position.y = stellaOggi.userData.y = h + rh + 2.2;
        if (giorno === 24) {
            const insegna = cartello('BABBO NATALE', 1.7, '#2e5b3f');
            insegna.position.set(0, 2.05, d / 2 + 0.06);
            g.add(insegna);
            // Bastoncini di zucchero ai lati della porta
            [-0.85, 0.85].forEach(bx => {
                for (let k = 0; k < 6; k++) g.add(scatola(0.16, 0.25, 0.16, new T.MeshStandardMaterial({ color: k % 2 ? '#fbfdff' : '#d63031' }), bx, 0.12 + k * 0.25, d / 2 + 0.25));
            });
            g.scale.setScalar(1.35);
        }
        g.add(stellaOggi);
        [[-w / 2 + 0.3, d / 2], [w / 2 - 0.2, d / 2 - 0.2]].forEach(([nx, nz]) => {
            const mucchio = new T.Mesh(new T.SphereGeometry(0.7, 10, 6), neveMat);
            mucchio.scale.set(1.2, 0.45, 0.9);
            mucchio.position.set(nx, 0, nz + 0.4);
            g.add(mucchio);
        });
        g.position.set(x, 0, z);
        g.lookAt(0, 0, 0);
        scena.add(g);
        case3D.push({ giorno, gruppo: g, vetro, lucine, bagliore, stellaOggi, cardine, vano, d, stato: '', aperturaPorta: 0, scossa: 0 });
    }
    function geoStella(raggio) {
        const forma = new T.Shape();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 ? raggio * 0.42 : raggio, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
            i ? forma.lineTo(Math.cos(a) * r, Math.sin(a) * r) : forma.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        const geo = new T.ExtrudeGeometry(forma, { depth: raggio * 0.28, bevelEnabled: false });
        geo.translate(0, 0, -raggio * 0.14);
        return geo;
    }
    // 12 case nel giro interno e 12 nel giro esterno, in ordine come un percorso
    for (let i = 0; i < 24; i++) {
        const interno = i < 12, k = interno ? i : i - 12;
        const a = (k / 12) * Math.PI * 2 + (interno ? 0.13 : 0.39) - Math.PI / 2;
        const r = interno ? 22 : 37;
        casa(i + 1, Math.cos(a) * r, Math.sin(a) * r);
    }

    // ---- L'albero grande in piazza ----
    const albero = new T.Group();
    const tronco = new T.Mesh(new T.CylinderGeometry(0.5, 0.7, 2, 8), legnoMat);
    tronco.position.y = 1;
    tronco.castShadow = true;
    albero.add(tronco);
    const verdeAlbero = new T.MeshStandardMaterial({ color: '#1d5a3f', roughness: 0.85, flatShading: true });
    [[4.4, 4.6, 3.2], [3.5, 4, 5.6], [2.6, 3.4, 7.6], [1.6, 2.8, 9.4]].forEach(([r, h, y]) => {
        const c = new T.Mesh(new T.ConeGeometry(r, h, 12), verdeAlbero);
        c.position.y = y;
        c.castShadow = true;
        const n = new T.Mesh(new T.ConeGeometry(r * 0.5, h * 0.3, 12), neveMat);
        n.position.y = y + h * 0.36;
        albero.add(c, n);
    });
    const palline = ['#ff4b4b', '#ffd36b', '#6fd3ff', '#ff9de2', '#7dff9a'].map(c => new T.MeshBasicMaterial({ color: c }));
    const baseColori = palline.map(m => m.color.clone());
    for (let i = 0; i < 90; i++) {
        const t = i / 90, rr = 4.35 - t * 3.6, a = t * Math.PI * 14;
        const p = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), palline[i % palline.length]);
        p.position.set(Math.cos(a) * rr, 1.6 + t * 9.2, Math.sin(a) * rr);
        albero.add(p);
    }
    const stella = new T.Mesh(geoStella(1.1), new T.MeshBasicMaterial({ color: '#ffe066' }));
    stella.position.y = 11.6;
    const aloneStella = alone('#ffd36b', 9, 0.8);
    aloneStella.position.y = 11.6;
    const luceStella = new T.PointLight('#ffcf73', 1.2, 40, 2);
    luceStella.position.y = 10;
    albero.add(stella, aloneStella, luceStella);
    [['#c0392b', '#f4d03f', 2.6, 1.4], ['#2e7d5b', '#fbf6ea', -2.4, 2], ['#2d4f8a', '#e84393', 1.2, -2.8], ['#f4d03f', '#c0392b', -2.2, -2]].forEach(([carta, nastro, px, pz]) => {
        const s = 0.9 + caso() * 0.5, r = new T.Group();
        const nastroMat = new T.MeshStandardMaterial({ color: nastro });
        r.add(scatola(s, s, s, new T.MeshStandardMaterial({ color: carta, roughness: 0.6 }), 0, s / 2, 0), scatola(s + 0.02, s + 0.02, 0.2, nastroMat, 0, s / 2, 0), scatola(0.2, s + 0.02, s + 0.02, nastroMat, 0, s / 2, 0));
        r.children.forEach(m => (m.castShadow = true));
        r.position.set(px, 0, pz);
        r.rotation.y = caso() * Math.PI;
        albero.add(r);
    });
    scena.add(albero);

    // ---- Lampioni ----
    const lampioni = [];
    const ferro = new T.MeshStandardMaterial({ color: '#2c2f45', roughness: 0.6, metalness: 0.4 });
    const lanternaMat = new T.MeshBasicMaterial({ color: '#ffd47a' });
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + 0.52, r = 26.6;
        const l = new T.Group();
        const palo = scatola(0.16, 4, 0.16, ferro, 0, 2, 0);
        palo.castShadow = true;
        const a2 = alone('#ffcf73', 4.5, 0.7);
        a2.position.y = 4.2;
        l.add(palo, scatola(0.5, 0.6, 0.5, lanternaMat, 0, 4.2, 0), scatola(0.7, 0.12, 0.7, neveMat, 0, 4.58, 0), a2);
        l.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        scena.add(l);
        lampioni.push(a2);
        if (i % 3 === 0) {
            const luce = new T.PointLight('#ffcf73', 0.9, 16, 2);
            luce.position.set(l.position.x, 4, l.position.z);
            scena.add(luce);
            lampioni.push(luce);
        }
    }

    // ---- La slitta di Babbo Natale ----
    const slitta = new T.Group();
    const rosso = new T.MeshStandardMaterial({ color: '#b3202b', roughness: 0.5 });
    const oro = new T.MeshStandardMaterial({ color: '#e8c766', roughness: 0.3, metalness: 0.6 });
    slitta.add(scatola(1.7, 0.8, 2.6, rosso, 0, 0.4, 0), scatola(1.7, 1.3, 0.5, rosso, 0, 0.65, -1.1), scatola(0.1, 0.1, 3.4, oro, -0.75, -0.25, 0.2), scatola(0.1, 0.1, 3.4, oro, 0.75, -0.25, 0.2));
    const pelle = new T.MeshStandardMaterial({ color: '#f2d2bd' });
    const bianco = new T.MeshStandardMaterial({ color: '#fbfdff' });
    const babbo = new T.Group();
    const giacca = new T.Mesh(new T.CylinderGeometry(0.4, 0.55, 1.1, 10), rosso);
    giacca.position.y = 1.2;
    const testa = new T.Mesh(new T.SphereGeometry(0.3, 12, 10), pelle);
    testa.position.y = 1.95;
    const barba = new T.Mesh(new T.SphereGeometry(0.28, 12, 10), bianco);
    barba.position.set(0, 1.78, 0.18);
    const cappello = new T.Mesh(new T.ConeGeometry(0.3, 0.6, 10), rosso);
    cappello.position.y = 2.35;
    babbo.add(giacca, testa, barba, cappello);
    babbo.position.z = -0.3;
    const sacco = new T.Mesh(new T.SphereGeometry(0.6, 12, 10), new T.MeshStandardMaterial({ color: '#8a5a36', roughness: 1 }));
    sacco.position.set(0, 1.3, -1.2);
    slitta.add(babbo, sacco);
    const pelo = new T.MeshStandardMaterial({ color: '#7a5034', roughness: 0.9 });
    const corna = new T.MeshStandardMaterial({ color: '#d9c3a0' });
    const zampe = [];
    function renna(x, z, naso) {
        const r = new T.Group();
        const collo = scatola(0.25, 0.6, 0.25, pelo, 0, 1.0, 0.5);
        collo.rotation.x = 0.4;
        r.add(scatola(0.45, 0.5, 1.2, pelo, 0, 0.6, 0), collo, scatola(0.3, 0.3, 0.45, pelo, 0, 1.3, 0.75), scatola(0.05, 0.45, 0.05, corna, 0.12, 1.65, 0.65), scatola(0.05, 0.45, 0.05, corna, -0.12, 1.65, 0.65));
        [[0.14, 0.4], [-0.14, 0.4], [0.14, -0.4], [-0.14, -0.4]].forEach(([zx, zz], i) => {
            const zampa = scatola(0.09, 0.55, 0.09, pelo, zx, 0.2, zz);
            zampa.userData.fase = i % 2 ? 0 : Math.PI;
            zampe.push(zampa);
            r.add(zampa);
        });
        if (naso) {
            const n = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), new T.MeshBasicMaterial({ color: '#ff3b30' }));
            n.position.set(0, 1.3, 1.0);
            const a = alone('#ff3b30', 2.4, 0.9);
            a.position.copy(n.position);
            r.add(n, a);
        }
        r.position.set(x, 0, z);
        slitta.add(r);
    }
    [2.6, 4.2, 5.8].forEach(z => { renna(0.45, z, false); renna(-0.45, z, false); });
    renna(0, 7.4, true);
    scena.add(slitta);
    // ---- Gli edifici speciali: ognuno apre la sua stanza del villaggio disegnato ----
    const speciali = [];
    const vetriSpeciali = [];
    const legnoChiaro = new T.MeshStandardMaterial({ color: '#8a5a3c', roughness: 0.9 });
    const cornice = new T.MeshStandardMaterial({ color: '#fbf6ea', roughness: 0.8 });
    const vetroSpeciale = () => {
        const v = new T.MeshStandardMaterial({ color: '#1a2142', emissive: '#ffb347', emissiveIntensity: 1, roughness: 0.3 });
        vetriSpeciali.push(v);
        return v;
    };
    function finestraGrande(g, x, y, z, vetro) {
        g.add(scatola(1.25, 1.35, 0.1, cornice, x, y, z), scatola(1.05, 1.15, 0.12, vetro, x, y, z + 0.01), scatola(0.08, 1.15, 0.14, cornice, x, y, z + 0.02), scatola(1.05, 0.08, 0.14, cornice, x, y, z + 0.02), scatola(1.4, 0.14, 0.3, neveMat, x, y - 0.72, z + 0.1));
    }
    function edificio({ w, h, d, muro, tetto, testo, insegna = '#7b2d26', rh = 2.6 }) {
        const g = new T.Group();
        const corpo = scatola(w, h, d, new T.MeshStandardMaterial({ color: muro, roughness: 0.85 }), 0, h / 2, 0);
        corpo.castShadow = corpo.receiveShadow = true;
        const t = prisma(w + 0.9, rh, d + 0.8, new T.MeshStandardMaterial({ color: tetto, roughness: 0.8 }));
        t.position.y = h;
        const n = prisma(w + 0.45, rh + 0.05, d + 0.95, neveMat);
        n.position.y = h + 0.16;
        g.add(corpo, t, n, scatola(1.5, 2.3, 0.14, new T.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.7 }), 0, 1.15, d / 2 + 0.05));
        const vetro = vetroSpeciale();
        [-w * 0.3, w * 0.3].forEach(x => finestraGrande(g, x, h * 0.55, d / 2 + 0.05, vetro));
        const scritta = cartello(testo, Math.min(w * 0.62, 5.2), insegna);
        scritta.position.set(0, h + rh * 0.3, (d + 0.8) / 2 + 0.03);
        g.add(scritta);
        const bagliore = alone('#ffb347', w * 0.9, 0.35);
        bagliore.position.set(0, 1.4, d / 2 + 1.5);
        g.add(bagliore);
        lampioni.push(bagliore);
        return g;
    }
    function speciale(gruppo, selettore, indice, r, angolo, { entra = true, distanza = 19, alto = 3, alzo = 0.55, guardaFuori = false } = {}) {
        gruppo.position.set(Math.cos(angolo) * r, 0, Math.sin(angolo) * r);
        if (guardaFuori) gruppo.lookAt(gruppo.position.x * 2, 0, gruppo.position.z * 2);
        else gruppo.lookAt(0, 0, 0);
        gruppo.userData.speciale = true;
        if (!scena.children.includes(gruppo)) scena.add(gruppo);
        const s = { gruppo, elemento: trova(selettore, indice), entra, distanza, alto, alzo, fino: 0 };
        speciali.push(s);
        return s;
    }
    function personaggio(giacca, cappello, pelleColore = '#f2d2bd', k = 1) {
        const p = new T.Group();
        const corpo = new T.Mesh(new T.CylinderGeometry(0.28 * k, 0.4 * k, 1.1 * k, 10), new T.MeshStandardMaterial({ color: giacca, roughness: 0.8 }));
        corpo.position.y = 0.55 * k;
        corpo.castShadow = true;
        const testa = new T.Mesh(new T.SphereGeometry(0.25 * k, 12, 10), new T.MeshStandardMaterial({ color: pelleColore }));
        testa.position.y = 1.3 * k;
        const berretto = new T.Mesh(new T.ConeGeometry(0.24 * k, 0.5 * k, 10), new T.MeshStandardMaterial({ color: cappello }));
        berretto.position.y = 1.62 * k;
        const pon = new T.Mesh(new T.SphereGeometry(0.07 * k, 8, 6), bianco);
        pon.position.y = 1.88 * k;
        p.add(corpo, testa, berretto, pon);
        return p;
    }
    const A = i => -Math.PI / 2 + i * (Math.PI / 4) + 0.2;

    // Stazione, con il marciapiede verso i binari del trenino
    const stazione = edificio({ w: 10, h: 4.6, d: 5, muro: '#8a5a3c', tetto: '#7b2d26', testo: 'STAZIONE' });
    const orologio3D = new T.Mesh(new T.CircleGeometry(0.55, 24), new T.MeshBasicMaterial({ color: '#fdf6dc' }));
    orologio3D.position.set(0, 3.7, 2.58);
    stazione.add(orologio3D, scatola(0.06, 0.4, 0.02, new T.MeshBasicMaterial({ color: '#222' }), 0, 3.85, 2.6), scatola(0.3, 0.06, 0.02, new T.MeshBasicMaterial({ color: '#222' }), 0.12, 3.7, 2.6));
    stazione.add(scatola(16, 0.5, 3.2, pietra, 0, 0.25, -4.2));
    speciale(stazione, '.stazione', 0, 52, A(0), { distanza: 20 });

    // Ufficio postale con la cassetta delle lettere
    const posta3D = edificio({ w: 8, h: 4.2, d: 5, muro: '#c0392b', tetto: '#2e5b3f', testo: 'UFFICIO POSTALE', insegna: '#2e5b3f' });
    const rossoPosta = new T.MeshStandardMaterial({ color: '#d63031', roughness: 0.5 });
    posta3D.add(scatola(0.12, 1.2, 0.12, ferro, 5, 0.6, 3.4), scatola(0.7, 0.9, 0.55, rossoPosta, 5, 1.55, 3.4), scatola(0.8, 0.12, 0.65, neveMat, 5, 2.05, 3.4));
    speciale(posta3D, '.posta', 0, 50, A(1), { distanza: 17 });

    // Laboratorio degli elfi, con l'ingranaggio che gira e i pacchi pronti
    const laboratorio3D = edificio({ w: 12, h: 5.2, d: 6, muro: '#8a5a3c', tetto: '#2d4f8a', testo: 'LABORATORIO DEGLI ELFI', insegna: '#2d4f8a' });
    const ingranaggio = new T.Group();
    const oroGiallo = new T.MeshStandardMaterial({ color: '#e8c766', roughness: 0.3, metalness: 0.6 });
    ingranaggio.add(new T.Mesh(new T.TorusGeometry(0.55, 0.14, 8, 24), oroGiallo));
    for (let i = 0; i < 8; i++) {
        const dente = scatola(0.22, 0.3, 0.16, oroGiallo, Math.cos(i * Math.PI / 4) * 0.75, Math.sin(i * Math.PI / 4) * 0.75, 0);
        dente.rotation.z = i * Math.PI / 4;
        ingranaggio.add(dente);
    }
    ingranaggio.position.set(0, 3.9, 3.08);
    laboratorio3D.add(ingranaggio);
    [['#c0392b', 4.6, 0.5], ['#2e7d5b', 5.5, 0.45], ['#f4d03f', 5, 1.3]].forEach(([c, x, y]) => laboratorio3D.add(scatola(0.9, 0.9, 0.9, new T.MeshStandardMaterial({ color: c }), x, y, 3.6)));
    speciale(laboratorio3D, '.laboratorio', 0, 53, A(2), { distanza: 22 });

    // Stalla rossa con il portone a croce, il fieno e due renne fuori
    const stalla3D = edificio({ w: 9, h: 4.2, d: 5.5, muro: '#a3242c', tetto: '#5d3a22', testo: 'STALLA DELLE RENNE', insegna: '#5d3a22', rh: 3 });
    [0.55, -0.55].forEach(a => {
        const asse = scatola(0.14, 2.7, 0.06, bianco, 0, 1.15, 2.86);
        asse.rotation.z = a;
        stalla3D.add(asse);
    });
    const fieno = new T.MeshStandardMaterial({ color: '#d9b34a', roughness: 1 });
    [[-5.4, 0.5, 2.5], [-5.4, 1.4, 2.5], [5.4, 0.5, 2.8]].forEach(([x, y, z]) => {
        const balla = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 1.1, 12), fieno);
        balla.rotation.z = Math.PI / 2;
        balla.position.set(x, y, z);
        stalla3D.add(balla);
    });
    function rennaFerma(x, z, ry) {
        const r = new T.Group();
        const collo = scatola(0.3, 0.8, 0.3, pelo, 0, 1.4, 0.65);
        collo.rotation.x = 0.3;
        r.add(scatola(0.6, 0.65, 1.5, pelo, 0, 1.0, 0), collo, scatola(0.38, 0.38, 0.6, pelo, 0, 1.85, 0.9), scatola(0.06, 0.6, 0.06, corna, 0.15, 2.3, 0.8), scatola(0.06, 0.6, 0.06, corna, -0.15, 2.3, 0.8));
        [[0.18, 0.5], [-0.18, 0.5], [0.18, -0.5], [-0.18, -0.5]].forEach(([zx, zz]) => r.add(scatola(0.12, 0.75, 0.12, pelo, zx, 0.37, zz)));
        r.position.set(x, 0, z);
        r.rotation.y = ry;
        r.children.forEach(m => (m.castShadow = true));
        stalla3D.add(r);
    }
    rennaFerma(-3.6, 3.9, 0.7);
    rennaFerma(3.3, 4.4, -0.5);
    speciale(stalla3D, '.stalla', 0, 51, A(3), { distanza: 19 });

    // Le bancarelle: tetto colorato innevato, bancone, lampada e chi vende
    function bancarella(nome, colore, merce) {
        const g = new T.Group();
        g.add(scatola(3, 1.1, 1.3, legnoChiaro, 0, 0.55, 0.35), scatola(3.1, 0.1, 1.45, bianco, 0, 1.13, 0.35), scatola(3, 2.5, 0.12, legnoChiaro, 0, 1.25, -0.6));
        [[-1.45, -0.55], [1.45, -0.55], [-1.45, 1.0], [1.45, 1.0]].forEach(([x, z]) => g.add(scatola(0.12, 2.6, 0.12, legnoChiaro, x, 1.3, z)));
        const tettoB = prisma(3.7, 1.1, 2.3, new T.MeshStandardMaterial({ color: colore, roughness: 0.7 }));
        tettoB.position.set(0, 2.6, 0.2);
        const neveB = prisma(3.35, 1.15, 2.4, neveMat);
        neveB.position.set(0, 2.72, 0.2);
        const scritta = cartello(nome, 2.3, colore);
        scritta.position.set(0, 2.92, 1.37);
        const lampada = new T.Mesh(new T.SphereGeometry(0.14, 10, 8), lanternaMat);
        lampada.position.set(0, 2.3, 0.9);
        const luceB = alone('#ffcf73', 3, 0.6);
        luceB.position.copy(lampada.position);
        lampioni.push(luceB);
        g.add(tettoB, neveB, scritta, lampada, luceB);
        merce.forEach((c, i) => {
            const m = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), new T.MeshStandardMaterial({ color: c, roughness: 0.5 }));
            m.position.set(-1.1 + i * 0.45, 1.3, 0.6);
            g.add(m);
        });
        const chi = personaggio(['#3b3f58', '#5b3a6b', '#2d4f8a', '#2e7d5b', '#c0392b'][nome.length % 5], '#c0392b');
        chi.position.set(0.3, 0.2, -0.2);
        g.add(chi);
        return g;
    }
    [['Castagne', '#9b1d2a', ['#6b3a1e', '#7a4424', '#5d3218', '#6b3a1e', '#7a4424']], ['Cioccolata', '#2e6b3f', ['#5a3420', '#fbfdff', '#5a3420', '#fbfdff', '#5a3420']], ['Frittelle', '#2d4f8a', ['#e0a85a', '#d9984a', '#e0a85a', '#d9984a', '#e0a85a']]].forEach(([nome, colore, merce], i) => {
        speciale(bancarella(nome, colore, merce), `.bancarella[data-tipo="${nome.toLowerCase()}"]`, 0, 50, A(4) + (i - 1) * 0.1, { distanza: 11, alto: 1.8 });
    });
    [['Addobbi', '#7d4e9e', ['#e0262f', '#f4d03f', '#3f7fd6', '#e84393', '#2e7d4a']], ['Candele', '#b5651d', ['#fff4dc', '#ffd36b', '#fff4dc', '#ffd36b', '#fff4dc']]].forEach(([nome, colore, merce], i) => {
        speciale(bancarella(nome, colore, merce), '.negozio', i, 50, A(5) + (i - 0.5) * 0.1, { distanza: 11, alto: 1.8 });
    });

    // La giostra con i cavalli che salgono e scendono
    const giostra3D = new T.Group();
    const pedana = new T.Mesh(new T.CylinderGeometry(3.4, 3.6, 0.5, 32), new T.MeshStandardMaterial({ color: '#fbf1d8', roughness: 0.6 }));
    pedana.position.y = 0.25;
    giostra3D.add(pedana);
    const giro = new T.Group();
    giro.add(scatola(0.9, 3.4, 0.9, oroGiallo, 0, 2.2, 0));
    const strisce = tela(256, g => {
        for (let i = 0; i < 16; i++) {
            g.fillStyle = i % 2 ? '#fbfdff' : '#c0392b';
            g.fillRect(i * 16, 0, 16, 256);
        }
    });
    const tettoG = new T.Mesh(new T.ConeGeometry(3.9, 1.9, 32), new T.MeshStandardMaterial({ map: strisce, roughness: 0.6 }));
    tettoG.position.y = 4.85;
    tettoG.castShadow = true;
    const cimaG = new T.Mesh(new T.SphereGeometry(0.25, 10, 8), oroGiallo);
    cimaG.position.y = 5.95;
    giro.add(tettoG, cimaG);
    const cavalli = [];
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const palo = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 3.5, 6), oroGiallo);
        palo.position.set(Math.cos(a) * 2.6, 2.2, Math.sin(a) * 2.6);
        const cavallo = new T.Group();
        const mantello = new T.MeshStandardMaterial({ color: i % 2 ? '#fbfdff' : '#f2d7b3' });
        const collo = scatola(0.25, 0.6, 0.25, mantello, 0, 0.35, 0.45);
        collo.rotation.x = -0.4;
        cavallo.add(scatola(0.32, 0.45, 1.1, mantello, 0, 0, 0), collo, scatola(0.25, 0.25, 0.5, mantello, 0, 0.65, 0.65), scatola(0.36, 0.1, 0.5, new T.MeshStandardMaterial({ color: COLORI_FESTA[i % 5] }), 0, 0.26, -0.05));
        cavallo.position.set(Math.cos(a) * 2.6, 1.6, Math.sin(a) * 2.6);
        cavallo.rotation.y = -a;
        cavalli.push(cavallo);
        giro.add(palo, cavallo);
        const luceG = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), LUCINE[i % LUCINE.length]);
        luceG.position.set(Math.cos(a) * 3.85, 3.95, Math.sin(a) * 3.85);
        giro.add(luceG);
    }
    giostra3D.add(giro);
    const sGiostra = speciale(giostra3D, '.giostra', 0, 50, A(6), { entra: false, distanza: 15, alto: 2.5 });

    // Il palaghiaccio: una cupola di ghiaccio azzurro
    const pala = new T.Group();
    const muroPala = new T.Mesh(new T.CylinderGeometry(6, 6, 3.2, 40), new T.MeshStandardMaterial({ color: '#e3f1ff', roughness: 0.5 }));
    muroPala.position.y = 1.6;
    muroPala.castShadow = muroPala.receiveShadow = true;
    const cupola = new T.Mesh(new T.SphereGeometry(6.1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: '#a9d6f5', roughness: 0.15, metalness: 0.25 }));
    cupola.position.y = 3.2;
    cupola.scale.y = 0.6;
    cupola.castShadow = true;
    const capNeve = new T.Mesh(new T.SphereGeometry(3.2, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), neveMat);
    capNeve.position.y = 5.65;
    capNeve.scale.y = 0.35;
    pala.add(muroPala, cupola, capNeve, scatola(1.8, 2.3, 0.3, new T.MeshStandardMaterial({ color: '#2d4f8a' }), 0, 1.15, 5.95));
    const vetroPala = vetroSpeciale();
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + Math.PI / 10;
        if (Math.abs(Math.sin(a) - 1) < 0.05) continue;
        const f = scatola(0.9, 1, 0.1, vetroPala, Math.sin(a) * 6.02, 2, Math.cos(a) * 6.02);
        f.rotation.y = a;
        pala.add(f);
    }
    const scrittaPala = cartello('PALAGHIACCIO', 4, '#2d4f8a');
    scrittaPala.position.set(0, 2.85, 6.08);
    pala.add(scrittaPala);
    speciale(pala, '.palaghiaccio', 0, 52, A(7), { distanza: 21, alto: 3 });

    // Il coro in piazza, rivolto verso chi guarda
    const coro3D = new T.Group();
    [['#c0392b', '#2e7d5b'], ['#2d4f8a', '#c0392b'], ['#7d4e9e', '#f4d03f'], ['#2e7d5b', '#c0392b'], ['#b5652f', '#2d4f8a']].forEach(([giacca, cappello], i) => {
        const p = personaggio(giacca, cappello, i % 2 ? '#e3b393' : '#f2d2bd');
        p.position.set((i - 2) * 0.9, 0, i % 2 ? -0.5 : 0);
        p.add(scatola(0.4, 0.3, 0.06, bianco, 0, 0.95, 0.4));
        coro3D.add(p);
    });
    const sCoro = speciale(coro3D, '.coro', 0, 15.5, 0.05, { entra: false, distanza: 9, alto: 1.4, alzo: 0.35, guardaFuori: true });

    // Anche l'albero si tocca: parte lo Schiaccianoci
    const sAlbero = speciale(albero, '.albero', 0, 0, 0, { entra: false, distanza: 30, alto: 6, alzo: 0.3 });

    // La signora Natale, che aspetta alla porta della casa di Babbo Natale la sera del 24
    const signora = new T.Group();
    const vestito = new T.MeshStandardMaterial({ color: '#b3202b', roughness: 0.7 });
    const gonna = new T.Mesh(new T.ConeGeometry(0.6, 1.3, 16), vestito);
    gonna.position.y = 0.65;
    const busto = new T.Mesh(new T.CylinderGeometry(0.26, 0.36, 0.6, 12), vestito);
    busto.position.y = 1.55;
    const grembiule = scatola(0.5, 0.8, 0.05, bianco, 0, 0.75, 0.33);
    grembiule.rotation.x = -0.2;
    const testaS = new T.Mesh(new T.SphereGeometry(0.25, 14, 12), pelle);
    testaS.position.y = 2.05;
    const capelli = new T.Mesh(new T.SphereGeometry(0.27, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: '#e8e8ee' }));
    capelli.position.y = 2.08;
    const chignon = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), capelli.material);
    chignon.position.set(0, 2.35, -0.1);
    const tazza = new T.Mesh(new T.CylinderGeometry(0.09, 0.08, 0.18, 10), new T.MeshStandardMaterial({ color: '#fbf6ea' }));
    tazza.position.set(0.35, 1.35, 0.25);
    signora.add(gonna, busto, grembiule, testaS, capelli, chignon, tazza);
    signora.children.forEach(m => (m.castShadow = true));
    signora.visible = false;
    const casa24 = case3D.find(c => c.giorno === 24);
    signora.position.set(1.15, 0, casa24.d / 2 + 0.8);
    casa24.gruppo.add(signora);

    // Il trenino che fa il giro del paese sui suoi binari
    const BINARI = 60;
    [[BINARI - 0.9, BINARI + 0.9, '#9a8f86'], [BINARI - 0.55, BINARI - 0.42, '#5c6378'], [BINARI + 0.42, BINARI + 0.55, '#5c6378']].forEach(([da, a, c], i) => {
        const anello = new T.Mesh(new T.RingGeometry(da, a, 160), new T.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: i ? 0.5 : 0 }));
        anello.rotation.x = -Math.PI / 2;
        anello.position.y = 0.04 + i * 0.01;
        anello.receiveShadow = true;
        scena.add(anello);
    });
    const vagoni = [];
    const locomotiva = new T.Group();
    const caldaia = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 2.2, 16), new T.MeshStandardMaterial({ color: '#b3202b', roughness: 0.4 }));
    caldaia.rotation.x = Math.PI / 2;
    caldaia.position.set(0, 1.05, 0.4);
    const ciminiera = new T.Mesh(new T.CylinderGeometry(0.22, 0.15, 0.7, 10), new T.MeshStandardMaterial({ color: '#2c2f45' }));
    ciminiera.position.set(0, 1.85, 1.1);
    const fanale = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), lanternaMat);
    fanale.position.set(0, 1.1, 1.55);
    locomotiva.add(caldaia, ciminiera, fanale, scatola(1.3, 1.5, 1.1, new T.MeshStandardMaterial({ color: '#2e5b3f', roughness: 0.5 }), 0, 1.25, -0.95), scatola(1.5, 0.15, 1.3, neveMat, 0, 2.05, -0.95), scatola(1.2, 0.3, 3.2, ferro, 0, 0.4, 0));
    vagoni.push(locomotiva);
    ['#c0392b', '#2d4f8a', '#2e7d5b'].forEach(c => {
        const v = new T.Group();
        const vetroV = vetroSpeciale();
        v.add(scatola(1.3, 1.3, 2.6, new T.MeshStandardMaterial({ color: c, roughness: 0.5 }), 0, 1.1, 0), scatola(1.45, 0.15, 2.8, neveMat, 0, 1.82, 0), scatola(1.35, 0.45, 2.0, vetroV, 0, 1.3, 0), scatola(1.1, 0.3, 2.6, ferro, 0, 0.35, 0));
        vagoni.push(v);
    });
    vagoni.forEach(v => {
        v.children.forEach(m => (m.castShadow = true));
        scena.add(v);
    });

    const SCIA = 70;
    const sciaPos = new Float32Array(SCIA * 3), sciaCol = new Float32Array(SCIA * 3);
    const sciaGeo = new T.BufferGeometry();
    sciaGeo.setAttribute('position', new T.BufferAttribute(sciaPos, 3));
    sciaGeo.setAttribute('color', new T.BufferAttribute(sciaCol, 3));
    scena.add(new T.Points(sciaGeo, new T.PointsMaterial({ size: 0.6, map: ALONE, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false })));
    const storia = [];

    // ---- Le ballerine intorno all'albero: ferme in cerchio, danzano con lo Schiaccianoci ----
    const ballerine = [];
    const calzamaglia = new T.MeshStandardMaterial({ color: '#f6c6d0', roughness: 0.6 });
    const capelliB = new T.MeshStandardMaterial({ color: '#6b4226', roughness: 0.8 });
    ['#ffd1e3', '#fff4fb', '#d6ecff', '#ffe9b8', '#e8d6ff', '#ffd1e3'].forEach((colore, i) => {
        const b = new T.Group();
        const stoffa = new T.MeshStandardMaterial({ color: colore, roughness: 0.5 });
        [-0.07, 0.07].forEach(x => {
            const gamba = new T.Mesh(new T.CylinderGeometry(0.045, 0.035, 0.9, 8), calzamaglia);
            gamba.position.set(x, 0.45, 0);
            b.add(gamba);
        });
        const tutu = new T.Mesh(new T.CylinderGeometry(0.5, 0.58, 0.1, 24), stoffa);
        tutu.position.y = 0.95;
        const sottogonna = new T.Mesh(new T.CylinderGeometry(0.42, 0.5, 0.08, 24), bianco);
        sottogonna.position.y = 0.88;
        const busto = new T.Mesh(new T.CylinderGeometry(0.12, 0.16, 0.5, 10), stoffa);
        busto.position.y = 1.25;
        const testaB = new T.Mesh(new T.SphereGeometry(0.13, 12, 10), pelle);
        testaB.position.y = 1.62;
        const chignonB = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), capelliB);
        chignonB.position.set(0, 1.76, -0.04);
        const cuffia = new T.Mesh(new T.SphereGeometry(0.135, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), capelliB);
        cuffia.position.y = 1.63;
        const braccia = new T.Group();
        [-1, 1].forEach(lato => {
            const braccio = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.6, 6), calzamaglia);
            braccio.position.set(lato * 0.22, 1.62, 0);
            braccio.rotation.z = lato * -0.5;
            braccia.add(braccio);
        });
        b.add(tutu, sottogonna, busto, testaB, chignonB, cuffia, braccia);
        b.children.forEach(m => (m.castShadow = true));
        b.scale.setScalar(1.45);
        b.userData = { base: (i / 6) * Math.PI * 2 + 0.3, braccia };
        albero.add(b);
        ballerine.push(b);
    });

    // ---- Il laghetto ghiacciato con i pattinatori ----
    const lago = new T.Group();
    const ghiaccio = new T.Mesh(new T.CircleGeometry(5, 48), new T.MeshStandardMaterial({ color: '#cfe9ff', roughness: 0.08, metalness: 0.25 }));
    ghiaccio.rotation.x = -Math.PI / 2;
    ghiaccio.scale.set(1.5, 1, 1);
    ghiaccio.position.y = 0.05;
    ghiaccio.receiveShadow = true;
    const riva = new T.Mesh(new T.RingGeometry(5, 5.7, 48), neveMat);
    riva.rotation.x = -Math.PI / 2;
    riva.scale.set(1.5, 1, 1);
    riva.position.y = 0.06;
    lago.add(ghiaccio, riva);
    // Riflessi sul ghiaccio
    [[-2, 1, 1.6], [2.5, -1.2, 1.1]].forEach(([x, z, l]) => {
        const riflesso = new T.Mesh(new T.PlaneGeometry(l, 0.12), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6 }));
        riflesso.rotation.set(-Math.PI / 2, 0, 0.5);
        riflesso.position.set(x, 0.07, z);
        lago.add(riflesso);
    });
    const pattinatori = [['#c0392b', '#2e7d5b', 6, 3.4, 0.55, 0], ['#2d4f8a', '#f4d03f', 4.6, 2.6, -0.7, 2], ['#7d4e9e', '#c0392b', 5.4, 3, 0.45, 4], ['#2e7d5b', '#fbfdff', 3.2, 1.8, 0.9, 1]].map(([giacca, cappello, rx, rz, vel, fase]) => {
        const p = personaggio(giacca, cappello, '#f2d2bd', 0.85);
        const sciarpa = new T.Mesh(new T.TorusGeometry(0.2, 0.06, 6, 14), new T.MeshStandardMaterial({ color: cappello === '#fbfdff' ? '#c0392b' : cappello }));
        sciarpa.rotation.x = Math.PI / 2;
        sciarpa.position.y = 1.0;
        p.add(sciarpa);
        lago.add(p);
        return { p, rx, rz, vel, fase };
    });
    lago.position.set(Math.cos(A(6.5)) * 45.5, 0, Math.sin(A(6.5)) * 45.5);
    lago.lookAt(0, 0, 0);
    scena.add(lago);

    // ---- La slitta personale: Cometa o Rudolph la tirano di casa in casa ----
    const STRADA_R = 29.25;
    let mia = null, rennaScelta = null, angoloMia = 0, inCorsa = false;
    const zampeMia = [];
    const sciaMiaPos = new Float32Array(40 * 3);
    const sciaMiaGeo = new T.BufferGeometry();
    sciaMiaGeo.setAttribute('position', new T.BufferAttribute(sciaMiaPos, 3));
    const sciaMia = new T.Points(sciaMiaGeo, new T.PointsMaterial({ color: '#ffe066', size: 0.5, map: ALONE, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
    sciaMia.visible = false;
    scena.add(sciaMia);
    const storiaMia = [];
    function costruisciMia(renna) {
        const g = new T.Group();
        g.userData.slittaMia = true;
        g.add(scatola(1.5, 0.7, 2.3, rosso, 0, 0.75, 0), scatola(1.5, 1.1, 0.45, rosso, 0, 0.95, -1), scatola(0.1, 0.1, 3, oro, -0.65, 0.3, 0.2), scatola(0.1, 0.1, 3, oro, 0.65, 0.3, 0.2));
        [-0.65, 0.65].forEach(x => {
            const ricciolo = new T.Mesh(new T.TorusGeometry(0.3, 0.05, 6, 12, Math.PI), oro);
            ricciolo.rotation.y = Math.PI / 2;
            ricciolo.position.set(x, 0.6, 1.7);
            g.add(ricciolo);
        });
        const passeggero = personaggio('#2d4f8a', '#c0392b', '#f2d2bd', 0.75);
        passeggero.position.set(0, 0.75, -0.2);
        passeggero.visible = false;
        g.add(passeggero);
        g.userData.passeggero = passeggero;
        const peloMio = new T.MeshStandardMaterial({ color: renna === 'cometa' ? '#c9b08f' : '#7a5034', roughness: 0.9 });
        const tiro = (x, z, guida) => {
            const r = new T.Group();
            const collo = scatola(0.25, 0.6, 0.25, peloMio, 0, 1.4, 0.5);
            collo.rotation.x = 0.4;
            r.add(scatola(0.45, 0.5, 1.2, peloMio, 0, 1.0, 0), collo, scatola(0.3, 0.3, 0.45, peloMio, 0, 1.7, 0.75), scatola(0.05, 0.45, 0.05, corna, 0.12, 2.05, 0.65), scatola(0.05, 0.45, 0.05, corna, -0.12, 2.05, 0.65));
            [[0.14, 0.4], [-0.14, 0.4], [0.14, -0.4], [-0.14, -0.4]].forEach(([zx, zz], i) => {
                const zampa = scatola(0.09, 0.75, 0.09, peloMio, zx, 0.4, zz);
                zampa.userData.fase = i % 2 ? 0 : Math.PI;
                zampeMia.push(zampa);
                r.add(zampa);
            });
            if (guida && renna === 'rudolph') {
                const naso = new T.Mesh(new T.SphereGeometry(0.11, 8, 6), new T.MeshBasicMaterial({ color: '#ff3b30' }));
                naso.position.set(0, 1.7, 1.0);
                const luceNaso = alone('#ff3b30', 3.2, 0.95);
                luceNaso.position.copy(naso.position);
                r.add(naso, luceNaso);
            }
            if (guida && renna === 'cometa') {
                const stellina = new T.Mesh(geoStella(0.28), new T.MeshBasicMaterial({ color: '#ffe066' }));
                stellina.position.set(0, 2.45, 0.65);
                const luceStellina = alone('#ffe066', 2.6, 0.9);
                luceStellina.position.copy(stellina.position);
                r.add(stellina, luceStellina);
            }
            r.children.forEach(m => (m.castShadow = true));
            r.position.set(x, 0, z);
            g.add(r);
        };
        tiro(0.4, 2.7, false);
        tiro(-0.4, 2.7, false);
        tiro(0, 4.4, true);
        g.children.forEach(m => (m.castShadow = true));
        return g;
    }
    function posaMia(a, verso = 1) {
        angoloMia = a;
        mia.position.set(Math.cos(a) * STRADA_R, 0, Math.sin(a) * STRADA_R);
        mia.lookAt(Math.cos(a + verso * 0.02) * STRADA_R, 0, Math.sin(a + verso * 0.02) * STRADA_R);
    }
    const angoloCasa = c => Math.atan2(c.gruppo.position.z, c.gruppo.position.x);

    // ---- Neve che cade ----
    const FIOCCHI = telefono ? 1400 : 2800;
    const fiocchi = new Float32Array(FIOCCHI * 3), velocita = [];
    for (let i = 0; i < FIOCCHI; i++) {
        fiocchi.set([(caso() - 0.5) * 140, caso() * 50, (caso() - 0.5) * 140], i * 3);
        velocita.push(1.5 + caso() * 2.5);
    }
    const neveGeo = new T.BufferGeometry();
    neveGeo.setAttribute('position', new T.BufferAttribute(fiocchi, 3));
    scena.add(new T.Points(neveGeo, new T.PointsMaterial({ color: '#ffffff', size: 0.35, map: ALONE, transparent: true, depthWrite: false, opacity: 0.9 })));

    // ---- Il momento della giornata segue quello del villaggio ----
    let buio = true, momentoAttuale = '';
    function applicaMomento() {
        const m = momento();
        if (m === momentoAttuale) return;
        momentoAttuale = m;
        const l = LUCI_3D[m] ?? LUCI_3D.notte;
        buio = l.buio;
        cieloMat.uniforms.alto.value.set(l.alto);
        cieloMat.uniforms.basso.value.set(l.basso);
        scena.fog.color.set(l.nebbia);
        emisfero.intensity = l.emisfero;
        emisfero.color.set(l.cieloLuce);
        sole.color.set(l.sole);
        sole.intensity = l.forza;
        sole.position.set(m === 'notte' ? -60 : m === 'alba' ? -90 : m === 'tramonto' ? 90 : 50, m === 'giorno' ? 80 : 40, m === 'notte' ? -40 : 30);
        terra.material.color.set(l.terra);
        cieloStellato.visible = luna.visible = aloneLuna.visible = m === 'notte';
        luceStella.intensity = buio ? 1.2 : 0.3;
        lampioni.forEach(o => (o.visible = buio));
    }

    // ---- Telecamera ----
    const PANORAMA = { alzo: 0.5, distanza: 76 };
    const vista = { angolo: 0, alzo: PANORAMA.alzo, distanza: 95, centro: new T.Vector3(0, 3, 0) };
    const meta = { angolo: 0, alzo: PANORAMA.alzo, distanza: PANORAMA.distanza, centro: new T.Vector3(0, 3, 0) };
    let ultimoTocco = -1e9, vicinoA = null;
    const puntatori = new Map();
    let pizzico = null, spostato = 0;
    const vicino = (verso, da) => {
        while (verso - da > Math.PI) verso -= Math.PI * 2;
        while (verso - da < -Math.PI) verso += Math.PI * 2;
        return verso;
    };
    // Dal panorama si guarda il paese dalla parte di una casa o di un edificio
    function panorama(verso = null) {
        vicinoA = null;
        meta.centro.set(0, 3, 0);
        meta.alzo = PANORAMA.alzo;
        meta.distanza = PANORAMA.distanza;
        // Usciti da un edificio lo si vede dall'altra parte del paese; da una casa, da dietro la casa
        if (verso && verso.position.lengthSq() > 1) meta.angolo = vicino(Math.atan2(verso.position.z, verso.position.x) + (verso.userData.speciale ? Math.PI : 0), vista.angolo);
        ultimoTocco = performance.now();
    }
    // La telecamera si mette davanti alla porta (o, per il coro, davanti ai cantori)
    function avvicina(gruppo, { distanza = 15, alto = 2.6, alzo = 0.3, fuori = false } = {}) {
        vicinoA = gruppo;
        const p = gruppo.position;
        meta.centro.set(p.x, alto, p.z);
        meta.angolo = vicino(Math.atan2(p.z, p.x) + (fuori ? 0 : Math.PI), vista.angolo);
        meta.alzo = alzo;
        meta.distanza = distanza;
        ultimoTocco = performance.now() + 1e9;
    }
    const avvicinaCasa = c => avvicina(c.gruppo, { distanza: c.giorno === 24 ? 20 : 15, alto: c.giorno === 24 ? 3.4 : 2.6 });
    const avvicinaSpeciale = s => avvicina(s.gruppo, { distanza: s.distanza, alto: s.alto, alzo: s.alzo, fuori: s === sCoro });

    canvas.addEventListener('pointerdown', e => {
        try {
            canvas.setPointerCapture(e.pointerId);
        } catch { /* il dito si segue lo stesso */ }
        puntatori.set(e.pointerId, { x: e.clientX, y: e.clientY });
        spostato = 0;
        canvas.classList.add('trascina');
        if (puntatori.size === 2) {
            const [a, b] = [...puntatori.values()];
            pizzico = { d: Math.hypot(a.x - b.x, a.y - b.y), distanza: meta.distanza };
        }
    });
    canvas.addEventListener('pointermove', e => {
        const p = puntatori.get(e.pointerId);
        if (!p) return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        p.x = e.clientX;
        p.y = e.clientY;
        spostato += Math.abs(dx) + Math.abs(dy);
        ultimoTocco = performance.now();
        if (puntatori.size === 2 && pizzico) {
            const [a, b] = [...puntatori.values()];
            meta.distanza = T.MathUtils.clamp(pizzico.distanza * pizzico.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), 10, 130);
        } else if (spostato > 8) {
            if (vicinoA) vicinoA = null;
            meta.angolo -= dx * 0.006;
            meta.alzo = T.MathUtils.clamp(meta.alzo + dy * 0.004, 0.08, 1.25);
        }
    });
    function fine(e) {
        const breve = spostato < 8 && puntatori.size === 1;
        puntatori.delete(e.pointerId);
        if (puntatori.size < 2) pizzico = null;
        if (!puntatori.size) canvas.classList.remove('trascina');
        if (breve && e.type === 'pointerup') tocca(e.clientX, e.clientY);
    }
    canvas.addEventListener('pointerup', fine);
    canvas.addEventListener('pointercancel', fine);
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        ultimoTocco = performance.now();
        meta.distanza = T.MathUtils.clamp(meta.distanza * (1 + Math.sign(e.deltaY) * 0.1), 10, 130);
    }, { passive: false });

    const raggio = new T.Raycaster();
    function tocca(cx, cy) {
        const r = canvas.getBoundingClientRect();
        raggio.setFromCamera({ x: ((cx - r.left) / r.width) * 2 - 1, y: -((cy - r.top) / r.height) * 2 + 1 }, camera);
        const colpi = raggio.intersectObjects([...case3D.map(c => c.gruppo), ...speciali.map(k => k.gruppo), ...(mia ? [mia] : [])], true);
        // Contano solo le cose solide e visibili: non gli aloni di luce né le lucine spente
        const visibile = n => {
            for (; n; n = n.parent) if (!n.visible) return false;
            return true;
        };
        const colpo = colpi.find(h => !h.object.isSprite && visibile(h.object));
        if (!colpo) return;
        let o = colpo.object;
        while (o && !o.userData.giorno && !o.userData.speciale && !o.userData.slittaMia) o = o.parent;
        if (o?.userData.slittaMia) return onSlitta();
        const sp = speciali.find(k => k.gruppo === o);
        if (sp) return toccaSpeciale(sp);
        const c = case3D.find(k => k.gruppo === o);
        if (c) toccaCasa(c);
    }

    function toccaCasa(c) {
        if (mia && c.stato !== 'chiusa') return onCasa(c.giorno);
        if (c.stato === 'chiusa') {
            // Una casa ancora chiusa trema un po', e il villaggio dice quando si aprirà
            c.scossa = 1;
            onCasa(c.giorno);
            return;
        }
        avvicinaCasa(c);
        c.aperturaPorta = 0.001;
        // La porta si apre, poi si entra dalla stessa porta del villaggio disegnato
        setTimeout(() => onCasa(c.giorno), 1100);
    }

    // Gli edifici aprono la loro stanza; giostra, coro e albero suonano e si animano
    function toccaSpeciale(sp) {
        if (!sp.elemento) return;
        if (!sp.entra) {
            sp.fino = sp.fino > tempo ? 0 : tempo + 45;
            return onSpeciale(sp.elemento);
        }
        avvicinaSpeciale(sp);
        setTimeout(() => onSpeciale(sp.elemento), 900);
    }

    // Solo per le prove: tocca un edificio senza doverlo inquadrare
    canvas.toccaPerProva = selettore => {
        aggiornaCase();
        if (typeof selettore === 'number') return toccaCasa(case3D.find(k => k.giorno === selettore));
        const sp = speciali.find(k => k.elemento?.matches(selettore));
        if (sp) toccaSpeciale(sp);
    };

    function aggiornaCase() {
        case3D.forEach(c => {
            const stato = statoCasa(c.giorno);
            if (stato === c.stato) return;
            c.stato = stato;
            c.lucine.visible = stato === 'aperta';
            c.bagliore.visible = stato !== 'chiusa';
            c.stellaOggi.visible = stato === 'oggi';
        });
    }

    // ---- Dimensioni e animazione ----
    function adatta() {
        const w = contenitore.clientWidth, h = contenitore.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w < h ? 62 : 45;
        camera.updateProjectionMatrix();
    }
    const osservatore = new ResizeObserver(adatta);
    osservatore.observe(contenitore);

    const orologio = new T.Clock();
    let tempo = 0, attivo = false, ultimoStato = 0;
    function ciclo() {
        if (!attivo || !contenitore.isConnected) return;
        requestAnimationFrame(ciclo);
        const dt = Math.min(orologio.getDelta(), 0.05);
        // Dentro una casa o con la pagina nascosta non serve disegnare
        if (document.hidden || contenitore.classList.contains('dentro')) return;
        tempo += dt;
        if (tempo - ultimoStato > 0.4) {
            ultimoStato = tempo;
            aggiornaCase();
            applicaMomento();
        }
        if (!calmo && performance.now() - ultimoTocco > 5000 && !vicinoA) meta.angolo += dt * 0.04;
        const k = 1 - Math.pow(0.04, dt);
        vista.angolo += (meta.angolo - vista.angolo) * k;
        vista.alzo += (meta.alzo - vista.alzo) * k;
        vista.distanza += (meta.distanza - vista.distanza) * k;
        vista.centro.lerp(meta.centro, k);
        camera.position.set(
            vista.centro.x + Math.cos(vista.angolo) * Math.cos(vista.alzo) * vista.distanza,
            vista.centro.y + Math.sin(vista.alzo) * vista.distanza,
            vista.centro.z + Math.sin(vista.angolo) * Math.cos(vista.alzo) * vista.distanza
        );
        camera.lookAt(vista.centro);

        palline.forEach((m, i) => m.color.copy(baseColori[i]).multiplyScalar(0.55 + 0.45 * Math.sin(tempo * 2.2 + i * 1.3)));
        aloneStella.material.opacity = (buio ? 0.7 : 0.3) + Math.sin(tempo * 3) * 0.1;

        const a = tempo * 0.12, sy = 30 + Math.sin(tempo * 0.9) * 2;
        slitta.position.set(Math.cos(a) * 32, sy, Math.sin(a) * 32);
        slitta.lookAt(Math.cos(a + 0.05) * 32, sy, Math.sin(a + 0.05) * 32);
        zampe.forEach(z => (z.rotation.x = Math.sin(tempo * 9 + z.userData.fase) * 0.6));
        storia.unshift(slitta.position.clone().add(new T.Vector3((caso() - 0.5) * 0.6, (caso() - 0.5) * 0.6, (caso() - 0.5) * 0.6)));
        if (storia.length > SCIA) storia.pop();
        for (let i = 0; i < SCIA; i++) {
            const p = storia[Math.min(i, storia.length - 1)];
            sciaPos.set([p.x, p.y - 0.3, p.z], i * 3);
            const f = 1 - i / SCIA;
            sciaCol.set([f, f * 0.85, f * 0.45], i * 3);
        }
        sciaGeo.attributes.position.needsUpdate = sciaGeo.attributes.color.needsUpdate = true;

        const vel = calmo ? 0.3 : 1;
        for (let i = 0; i < FIOCCHI; i++) {
            let y = fiocchi[i * 3 + 1] - velocita[i] * dt * vel;
            if (y < 0) y += 50;
            fiocchi[i * 3 + 1] = y;
            fiocchi[i * 3] += Math.sin(tempo + i) * dt * 0.3;
        }
        neveGeo.attributes.position.needsUpdate = true;

        case3D.forEach((c, i) => {
            if (c.stato === 'aperta') c.lucine.children.forEach((l, j) => (l.visible = Math.sin(tempo * 3 + j + i) > -0.6));
            const luce = c.stato === 'aperta' ? (buio ? 1.3 : 0.6) : c.stato === 'chiusa' ? 0.04 : buio ? 0.7 : 0.3;
            c.vetro.emissiveIntensity += (luce - c.vetro.emissiveIntensity) * k;
            c.bagliore.material.opacity = (buio ? 0.5 : 0.15) * (c.stato === 'aperta' ? 1 : 0.6);
            if (c.stellaOggi.visible) {
                c.stellaOggi.position.y = c.stellaOggi.userData.y + Math.sin(tempo * 2.4) * 0.35;
                c.stellaOggi.rotation.y = tempo * 1.5;
            }
            if (c.scossa > 0) {
                c.scossa = Math.max(0, c.scossa - dt * 1.6);
                c.gruppo.rotation.z = Math.sin(tempo * 40) * 0.03 * c.scossa;
            }
            // La porta si apre piano, e si richiude quando si torna fuori
            if (c.aperturaPorta > 0) {
                c.aperturaPorta = Math.min(1, c.aperturaPorta + dt * 1.2);
                c.cardine.rotation.y = -1.9 * Math.sin(Math.min(1, c.aperturaPorta) * Math.PI / 2);
            } else if (c.cardine.rotation.y < 0) {
                c.cardine.rotation.y = Math.min(0, c.cardine.rotation.y + dt * 2);
            }
        });
        // Edifici: finestre accese di sera, ingranaggio, giostra, coro, trenino
        vetriSpeciali.forEach(v => (v.emissiveIntensity = buio ? 1.2 : 0.35));
        ingranaggio.rotation.z = tempo * 0.8;
        const suona = sGiostra.fino > tempo;
        giro.rotation.y += dt * (suona ? 0.9 : 0.25);
        cavalli.forEach((cv, i) => (cv.position.y = 1.6 + Math.sin(tempo * (suona ? 3 : 1.5) + i) * 0.35));
        const canta = sCoro.fino > tempo;
        coro3D.children.forEach((p, i) => {
            p.position.y = canta ? Math.abs(Math.sin(tempo * 4 + i * 0.7)) * 0.18 : 0;
            p.rotation.z = canta ? Math.sin(tempo * 2 + i) * 0.06 : 0;
        });
        stella.rotation.y = tempo * (sAlbero.fino > tempo ? 2.4 : 0.6);
        const giroTreno = tempo * 0.035;
        vagoni.forEach((v, i) => {
            const a = giroTreno - i * 0.055;
            v.position.set(Math.cos(a) * BINARI, 0, Math.sin(a) * BINARI);
            v.lookAt(Math.cos(a + 0.01) * BINARI, 0, Math.sin(a + 0.01) * BINARI);
        });
        // Ballerine: ferme in cerchio che ondeggiano, oppure in girotondo con piroette
        const danza = sAlbero.fino > tempo;
        ballerine.forEach((b, i) => {
            const a = b.userData.base + (danza ? tempo * 0.5 : 0);
            b.position.set(Math.cos(a) * 6.6, danza ? Math.abs(Math.sin(tempo * 3 + i)) * 0.25 : 0, Math.sin(a) * 6.6);
            b.rotation.y = danza ? tempo * 5 + i : -a + Math.PI / 2 + Math.sin(tempo + i) * 0.15;
            b.userData.braccia.rotation.z = danza ? Math.sin(tempo * 3 + i) * 0.3 : 0;
        });
        // Pattinatori che scivolano sul ghiaccio, piegati nelle curve
        pattinatori.forEach(k => {
            const t = tempo * k.vel + k.fase;
            const x = Math.cos(t) * k.rx, z = Math.sin(t) * k.rz;
            k.p.position.set(x, 0.06, z);
            k.p.rotation.set(0, Math.atan2(-Math.sin(t) * k.rx * Math.sign(k.vel), Math.cos(t) * k.rz * Math.sign(k.vel)), Math.sign(k.vel) * -0.15);
        });
        // La slitta personale: le renne scalpitano, e Cometa lascia una scia di stelle
        if (mia) {
            zampeMia.forEach(z => (z.rotation.x = inCorsa ? Math.sin(tempo * 12 + z.userData.fase) * 0.7 : Math.sin(tempo * 1.5 + z.userData.fase) * 0.05));
            if (rennaScelta === 'cometa') {
                const punta = mia.localToWorld(new T.Vector3(0, 2.4, 4.6));
                storiaMia.unshift(punta.add(new T.Vector3((caso() - 0.5) * 0.3, (caso() - 0.5) * 0.3, (caso() - 0.5) * 0.3)));
                if (storiaMia.length > 40) storiaMia.pop();
                storiaMia.forEach((v, i) => sciaMiaPos.set([v.x, v.y - i * 0.01, v.z], i * 3));
                sciaMiaGeo.attributes.position.needsUpdate = true;
            }
        }
        renderer.render(scena, camera);
    }

    return {
        canvas,
        avvia(versoGiorno) {
            if (attivo) return;
            attivo = true;
            adatta();
            aggiornaCase();
            applicaMomento();
            const c = case3D.find(k => k.giorno === versoGiorno);
            panorama(c?.gruppo);
            if (c) vista.angolo = meta.angolo;
            orologio.getDelta();
            requestAnimationFrame(ciclo);
        },
        ferma() {
            attivo = false;
        },
        // Usciti da una casa si chiude la porta e si torna a guardare il paese
        fuori() {
            case3D.forEach(c => (c.aperturaPorta = 0));
            if (vicinoA) panorama(vicinoA);
        },
        // Il villaggio porta lo sguardo su un edificio o una casa (il tour, il finale del 24…)
        guarda(elemento) {
            if (!attivo || !elemento) return;
            const sp = speciali.find(k => k.elemento === elemento);
            if (sp) return avvicinaSpeciale(sp);
            const c = case3D.find(k => k.giorno === Number(elemento.dataset?.giorno));
            if (c) avvicinaCasa(c);
        },
        // La signora Natale alla porta della casa 24, che si apre per lei
        signora(si) {
            signora.visible = si;
            casa24.aperturaPorta = si ? 0.001 : 0;
        },
        panorama: () => panorama(),
        // La renna scelta nella stalla: la slitta compare sulla strada, vicino alla casa di oggi
        slitta(renna, giornoVicino = 1) {
            if (!renna || renna === rennaScelta) return;
            if (mia) {
                scena.remove(mia);
                zampeMia.length = 0;
            }
            rennaScelta = renna;
            mia = costruisciMia(renna);
            scena.add(mia);
            const c = case3D.find(k => k.giorno === giornoVicino) ?? case3D[0];
            posaMia(angoloCasa(c) - 0.12);
            storiaMia.length = 0;
            sciaMia.visible = renna === 'cometa';
        },
        // Si sale e si corre sulla strada ad anello fino alla casa; poi si apre la porta
        corsaVerso(giorno) {
            const c = case3D.find(k => k.giorno === giorno);
            if (!mia || !c || !attivo) return Promise.resolve();
            mia.userData.passeggero.visible = true;
            const da = angoloMia, a = vicino(angoloCasa(c) - 0.12, da);
            const verso = a >= da ? 1 : -1;
            const durata = Math.min(4200, Math.max(1400, Math.abs(a - da) * 1700));
            inCorsa = true;
            return new Promise(fatto => {
                const inizio = performance.now();
                const passo = adesso => {
                    const t = Math.min(1, (adesso - inizio) / durata);
                    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                    posaMia(da + (a - da) * e, verso);
                    // La telecamera segue la slitta da dietro e un po' dall'alto
                    vicinoA = mia;
                    meta.centro.set(mia.position.x, 2, mia.position.z);
                    meta.angolo = vicino(angoloMia - verso * 0.9, vista.angolo);
                    meta.alzo = 0.42;
                    meta.distanza = 17;
                    ultimoTocco = performance.now() + 1e9;
                    if (t < 1 && attivo) return requestAnimationFrame(passo);
                    inCorsa = false;
                    avvicinaCasa(c);
                    c.aperturaPorta = 0.001;
                    setTimeout(fatto, 1100);
                };
                requestAnimationFrame(passo);
            });
        }
    };
}

const MOMENTI = ['alba', 'giorno', 'tramonto', 'notte'];

// Luce calda dall'alto, angoli in penombra e un pulviscolo dorato che fluttua nell'aria
function atmosfera(nodo, { polvere = true } = {}) {
    const svg = nodo.querySelector(':scope > svg');
    if (!svg) return;
    const g = el('g', { class: 'atmosfera', 'pointer-events': 'none' }, svg);
    el('ellipse', { class: 'luce-stanza', cx: 800, cy: 160, rx: 760, ry: 420, fill: 'url(#luce-stanza)' }, g);
    el('rect', { x: -1400, y: -600, width: 4400, height: 2100, fill: 'url(#penombra-stanza)' }, g);
    if (!polvere) return;
    let semePolvere = 41;
    const casoPolvere = () => (semePolvere = (semePolvere * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) {
        el('circle', {
            class: 'granello', cx: (120 + casoPolvere() * 1360).toFixed(0), cy: (80 + casoPolvere() * 640).toFixed(0), r: (1.4 + casoPolvere() * 2.4).toFixed(1),
            fill: '#ffe9b8', style: `animation-duration:${(9 + casoPolvere() * 9).toFixed(1)}s;animation-delay:-${(casoPolvere() * 18).toFixed(1)}s`
        }, g);
    }
}

function momentoDiAdesso(adesso = new Date()) {
    const parti = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(adesso);
    const valore = tipo => Number(parti.find(p => p.type === tipo)?.value ?? 0);
    const minuti = valore('hour') * 60 + valore('minute');
    if (minuti < 6 * 60 + 45) return 'notte';
    if (minuti < 8 * 60 + 30) return 'alba';
    if (minuti < 15 * 60 + 45) return 'giorno';
    if (minuti < 17 * 60 + 15) return 'tramonto';
    return 'notte';
}

export function creaVillaggio(contenitore, { aperti, viste, onTocco, onApri, onChiusa, modifica = false, piene = new Set(), benvenuto = '', lettere = [], onLettera = async () => {}, destinatario = '', letteraBabbo = '' }) {
    seme = 7;
    const svg = el('svg', { role: 'img', 'aria-label': 'Villaggio con 24 case, una per ogni giorno di dicembre. Trascina per esplorarlo.' });
    disegnaDefinizioni(svg);

    // Strati a velocità diverse: il cielo quasi fermo, le case alla velocità del mouse
    const strati = [
        { fattore: 0.1, disegna: disegnaCielo },
        { fattore: 0.35, disegna: disegnaMontagne },
        { fattore: 0.65, disegna: disegnaBosco },
        { fattore: 1, disegna: disegnaPaese },
        { fattore: 1.3, disegna: disegnaPrimoPiano }
    ].map(strato => {
        const g = el('g', {}, svg);
        strato.disegna(g);
        return { ...strato, g };
    });
    const mondo = strati[3].g;

    const neve = document.createElement('canvas');
    const vignetta = Object.assign(document.createElement('div'), { className: 'vignetta' });
    const indietro = Object.assign(document.createElement('button'), { type: 'button', className: 'freccia freccia-sinistra', textContent: '‹', ariaLabel: 'Vai a sinistra' });
    const avanti = Object.assign(document.createElement('button'), { type: 'button', className: 'freccia freccia-destra', textContent: '›', ariaLabel: 'Vai a destra' });
    const suggerimento = Object.assign(document.createElement('p'), { className: 'suggerimento', textContent: modifica ? `↔ Trascina il villaggio e ${matchMedia('(pointer: coarse)').matches ? 'tocca' : 'clicca'} una casa per preparare la sorpresa` : '↔ Trascina per esplorare il villaggio' });
    const interno = creaInterno({
        onScarta: giorno => {
            viste.add(giorno);
            aggiornaStato();
            onApri(giorno);
        },
        onEsci: () => esciDallaCasa()
    });
    const sala = creaSala({ onParti: guida => parti(guida), benvenuto });
    const bancone = creaBancone({ onEsci: () => esciDalBancone() });
    const pista = creaPalaghiaccio({ onEsci: () => esciDallaPista() });
    const posta = creaPosta({ onEsci: () => esciDalQuartiere(posta), onSpedisci: (testo, firma) => onLettera(testo, firma), modifica, lettere, destinatario, letteraBabbo });
    const laboratorio = creaLaboratorio({ onEsci: () => esciDalQuartiere(laboratorio) });
    const stalla = creaStalla({ onEsci: () => esciDalQuartiere(stalla), onTocco: () => onTocco(), onScegliRenna: nome => scegliRenna(nome) });
    const cucina = creaCucinaNatale({
        onTocco: () => onTocco(),
        // Babbo Natale consegna l'ultimo dono: è la sorpresa del 24
        onDono: () => {
            viste.add(24);
            aggiornaStato();
            onApri(24);
        },
        onFine: () => {
            torna();
            cucina.nascondi();
            adattaVista();
            if (slittaMia) {
                slittaMia.classList.add('vola-via');
                setTimeout(() => slittaMia?.classList.remove('vola-via'), 5000);
            }
            festaDiNatale();
        }
    });
    const negozio = creaNegozio({ onEsci: () => esciDalQuartiere(negozio), onTocco: () => onTocco() });
    [interno, sala, posta, laboratorio, stalla, negozio, cucina].forEach(stanza => atmosfera(stanza.nodo));
    atmosfera(pista.nodo, { polvere: false });
    // Una velatura leggera colora tutto il paese con la luce del momento
    el('rect', { class: 'tinta', x: -5000, y: -1000, width: 20000, height: 4000, 'pointer-events': 'none' }, svg);
    contenitore.replaceChildren(svg, neve, vignetta, indietro, avanti, suggerimento, interno.nodo, sala.nodo, bancone.nodo, pista.nodo, posta.nodo, laboratorio.nodo, stalla.nodo, negozio.nodo, cucina.nodo);

    let momentoScelto = null;
    function aggiornaMomento() {
        const momento = momentoScelto ?? momentoDiAdesso();
        MOMENTI.forEach(m => contenitore.classList.toggle(`momento-${m}`, m === momento));
    }
    aggiornaMomento();
    const orologio = setInterval(() => {
        if (!contenitore.isConnected) return clearInterval(orologio);
        aggiornaMomento();
    }, 5 * 60 * 1000);
    avviaNeve(neve);
    const movimentoRidotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- Spostamento ----
    let larghezzaVista = VISTA_H * 16 / 9;
    // Sul telefono in verticale si guarda un po' meno cielo, così si vedono più case
    let vistaY = VISTA_Y, vistaH = VISTA_H;
    let posizione = 0;
    let animazione = null;

    function limita(valore) {
        return Math.min(Math.max(valore, 0), Math.max(0, MONDO - larghezzaVista));
    }

    // Le parti del paese con le loro posizioni: quelle lontane dalla vista mettono in pausa le animazioni
    let pezzi = null, ultimaVerifica = null;
    function segnaFuori() {
        if (ultimaVerifica !== null && Math.abs(posizione - ultimaVerifica) < 80) return;
        ultimaVerifica = posizione;
        // Il trenino si sposta da solo: resta sempre animato
        pezzi ??= [...mondo.children].filter(n => n.tagName === 'g' && !n.classList.contains('trenino')).map(nodo => {
            const { x, width } = nodo.getBBox();
            const t = nodo.transform.baseVal.consolidate();
            const sx = t ? t.matrix.a : 1, tx = t ? t.matrix.e : 0;
            return { nodo, x1: tx + x * sx, x2: tx + (x + width) * sx };
        });
        const da = posizione - 250, a = posizione + larghezzaVista + 250;
        for (const { nodo, x1, x2 } of pezzi) nodo.classList.toggle('fuori', x2 < da || x1 > a);
    }

    function applica() {
        strati.forEach(({ g, fattore }) => g.setAttribute('transform', `translate(${(-posizione * fattore).toFixed(1)} 0)`));
        segnaFuori();
        indietro.disabled = posizione <= 0;
        avanti.disabled = posizione >= MONDO - larghezzaVista - 1;
    }

    function spostaA(valore, morbido = true) {
        cancelAnimationFrame(animazione);
        const arrivo = limita(valore);
        if (!morbido) {
            posizione = arrivo;
            return applica();
        }
        const partenza = posizione;
        const inizio = performance.now();
        const passo = adesso => {
            const t = Math.min(1, (adesso - inizio) / 600);
            posizione = partenza + (arrivo - partenza) * (1 - Math.pow(1 - t, 3));
            applica();
            if (t < 1) animazione = requestAnimationFrame(passo);
        };
        animazione = requestAnimationFrame(passo);
    }

    function centraSu(x, morbido = true) {
        spostaA(x - larghezzaVista / 2, morbido);
    }

    function adattaVista() {
        const { width, height } = svg.getBoundingClientRect();
        if (!width || !height) return;
        const stretta = width / height < 1.3;
        vistaY = stretta ? 400 : VISTA_Y;
        vistaH = stretta ? 500 : VISTA_H;
        larghezzaVista = Math.min(MONDO, (vistaH * width) / height);
        svg.setAttribute('viewBox', `0 ${vistaY} ${larghezzaVista} ${vistaH}`);
        posizione = limita(posizione);
        applica();
    }
    new ResizeObserver(adattaVista).observe(contenitore);
    adattaVista();

    // Trascinamento: il clic su una casa vale solo se il mouse non si è mosso
    let presa = null;
    let trascinato = false;
    svg.addEventListener('pointerdown', evento => {
        if (evento.button !== 0) return;
        cancelAnimationFrame(animazione);
        seguiTreno = false;
        presa = { x: evento.clientX, posizione, id: evento.pointerId };
        trascinato = false;
    });
    svg.addEventListener('pointermove', evento => {
        if (!presa) return;
        const spostamento = evento.clientX - presa.x;
        if (!trascinato && Math.abs(spostamento) > 6) {
            trascinato = true;
            svg.setPointerCapture(presa.id);
            contenitore.classList.add('trascina');
            suggerimento.classList.add('nascosto');
        }
        if (trascinato) {
            posizione = limita(presa.posizione - spostamento * (larghezzaVista / svg.getBoundingClientRect().width));
            applica();
        }
    });
    const lascia = () => {
        presa = null;
        contenitore.classList.remove('trascina');
    };
    svg.addEventListener('pointerup', lascia);
    svg.addEventListener('pointercancel', lascia);

    svg.addEventListener('wheel', evento => {
        const delta = Math.abs(evento.deltaX) > Math.abs(evento.deltaY) ? evento.deltaX : evento.deltaY;
        const nuova = limita(posizione + delta * 1.5);
        if (nuova === posizione) return; // Ai bordi lascia scorrere la pagina
        evento.preventDefault();
        cancelAnimationFrame(animazione);
        seguiTreno = false;
        posizione = nuova;
        applica();
        suggerimento.classList.add('nascosto');
    }, { passive: false });

    indietro.addEventListener('click', () => { seguiTreno = false; spostaA(posizione - larghezzaVista * 0.7); });
    avanti.addEventListener('click', () => { seguiTreno = false; spostaA(posizione + larghezzaVista * 0.7); });

    // Con il tasto Tab la vista segue la casa selezionata
    svg.addEventListener('focusin', evento => {
        const casa = evento.target.closest('.casa');
        if (!casa) return;
        seguiTreno = false;
        const x = Number(casa.dataset.x);
        if (x < posizione + 120 || x > posizione + larghezzaVista - 120) centraSu(x);
    });

    // ---- Case ----
    function aggiornaStato() {
        // Il cartello in piazza conta i giorni che mancano a Natale
        const giornoCartello = modifica ? (new Date().getMonth() === 11 ? new Date().getDate() : 0) : aperti;
        const quantaNeve = Math.max(0.15, Math.min(1, giornoCartello / 24));
        contenitore.style.setProperty('--neve', quantaNeve.toFixed(2));
        neve.dataset.quanta = quantaNeve.toFixed(2);
        const cartello = mondo.querySelector('.cartello-natale');
        if (cartello) {
            const [sopra, sotto] = testoAttesa(giornoCartello);
            cartello.querySelectorAll('text')[0].textContent = sopra;
            cartello.querySelectorAll('text')[1].textContent = sotto;
        }
        mondo.querySelectorAll('.casa').forEach(casa => {
            const giorno = Number(casa.dataset.giorno);
            if (modifica) {
                casa.classList.toggle('aperta', piene.has(giorno));
                return;
            }
            casa.classList.toggle('chiusa', giorno > aperti);
            casa.classList.toggle('aperta', viste.has(giorno) && giorno <= aperti);
            casa.classList.toggle('oggi', giorno === aperti && !viste.has(giorno));
        });
    }

    // La vista si avvicina alla porta, come se si entrasse in casa
    function avvicinaA(casa, durata) {
        const [, x, y, s] = casa.getAttribute('transform').match(/translate\(([\d.-]+) ([\d.-]+)\) scale\(([\d.-]+)\)/).map(Number);
        return avvicinaAlPunto(x, y - 22 * s, 150 * s, durata);
    }

    function avvicinaAlPunto(x, y, larghezza, durata) {
        const partenza = [0, vistaY, larghezzaVista, vistaH];
        const altezza = larghezza * vistaH / larghezzaVista;
        const arrivo = [x - posizione - larghezza / 2, y - altezza / 2, larghezza, altezza];
        return new Promise(fatto => {
            if (movimentoRidotto) return fatto();
            // Se il browser mette in pausa l'animazione (scheda in secondo piano), si entra lo stesso
            setTimeout(fatto, durata + 400);
            const inizio = performance.now();
            const passo = adesso => {
                const t = Math.min(1, (adesso - inizio) / durata);
                const e = t * t * (3 - 2 * t);
                svg.setAttribute('viewBox', partenza.map((da, i) => da + (arrivo[i] - da) * e).join(' '));
                if (t < 1) requestAnimationFrame(passo);
                else fatto();
            };
            requestAnimationFrame(passo);
        });
    }

    let inApertura = false;
    let giornoInCasa = null;
    let timerDentro = null;

    // Quando la stanza ha finito di comparire, il villaggio dietro smette di muoversi e di disegnarsi
    function entraDentro(stanza, ...argomenti) {
        stanza.mostra(...argomenti);
        clearTimeout(timerDentro);
        timerDentro = setTimeout(() => contenitore.classList.add('dentro'), 700);
    }

    function torna() {
        clearTimeout(timerDentro);
        contenitore.classList.remove('dentro');
        paese3D?.fuori();
    }

    async function apriCasa(casa) {
        const giorno = Number(casa.dataset.giorno);
        // Chi prepara il calendario: casa vuota, si passa subito alla sorpresa da preparare
        if (modifica && !piene.has(giorno)) {
            seguiTreno = false;
            onTocco();
            casa.classList.add('si-apre');
            setTimeout(() => onApri(giorno), 600);
            return;
        }
        if (!modifica && giorno > aperti) return onChiusa(giorno);
        if (inApertura) return;

        seguiTreno = false;
        // Con la slitta personale si arriva davanti alla casa correndo sulla strada
        // In 3D la slitta corre sulla strada ad anello; nel disegno, lungo la strada del paese
        if (rennaMia && paese3D && contenitore.classList.contains('vista-3d')) {
            inApertura = true;
            await paese3D.corsaVerso(giorno);
            inApertura = false;
        } else if (slittaMia) {
            inApertura = true;
            await corsaMia(Number(casa.dataset.x) - 80);
            inApertura = false;
        }
        // Il 24, la prima volta, la signora Natale aspetta alla porta
        if (!modifica && giorno === 24 && aperti >= 24 && !viste.has(24)) {
            onTocco();
            return finaleDel24(casa);
        }
        onTocco();
        casa.classList.add('si-apre');
        // Le case già aperte mostrano subito la sorpresa, senza scartarla di nuovo
        if (viste.has(giorno)) {
            setTimeout(() => onApri(giorno), 750);
            return;
        }
        inApertura = true;
        setTimeout(async () => {
            await avvicinaA(casa, 800);
            giornoInCasa = giorno;
            entraDentro(interno, giorno);
            inApertura = false;
        }, 650);
    }

    // Si entra in stazione come in una casa: la vista si avvicina alla porta
    async function entraInStazione(stazione) {
        paese3D?.guarda(stazione);
        if (inApertura) return;
        inApertura = true;
        seguiTreno = false;
        onTocco();
        stazione.classList.remove('invita');
        await avvicinaA(stazione, 800);
        entraDentro(sala);
        inApertura = false;
    }

    // Si entra nella bancarella del mercatino a guardare la nonna che cucina
    async function entraNellaBancarella(banco) {
        paese3D?.guarda(banco);
        if (inApertura) return;
        inApertura = true;
        seguiTreno = false;
        onTocco();
        const { cx, cy, larghezza, tipo } = banco.dataset;
        await avvicinaAlPunto(Number(cx), Number(cy), Number(larghezza), 800);
        entraDentro(bancone, tipo);
        inApertura = false;
    }

    // Si entra nel palazzetto del ghiaccio: parte la musica e i pattinatori girano
    async function entraNelPalaghiaccio(palazzetto) {
        paese3D?.guarda(palazzetto);
        if (inApertura) return;
        inApertura = true;
        seguiTreno = false;
        onTocco();
        fermaCoro?.();
        fermaBalletto?.();
        fermaGiostra?.();
        contenitore.dispatchEvent(new CustomEvent('coro', { detail: { canta: true } }));
        const [, x, y, s] = palazzetto.getAttribute('transform').match(/translate\(([\d.-]+) ([\d.-]+)\) scale\(([\d.-]+)\)/).map(Number);
        await avvicinaAlPunto(x, y - 60 * s, 160 * s, 800);
        entraDentro(pista);
        inApertura = false;
    }

    // Si entra in un edificio del quartiere di Babbo Natale: la vista si avvicina alla porta
    async function entraNelQuartiere(edificio) {
        paese3D?.guarda(edificio);
        if (inApertura) return;
        inApertura = true;
        seguiTreno = false;
        onTocco();
        const [, x, y, s] = edificio.getAttribute('transform').match(/translate\(([\d.-]+) ([\d.-]+)\) scale\(([\d.-]+)\)/).map(Number);
        await avvicinaAlPunto(x, y - 60 * s, 170 * s, 800);
        if (edificio.classList.contains('posta')) entraDentro(posta);
        else if (edificio.classList.contains('laboratorio')) entraDentro(laboratorio);
        // La notte del 24 le renne sono partite con la slitta
        else entraDentro(stalla, !modifica && aperti >= 24);
        inApertura = false;
    }

    // Si entra nella bancarella degli addobbi
    async function entraNelNegozio(banco) {
        paese3D?.guarda(banco);
        if (inApertura) return;
        inApertura = true;
        seguiTreno = false;
        onTocco();
        const { cx, cy, larghezza } = banco.dataset;
        await avvicinaAlPunto(Number(cx), Number(cy), Number(larghezza), 800);
        entraDentro(negozio);
        inApertura = false;
    }

    function esciDalQuartiere(stanza) {
        torna();
        stanza.nascondi();
        adattaVista();
        if (slittaTour) {
            posizionaSlitta(xSlitta);
            fumettoGuida.classList.remove('nascosto');
        } else if (stanza === stalla && slittaMia) {
            // Usciti dalla stalla, la vista va sulla slitta con la renna appena scelta, che invita a salire
            posizionaMia(xMia, true, yMia);
            invitaASalire();
        }
    }

    function esciDallaPista() {
        torna();
        pista.nascondi();
        adattaVista();
        contenitore.dispatchEvent(new CustomEvent('coro', { detail: { canta: false } }));
    }

    function esciDalBancone() {
        torna();
        bancone.nascondi();
        if (slittaTour) setTimeout(() => {
            posizionaSlitta(xSlitta);
            fumettoGuida.classList.remove('nascosto');
        }, 50);
        adattaVista();
    }



    // ---- La slitta personale: Cometa o Rudolph portano il passeggero di casa in casa ----
    const NOMI_RENNA = { cometa: 'Cometa', rudolph: 'Rudolph' };
    let rennaMia = null;
    try { rennaMia = NOMI_RENNA[localStorage.getItem('villaggio_renna')] ? localStorage.getItem('villaggio_renna') : null; } catch { rennaMia = null; }
    let slittaMia = null, xMia = 0, yMia = 0, animMia = null;

    function disegnaSlittaMia(renna) {
        const g = el('g', { class: `slitta-mia slitta-${renna}`, tabindex: 0, role: 'button', 'aria-label': `La tua slitta con ${NOMI_RENNA[renna]}: tocca per salire e partire` }, mondo);
        const corpo = el('g', { class: 'slitta-tour-corpo' }, g);
        el('ellipse', { cx: 30, cy: 6, rx: 120, ry: 11, fill: 'rgba(40,60,110,0.3)' }, corpo);
        // Cometa lascia una scia di stelline, Rudolph illumina la strada col naso
        if (renna === 'cometa') {
            const scia = el('g', { class: 'scia-cometa' }, corpo);
            for (let i = 0; i < 14; i++) el('path', { d: stellaPiccola(-90 - i * 18, -20 + Math.sin(i) * 12, 5 - i * 0.2), fill: i % 2 ? '#fff6c8' : '#ffd36b', style: `animation-delay:${(-i * 0.1).toFixed(1)}s` }, scia);
        } else {
            el('path', { class: 'luce-rudolph', d: 'M150 -30 L330 -60 L330 30 Z', fill: 'url(#cono-luce)', opacity: 0.8 }, corpo);
            el('ellipse', { class: 'luce-rudolph', cx: 260, cy: 6, rx: 80, ry: 14, fill: '#ff6b5a', opacity: 0.35 }, corpo);
        }
        el('path', { d: 'M38 -40 Q 90 -46 140 -50', stroke: '#8a5a1f', 'stroke-width': 1.5, fill: 'none' }, corpo);
        rennaVolante(el('g', { transform: 'translate(124 -16) scale(1.7)' }, corpo), 0, 0, false, renna === 'rudolph');
        el('path', { d: 'M-70 -2 Q-80 -50 -60 -54 L-44 -44 L36 -44 Q52 -44 54 -26 L48 6 L-62 6 Z', fill: '#b3202b' }, corpo);
        el('path', { d: 'M-70 -2 Q-80 -50 -60 -54 L-44 -44 L36 -44 Q52 -44 54 -26', stroke: '#e8c766', 'stroke-width': 3, fill: 'none' }, corpo);
        el('path', { d: 'M-44 -40 q 20 -14 40 0 Z', fill: '#2e7d4a' }, corpo);
        el('text', { x: -10, y: -16, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 'bold', fill: '#ffe9a8', 'font-family': 'Georgia, serif' }, corpo).textContent = '★ TU ★';
        // Il passeggero seduto, con berretto e sciarpa: compare quando si sale a bordo
        const passeggero = el('g', { class: 'passeggero' }, corpo);
        el('path', { d: 'M-34 -44 q 0 -26 18 -26 q 18 0 18 26 Z', fill: '#2d4f8a' }, passeggero);
        el('rect', { x: -32, y: -66, width: 32, height: 7, rx: 3, fill: '#c0392b' }, passeggero);
        el('circle', { cx: -16, cy: -80, r: 11, fill: '#f2d2bd' }, passeggero);
        el('path', { d: 'M-27 -82 Q-27 -96 -16 -96 Q-5 -96 -5 -82 Z', fill: '#c0392b' }, passeggero);
        el('rect', { x: -28, y: -84, width: 24, height: 5, rx: 2.5, fill: '#fbfdff' }, passeggero);
        el('circle', { cx: -16, cy: -98, r: 3.5, fill: '#fbfdff' }, passeggero);
        el('circle', { cx: -12, cy: -80, r: 1.4, fill: '#2a1d14' }, passeggero);
        el('path', { d: 'M-14 -75 q 3 2 6 0', stroke: '#7a3a2a', 'stroke-width': 1.2, fill: 'none' }, passeggero);
        el('path', { class: 'braccio-elfo saluta', d: 'M-4 -58 q 10 -6 12 -18', stroke: '#2d4f8a', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, passeggero);
        el('path', { d: 'M-62 6 L-58 14 M30 6 L26 14 M-80 14 H40 Q56 14 54 2', stroke: '#e8c766', 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round' }, corpo);
        return g;
    }

    function posizionaMia(x, segui, y = yStrada(x) + 10) {
        xMia = x;
        yMia = y;
        slittaMia?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(scalaPer(y) * 1.3).toFixed(3)})`);
        if (segui) {
            posizione = limita(x - larghezzaVista * 0.4);
            applica();
        }
    }

    // La slitta corre fino a un punto del paese; la vista la segue. Più è lontano, più dura (ma mai troppo)
    function corsaMia(arrivo) {
        return new Promise(fatto => {
            if (!slittaMia) return fatto();
            cancelAnimationFrame(animMia);
            const da = xMia, yDa = yMia, distanza = Math.abs(arrivo - da);
            if (movimentoRidotto || distanza < 40) {
                posizionaMia(arrivo, true);
                return fatto();
            }
            const durata = Math.min(2600, 500 + distanza * 0.55);
            slittaMia.classList.add('in-corsa');
            slittaMia.classList.toggle('verso-sinistra', arrivo < da);
            const inizio = performance.now();
            const sicurezza = setTimeout(() => { posizionaMia(arrivo, true); slittaMia?.classList.remove('in-corsa'); fatto(); }, durata + 600);
            const passo = adesso => {
                const t = Math.min(1, (adesso - inizio) / durata);
                const x = da + (arrivo - da) * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
                // Se era parcheggiata fuori strada (davanti alla stalla), la raggiunge dolcemente
                const k = Math.min(1, t / 0.35);
                posizionaMia(x, true, yDa + (yStrada(x) + 10 - yDa) * k);
                if (t < 1) animMia = requestAnimationFrame(passo);
                else {
                    clearTimeout(sicurezza);
                    slittaMia?.classList.remove('in-corsa');
                    fatto();
                }
            };
            animMia = requestAnimationFrame(passo);
        });
    }

    // La casa dove porta la slitta: quella di oggi; per chi prepara, la prima ancora vuota
    function casaDaRaggiungere() {
        let giorno = Math.max(1, Math.min(aperti, 24));
        if (modifica) {
            giorno = 1;
            for (let g = 1; g <= 24; g++) if (!piene.has(g)) { giorno = g; break; }
        }
        return mondo.querySelector(`.casa[data-giorno="${giorno}"]`);
    }

    function invitaASalire() {
        if (!slittaMia || slittaTour) return;
        const casa = casaDaRaggiungere();
        const numero = casa?.dataset.giorno;
        modoFumetto = 'slitta';
        facciaGuida.textContent = rennaMia === 'rudolph' ? '🔴' : '✨';
        nomeGuida.textContent = NOMI_RENNA[rennaMia];
        testoGuida.textContent = modifica
            ? `Sali sulla slitta! Ti porto alla casa numero ${numero}, così prepari la sua sorpresa.`
            : aperti >= 1
                ? `Sali sulla slitta! Ti porto alla casa di oggi, la numero ${numero}.`
                : 'Sali sulla slitta! Ti porto alla casa numero 1: si aprirà il 1° dicembre.';
        entraGuida.hidden = true;
        conCometa.hidden = true;
        conRudolph.hidden = true;
        avantiGuida.hidden = false;
        avantiGuida.textContent = '🛷 Sali e parti';
        saltaGuida.hidden = false;
        saltaGuida.textContent = 'Non ora';
        fumettoGuida.hidden = false;
        fumettoGuida.classList.remove('nascosto');
        avantiGuida.focus({ preventScroll: true });
    }

    async function partiConLaSlitta() {
        fumettoGuida.hidden = true;
        saltaGuida.textContent = 'Salta il tour';
        modoFumetto = 'tour';
        const casa = casaDaRaggiungere();
        if (!slittaMia || !casa) return;
        onTocco();
        slittaMia.classList.add('a-bordo');
        if (!contenitore.classList.contains('vista-3d')) await corsaMia(Number(casa.dataset.x) - 80);
        apriCasa(casa);
    }

    function scegliRenna(nome, subito = true) {
        if (!NOMI_RENNA[nome]) return;
        rennaMia = nome;
        try { localStorage.setItem('villaggio_renna', nome); } catch { /* resterà solo per questa visita */ }
        const dove = slittaMia ? xMia : STAZIONE.x + 80;
        slittaMia?.remove();
        slittaMia = null;
        if (subito) {
            // La slitta aspetta proprio davanti alla porta della stalla
            const stallaX = Number(mondo.querySelector('.stalla')?.getAttribute('transform').match(/translate\(([\d.-]+)/)[1] ?? dove);
            slittaMia = disegnaSlittaMia(nome);
            posizionaMia(stallaX - 70, false, 842);
        } else xMia = dove;
        paese3D?.slitta(nome, Number(casaDaRaggiungere()?.dataset.giorno ?? 1));
    }

    // ---- Il 24: la signora Natale alla porta, poi in cucina ----
    let casaFinale = null, signoraAllaPorta = null;
    function finaleDel24(casa) {
        casaFinale = casa;
        const [, x, y, s] = casa.getAttribute('transform').match(/translate\(([\d.-]+) ([\d.-]+)\) scale\(([\d.-]+)\)/).map(Number);
        signoraAllaPorta?.remove();
        signoraAllaPorta = disegnaSignoraNatale(mondo, x + 4 * s, y + 2, s * 1.1);
        modoFumetto = 'finale';
        paese3D?.guarda(casa);
        paese3D?.signora(true);
        facciaGuida.textContent = '🤶';
        nomeGuida.textContent = 'La signora Natale';
        testoGuida.textContent = 'Che bello vederti qui! Hai fatto tutto il viaggio fino alla nostra casa… Entra, ti ho preparato una cioccolata calda!';
        entraGuida.hidden = true;
        conCometa.hidden = true;
        conRudolph.hidden = true;
        saltaGuida.hidden = true;
        avantiGuida.hidden = false;
        avantiGuida.textContent = '☕ Entro!';
        fumettoGuida.hidden = false;
        fumettoGuida.classList.remove('nascosto');
        avantiGuida.focus({ preventScroll: true });
        inApertura = false;
    }

    async function entraInCucina() {
        if (inApertura || !casaFinale) return;
        inApertura = true;
        fumettoGuida.hidden = true;
        modoFumetto = 'tour';
        onTocco();
        await avvicinaA(casaFinale, 900);
        signoraAllaPorta?.remove();
        signoraAllaPorta = null;
        paese3D?.signora(false);
        entraDentro(cucina);
        inApertura = false;
    }

    // ---- Il tour in slitta con la guida ----
    // Dalla stazione la slitta porta il passeggero all'ufficio postale, al laboratorio e alla stalla
    const yStrada = profiloStrada(mondo);
    const GUIDE = {
        elfo: { nome: 'Fiocco', icona: '🧝‍♂️', giacca: '#2e7d5b', cappello: '#c0392b', capelli: '#c9984a', amica: false },
        elfa: { nome: 'Brina', icona: '🧝‍♀️', giacca: '#7d4e9e', cappello: '#6fd3ff', capelli: '#8a5a2b', amica: true }
    };
    const fumettoGuida = Object.assign(document.createElement('div'), { className: 'guida-fumetto', hidden: true });
    const facciaGuida = Object.assign(document.createElement('span'), { className: 'guida-faccia' });
    const nomeGuida = Object.assign(document.createElement('p'), { className: 'guida-nome' });
    const testoGuida = Object.assign(document.createElement('p'), { className: 'guida-testo' });
    const bottoniGuida = Object.assign(document.createElement('div'), { className: 'guida-bottoni' });
    const entraGuida = Object.assign(document.createElement('button'), { type: 'button', className: 'guida-entra', textContent: '🚪 Entra' });
    const avantiGuida = Object.assign(document.createElement('button'), { type: 'button', className: 'guida-avanti', textContent: 'Prossima tappa ▶' });
    const saltaGuida = Object.assign(document.createElement('button'), { type: 'button', className: 'guida-salta', textContent: 'Salta il tour' });
    const conCometa = Object.assign(document.createElement('button'), { type: 'button', className: 'guida-avanti', textContent: '✨ Cometa' });
    const conRudolph = Object.assign(document.createElement('button'), { type: 'button', className: 'guida-avanti', textContent: '🔴 Rudolph' });
    bottoniGuida.append(entraGuida, conCometa, conRudolph, avantiGuida, saltaGuida);
    const testaFumetto = document.createElement('div');
    testaFumetto.append(nomeGuida, testoGuida);
    fumettoGuida.append(facciaGuida, testaFumetto, bottoniGuida);
    contenitore.append(fumettoGuida);

    let slittaTour = null, tappaTour = -1, guidaScelta = null, xSlitta = 0, animSlitta = null;

    function disegnaSlittaTour(guida) {
        const g = el('g', { class: 'slitta-tour', 'pointer-events': 'none' }, mondo);
        const corpo = el('g', { class: 'slitta-tour-corpo' }, g);
        el('ellipse', { cx: 40, cy: 6, rx: 150, ry: 12, fill: 'rgba(40,60,110,0.3)' }, corpo);
        // Le renne davanti, con le redini
        el('path', { d: 'M38 -40 Q 90 -46 150 -52', stroke: '#8a5a1f', 'stroke-width': 1.5, fill: 'none' }, corpo);
        rennaVolante(el('g', { transform: 'translate(110 -14) scale(1.6)' }, corpo), 0, 0, true, false);
        rennaVolante(el('g', { transform: 'translate(160 -20) scale(1.6)' }, corpo), 0, 0, false, true);
        // La guida seduta davanti, il posto del passeggero dietro con la coperta
        const elfo = disegnaElfo(corpo, 2, -26, 0.42, { giacca: guida.giacca, cappello: guida.cappello, capelli: guida.capelli });
        if (guida.amica) {
            el('path', { d: 'M-15 -96 q -10 18 -6 38 M15 -96 q 10 18 6 38', stroke: guida.capelli, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, elfo.g);
            el('circle', { cx: -21, cy: -58, r: 4, fill: '#e84393' }, elfo.g);
            el('circle', { cx: 21, cy: -58, r: 4, fill: '#e84393' }, elfo.g);
        }
        elfo.braccio.classList.add('saluta');
        el('path', { d: 'M-70 -2 Q-80 -50 -60 -54 L-44 -44 L36 -44 Q52 -44 54 -26 L48 6 L-62 6 Z', fill: '#b3202b' }, corpo);
        el('path', { d: 'M-70 -2 Q-80 -50 -60 -54 L-44 -44 L36 -44 Q52 -44 54 -26', stroke: '#e8c766', 'stroke-width': 3, fill: 'none' }, corpo);
        el('path', { d: 'M-44 -40 q 20 -14 40 0 Z', fill: '#2e7d4a' }, corpo);
        el('path', { d: 'M-44 -40 q 20 -14 40 0', stroke: '#f4d03f', 'stroke-width': 2, 'stroke-dasharray': '4 4', fill: 'none' }, corpo);
        el('text', { x: -24, y: -14, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 'bold', fill: '#ffe9a8', 'font-family': 'Georgia, serif' }, corpo).textContent = '★ TU ★';
        el('path', { d: 'M-62 6 L-58 14 M30 6 L26 14 M-80 14 H40 Q56 14 54 2', stroke: '#e8c766', 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round' }, corpo);
        el('circle', { class: 'luce-calda', cx: 0, cy: -30, r: 90, fill: 'url(#alone)', opacity: 0.35 }, corpo);
        return g;
    }

    let versoSlitta = 1;
    function posizionaSlitta(x) {
        const y = yStrada(x) + 10;
        if (Math.abs(x - xSlitta) > 0.5) versoSlitta = x < xSlitta ? -1 : 1;
        const k = scalaPer(y) * 1.3;
        xSlitta = x;
        slittaTour?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(k * versoSlitta).toFixed(3)} ${k.toFixed(3)})`);
        posizione = limita(x - larghezzaVista * 0.38);
        applica();
    }

    function viaggioSlitta(arrivo, durata = 2600) {
        return new Promise(fatto => {
            cancelAnimationFrame(animSlitta);
            const da = xSlitta;
            if (movimentoRidotto) {
                posizionaSlitta(arrivo);
                return fatto();
            }
            slittaTour?.classList.add('in-corsa');
            const inizio = performance.now();
            setTimeout(() => { posizionaSlitta(arrivo); fatto(); }, durata + 600);
            const passo = adesso => {
                const t = Math.min(1, (adesso - inizio) / durata);
                posizionaSlitta(da + (arrivo - da) * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2));
                if (t < 1) animSlitta = requestAnimationFrame(passo);
                else {
                    slittaTour?.classList.remove('in-corsa');
                    fatto();
                }
            };
            animSlitta = requestAnimationFrame(passo);
        });
    }

    const TAPPE_SLITTA = [
        { edificio: '.posta', testo: "Ecco l'ufficio postale di Babbo Natale! Qui puoi scrivere la tua letterina… e c'è anche un sacco della posta con il tuo nome." },
        { edificio: '.laboratorio', testo: "Questo è il laboratorio degli elfi: qui nascono tutti i regali. Dentro c'è anche un tour in minibus!" },
        { edificio: '.bancarella[data-tipo="cioccolata"]', testo: "Facciamo una sosta ai mercatini! Le nonne preparano castagne, cioccolata calda e frittelle: entra a vederle cucinare, oppure tocca una bancarella che preferisci." },
        { edificio: '.stalla', testo: "Ed ecco la stalla delle renne! Ora scegli chi tirerà la tua slitta per andare di casa in casa: Cometa, la più veloce, o Rudolph, col naso che illumina la notte?", scelta: true }
    ];

    let modoFumetto = 'tour';
    function parla(testo, { entra = false, ultima = false, scelta = false } = {}) {
        modoFumetto = 'tour';
        testoGuida.textContent = testo;
        entraGuida.hidden = !entra;
        conCometa.hidden = !scelta;
        conRudolph.hidden = !scelta;
        avantiGuida.hidden = scelta;
        avantiGuida.textContent = ultima ? 'Inizia il viaggio ✨' : tappaTour < 0 ? 'Partiamo! ▶' : 'Prossima tappa ▶';
        saltaGuida.hidden = ultima;
        fumettoGuida.hidden = false;
        fumettoGuida.classList.remove('nascosto');
        avantiGuida.focus({ preventScroll: true });
    }

    async function prossimaTappa() {
        tappaTour++;
        fumettoGuida.classList.add('nascosto');
        if (tappaTour < TAPPE_SLITTA.length) {
            const edificio = mondo.querySelector(TAPPE_SLITTA[tappaTour].edificio);
            paese3D?.guarda(edificio);
            const arrivo = (edificio.dataset.cx ? Number(edificio.dataset.cx) : Number(edificio.getAttribute('transform').match(/translate\(([\d.-]+)/)[1])) - 90;
            await viaggioSlitta(arrivo, Math.min(5200, Math.max(2600, Math.abs(arrivo - xSlitta) * 3)));
            parla(TAPPE_SLITTA[tappaTour].testo, { entra: true, scelta: Boolean(TAPPE_SLITTA[tappaTour].scelta) });
            return;
        }
        if (tappaTour === TAPPE_SLITTA.length) {
            await viaggioSlitta(xSlitta + 260, 1600);
            const oggi = !modifica && aperti >= 1 && aperti <= 24
                ? `oggi ti aspetta la casa numero ${aperti}`
                : 'dal 1° dicembre si apre una casa al giorno';
            const chi = rennaMia ? `${NOMI_RENNA[rennaMia]} tirerà la tua slitta di casa in casa. ` : '';
            parla(`Il tour è finito! ${chi}Ora il villaggio è tutto tuo: ${oggi}. Buon viaggio e buon Natale!`, { ultima: true });
            return;
        }
        fineTour();
    }

    function fineTour() {
        cancelAnimationFrame(animSlitta);
        fumettoGuida.hidden = true;
        slittaTour?.classList.add('se-ne-va');
        const vecchia = slittaTour;
        const dove = xSlitta;
        setTimeout(() => vecchia?.remove(), 900);
        slittaTour = null;
        tappaTour = -1;
        try { localStorage.setItem('villaggio_tour_fatto', '1'); } catch { /* niente memoria: pazienza */ }
        const casa = mondo.querySelector(`.casa[data-giorno="${Math.max(1, Math.min(aperti, 24))}"]`);
        if (rennaMia) {
            // La slitta personale parte da dove si è fermato il tour e porta alla casa di oggi
            if (!slittaMia) slittaMia = disegnaSlittaMia(rennaMia);
            slittaMia.classList.add('a-bordo');
            posizionaMia(dove, true);
            corsaMia(Number(casa?.dataset.x ?? PIAZZA.x) - 80);
            return;
        }
        centraSu(Number(casa?.dataset.x ?? PIAZZA.x));
    }

    function avviaTourSlitta(chi) {
        guidaScelta = GUIDE[chi];
        slittaTour?.remove();
        slittaTour = disegnaSlittaTour(guidaScelta);
        tappaTour = -1;
        facciaGuida.textContent = guidaScelta.icona;
        nomeGuida.textContent = guidaScelta.nome;
        posizionaSlitta(STAZIONE.x + 80);
        parla(`Ciao, sono ${guidaScelta.nome}! Sali sulla slitta: ti porto a scoprire il quartiere di Babbo Natale, proprio qui dietro la stazione.`);
    }

    avantiGuida.addEventListener('click', () => {
        if (modoFumetto === 'finale') entraInCucina();
        else if (modoFumetto === 'slitta') partiConLaSlitta();
        else prossimaTappa();
    });
    [[conCometa, 'cometa'], [conRudolph, 'rudolph']].forEach(([bottone, nome]) => bottone.addEventListener('click', () => {
        scegliRenna(nome, false);
        prossimaTappa();
    }));
    saltaGuida.addEventListener('click', () => {
        if (modoFumetto === 'slitta') {
            fumettoGuida.hidden = true;
            saltaGuida.textContent = 'Salta il tour';
            modoFumetto = 'tour';
        } else fineTour();
    });
    entraGuida.addEventListener('click', () => {
        const edificio = mondo.querySelector(TAPPE_SLITTA[tappaTour]?.edificio);
        if (!edificio) return;
        fumettoGuida.classList.add('nascosto');
        if (edificio.classList.contains('bancarella')) entraNellaBancarella(edificio);
        else entraNelQuartiere(edificio);
    });

    // Dalla stazione: con la guida parte il tour in slitta, da soli si va davanti alla casa di oggi
    function parti(guida) {
        torna();
        sala.nascondi();
        adattaVista();
        if (guida) return avviaTourSlitta(guida);
        const casa = mondo.querySelector(`.casa[data-giorno="${Math.max(1, Math.min(aperti, 24))}"]`);
        centraSu(Number(casa?.dataset.x ?? PIAZZA.x));
    }

    function esciDallaCasa() {
        torna();
        interno.nascondi();
        adattaVista();
        mondo.querySelectorAll('.si-apre').forEach(casa => casa.classList.remove('si-apre'));
        // Usciti dalla casa di Babbo Natale con il regalo scartato: grande festa sul villaggio
        const eraIn = giornoInCasa;
        giornoInCasa = null;
        if (!modifica && eraIn === 24 && viste.has(24)) festaDiNatale();
    }

    // Fuochi d'artificio sopra il villaggio e la scritta "Buon Natale!"
    function festaDiNatale() {
        contenitore.querySelector('.festa')?.remove();
        const festa = Object.assign(document.createElement('div'), { className: 'festa' });
        const tela = document.createElement('canvas');
        const scritta = Object.assign(document.createElement('div'), { className: 'scritta-festa' });
        scritta.append(
            Object.assign(document.createElement('strong'), { textContent: 'BUON NATALE' }),
            Object.assign(document.createElement('span'), { textContent: '🎅 Da Babbo Natale e da tutto il villaggio ✨' })
        );
        festa.append(tela, scritta);
        contenitore.append(festa);
        let finita = false;
        const chiudi = () => {
            if (finita) return;
            finita = true;
            festa.classList.add('via');
            setTimeout(() => festa.remove(), 900);
        };
        festa.addEventListener('click', chiudi);
        setTimeout(chiudi, 14000);
        if (movimentoRidotto) return;

        const ctx = tela.getContext('2d');
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const W = festa.clientWidth, H = festa.clientHeight;
        tela.width = W * dpr;
        tela.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const COLORI = ['#ff5a4f', '#ffd36b', '#6fd3ff', '#7dff9a', '#ff9de2', '#ffffff'];
        const razzi = [], scintille = [];
        const inizio = performance.now();
        let ultimo = inizio, prossimo = inizio;
        const passo = adesso => {
            if (finita) return;
            const dt = Math.min(0.05, (adesso - ultimo) / 1000);
            ultimo = adesso;
            if (adesso - inizio < 10000 && adesso >= prossimo) {
                razzi.push({ x: W * (0.12 + Math.random() * 0.76), y: H, alto: H * (0.1 + Math.random() * 0.32), colore: COLORI[Math.floor(Math.random() * COLORI.length)] });
                prossimo = adesso + 300 + Math.random() * 500;
            }
            // Le scie svaniscono pian piano
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'lighter';
            for (let i = razzi.length - 1; i >= 0; i--) {
                const razzo = razzi[i];
                razzo.y -= H * 0.95 * dt;
                ctx.fillStyle = '#fff3c4';
                ctx.beginPath();
                ctx.arc(razzo.x, razzo.y, 2.2, 0, Math.PI * 2);
                ctx.fill();
                if (razzo.y <= razzo.alto) {
                    razzi.splice(i, 1);
                    const quante = 50 + Math.floor(Math.random() * 30);
                    const forza = H * (0.18 + Math.random() * 0.14);
                    for (let k = 0; k < quante; k++) {
                        const a = (k / quante) * Math.PI * 2;
                        const v = forza * (0.6 + Math.random() * 0.4);
                        scintille.push({ x: razzo.x, y: razzo.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vita: 1, svanisce: 0.45 + Math.random() * 0.35, colore: Math.random() < 0.15 ? '#ffffff' : razzo.colore });
                    }
                }
            }
            for (let i = scintille.length - 1; i >= 0; i--) {
                const sc = scintille[i];
                sc.vx *= 0.985;
                sc.vy = sc.vy * 0.985 + H * 0.22 * dt;
                sc.x += sc.vx * dt;
                sc.y += sc.vy * dt;
                sc.vita -= sc.svanisce * dt;
                if (sc.vita <= 0) {
                    scintille.splice(i, 1);
                    continue;
                }
                ctx.globalAlpha = sc.vita;
                ctx.fillStyle = sc.colore;
                ctx.beginPath();
                ctx.arc(sc.x, sc.y, 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
    }

    svg.addEventListener('click', evento => {
        if (trascinato) return;
        const stazione = evento.target.closest('.stazione');
        if (stazione) return entraInStazione(stazione);
        const renna = evento.target.closest('.renna');
        if (renna) return faiSaltare(renna);
        const coro = evento.target.closest('.coro');
        if (coro) return cantaIlCoro(coro);
        const banco = evento.target.closest('.bancarella');
        if (banco) return entraNellaBancarella(banco);
        const albero = evento.target.closest('.albero');
        if (albero) return ballaLoSchiaccianoci(albero);
        const giostra = evento.target.closest('.giostra');
        if (giostra) return suonaLaGiostra(giostra);
        const palazzetto = evento.target.closest('.palaghiaccio');
        if (palazzetto) return entraNelPalaghiaccio(palazzetto);
        const edificio = evento.target.closest('.posta, .laboratorio, .stalla');
        if (edificio) return entraNelQuartiere(edificio);
        const negozioAddobbi = evento.target.closest('.negozio');
        if (negozioAddobbi) return entraNelNegozio(negozioAddobbi);
        if (evento.target.closest('.slitta-mia')) return invitaASalire();
        const casa = evento.target.closest('.casa');
        if (casa) apriCasa(casa);
    });

    // Cliccato, il coro canta "We Wish You a Merry Christmas"; un altro clic lo ferma.
    // Avvisa la pagina, così la musica di sottofondo si mette in pausa
    let fermaCoro = null;
    function cantaIlCoro(coro) {
        if (fermaCoro) return fermaCoro();
        fermaBalletto?.();
        fermaGiostra?.();
        coro.classList.add('canta');
        contenitore.dispatchEvent(new CustomEvent('coro', { detail: { canta: true } }));
        fermaCoro = cantaMerryChristmas(() => {
            fermaCoro = null;
            coro.classList.remove('canta');
            contenitore.dispatchEvent(new CustomEvent('coro', { detail: { canta: false } }));
        });
    }

    // Cliccato, il balletto danza sulla "Danza della Fata Confetto"; un altro clic la ferma
    let fermaBalletto = null;
    function ballaLoSchiaccianoci(albero) {
        if (fermaBalletto) return fermaBalletto();
        fermaCoro?.();
        fermaGiostra?.();
        albero.classList.add('suona');
        contenitore.dispatchEvent(new CustomEvent('coro', { detail: { canta: true } }));
        fermaBalletto = suonaSchiaccianoci(() => {
            fermaBalletto = null;
            albero.classList.remove('suona');
            contenitore.dispatchEvent(new CustomEvent('coro', { detail: { canta: false } }));
        });
    }

    // Toccata, la giostrina gira più veloce con il carillon di "Deck the Halls"; un altro tocco la ferma
    let fermaGiostra = null;
    function suonaLaGiostra(giostra) {
        if (fermaGiostra) return fermaGiostra();
        fermaCoro?.();
        fermaBalletto?.();
        giostra.classList.add('suona');
        contenitore.dispatchEvent(new CustomEvent('coro', { detail: { canta: true } }));
        fermaGiostra = suonaBrano({ melodia: DECK_THE_HALLS, bassi: BASSI_DECK, battito: 0.36, strumento: 'carillon' }, () => {
            fermaGiostra = null;
            giostra.classList.remove('suona');
            contenitore.dispatchEvent(new CustomEvent('coro', { detail: { canta: false } }));
        });
    }

    // Cliccata, la renna fa un saltello con il tintinnio delle campanelle
    function faiSaltare(renna) {
        onTocco();
        renna.classList.remove('salta');
        renna.getBBox();
        renna.classList.add('salta');
        setTimeout(() => renna.classList.remove('salta'), 700);
    }
    svg.addEventListener('keydown', evento => {
        const casa = evento.target.closest('.casa');
        const stazione = evento.target.closest('.stazione');
        const coro = evento.target.closest('.coro');
        const banco = evento.target.closest('.bancarella');
        const albero = evento.target.closest('.albero');
        const giostra = evento.target.closest('.giostra');
        const palazzetto = evento.target.closest('.palaghiaccio');
        const edificio = evento.target.closest('.posta, .laboratorio, .stalla');
        const negozioAddobbi = evento.target.closest('.negozio');
        if ((casa || stazione || coro || banco || albero || giostra || palazzetto || edificio || negozioAddobbi) && (evento.key === 'Enter' || evento.key === ' ')) {
            evento.preventDefault();
            if (negozioAddobbi) entraNelNegozio(negozioAddobbi);
            else if (edificio) entraNelQuartiere(edificio);
            else if (giostra) suonaLaGiostra(giostra);
            else if (palazzetto) entraNelPalaghiaccio(palazzetto);
            else if (albero) ballaLoSchiaccianoci(albero);
            else if (banco) entraNellaBancarella(banco);
            else if (coro) cantaIlCoro(coro);
            else if (stazione) entraInStazione(stazione);
            else apriCasa(casa);
        }
    });
    aggiornaStato();

    // ---- Le scintille: dicono cosa si può toccare ----
    // Una stellina che pulsa sopra coro, balletto, bancarelle e renne finché non le si tocca la prima volta.
    // Il dispositivo se lo ricorda, così non ricompaiono ogni volta
    const TOCCABILI = [
        { chiave: 'coro', selettore: '.coro', x: 0, y: -100, k: 1.3 },
        { chiave: 'balletto', selettore: '.albero', x: 120, y: -90, k: 1.3 },
        { chiave: 'mercatino', selettore: '.bancarella', x: 0, y: -134, k: 1.8 },
        { chiave: 'renne', selettore: '.renna', x: 0, y: -100, k: 2.4 },
        { chiave: 'giostra', selettore: '.giostra', x: 0, y: -290, k: 1.6 },
        { chiave: 'palaghiaccio', selettore: '.palaghiaccio', x: 0, y: -270, k: 1.6 },
        { chiave: 'posta', selettore: '.posta', x: 0, y: -215, k: 1.6 },
        { chiave: 'laboratorio', selettore: '.laboratorio', x: 0, y: -262, k: 1.6 },
        { chiave: 'stalla', selettore: '.stalla', x: 0, y: -236, k: 1.6 },
        { chiave: 'addobbi', selettore: '.negozio', x: 0, y: -134, k: 1.8 }
    ];
    const leggiToccati = () => {
        try { return JSON.parse(localStorage.getItem('villaggio_toccati') || '[]'); } catch { return []; }
    };
    TOCCABILI.forEach(({ chiave, selettore, x, y, k }) => {
        if (leggiToccati().includes(chiave)) return;
        mondo.querySelectorAll(selettore).forEach((nodo, i) => {
            // Delle renne basta una stellina sulla prima
            if (chiave === 'renne' && i > 0) return;
            const stellina = el('g', { class: 'scintilla-tocco', 'data-chiave': chiave, transform: `translate(${x} ${y}) scale(${k})`, 'pointer-events': 'none' }, nodo);
            el('circle', { r: 14, fill: 'url(#alone)' }, stellina);
            el('path', { d: 'M0 -11 Q1.6 -1.6 11 0 Q1.6 1.6 0 11 Q-1.6 1.6 -11 0 Q-1.6 -1.6 0 -11 Z', fill: '#fff6c8' }, stellina);
            el('circle', { r: 2.2, fill: '#ffffff' }, stellina);
        });
    });
    // Toccato una volta, la stellina se ne va da tutte le parti di quel tipo
    svg.addEventListener('click', evento => {
        const voce = TOCCABILI.find(({ selettore }) => evento.target.closest(selettore));
        if (!voce) return;
        mondo.querySelectorAll(`.scintilla-tocco[data-chiave="${voce.chiave}"]`).forEach(n => n.remove());
        try {
            const toccati = new Set(leggiToccati()).add(voce.chiave);
            localStorage.setItem('villaggio_toccati', JSON.stringify([...toccati]));
        } catch { /* senza memoria la stellina ricomparirà la prossima volta */ }
    });

    // ---- Il treno ----
    const treno = mondo.querySelector('.trenino');
    let seguiTreno = false;

    function posizionaTreno(x) {
        treno.setAttribute('transform', `translate(${x.toFixed(1)} ${BINARI_Y}) scale(0.55)`);
    }

    // Una corsa da un punto all'altro: frena arrivando in stazione, accelera ripartendo
    function corsa(da, a, durata, frena) {
        return new Promise(fatto => {
            treno.classList.add('in-moto');
            const inizio = performance.now();
            const passo = adesso => {
                const t = Math.min(1, (adesso - inizio) / durata);
                const x = da + (a - da) * (frena ? 1 - Math.pow(1 - t, 3) : t * t * t);
                posizionaTreno(x);
                if (seguiTreno) {
                    posizione = limita(x - larghezzaVista * 0.45);
                    applica();
                }
                if (t < 1) return requestAnimationFrame(passo);
                treno.classList.remove('in-moto');
                fatto();
            };
            requestAnimationFrame(passo);
        });
    }

    const pausa = ms => new Promise(fatto => setTimeout(fatto, ms));

    // Si parte dalla casa di oggi, oppure dalla piazza
    const casaDiOggi = modifica ? null : mondo.querySelector(`.casa[data-giorno="${aperti}"]`);
    const partenzaVista = casaDiOggi ? Number(casaDiOggi.dataset.x) : PIAZZA.x;

    if (rennaMia) {
        slittaMia = disegnaSlittaMia(rennaMia);
        posizionaMia(casaDiOggi ? Number(casaDiOggi.dataset.x) - 80 : STAZIONE.x + 80, false);
    }

    // All'arrivo il treno attraversa il paese e la vista lo accompagna fino alla stazione
    async function viaggiDelTreno(segui) {
        seguiTreno = segui;
        await corsa(-350, STAZIONE.fermata, 11000, true);
        // Il treno è arrivato: la stazione brilla e invita a entrare
        mondo.querySelector('.stazione').classList.add('invita');
        seguiTreno = false;
        // Chi arriva per la prima volta viene accompagnato dentro la stazione, a scegliere la guida
        let giaFatto = true;
        try { giaFatto = Boolean(localStorage.getItem('villaggio_tour_fatto')); } catch { /* senza memoria non si insiste */ }
        if (!modifica && !giaFatto && segui) setTimeout(() => {
            if (!inApertura && !contenitore.classList.contains('dentro') && !slittaTour) entraInStazione(mondo.querySelector('.stazione'));
        }, 1400);
        while (contenitore.isConnected) {
            await pausa(12000);
            await corsa(STAZIONE.fermata, MONDO + 400, 14000, false);
            await pausa(15000);
            await corsa(-350, STAZIONE.fermata, 16000, true);
        }
    }

    if (movimentoRidotto) {
        centraSu(partenzaVista, false);
        mondo.querySelector('.stazione').classList.add('invita');
    } else if (modifica) {
        // Chi prepara il calendario parte dalla piazza, senza il giro del treno
        centraSu(partenzaVista, false);
        viaggiDelTreno(false);
    } else {
        spostaA(0, false);
        viaggiDelTreno(true);
    }

    // ---- La vista in 3D: per ora solo dove il contenitore la chiede (data-vista="3d") ----
    let paese3D = null;
    const bottoneVista = Object.assign(document.createElement('button'), { type: 'button', className: 'cambia-vista' });
    const testo2D = suggerimento.textContent;
    function statoCasa3D(giorno) {
        const c = mondo.querySelector(`.casa[data-giorno="${giorno}"]`);
        if (!c) return 'chiusa';
        if (modifica) return c.classList.contains('aperta') ? 'aperta' : 'pronta';
        if (c.classList.contains('chiusa')) return 'chiusa';
        if (c.classList.contains('aperta')) return 'aperta';
        return c.classList.contains('oggi') ? 'oggi' : 'pronta';
    }
    async function usa3D(si) {
        if (si) {
            try {
                await caricaThree();
                paese3D ??= creaPaese3D(contenitore, {
                    onCasa: giorno => apriCasa(mondo.querySelector(`.casa[data-giorno="${giorno}"]`)),
                    // Gli edifici 3D bussano alla stessa porta di quelli disegnati
                    onSpeciale: elemento => elemento.dispatchEvent(new MouseEvent('click', { bubbles: true })),
                    onSlitta: () => invitaASalire(),
                    trova: (selettore, indice = 0) => mondo.querySelectorAll(selettore)[indice] ?? null,
                    statoCasa: statoCasa3D,
                    momento: () => MOMENTI.find(m => contenitore.classList.contains(`momento-${m}`)) ?? 'notte'
                });
            } catch {
                // Niente 3D su questo dispositivo: resta il villaggio disegnato
                bottoneVista.hidden = true;
                return usa3D(false);
            }
            if (!paese3D.canvas.isConnected) neve.after(paese3D.canvas);
            contenitore.classList.add('vista-3d');
            paese3D.avvia(modifica ? Number(casaDaRaggiungere()?.dataset.giorno ?? 1) : Math.max(1, Math.min(aperti, 24)));
            if (rennaMia) paese3D.slitta(rennaMia, Number(casaDaRaggiungere()?.dataset.giorno ?? 1));
            suggerimento.textContent = matchMedia('(pointer: coarse)').matches ? '↻ Gira con il dito · tocca una casa' : '↻ Trascina per girare · clicca una casa';
        } else {
            paese3D?.ferma();
            contenitore.classList.remove('vista-3d');
            suggerimento.textContent = testo2D;
        }
        bottoneVista.textContent = si ? '🖼️ Vista 2D' : '🧊 Vista 3D';
        try {
            localStorage.setItem('villaggio_vista', si ? '3d' : '2d');
        } catch { /* la scelta vale solo per questa visita */ }
    }
    if (contenitore.dataset.vista === '3d') {
        contenitore.append(bottoneVista);
        bottoneVista.addEventListener('click', () => usa3D(!contenitore.classList.contains('vista-3d')));
        let preferita = '3d';
        try {
            preferita = localStorage.getItem('villaggio_vista') ?? '3d';
        } catch { /* si parte in 3D */ }
        usa3D(preferita === '3d');
    }

    return {
        chiudiPorte: esciDallaCasa,
        // Dopo un salvataggio si riaccendono le case con la sorpresa pronta
        segnaPiene(nuove) {
            piene = nuove;
            aggiornaStato();
        },
        // Le letterine arrivate all'ufficio postale (per chi prepara il calendario)
        impostaLettere(nuove) {
            posta.aggiornaLettere(nuove);
        },
        // Il nome di chi riceve il calendario e la letterina di Babbo Natale nel sacco
        impostaSacco(nome, lettera) {
            posta.impostaSacco(nome, lettera);
        },
        // Il benvenuto della stazione, cambiato da chi prepara il calendario
        impostaBenvenuto(testo) {
            sala.impostaBenvenuto(testo);
        },
        // Per provare i diversi momenti della giornata (null = ora vera)
        impostaMomento(momento) {
            momentoScelto = MOMENTI.includes(momento) ? momento : null;
            aggiornaMomento();
        },
        // Solo per le prove: sposta la vista in un punto del paese
        centraSu
    };
}
