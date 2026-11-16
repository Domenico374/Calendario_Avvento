import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.SEGRETO = 'segreto-di-prova';
process.env.CODICE_INVITO = 'neve';
process.env.BLOB_BASE_URL = 'https://archivio.example';

const {
    annoCalendario, applicaModifiche, chiaveValida, codiceValido, firma, giorniAperti,
    pulisciContenuto, pulisciGiorni, vistaPubblica
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

test('il codice di invito viene controllato', () => {
    assert.ok(codiceValido(' neve '));
    assert.ok(!codiceValido('sole'));
    assert.ok(!codiceValido(undefined));
});

test('senza codice di invito impostato chiunque può creare', () => {
    const salvato = process.env.CODICE_INVITO;
    delete process.env.CODICE_INVITO;
    assert.ok(codiceValido(undefined));
    assert.ok(codiceValido('qualsiasi'));
    process.env.CODICE_INVITO = salvato;
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

test('si cambiano solo le caselle modificate e si eliminano i file sostituiti', () => {
    const vecchiaFoto = `https://archivio.example/media/${ID}-foto.jpg`;
    const nuovaFoto = `https://archivio.example/media/${ID}-foto2.jpg`;
    const calendario = { titolo: 'T', anno: 2026, giorni: { 1: { tipo: 'messaggio', testo: 'resta' }, 2: { tipo: 'foto', url: vecchiaFoto } } };

    const sostituita = applicaModifiche(calendario, { 2: { tipo: 'foto', url: nuovaFoto } }, ID);
    assert.equal(sostituita.calendario.giorni[1].testo, 'resta');
    assert.equal(sostituita.calendario.giorni[2].url, nuovaFoto);
    assert.deepEqual(sostituita.daEliminare, [vecchiaFoto]);

    const svuotata = applicaModifiche(calendario, { 2: null }, ID);
    assert.deepEqual(Object.keys(svuotata.calendario.giorni), ['1']);
    assert.deepEqual(svuotata.daEliminare, [vecchiaFoto]);

    assert.ok(applicaModifiche(calendario, { 30: { tipo: 'messaggio', testo: 'x' } }, ID).errore);
    assert.ok(applicaModifiche(calendario, { 3: { tipo: 'link', url: 'javascript:alert(1)' } }, ID).errore);
    assert.deepEqual(calendario.giorni[2].url, vecchiaFoto, 'il calendario originale non cambia');
});

test('i link accettano solo indirizzi web veri', () => {
    assert.deepEqual(pulisciContenuto({ tipo: 'link', url: 'https://vimeo.com/123', testo: ' Guarda ' }, ID), { tipo: 'link', url: 'https://vimeo.com/123', testo: 'Guarda' });
    assert.deepEqual(pulisciContenuto({ tipo: 'link', url: 'https://www.instagram.com/reel/abc/' }, ID), { tipo: 'link', url: 'https://www.instagram.com/reel/abc/' });
    assert.equal(pulisciContenuto({ tipo: 'link', url: 'javascript:alert(1)' }, ID), null);
    assert.equal(pulisciContenuto({ tipo: 'link', url: 'data:text/html,ciao' }, ID), null);
    assert.equal(pulisciContenuto({ tipo: 'link', url: 'non è un link' }, ID), null);
    assert.equal(pulisciContenuto({ tipo: 'link', url: 'https://x.it/' + 'a'.repeat(600) }, ID), null);
    assert.equal(pulisciContenuto({ tipo: 'link', url: 'https://x.it', testo: 'a'.repeat(200) }, ID).testo.length, 80);
});

test('il 1° dicembre chi riceve il link vede solo la prima sorpresa, il 2 anche la seconda', () => {
    const calendario = {
        titolo: 'Prova', anno: 2026,
        giorni: { 1: { tipo: 'messaggio', testo: 'uno' }, 2: { tipo: 'messaggio', testo: 'due' }, 24: { tipo: 'messaggio', testo: 'vigilia' } }
    };
    const primo = vistaPubblica(calendario, new Date('2026-11-30T23:00:30Z')); // 00:00 del 1° dicembre in Italia
    assert.equal(primo.aperti, 1);
    assert.deepEqual(Object.keys(primo.giorni), ['1']);
    const secondo = vistaPubblica(calendario, new Date('2026-12-02T08:00:00Z'));
    assert.deepEqual(Object.keys(secondo.giorni), ['1', '2']);
    assert.equal(vistaPubblica(calendario, new Date('2026-12-23T22:59:00Z')).giorni[24], undefined);
    assert.equal(vistaPubblica(calendario, new Date('2026-12-23T23:00:00Z')).giorni[24].testo, 'vigilia');
});
