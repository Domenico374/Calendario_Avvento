// Ricostruisce la demo del villaggio dal codice del sito: node demo/costruisci.cjs
// Scrive demo.html (pubblicata sul sito), artifact.html (la demo su Claude)
// e una copia da aprire con un doppio clic sul Desktop
const fs = require('fs');
const path = require('path');
const os = require('os');

const scratch = __dirname;
const progetto = path.join(__dirname, '..');
const desktop = path.join(os.homedir(), 'OneDrive', 'Desktop');

let js = fs.readFileSync(path.join(progetto, 'villaggio.js'), 'utf8');
const firma = 'export function creaVillaggio(contenitore, { aperti, viste, onTocco, onApri, onChiusa }) {';
const fine = '        // Solo per le prove: sposta la vista in un punto del paese\n        centraSu\n';
if (!js.includes(firma) || !js.includes(fine)) throw new Error('villaggio.js è cambiato: aggiorna lo script');
js = js.replace(firma, 'function creaVillaggio(contenitore, opzioni) {\n    let { aperti } = opzioni;\n    const { viste, onTocco, onApri, onChiusa } = opzioni;');
js = js.replace(fine, '        centraSu,\n        // Nella demo il giorno si cambia con il cursore\n        impostaOggi(giorno) {\n            aperti = giorno;\n            aggiornaStato();\n            const casa = mondo.querySelector(`.casa[data-giorno="${giorno}"]`);\n            centraSu(casa ? Number(casa.dataset.x) : PIAZZA.x);\n        }\n');

let css = fs.readFileSync(path.join(progetto, 'style.css'), 'utf8');
css = css.slice(css.indexOf('/* Villaggio: la vista'));
const misure = /width: 96vw;\n    max-width: 1800px;\n    height: max\(460px, calc\(100vh - 310px\)\);\n    margin: 20px auto 30px;/;
if (!misure.test(css)) throw new Error('style.css è cambiato: aggiorna lo script');
css = css.replace(misure, 'width: 100%;\n    max-width: 1600px;\n    height: clamp(360px, 64vh, 760px);');
css += '\n@media (max-width: 600px) {\n    .scena .freccia { width: 42px; height: 42px; font-size: 1.7em; }\n    .scena .suggerimento { font-size: 0.85rem; white-space: nowrap; }\n}\n';

const testa = fs.readFileSync(path.join(scratch, 'testa.html'), 'utf8').replace('</style>', css + '\n</style>');
const corpo = fs.readFileSync(path.join(scratch, 'corpo.html'), 'utf8');
// La foto di esempio viaggia dentro la pagina, così funziona anche senza altri file
const foto = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(progetto, 'albero_natale.jpeg')).toString('base64');
const collega = fs.readFileSync(path.join(scratch, 'collega.js'), 'utf8').replace('__FOTO_ESEMPIO__', foto);
const script = '\n<script>\n' + js + collega + '</script>\n';
// Controlla solo la sintassi: new Function non esegue il codice
new Function(js + collega);

const artifact = testa + '\n' + corpo + script;
fs.writeFileSync(path.join(scratch, 'artifact.html'), artifact);

const autonomo = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="description" content="Il Villaggio dell'Avvento: un paese innevato in cui ogni giorno di dicembre si accende una casa.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>">
<style>*,*::before,*::after{box-sizing:border-box}body{margin:0}[hidden]{display:none!important}</style>
${testa.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')}
</head>
<body>
${corpo}${script}</body>
</html>
`;
fs.writeFileSync(path.join(desktop, "Villaggio dell'Avvento - demo.html"), autonomo);
fs.writeFileSync(path.join(progetto, 'NUOVO villaggio - demo da aprire.html'), autonomo);
// La demo fa parte del sito: villaggio-avvento.vercel.app/demo.html
fs.writeFileSync(path.join(progetto, 'demo.html'), autonomo);
console.log('artifact', artifact.length, 'autonomo', autonomo.length);
