import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.SEGRETO = 'segreto-di-prova';
process.env.CODICE_INVITO = 'neve';
process.env.BLOB_BASE_URL = 'https://archivio.example';

const {
    annoCalendario, chiaveValida, codiceValido, firma, giorniAperti,
    percorsoCalendario, pulisciContenuto, pulisciGiorni, vistaPubblica
} = await import('../lib/calendario.js');

const ID = 'abcDEF123456';

test('i giorni si aprono secondo la data italiana', () => {
    assert.equal(giorniAperti(2026, new Date('2026-11-30T22:59:00Z')), 0);
    assert.equal(giorniAperti(2026, new Date('2026-11-30T23:00:00Z')), 1);
    assert.equal(giorniAperti(2026, new Date('2026-12-05T11:00:00Z')), 5);
    assert.equal(giorniAperti(2026, new Date('2026-12-24T23:30:00Z')), 24);
    assert.equal(giorniAperti(2026, new Date('2026-12-31T11:00:00Z')), 24);
    assert.equal(giorniAperti(2026, new Date('2027-06-01T11:00:00Z')), 24);
});

test('un calendario creato dopo il 24 dicembre vale per l\'anno dopo', () => {
    assert.equal(annoCalendario(new Date('2026-11-01T11:00:00Z')), 2026);
    assert.equal(annoCalendario(new Date('2026-12-26T11:00:00Z')), 2027);
    assert.equal(giorniAperti(2027, new Date('2026-12-26T11:00:00Z')), 0);
});

test('la vista pubblica non contiene i giorni chiusi', () => {
    const calendario = {
        titolo: 'Prova',
        anno: 2026,
        giorni: { 3: { tipo: 'messaggio', testo: 'aperto' }, 4: { tipo: 'messaggio', testo: 'segreto' } }
    };
    const vista = vistaPubblica(calendario, new Date('2026-12-03T11:00:00Z'));
    assert.equal(vista.aperti, 3);
    assert.deepEqual(Object.keys(vista.giorni), ['3']);
    assert.ok(!JSON.stringify(vista).includes('segreto'));
});

test('la chiave di modifica vale solo per il suo calendario', () => {
    assert.ok(chiaveValida(ID, firma('modifica', ID)));
    assert.ok(!chiaveValida(ID, firma('modifica', 'altroId123456')));
    assert.ok(!chiaveValida(ID, firma('percorso', ID)));
    assert.ok(!chiaveValida(ID, undefined));
});

test('il percorso del calendario non si ricava dall\'id', () => {
    assert.ok(percorsoCalendario(ID).length > `calendari/${ID}.json`.length + 20);
});

test('il codice di invito viene controllato', () => {
    assert.ok(codiceValido(' neve '));
    assert.ok(!codiceValido('sole'));
    assert.ok(!codiceValido(undefined));
});

test('solo contenuti validi e file di questo calendario', () => {
    const file = `https://archivio.example/media/${ID}-foto.jpg`;
    assert.deepEqual(pulisciContenuto({ tipo: 'foto', url: file, extra: 1 }, ID), { tipo: 'foto', url: file });
    assert.equal(pulisciContenuto({ tipo: 'foto', url: 'https://altrove.example/x.jpg' }, ID), null);
    assert.equal(pulisciContenuto({ tipo: 'foto', url: 'https://archivio.example/media/altro-x.jpg' }, ID), null);
    assert.equal(pulisciContenuto({ tipo: 'youtube', video: '"><script>' }, ID), null);
    assert.equal(pulisciContenuto({ tipo: 'sconosciuto' }, ID), null);
    assert.deepEqual(Object.keys(pulisciGiorni({ 0: { tipo: 'messaggio', testo: 'no' }, 25: { tipo: 'messaggio', testo: 'no' }, 2: { tipo: 'messaggio', testo: 'sì' } }, ID)), ['2']);
});
