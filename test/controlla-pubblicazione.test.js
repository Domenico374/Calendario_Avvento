import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { controlla, trovaSegnaposti } from '../scripts/controlla-pubblicazione.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'controlla-pubblicazione.mjs');
const EMAIL = '[' + 'EMAIL' + ']';

// Una cartella finta con i file di un sito
function sitoFinto(file) {
    const radice = fs.mkdtempSync(path.join(os.tmpdir(), 'controllo-'));
    for (const [nome, testo] of Object.entries(file)) {
        fs.mkdirSync(path.dirname(path.join(radice, nome)), { recursive: true });
        fs.writeFileSync(path.join(radice, nome), testo);
    }
    return radice;
}

function esegui(radice, ambiente) {
    // Lo script controlla la cartella sopra di sé: lo si copia nella cartella finta
    fs.mkdirSync(path.join(radice, 'scripts'), { recursive: true });
    fs.copyFileSync(SCRIPT, path.join(radice, 'scripts', 'controlla-pubblicazione.mjs'));
    const env = { ...process.env };
    delete env.VERCEL_ENV;
    if (ambiente) env.VERCEL_ENV = ambiente;
    try {
        execFileSync(process.execPath, [path.join(radice, 'scripts', 'controlla-pubblicazione.mjs')], { env, stdio: 'pipe' });
        return 0;
    } catch (errore) {
        return errore.status;
    }
}

test('trova il segnaposto dell\'email', () => {
    assert.deepEqual(trovaSegnaposti(`scrivi a ${EMAIL}`), [EMAIL]);
    assert.deepEqual(trovaSegnaposti('scrivi a nome@esempio.it'), []);
});

test('controlla le pagine e i codici del sito, non le prove né le demo né le pagine escluse', () => {
    const radice = sitoFinto({
        'genitori.html': `<p>${EMAIL}</p>`,
        'script.js': `const x = '${EMAIL}';`,
        'lib/pagina.js': `// ${EMAIL}`,
        'test/prova.test.js': EMAIL,
        'demo/genitori-demo.html': EMAIL,
        'vecchia-copia.html': EMAIL,
        'README.md': EMAIL
    });
    assert.deepEqual(controlla(radice).map(p => p.split(':')[0]).sort(), ['genitori.html', path.join('lib', 'pagina.js'), 'script.js'].sort());
});

test('sul sito vero la pubblicazione si ferma; nelle anteprime avvisa soltanto', () => {
    const conSegnaposto = sitoFinto({ 'genitori.html': `<p>${EMAIL}</p>` });
    assert.equal(esegui(conSegnaposto, 'production'), 1);
    assert.equal(esegui(conSegnaposto, undefined), 1);       // sul computer: si ferma
    assert.equal(esegui(conSegnaposto, 'preview'), 0);
    const pulito = sitoFinto({ 'genitori.html': '<p>nome@esempio.it</p>' });
    assert.equal(esegui(pulito, 'production'), 0);
});
