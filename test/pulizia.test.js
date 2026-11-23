import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.SEGRETO = 'segreto-di-prova';
process.env.BLOB_BASE_URL = 'https://archivio.example';

const { ELENCO_GENITORI, calendariGenitori, creaCalendario, eliminaCalendario, leggiCalendario, salvaModifiche } = await import('../lib/archivio.js');
const { fileDiQuestoCalendario, scadenzaCalendario, scaduto, stessoSegreto } = await import('../lib/calendario.js');
const { pulisciScaduti } = await import('../lib/pulizia.js');
const { default: gestorePulizia } = await import('../api/pulizia.js');

// Redis finto in memoria, con i comandi usati (hash e insiemi)
function redisFinto() {
    const dati = new Map();
    return {
        dati,
        async hgetall(chiave) {
            const hash = dati.get(chiave);
            return hash && Object.keys(hash).length ? structuredClone(hash) : null;
        },
        async hset(chiave, campi) { dati.set(chiave, { ...(dati.get(chiave) ?? {}), ...structuredClone(campi) }); },
        async del(chiave) { dati.delete(chiave); },
        async hdel(chiave, ...campi) { const h = dati.get(chiave) ?? {}; campi.forEach(c => delete h[c]); },
        async sadd(chiave, ...membri) { const s = dati.get(chiave) ?? new Set(); membri.forEach(m => s.add(m)); dati.set(chiave, s); },
        async smembers(chiave) { return [...(dati.get(chiave) ?? [])]; },
        async srem(chiave, ...membri) { const s = dati.get(chiave); membri.forEach(m => s?.delete(m)); }
    };
}

// Archivio finto: un elenco di file; elencaFile filtra per inizio del nome, come il vero list({ prefix })
function archivioFinto(nomi) {
    const file = new Map(nomi.map(nome => [nome, `https://archivio.example/${nome}`]));
    const cancellati = [];
    return {
        file, cancellati,
        elencaFile: async prefisso => [...file].filter(([nome]) => nome.startsWith(prefisso)).map(([pathname, url]) => ({ pathname, url })),
        cancellaFile: async urls => urls.forEach(url => {
            cancellati.push(url);
            for (const [nome, u] of file) if (u === url) file.delete(nome);
        })
    };
}

const SCADUTO = 'Scad1234abcd';       // calendario dei genitori 2026: scade il 31/01/2027
const NON_SCADUTO = 'Vivo5678efgh';   // calendario dei genitori 2027: scade il 31/01/2028
const GRANDI = 'Gran9012ijkl';        // calendario dei grandi
const SIMILE = 'Scad1234ab';          // ID più corto che inizia come quello scaduto
const DOPO_SCADENZA = Date.parse('2027-02-01T03:00:00Z');

async function preparaTutto() {
    const redis = redisFinto();
    await creaCalendario(redis, SCADUTO, { titolo: 'Il calendario di Luca', anno: 2026, perBambini: true });
    await creaCalendario(redis, NON_SCADUTO, { titolo: 'Il calendario di Anna', anno: 2027, perBambini: true });
    await creaCalendario(redis, GRANDI, { titolo: 'Per la nonna', anno: 2026 });
    await creaCalendario(redis, SIMILE, { titolo: 'Per Marco', anno: 2026 });
    const archivio = archivioFinto([
        `media/${SCADUTO}-foto-a1B2c3.jpg`,          // del calendario scaduto: si cancellano
        `media/${SCADUTO}-video-Zz9.mp4`,
        `media/${SCADUTO}-vocale.webm`,
        `media/${SCADUTO}-foto.jpg/altro`,            // nomi strani con lo stesso inizio: mai toccati
        `media/${SCADUTO}-documento-x.pdf`,
        `media/${SCADUTO}-foto-a1B2c3.jpg.bak`,
        `media/${SCADUTO}--foto-x.jpg`,
        `media/${NON_SCADUTO}-foto-x.jpg`,            // di altri calendari: mai toccati
        `media/${GRANDI}-foto-x.jpg`,
        `media/${SIMILE}-foto-x.jpg`,
        `altro/${SCADUTO}-foto-x.jpg`,               // fuori da media/: mai toccato
        `${SCADUTO}-foto-x.jpg`,
        'verbale-scriba-2026.pdf'                     // altro nell'archivio: mai toccato
    ]);
    return { redis, archivio };
}

test('la scadenza è il 31 gennaio dell\'anno dopo, solo per i calendari dei genitori', async () => {
    assert.equal(scadenzaCalendario(2026), '2027-01-31');
    const { redis } = await preparaTutto();
    assert.equal((await leggiCalendario(redis, SCADUTO)).scadenza, '2027-01-31');
    assert.equal((await leggiCalendario(redis, GRANDI)).scadenza, undefined);
    assert.deepEqual((await calendariGenitori(redis)).sort(), [NON_SCADUTO, SCADUTO].sort());
});

test('un salvataggio non toglie la scadenza; eliminare il calendario lo toglie dall\'elenco', async () => {
    const { redis } = await preparaTutto();
    await salvaModifiche(redis, SCADUTO, { titolo: 'Il calendario di Luca e Anna', modifiche: { 1: { tipo: 'messaggio', testo: 'Ciao' } } });
    assert.equal((await leggiCalendario(redis, SCADUTO)).scadenza, '2027-01-31');
    await eliminaCalendario(redis, SCADUTO);
    assert.deepEqual(await calendariGenitori(redis), [NON_SCADUTO]);
});

test('scaduto: solo dopo la fine del 31 gennaio (ora italiana) e solo per i genitori', () => {
    const cal = { perBambini: true, scadenza: '2027-01-31' };
    assert.equal(scaduto(cal, Date.parse('2027-01-31T22:59:00Z')), false); // 23:59 in Italia
    assert.equal(scaduto(cal, Date.parse('2027-01-31T23:00:01Z')), true);  // già 1 febbraio
    assert.equal(scaduto({ scadenza: '2027-01-31' }, DOPO_SCADENZA), false);           // grandi
    assert.equal(scaduto({ perBambini: true }, DOPO_SCADENZA), false);                 // senza scadenza
    assert.equal(scaduto({ perBambini: true, scadenza: 'domani' }, DOPO_SCADENZA), false);
});

test('i nomi dei file: solo media/<ID>-<tipo>[-casuale].<estensione>', () => {
    assert.equal(fileDiQuestoCalendario(`media/${SCADUTO}-foto-a1B2c3.jpg`, SCADUTO), true);
    assert.equal(fileDiQuestoCalendario(`media/${SCADUTO}-vocale.webm`, SCADUTO), true);
    for (const nome of [`media/${SCADUTO}-documento-x.pdf`, `media/${SCADUTO}-foto.jpg/altro`, `media/${SCADUTO}--foto-x.jpg`,
        `altro/${SCADUTO}-foto-x.jpg`, `media/${SIMILE}-foto-x.jpg`, `media/${SCADUTO}-foto-a1.jpg.bak`]) {
        assert.equal(fileDiQuestoCalendario(nome, SCADUTO), false, nome);
    }
    // Un ID con il trattino non "cattura" i file di un altro ID
    assert.equal(fileDiQuestoCalendario('media/abcdefghij-k-foto-x.jpg', 'abcdefghij'), false);
    assert.equal(fileDiQuestoCalendario('media/x.jpg', '../../tutto'), false);
    // Un ID che finisce con il trattino: i suoi file sono suoi, e non di un ID uguale senza trattino
    assert.equal(fileDiQuestoCalendario('media/SN0dq4qKJd4--foto-ab1.jpg', 'SN0dq4qKJd4-'), true);
    assert.equal(fileDiQuestoCalendario('media/SN0dq4qKJd4--foto-ab1.jpg', 'SN0dq4qKJd4'), false);
    assert.equal(fileDiQuestoCalendario('media/SN0dq4qKJd4-foto-ab1.jpg', 'SN0dq4qKJd4-'), false);
});

test('pulizia ATTIVA: cancella solo il calendario scaduto dei genitori e solo i suoi file', async () => {
    const { redis, archivio } = await preparaTutto();
    const prima = [...archivio.file.keys()];
    const esito = await pulisciScaduti({ redis, ...archivio, adesso: DOPO_SCADENZA, attiva: true, registro: () => {} });

    assert.deepEqual(esito.scaduti, [SCADUTO]);
    assert.equal(esito.file, 3);
    assert.equal(await leggiCalendario(redis, SCADUTO), null);
    assert.deepEqual(await calendariGenitori(redis), [NON_SCADUTO]);
    // Tutto il resto c'è ancora
    assert.ok(await leggiCalendario(redis, NON_SCADUTO));
    assert.ok(await leggiCalendario(redis, GRANDI));
    assert.ok(await leggiCalendario(redis, SIMILE));
    const cancellati = prima.filter(nome => !archivio.file.has(nome)).sort();
    assert.deepEqual(cancellati, [`media/${SCADUTO}-foto-a1B2c3.jpg`, `media/${SCADUTO}-video-Zz9.mp4`, `media/${SCADUTO}-vocale.webm`].sort());
    assert.equal(archivio.file.size, prima.length - 3);
});

test('pulizia SPENTA: non cancella niente, scrive solo nel registro', async () => {
    const { redis, archivio } = await preparaTutto();
    const prima = structuredClone([...redis.dati].map(([k, v]) => [k, v instanceof Set ? [...v] : v]));
    const righe = [];
    const esito = await pulisciScaduti({ redis, ...archivio, adesso: DOPO_SCADENZA, registro: r => righe.push(r) });

    assert.equal(esito.attiva, false);
    assert.deepEqual(esito.scaduti, [SCADUTO]);
    assert.equal(archivio.cancellati.length, 0);
    assert.deepEqual([...redis.dati].map(([k, v]) => [k, v instanceof Set ? [...v] : v]), prima);
    assert.match(righe[0], /PROVA \(pulizia spenta\), cancellerei: calendario Scad1234abcd, scadenza 2027-01-31, 3 file/);
});

test('i calendari dei grandi non si toccano nemmeno se finissero per errore nell\'elenco', async () => {
    const { redis, archivio } = await preparaTutto();
    await redis.sadd(ELENCO_GENITORI, GRANDI, SIMILE);
    await pulisciScaduti({ redis, ...archivio, adesso: Date.parse('2099-01-01'), attiva: true, registro: () => {} });
    assert.ok(await leggiCalendario(redis, GRANDI));
    assert.ok(await leggiCalendario(redis, SIMILE));
    assert.ok(archivio.file.has(`media/${GRANDI}-foto-x.jpg`));
    assert.ok(archivio.file.has(`media/${SIMILE}-foto-x.jpg`));
});

test('prima della scadenza non si cancella niente', async () => {
    const { redis, archivio } = await preparaTutto();
    const esito = await pulisciScaduti({ redis, ...archivio, adesso: Date.parse('2027-01-15T12:00:00Z'), attiva: true, registro: () => {} });
    assert.deepEqual(esito.scaduti, []);
    assert.equal(archivio.cancellati.length, 0);
});

// La pagina /api/pulizia: senza CRON_SECRET non parte, con una parola sbagliata risponde "non autorizzato"
function rispostaFinta() {
    const r = { stato: 0, corpo: null };
    r.status = s => { r.stato = s; return r; };
    r.json = o => { r.corpo = o; return r; };
    return r;
}

test('la pulizia non parte senza CRON_SECRET o con la parola sbagliata', async () => {
    const vecchio = process.env.CRON_SECRET;
    try {
        delete process.env.CRON_SECRET;
        const senza = rispostaFinta();
        await gestorePulizia({ headers: { authorization: 'Bearer qualcosa' } }, senza);
        assert.equal(senza.stato, 500);

        process.env.CRON_SECRET = 'parola-giusta';
        for (const intestazione of [undefined, '', 'Bearer parola-sbagliata', 'parola-giusta', 'Bearer parola-giusta ']) {
            const r = rispostaFinta();
            await gestorePulizia({ headers: { authorization: intestazione } }, r);
            assert.equal(r.stato, 401, String(intestazione));
        }
    } finally {
        if (vecchio === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = vecchio;
    }
    assert.equal(stessoSegreto('', ''), false);
    assert.equal(stessoSegreto('Bearer x', 'Bearer x'), true);
});
