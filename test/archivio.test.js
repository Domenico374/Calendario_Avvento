import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.SEGRETO = 'segreto-di-prova';
process.env.BLOB_BASE_URL = 'https://archivio.example';

const { creaCalendario, eliminaCalendario, leggiCalendario, salvaModifiche } = await import('../lib/archivio.js');

// Un Redis finto in memoria, con i soli comandi usati
function redisFinto() {
    const dati = new Map();
    return {
        async hgetall(chiave) {
            const hash = dati.get(chiave);
            return hash && Object.keys(hash).length ? structuredClone(hash) : null;
        },
        async hset(chiave, campi) {
            dati.set(chiave, { ...(dati.get(chiave) ?? {}), ...structuredClone(campi) });
        },
        async del(chiave) {
            dati.delete(chiave);
        },
        async hdel(chiave, ...campi) {
            const hash = dati.get(chiave) ?? {};
            campi.forEach(campo => delete hash[campo]);
        }
    };
}

const ID = 'abcDEF123456';

test('due salvataggi di caselle diverse non si cancellano a vicenda', async () => {
    const redis = redisFinto();
    await creaCalendario(redis, ID, { titolo: 'Prova', anno: 2026 });
    await Promise.all([3, 7, 12].map(giorno =>
        salvaModifiche(redis, ID, { modifiche: { [giorno]: { tipo: 'messaggio', testo: `giorno ${giorno}` } } })));
    const calendario = await leggiCalendario(redis, ID);
    assert.deepEqual(Object.keys(calendario.giorni), ['3', '7', '12']);
    assert.equal(calendario.titolo, 'Prova');
    assert.equal(calendario.anno, 2026);
});

test('svuotare una casella e cambiare il titolo', async () => {
    const redis = redisFinto();
    const foto = `https://archivio.example/media/${ID}-foto.jpg`;
    await creaCalendario(redis, ID, { titolo: 'Prima', anno: 2026 });
    await salvaModifiche(redis, ID, { modifiche: { 1: { tipo: 'foto', url: foto }, 2: { tipo: 'messaggio', testo: 'resta' } } });
    const esito = await salvaModifiche(redis, ID, { titolo: 'Dopo', modifiche: { 1: null } });
    assert.deepEqual(esito.daEliminare, [foto]);
    const calendario = await leggiCalendario(redis, ID);
    assert.deepEqual(Object.keys(calendario.giorni), ['2']);
    assert.equal(calendario.titolo, 'Dopo');
});

test('contenuti non validi e calendari inesistenti vengono rifiutati', async () => {
    const redis = redisFinto();
    assert.equal((await salvaModifiche(redis, ID, { modifiche: {} })).stato, 404);
    await creaCalendario(redis, ID, { titolo: 'Prova', anno: 2026 });
    assert.equal((await salvaModifiche(redis, ID, { modifiche: { 4: { tipo: 'link', url: 'javascript:alert(1)' } } })).stato, 400);
    assert.deepEqual((await leggiCalendario(redis, ID)).giorni, {});
});

test('eliminare un calendario toglie anche i suoi file', async () => {
    const redis = redisFinto();
    const foto = `https://archivio.example/media/${ID}-foto.jpg`;
    await creaCalendario(redis, ID, { titolo: 'Da eliminare', anno: 2026 });
    await salvaModifiche(redis, ID, { modifiche: { 1: { tipo: 'foto', url: foto }, 2: { tipo: 'messaggio', testo: 'ciao' } } });
    assert.deepEqual(await eliminaCalendario(redis, ID), [foto]);
    assert.equal(await leggiCalendario(redis, ID), null);
    assert.equal(await eliminaCalendario(redis, ID), null);
});

test('il benvenuto si salva, resta se non lo si manda e si vede nel link regalo', async () => {
    const { vistaPubblica, MAX_BENVENUTO } = await import('../lib/calendario.js');
    const redis = redisFinto();
    await creaCalendario(redis, ID, { titolo: 'Benvenuto', anno: 2026 });
    await salvaModifiche(redis, ID, { benvenuto: '  Ciao Oliver!\r\n\r\n\r\nBuon viaggio  ', modifiche: {} });
    let calendario = await leggiCalendario(redis, ID);
    assert.equal(calendario.benvenuto, 'Ciao Oliver!\n\nBuon viaggio');
    await salvaModifiche(redis, ID, { modifiche: { 1: { tipo: 'messaggio', testo: 'ciao' } } });
    calendario = await leggiCalendario(redis, ID);
    assert.equal(calendario.benvenuto, 'Ciao Oliver!\n\nBuon viaggio');
    assert.equal(vistaPubblica(calendario, new Date('2026-11-15T10:00:00Z')).benvenuto, 'Ciao Oliver!\n\nBuon viaggio');
    await salvaModifiche(redis, ID, { benvenuto: 'x'.repeat(500), modifiche: {} });
    assert.equal((await leggiCalendario(redis, ID)).benvenuto.length, MAX_BENVENUTO);
});
