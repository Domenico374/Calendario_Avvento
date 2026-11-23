// Controllo prima di pubblicare: nei file del sito non deve restare nessun segnaposto da sostituire
// (per ora: l'indirizzo email della nota privacy).
// - Sul sito vero (VERCEL_ENV=production) il deploy si FERMA se trova un segnaposto.
// - Nelle anteprime di Vercel avvisa soltanto.
// - Sul computer: "npm run controlla" si ferma come in produzione.
// Vercel lo esegue da solo a ogni deploy, come "vercel-build" in package.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Scritto a pezzi, così questo file non trova sé stesso
export const SEGNAPOSTI = ['[' + 'EMAIL' + ']'];

// Le cartelle che non vanno sul sito (vedi .vercelignore) o che non sono pagine
const CARTELLE_ESCLUSE = new Set(['node_modules', '.git', '.vercel', 'test', 'demo', 'scripts']);
const ESTENSIONI = new Set(['.html', '.js', '.mjs', '.css', '.json']);

export function trovaSegnaposti(testo) {
    return SEGNAPOSTI.filter(segnaposto => testo.includes(segnaposto));
}

// Le pagine HTML pubblicate sono solo quelle permesse in .vercelignore
function htmlPubblicato(relativo) {
    const nome = relativo.replace(/\\/g, '/');
    return ['index.html', 'demo.html', 'bimbi.html', 'demo-bimbi.html', 'genitori.html'].includes(nome)
        || /^bimbi-giochi\/[^/]+\.html$/.test(nome);
}

export function fileDaControllare(radice) {
    const trovati = [];
    const visita = cartella => {
        for (const voce of fs.readdirSync(cartella, { withFileTypes: true })) {
            const completo = path.join(cartella, voce.name);
            const relativo = path.relative(radice, completo);
            if (voce.isDirectory()) {
                if (!CARTELLE_ESCLUSE.has(voce.name)) visita(completo);
                continue;
            }
            const estensione = path.extname(voce.name).toLowerCase();
            if (!ESTENSIONI.has(estensione)) continue;
            if (estensione === '.html' && !htmlPubblicato(relativo)) continue;
            trovati.push(relativo);
        }
    };
    visita(radice);
    return trovati;
}

export function controlla(radice) {
    const problemi = [];
    for (const relativo of fileDaControllare(radice)) {
        const testo = fs.readFileSync(path.join(radice, relativo), 'utf8');
        for (const segnaposto of trovaSegnaposti(testo)) problemi.push(`${relativo}: c'è ancora ${segnaposto}`);
    }
    return problemi;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const problemi = controlla(radice);
    const ambiente = process.env.VERCEL_ENV;
    const soloAvviso = ambiente === 'preview' || ambiente === 'development';
    if (!problemi.length) {
        console.log('Controllo pubblicazione: nessun segnaposto, si può pubblicare.');
    } else if (soloAvviso) {
        console.warn(`ATTENZIONE (anteprima, non blocca):\n- ${problemi.join('\n- ')}`);
    } else {
        console.error(`PUBBLICAZIONE FERMATA: sostituisci i segnaposto prima di pubblicare.\n- ${problemi.join('\n- ')}`);
        process.exit(1);
    }
}
