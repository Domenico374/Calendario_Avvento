import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.SEGRETO = 'segreto-di-prova';
process.env.BLOB_BASE_URL = 'https://archivio.example';

const { aggiungiLettera, creaCalendario, eliminaCalendario, leggiCalendario, salvaModifiche } = await import('../lib/archivio.js');

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
        },
        async sadd(chiave, ...membri) {
            const insieme = dati.get(chiave) ?? new Set();
            membri.forEach(membro => insieme.add(membro));
            dati.set(chiave, insieme);
        },
        async srem(chiave, ...membri) {
            membri.forEach(membro => dati.get(chiave)?.delete(membro));
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

test('le letterine si salvano, si tengono le ultime 30 e non si vedono nel link regalo', async () => {
    const { vistaPubblica, pulisciLettera, MAX_LETTERE } = await import('../lib/calendario.js');
    const redis = redisFinto();
    assert.equal(await aggiungiLettera(redis, ID, pulisciLettera({ testo: 'ciao' })), null);
    await creaCalendario(redis, ID, { titolo: 'Letterine', anno: 2026 });
    assert.equal(pulisciLettera({ testo: '   ' }), null);
    await aggiungiLettera(redis, ID, pulisciLettera({ testo: '  Vorrei un trenino  ', firma: '  Oliver   B. ' }));
    let calendario = await leggiCalendario(redis, ID);
    assert.equal(calendario.lettere.length, 1);
    assert.equal(calendario.lettere[0].testo, 'Vorrei un trenino');
    assert.equal(calendario.lettere[0].firma, 'Oliver B.');
    assert.equal('lettere' in vistaPubblica(calendario, new Date('2026-12-05T10:00:00Z')), false);
    for (let i = 0; i < 40; i++) await aggiungiLettera(redis, ID, pulisciLettera({ testo: `lettera ${i}` }));
    calendario = await leggiCalendario(redis, ID);
    assert.equal(calendario.lettere.length, MAX_LETTERE);
    assert.equal(calendario.lettere.at(-1).testo, 'lettera 39');
    // Salvare una casella non cancella le letterine
    await salvaModifiche(redis, ID, { modifiche: { 2: { tipo: 'messaggio', testo: 'ciao' } } });
    assert.equal((await leggiCalendario(redis, ID)).lettere.length, MAX_LETTERE);
});

test('nome sul sacco e letterina di Babbo Natale: si salvano e si vedono nel link regalo', async () => {
    const { vistaPubblica, MAX_DESTINATARIO } = await import('../lib/calendario.js');
    const redis = redisFinto();
    await creaCalendario(redis, ID, { titolo: 'Sacco', anno: 2026 });
    await salvaModifiche(redis, ID, { destinatario: '  Oliver   ', letteraBabbo: '  Caro Oliver,\r\nti aspetto!  ', modifiche: {} });
    let calendario = await leggiCalendario(redis, ID);
    assert.equal(calendario.destinatario, 'Oliver');
    assert.equal(calendario.letteraBabbo, 'Caro Oliver,\nti aspetto!');
    await salvaModifiche(redis, ID, { titolo: 'Altro', modifiche: {} });
    calendario = await leggiCalendario(redis, ID);
    assert.equal(calendario.destinatario, 'Oliver');
    const vista = vistaPubblica(calendario, new Date('2026-11-20T10:00:00Z'));
    assert.equal(vista.destinatario, 'Oliver');
    assert.equal(vista.letteraBabbo, 'Caro Oliver,\nti aspetto!');
    await salvaModifiche(redis, ID, { destinatario: 'x'.repeat(80), modifiche: {} });
    assert.equal((await leggiCalendario(redis, ID)).destinatario.length, MAX_DESTINATARIO);
});

test('il segnale "per bambini" si salva solo se acceso e resta dopo ogni salvataggio', async () => {
    const redis = redisFinto();
    await creaCalendario(redis, ID, { titolo: 'Per Luca', anno: 2026, perBambini: true });
    await salvaModifiche(redis, ID, { titolo: 'Il calendario di Luca', benvenuto: 'Ciao!', modifiche: { 1: { tipo: 'messaggio', testo: 'ciao' } } });
    assert.equal((await leggiCalendario(redis, ID)).perBambini, true);

    // I calendari dei grandi restano scritti come prima: niente campo in più
    const grandi = redisFinto();
    for (const perBambini of [undefined, false, 'si']) {
        await creaCalendario(grandi, ID, { titolo: 'Prova', anno: 2026, perBambini });
        await salvaModifiche(grandi, ID, { titolo: 'Dopo', modifiche: {} });
        assert.equal('perBambini' in (await leggiCalendario(grandi, ID)), false);
    }
});
