// Il villaggio dell'Avvento: un paese innevato più largo dello schermo, da esplorare trascinando.
// 23 case lungo la strada e l'albero del 24 in piazza.

const NS = 'http://www.w3.org/2000/svg';
const ALTEZZA = 900;
// Si inquadra solo la parte bassa del cielo, così le case sono più grandi
const VISTA_Y = 300;
const VISTA_H = 600;
const MONDO = 3600; // Larghezza del paese, circa tre schermi
const PIAZZA = { x: 1800, y: 705 };
const BINARI_Y = 580;
// Il treno si ferma con la locomotiva davanti alla stazione
const STAZIONE = { x: 2010, y: 572, fermata: 1990 };

// La strada principale: le case si dispongono ai suoi lati
const STRADA = 'M-50 720 C 300 660, 600 780, 1000 720 S 1500 640, 1800 700 S 2300 780, 2700 710 S 3300 650, 3700 720';

// Le case sono in ordine di giorno, da sinistra a destra lungo la strada: il 24 è l'albero in piazza.
// Il tipo di casa dipende dalla fila: le torri, alte, stanno solo dietro per non coprire i numeri
const TIPI_DIETRO = ['punta', 'torre', 'punta', 'piatto'];
const TIPI_DAVANTI = ['punta', 'piatto', 'punta'];
// Lato della strada: dietro (più lontane e piccole) o davanti
const DIETRO = [180, 380, 1000, 1230, 1460, 2150, 2380, 2610, 3080, 3300, 3500];
const DAVANTI = [120, 330, 560, 790, 1030, 1270, 1520, 2080, 2330, 2580, 3150, 3420];

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
    el('rect', { x: -100, width: 3400, height: ALTEZZA, fill: 'url(#cielo)' }, strato);
    // L'animazione dell'aurora usa transform, quindi lo spostamento va sul gruppo
    const aurore = el('g', { transform: 'translate(0 180)' }, strato);
    el('path', { class: 'aurora', d: 'M-100 260 C 250 120, 500 300, 820 170 S 1350 120, 1700 230 S 2500 140, 3300 220 L3300 320 C 2600 260, 2000 330, 1700 290 S 300 240, -100 360 Z', fill: '#3ee6b0', filter: 'url(#sfoca)' }, aurore);
    el('path', { class: 'aurora', style: 'animation-delay:-4s', d: 'M-100 200 C 300 90, 700 240, 1000 120 S 1900 160, 3300 140 L3300 200 C 2400 230, 1600 250, 900 220 S 300 200, -100 280 Z', fill: '#7b6cff', filter: 'url(#sfoca)', opacity: 0.4 }, aurore);
    for (let i = 0; i < 160; i++) {
        el('circle', {
            class: 'stella', cx: caso() * 3300, cy: 300 + caso() * 230, r: 0.8 + caso() * 2,
            fill: '#fff', style: `animation-delay:${(caso() * 3).toFixed(2)}s`
        }, strato);
    }
    el('circle', { cx: 1500, cy: 370, r: 40, fill: '#fdf6d8', filter: 'url(#bagliore)' }, strato);
    el('circle', { cx: 1516, cy: 360, r: 36, fill: '#1d2b6b', opacity: 0.25 }, strato);
}

function disegnaMontagne(strato) {
    let lontane = 'M-100 600';
    let vicine = 'M-100 620';
    const cime = [];
    for (let x = -100; x <= 4200; x += 180 + caso() * 160) {
        const y = 345 + caso() * 120;
        lontane += ` L${x} ${y} L${x + 120} ${y + 90 + caso() * 60}`;
        cime.push([x, y]);
        vicine += ` L${x + 60} ${495 + caso() * 45} L${x + 170} ${560 + caso() * 30}`;
    }
    el('path', { d: `${lontane} L4300 600 L4300 640 L-100 640 Z`, fill: '#8fa6d8' }, strato);
    cime.forEach(([x, y]) => {
        el('path', { d: `M${x} ${y} L${x - 38} ${y + 40} L${x - 12} ${y + 32} L${x + 8} ${y + 48} L${x + 26} ${y + 34} L${x + 44} ${y + 42} Z`, fill: '#f4f8ff' }, strato);
    });
    el('path', { d: `${vicine} L4300 620 L4300 660 L-100 660 Z`, fill: '#b9c8ea' }, strato);
}

function disegnaBosco(strato) {
    for (let x = -100; x < 5000; x += 34 + caso() * 40) {
        disegnaAbete(strato, x, 585 + caso() * 25, 0.55 + caso() * 0.45, '#2f5a5c');
    }
}

// ========== IL PAESE ==========

function disegnaTerreno(mondo) {
    el('path', { d: `M-200 560 C 600 540, 1400 575, 2200 550 S 3400 560, 3800 555 L3800 ${ALTEZZA} L-200 ${ALTEZZA} Z`, fill: 'url(#terra)' }, mondo);

    // Binari del trenino, in fondo al paese
    el('path', { d: 'M-200 575 L3800 575', stroke: '#8d98b8', 'stroke-width': 3 }, mondo);
    el('path', { d: 'M-200 583 L3800 583', stroke: '#8d98b8', 'stroke-width': 3 }, mondo);
    for (let x = -200; x < 3800; x += 18) el('rect', { x, y: 573, width: 6, height: 13, fill: '#7a6a5a', opacity: 0.6 }, mondo);

    // Laghetto ghiacciato
    el('ellipse', { cx: 700, cy: 615, rx: 190, ry: 42, fill: '#c3d1ec' }, mondo);
    el('ellipse', { cx: 700, cy: 612, rx: 175, ry: 35, fill: 'url(#ghiaccio)' }, mondo);
    el('path', { d: 'M600 605 q 40 -8 80 0 M720 620 q 50 -6 90 2', stroke: '#fff', 'stroke-width': 3, fill: 'none', opacity: 0.8 }, mondo);

    // Ruscello che scende verso il basso
    el('path', { d: 'M2860 560 C 2840 620, 2900 660, 2870 720 S 2930 820, 2900 920 L2960 920 C 2990 820, 2930 760, 2945 720 S 2900 620, 2905 560 Z', fill: 'url(#ghiaccio)' }, mondo);

    // Strada e piazza
    el('path', { d: STRADA, fill: 'none', stroke: '#a3b3d6', 'stroke-width': 86, 'stroke-linecap': 'round' }, mondo);
    el('path', { d: STRADA, fill: 'none', stroke: '#cbd6ec', 'stroke-width': 70, 'stroke-linecap': 'round' }, mondo);
    el('path', { d: STRADA, fill: 'none', stroke: '#f2f6fd', 'stroke-width': 4, 'stroke-dasharray': '22 26' }, mondo);
    el('ellipse', { cx: PIAZZA.x, cy: PIAZZA.y, rx: 250, ry: 78, fill: '#b6c3e0' }, mondo);
    el('ellipse', { cx: PIAZZA.x, cy: PIAZZA.y, rx: 238, ry: 70, fill: '#dde5f4' }, mondo);
    el('ellipse', { cx: PIAZZA.x, cy: PIAZZA.y, rx: 150, ry: 42, fill: 'none', stroke: '#c3cfe8', 'stroke-width': 3, 'stroke-dasharray': '10 12' }, mondo);

    // Ponte dove la strada passa sul ruscello
    const ponte = el('g', { transform: 'translate(2905 690)' }, mondo);
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
    const stazione = el('g', { transform: `translate(${x} ${y}) scale(${scala})` }, mondo);
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
    el('rect', { x: -3, y: -110, width: 6, height: 110, fill: '#2c2f45' }, lampione);
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
    el('rect', { x: -4, y: -10, width: 8, height: 12, fill: '#4a3426' }, g);
    [[0, 46, 34], [-22, 38, 28], [-42, 28, 20]].forEach(([dy, larghezza, altezza]) => {
        el('path', { d: `M${-larghezza / 2} ${dy - 8} L0 ${dy - 8 - altezza} L${larghezza / 2} ${dy - 8} Z`, fill: colore }, g);
        el('path', { d: `M${-larghezza / 4} ${dy - 8 - altezza / 2} L0 ${dy - 8 - altezza} L${larghezza / 4} ${dy - 8 - altezza / 2} Z`, fill: '#f4f8ff' }, g);
    });
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
    }
}

function disegnaCasa(mondo, giorno, x, y, scala, tipo) {
    const colori = COLORI[(giorno * 5) % COLORI.length];
    const materiale = tipo === 'torre' ? 'mattoni' : MATERIALI[(giorno * 3) % MATERIALI.length];
    const w = 92 + caso() * 22;
    const h = tipo === 'torre' ? 150 : 70 + caso() * 30;
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
    el('ellipse', { cx: 14 * verso, cy: 4, rx: w * 0.8, ry: 11, fill: '#6f84bd', opacity: 0.35 }, casa);
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
        // Ombra della gronda sul timpano e tavola di bordo
        el('path', { d: `M${-w / 2 - 4} ${-h + 3} L0 ${-h - rh + 5} L${w / 2 + 4} ${-h + 3}`, fill: 'none', stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 6 }, corpo);
        el('path', { d: `M${-w / 2 - 9} ${-h + 1} L0 ${-h - rh - 1} L${w / 2 + 9} ${-h + 1}`, fill: 'none', stroke: scurisci(colori.tetto, 0.45), 'stroke-width': 6, 'stroke-linejoin': 'round' }, corpo);
        el('path', { d: `M${-w / 2 - 10} ${-h - 2} L0 ${-h - rh - 5} L${w / 2 + 10} ${-h - 2}`, fill: 'none', stroke: '#fbfdff', 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, corpo);
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
        for (let i = 0; i < 3; i++) el('circle', { cx: cx + 7, cy: cima + 4, r: 7, fill: '#dfe6f5' }, fumo);
    }

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

    // Targa con il numero, in alto sul timpano
    el('circle', { class: 'targa', cx: 0, cy: targaY, r: 15, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 2.5 }, corpo);
    el('text', { class: 'targa-testo', x: 0, y: targaY + 6, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 'bold', fill: '#b22222' }, corpo).textContent = giorno;

    // Segnale "oggi"
    const segnale = el('g', { class: 'segnale' }, casa);
    el('path', { d: `M0 ${cima - 40} l7 14 15 2 -11 10 3 15 -14 -7 -14 7 3 -15 -11 -10 15 -2 Z`, fill: '#ffe066', filter: 'url(#bagliore)' }, segnale);
    return casa;
}

function disegnaAlbero(mondo, x, y, scala) {
    const albero = el('g', {
        class: 'casa albero', 'data-giorno': 24, 'data-x': x, tabindex: 0, role: 'button',
        'aria-label': '24 dicembre', transform: `translate(${x} ${y}) scale(${scala})`
    }, mondo);
    el('ellipse', { class: 'alone', cx: 0, cy: -140, rx: 170, ry: 200, fill: 'url(#alone)' }, albero);
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
    el('circle', { class: 'targa', cx: 0, cy: -205, r: 17, fill: '#fffaf0', stroke: '#c9a227', 'stroke-width': 2.5 }, corpo);
    el('text', { class: 'targa-testo', x: 0, y: -199, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 'bold', fill: '#b22222' }, corpo).textContent = 24;
    return albero;
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
    const yStrada = profiloStrada(mondo);

    const elementi = [];
    DIETRO.forEach((x, i) => elementi.push({ x, y: yStrada(x) - 62 - caso() * 22, tipo: 'casa', forma: TIPI_DIETRO[i % TIPI_DIETRO.length] }));
    DAVANTI.forEach((x, i) => elementi.push({ x, y: yStrada(x) + 88 + caso() * 18, tipo: 'casa', forma: TIPI_DAVANTI[i % TIPI_DAVANTI.length] }));
    // Da sinistra a destra: 1, 2, 3...
    [...elementi].sort((a, b) => a.x - b.x).forEach((elemento, i) => { elemento.giorno = i + 1; });
    elementi.push({ x: PIAZZA.x, y: PIAZZA.y, tipo: 'albero' });

    // Lampioni lungo la strada, pupazzi e qualche abete
    for (let x = 250; x < MONDO; x += 420) {
        if (Math.abs(x - PIAZZA.x) > 260) elementi.push({ x, y: yStrada(x) + 44, tipo: 'lampione' });
    }
    elementi.push({ x: PIAZZA.x - 170, y: PIAZZA.y + 30, tipo: 'pupazzo' }, { x: 920, y: 640, tipo: 'pupazzo' });
    [[60, 640], [880, 600], [1680, 610], [2760, 600], [3000, 650], [3600, 640], [450, 880], [1880, 880], [2780, 885], [3300, 890]]
        .forEach(([x, y]) => elementi.push({ x, y, tipo: 'abete' }));
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
    ].forEach(renna => elementi.push({ ...renna, tipo: 'renna' }));

    // Da dietro in avanti, così le cose vicine coprono quelle lontane
    elementi.sort((a, b) => a.y - b.y);
    for (const elemento of elementi) {
        const { x, y, tipo, giorno, forma } = elemento;
        const scala = scalaPer(y);
        if (tipo === 'casa') disegnaCasa(mondo, giorno, x, y, scala, forma);
        else if (tipo === 'albero') disegnaAlbero(mondo, x, y, scala * 1.15);
        else if (tipo === 'lampione') disegnaLampione(mondo, x, y, scala);
        else if (tipo === 'pupazzo') disegnaPupazzo(mondo, x, y, scala);
        else if (tipo === 'stazione') disegnaStazione(mondo, x, y, 0.62);
        else if (tipo === 'treno') disegnaTrenino(mondo);
        else if (tipo === 'renna') disegnaRenna(mondo, x, y, scala * (elemento.piccola ? 0.55 : 0.82), elemento);
        else disegnaAbete(mondo, x, y, scala * 1.4, '#24533f');
    }
}

// ========== NEVE ==========

function avviaNeve(canvas) {
    const ctx = canvas.getContext('2d');
    const fiocchi = Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 2.2, v: 0.0006 + Math.random() * 0.0012, o: Math.random() * Math.PI * 2 }));
    const ferma = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function disegna(tempo) {
        const { width, height } = canvas.getBoundingClientRect();
        if (canvas.width !== Math.round(width)) { canvas.width = width; canvas.height = height; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (const f of fiocchi) {
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
function creaTavolino(genitore) {
    const tavolino = el('g', { transform: 'translate(1150 872) scale(1.35)' }, genitore);
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
    return {
        mostra(giorno) {
            const scelto = DOLCI[(giorno - 1) % DOLCI.length];
            dolce.replaceChildren();
            disegnaDolce(dolce, scelto);
            nome.textContent = scelto.nome;
            const larghezza = scelto.nome.length * 8.4 + 22;
            fondo.setAttribute('x', -larghezza / 2);
            fondo.setAttribute('width', larghezza);
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

    // Quadro sopra il camino
    el('rect', { x: 1092, y: 104, width: 176, height: 116, rx: 4, fill: '#c9a227' }, svg);
    el('rect', { x: 1104, y: 116, width: 152, height: 92, fill: '#9fb4dc' }, svg);
    el('path', { d: 'M1104 180 L1150 150 L1180 168 L1220 140 L1256 166 V208 H1104 Z', fill: '#eef3ff' }, svg);
    el('path', { d: 'M1128 196 h20 v-14 l-10 -8 l-10 8 Z', fill: '#9b1d2a' }, svg);
    el('rect', { x: 1135, y: 188, width: 5, height: 6, fill: '#ffd36b' }, svg);

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

    // Il gatto che dorme davanti al fuoco
    const gatto = el('g', { transform: 'translate(1110 650)' }, svg);
    el('ellipse', { cx: 6, cy: 4, rx: 54, ry: 8, fill: 'rgba(0,0,0,0.25)' }, gatto);
    const respiro = el('g', { class: 'respiro' }, gatto);
    el('path', { d: 'M38 0 q 30 -4 22 -22 q -6 -12 -18 -6', fill: 'none', stroke: '#c9772d', 'stroke-width': 9, 'stroke-linecap': 'round' }, respiro);
    el('ellipse', { cx: 6, cy: -18, rx: 46, ry: 22, fill: '#d9893a' }, respiro);
    el('path', { d: 'M-8 -36 q 4 10 0 18 M8 -38 q 4 10 0 20 M24 -34 q 4 8 0 16', stroke: '#b5651d', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, respiro);
    el('circle', { cx: -34, cy: -16, r: 17, fill: '#d9893a' }, respiro);
    el('path', { d: 'M-46 -26 l -4 -14 l 12 8 Z M-28 -30 l 4 -14 l 6 12 Z', fill: '#c9772d' }, respiro);
    el('path', { d: 'M-42 -16 q 4 3 8 0 M-30 -16 q 4 3 8 0', stroke: '#3b2a1a', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }, respiro);
    el('path', { d: 'M-37 -9 l 2 2 l 2 -2 Z', fill: '#e58a8a' }, respiro);
    el('path', { d: 'M-26 2 q 30 6 60 0', stroke: '#c9772d', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, respiro);

    const tavolino = creaTavolino(svg);

    // Poltrona di velluto con la coperta a quadri
    const poltrona = el('g', { transform: 'translate(1430 840)' }, svg);
    el('ellipse', { cx: 0, cy: 6, rx: 150, ry: 18, fill: 'rgba(0,0,0,0.3)' }, poltrona);
    el('path', { d: 'M-118 0 v18 M118 0 v18 M-90 0 v14 M90 0 v14', stroke: '#3b2412', 'stroke-width': 9, 'stroke-linecap': 'round' }, poltrona);
    el('path', { d: 'M-104 -170 q 0 -60 104 -60 q 104 0 104 60 V-60 H-104 Z', fill: '#7d2026' }, poltrona);
    el('path', { d: 'M-104 -170 q 0 -60 104 -60 q 104 0 104 60 V-60 H-104 Z', fill: 'url(#cilindro)' }, poltrona);
    el('path', { d: 'M-60 -200 v120 M0 -214 v134 M60 -200 v120', stroke: '#5c141b', 'stroke-width': 3, opacity: 0.6 }, poltrona);
    el('rect', { x: -112, y: -78, width: 224, height: 72, rx: 14, fill: '#8e2b2b' }, poltrona);
    el('rect', { x: -96, y: -92, width: 192, height: 30, rx: 14, fill: '#a33a3a' }, poltrona);
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
    const carta = el('rect', { x: -110, y: -150, width: 220, height: 150, rx: 6 }, scatola);
    el('rect', { x: -110, y: -150, width: 220, height: 150, rx: 6, fill: 'url(#ombra-muro)' }, scatola);
    const nastroBase = el('rect', { x: -16, y: -150, width: 32, height: 150 }, scatola);
    const coperchio = el('g', { class: 'coperchio' }, scatola);
    const cartaCoperchio = el('rect', { x: -124, y: -190, width: 248, height: 44, rx: 6 }, coperchio);
    const nastroCoperchio = el('rect', { x: -16, y: -190, width: 32, height: 44 }, coperchio);
    const fiocco = el('g', {}, coperchio);
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
        nodo.classList.add('scartato');
        setTimeout(() => onScarta(giornoMostrato), 1100);
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
        if (evento.key === 'Escape' && !scartato) onEsci();
    });

    return {
        nodo,
        mostra(giorno) {
            const { carta: colore, nastro } = CARTE_REGALO[giorno % CARTE_REGALO.length];
            carta.setAttribute('fill', colore);
            cartaCoperchio.setAttribute('fill', scurisci(colore, 0.08));
            [nastroBase, nastroCoperchio, ...anelli].forEach(parte => parte.setAttribute('fill', nastro));
            data.textContent = `${giorno} dicembre`;
            tavolino.mostra(giorno);
            giornoMostrato = giorno;
            scartato = false;
            nodo.classList.remove('scartato');
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
export function creaVillaggio(contenitore, { aperti, viste, onTocco, onApri, onChiusa, modifica = false, piene = new Set() }) {
    seme = 7;
    const svg = el('svg', { role: 'img', 'aria-label': 'Villaggio con 24 case, una per ogni giorno di dicembre. Trascina per esplorarlo.' });
    disegnaDefinizioni(svg);

    // Strati a velocità diverse: il cielo quasi fermo, le case alla velocità del mouse
    const strati = [
        { fattore: 0.1, disegna: disegnaCielo },
        { fattore: 0.35, disegna: disegnaMontagne },
        { fattore: 0.65, disegna: disegnaBosco },
        { fattore: 1, disegna: disegnaPaese }
    ].map(strato => {
        const g = el('g', {}, svg);
        strato.disegna(g);
        return { ...strato, g };
    });
    const mondo = strati[strati.length - 1].g;

    const neve = document.createElement('canvas');
    const indietro = Object.assign(document.createElement('button'), { type: 'button', className: 'freccia freccia-sinistra', textContent: '‹', ariaLabel: 'Vai a sinistra' });
    const avanti = Object.assign(document.createElement('button'), { type: 'button', className: 'freccia freccia-destra', textContent: '›', ariaLabel: 'Vai a destra' });
    const suggerimento = Object.assign(document.createElement('p'), { className: 'suggerimento', textContent: modifica ? '↔ Trascina il villaggio e clicca una casa per preparare la sorpresa' : '↔ Trascina per esplorare il villaggio' });
    const interno = creaInterno({
        onScarta: giorno => {
            viste.add(giorno);
            aggiornaStato();
            onApri(giorno);
        },
        onEsci: () => esciDallaCasa()
    });
    contenitore.replaceChildren(svg, neve, indietro, avanti, suggerimento, interno.nodo);
    avviaNeve(neve);
    const movimentoRidotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- Spostamento ----
    let larghezzaVista = VISTA_H * 16 / 9;
    let posizione = 0;
    let animazione = null;

    function limita(valore) {
        return Math.min(Math.max(valore, 0), Math.max(0, MONDO - larghezzaVista));
    }

    function applica() {
        strati.forEach(({ g, fattore }) => g.setAttribute('transform', `translate(${(-posizione * fattore).toFixed(1)} 0)`));
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
        larghezzaVista = Math.min(MONDO, (VISTA_H * width) / height);
        svg.setAttribute('viewBox', `0 ${VISTA_Y} ${larghezzaVista} ${VISTA_H}`);
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
        const partenza = [0, VISTA_Y, larghezzaVista, VISTA_H];
        const larghezza = 150 * s;
        const altezza = larghezza * VISTA_H / larghezzaVista;
        const arrivo = [x - posizione - larghezza / 2, y - 22 * s - altezza / 2, larghezza, altezza];
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

    function apriCasa(casa) {
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
            interno.mostra(giorno);
            inApertura = false;
        }, 650);
    }

    function esciDallaCasa() {
        interno.nascondi();
        adattaVista();
        mondo.querySelectorAll('.si-apre').forEach(casa => casa.classList.remove('si-apre'));
    }

    svg.addEventListener('click', evento => {
        if (trascinato) return;
        const renna = evento.target.closest('.renna');
        if (renna) return faiSaltare(renna);
        const casa = evento.target.closest('.casa');
        if (casa) apriCasa(casa);
    });

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
        if (casa && (evento.key === 'Enter' || evento.key === ' ')) {
            evento.preventDefault();
            apriCasa(casa);
        }
    });
    aggiornaStato();

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

    // All'arrivo il treno attraversa il paese e la vista lo accompagna fino alla stazione
    async function viaggiDelTreno(segui) {
        seguiTreno = segui;
        await corsa(-350, STAZIONE.fermata, 11000, true);
        if (seguiTreno) {
            seguiTreno = false;
            await pausa(900);
            centraSu(partenzaVista);
        }
        while (contenitore.isConnected) {
            await pausa(12000);
            await corsa(STAZIONE.fermata, MONDO + 400, 14000, false);
            await pausa(15000);
            await corsa(-350, STAZIONE.fermata, 16000, true);
        }
    }

    if (movimentoRidotto) {
        centraSu(partenzaVista, false);
    } else if (modifica) {
        // Chi prepara il calendario parte dalla piazza, senza il giro del treno
        centraSu(partenzaVista, false);
        viaggiDelTreno(false);
    } else {
        spostaA(0, false);
        viaggiDelTreno(true);
    }

    return {
        chiudiPorte: esciDallaCasa,
        // Dopo un salvataggio si riaccendono le case con la sorpresa pronta
        segnaPiene(nuove) {
            piene = nuove;
            aggiornaStato();
        },
        // Solo per le prove: sposta la vista in un punto del paese
        centraSu
    };
}
