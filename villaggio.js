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
    // L'albero della piazza è sempre acceso: il 24 è la casa di Babbo Natale, qui accanto
    const albero = el('g', { class: 'albero aperta', transform: `translate(${x} ${y}) scale(${scala})` }, mondo);
    el('ellipse', { class: 'alone', cx: 0, cy: -140, rx: 170, ry: 200, fill: 'url(#alone)' }, albero);
    // Il laghetto ghiacciato dove danzano le ballerine
    el('ellipse', { cx: 0, cy: 0, rx: 128, ry: 34, fill: '#cfe0f5', stroke: '#a9c1e4', 'stroke-width': 3 }, albero);
    el('ellipse', { cx: -20, cy: -4, rx: 84, ry: 16, fill: '#eef5ff', opacity: 0.8 }, albero);
    el('path', { d: 'M-70 8 q 30 -6 60 2 M20 12 q 30 -8 56 -2', stroke: '#ffffff', 'stroke-width': 2, fill: 'none', opacity: 0.9 }, albero);
    const dietro = el('g', { class: 'ballerine', 'pointer-events': 'none' }, albero);
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
    const davanti = el('g', { class: 'ballerine', 'pointer-events': 'none' }, albero);
    danzaBallerine(albero, dietro, davanti);
    return albero;
}

// ========== LE BALLERINE ==========
// Danzano in cerchio intorno all'albero della piazza, come i cigni del balletto:
// tutù bianco, braccia ad ali, ogni tanto una piroetta. Passano dietro e davanti all'albero.

function disegnaBallerina(variante) {
    const pelle = ['#f2d2bd', '#e0b090', '#c98d6a', '#f5dccb', '#a8714f'][variante % 5];
    const capelli = ['#5a3b2a', '#2b1d14', '#1c1410', '#c9984a', '#3a2418'][variante % 5];
    const nero = variante === 2; // un cigno nero tra quelli bianchi
    const abito = nero ? '#2a2638' : '#fbf9ff';
    const piume = nero ? '#4a4460' : '#e6e9f8';
    const posto = el('g', {});
    el('ellipse', { cx: 0, cy: 1, rx: 16, ry: 3.5, fill: 'rgba(40,60,110,0.25)' }, posto);
    const giro = el('g', {}, posto);
    // Gamba sulle punte e gamba alzata in arabesque
    el('path', { d: 'M-1 -1 L-2 -30', stroke: '#f6d3cc', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, giro);
    el('path', { d: 'M-1 0 l -1 -5', stroke: '#e8a0a6', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, giro);
    el('path', { d: 'M1 -30 L24 -42', stroke: '#f6d3cc', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, giro);
    el('path', { d: 'M22 -41 l 4 -2', stroke: '#e8a0a6', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, giro);
    // Il tutù a piume
    el('ellipse', { cx: 0, cy: -32, rx: 23, ry: 6, fill: piume }, giro);
    el('ellipse', { cx: 0, cy: -34, rx: 20, ry: 4.5, fill: abito }, giro);
    for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI;
        el('circle', { cx: Math.cos(a) * 22, cy: -31 + Math.sin(a) * 5.5, r: 3, fill: abito }, giro);
    }
    // Corpetto con un brillantino
    el('path', { d: 'M-5 -34 L-6 -49 Q0 -52 6 -49 L5 -34 Z', fill: abito, stroke: piume, 'stroke-width': 1 }, giro);
    el('circle', { cx: 0, cy: -46, r: 1.6, fill: nero ? '#e0262f' : '#bfe3ff' }, giro);
    // Braccia aperte come ali, che ondeggiano
    const braccia = el('path', { class: 'ali', d: 'M-5 -47 Q-15 -58 -26 -50 M5 -47 Q15 -58 26 -50', stroke: pelle, 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, giro);
    // Testa con lo chignon e la coroncina di piume
    el('rect', { x: -1.5, y: -54, width: 3, height: 5, fill: pelle }, giro);
    el('circle', { cx: 0, cy: -58, r: 5.5, fill: pelle }, giro);
    el('path', { d: 'M-5.5 -58 q 0 -7 5.5 -7 q 5.5 0 5.5 7 q -3 -3 -5.5 -3 q -2.5 0 -5.5 3 Z', fill: capelli }, giro);
    el('circle', { cx: -3, cy: -64, r: 3.2, fill: capelli }, giro);
    el('path', { d: 'M-5 -62 q 5 -5 10 0', stroke: nero ? '#4a4460' : '#ffffff', 'stroke-width': 2.4, fill: 'none' }, giro);
    el('circle', { cx: 0, cy: -65, r: 1.4, fill: '#ffd36b' }, giro);
    return { posto, giro, braccia };
}

function danzaBallerine(albero, dietro, davanti) {
    const RX = 104, RY = 26, QUANTE = 5;
    const ballerine = Array.from({ length: QUANTE }, (_, i) => ({ ...disegnaBallerina(i), fase: (i / QUANTE) * Math.PI * 2 }));
    const ferma = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const disponi = t => {
        for (const [i, b] of ballerine.entries()) {
            const a = b.fase + t * 0.32;
            const x = Math.cos(a) * RX, y = Math.sin(a) * RY;
            const avanti = Math.sin(a) > 0;
            // Va verso sinistra quando passa davanti, verso destra quando passa dietro
            const verso = avanti ? -1 : 1;
            // Ogni tanto una piroetta, a turno
            const ciclo = (t * 0.25 + i * 0.37) % 1;
            const piroetta = ciclo < 0.18 ? Math.cos((ciclo / 0.18) * Math.PI * 4) : 1;
            const salto = Math.abs(Math.sin(t * 2.6 + i)) * 3;
            const scala = 1.3 * (1 + Math.sin(a) * 0.08);
            b.posto.setAttribute('transform', `translate(${x.toFixed(1)} ${(y - salto).toFixed(1)}) scale(${scala.toFixed(3)})`);
            b.giro.setAttribute('transform', `scale(${(verso * piroetta).toFixed(3)} 1)`);
            const onda = Math.sin(t * 3 + i) * 5;
            b.braccia.setAttribute('d', `M-5 -47 Q-15 ${(-58 + onda).toFixed(1)} -26 ${(-50 - onda).toFixed(1)} M5 -47 Q15 ${(-58 + onda).toFixed(1)} 26 ${(-50 - onda).toFixed(1)}`);
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
    const inizio = performance.now();
    const passo = adesso => {
        if (albero.isConnected) era = true;
        else if (era) return;
        disponi((adesso - inizio) / 1000);
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
    elementi.push({ x: PIAZZA.x - 70, y: PIAZZA.y, tipo: 'albero' }, { x: PIAZZA.x + 100, y: PIAZZA.y - 18, tipo: 'casaBabbo' });

    // Lampioni lungo la strada, pupazzi e qualche abete
    for (let x = 250; x < MONDO; x += 420) {
        if (Math.abs(x - PIAZZA.x) > 260) elementi.push({ x, y: yStrada(x) + 44, tipo: 'lampione' });
    }
    elementi.push({ x: PIAZZA.x - 210, y: PIAZZA.y + 30, tipo: 'pupazzo' }, { x: 920, y: 640, tipo: 'pupazzo' });
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
        else if (tipo === 'casaBabbo') disegnaCasaBabbo(mondo, x, y, scala * 1.3);
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

function creaSala({ onParti }) {
    const nodo = Object.assign(document.createElement('div'), { className: 'interno sala', hidden: true });
    const svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'La sala d\'attesa della stazione, con il messaggio di benvenuto' });
    const parti = Object.assign(document.createElement('button'), { type: 'button', className: 'partenza', textContent: 'Sì, partiamo! 🚂' });
    nodo.append(svg, parti);
    parti.addEventListener('click', onParti);

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
    BENVENUTO.forEach((riga, i) => {
        el('text', { x: 800, y: 296 + i * 36 + (i >= 4 ? 10 : 0), 'text-anchor': 'middle', 'font-size': 27, 'font-family': 'Georgia, serif', fill: i >= 4 ? '#ffe9a8' : '#f3ead8', 'font-weight': i >= 4 ? 'bold' : 'normal' }, svg).textContent = riga;
    });

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
        },
        nascondi() {
            nodo.classList.remove('visibile');
            nodo.hidden = true;
        }
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
            quadro.mostra(giorno);
            personaggio.mostra(giorno);
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
    const sala = creaSala({ onParti: () => parti() });
    contenitore.replaceChildren(svg, neve, indietro, avanti, suggerimento, interno.nodo, sala.nodo);
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

    // Si entra in stazione come in una casa: la vista si avvicina alla porta
    async function entraInStazione(stazione) {
        if (inApertura) return;
        inApertura = true;
        seguiTreno = false;
        onTocco();
        stazione.classList.remove('invita');
        await avvicinaA(stazione, 800);
        sala.mostra();
        inApertura = false;
    }

    // "Sì, partiamo!": si torna al villaggio, davanti alla casa di oggi (o alla prima)
    function parti() {
        sala.nascondi();
        adattaVista();
        const casa = mondo.querySelector(`.casa[data-giorno="${Math.max(1, Math.min(aperti, 24))}"]`);
        centraSu(Number(casa?.dataset.x ?? PIAZZA.x));
    }

    function esciDallaCasa() {
        interno.nascondi();
        adattaVista();
        mondo.querySelectorAll('.si-apre').forEach(casa => casa.classList.remove('si-apre'));
    }

    svg.addEventListener('click', evento => {
        if (trascinato) return;
        const stazione = evento.target.closest('.stazione');
        if (stazione) return entraInStazione(stazione);
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
        const stazione = evento.target.closest('.stazione');
        if ((casa || stazione) && (evento.key === 'Enter' || evento.key === ' ')) {
            evento.preventDefault();
            if (stazione) entraInStazione(stazione);
            else apriCasa(casa);
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
        // Il treno è arrivato: la stazione brilla e invita a entrare
        mondo.querySelector('.stazione').classList.add('invita');
        seguiTreno = false;
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
