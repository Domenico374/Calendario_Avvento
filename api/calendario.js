import { del, get, put } from '@vercel/blob';
import {
    annoCalendario, chiaveValida, codiceValido, firma, idValido, nuovoId,
    percorsoCalendario, pulisciGiorni, pulisciTitolo, vistaPubblica
} from '../lib/calendario.js';

// Chi modifica legge sempre l'ultima versione; chi visita può usare la cache
async function leggi(id, { aggiornato = false } = {}) {
    const risultato = await get(percorsoCalendario(id), { access: 'public', useCache: !aggiornato });
    if (!risultato?.stream) return null;
    return new Response(risultato.stream).json();
}

function scrivi(id, calendario) {
    return put(percorsoCalendario(id), JSON.stringify(calendario), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 60
    });
}

async function crea(req, res) {
    const { codice, titolo } = req.body ?? {};
    if (!codiceValido(codice)) return res.status(403).json({ errore: 'Codice di invito non valido.' });

    const id = nuovoId();
    await scrivi(id, { titolo: pulisciTitolo(titolo), anno: annoCalendario(), giorni: {} });
    return res.status(201).json({ id, chiave: firma('modifica', id) });
}

// L'editor invia sempre il calendario intero, così un salvataggio non dipende dalla cache
async function salva(req, res) {
    const { id, chiave, titolo, giorni, rimossi } = req.body ?? {};
    if (!chiaveValida(id, chiave)) return res.status(403).json({ errore: 'Link di modifica non valido.' });

    const calendario = await leggi(id, { aggiornato: true });
    if (!calendario) return res.status(404).json({ errore: 'Calendario non trovato.' });

    const aggiornato = { ...calendario, titolo: pulisciTitolo(titolo), giorni: pulisciGiorni(giorni, id) };
    await scrivi(id, aggiornato);

    const daEliminare = (Array.isArray(rimossi) ? rimossi : [])
        .filter(url => typeof url === 'string' && url.startsWith(`${process.env.BLOB_BASE_URL}/media/${id}-`));
    if (daEliminare.length) await del(daEliminare).catch(errore => console.error('Pulizia file:', errore));

    return res.status(200).json(aggiornato);
}

async function apri(req, res) {
    const { id, chiave } = req.query;
    if (!idValido(id)) return res.status(404).json({ errore: 'Calendario non trovato.' });

    if (chiave && !chiaveValida(id, chiave)) return res.status(403).json({ errore: 'Link di modifica non valido.' });

    const calendario = await leggi(id, { aggiornato: Boolean(chiave) });
    if (!calendario) return res.status(404).json({ errore: 'Calendario non trovato.' });

    return res.status(200).json(chiave ? { ...calendario, modifica: true } : vistaPubblica(calendario));
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    try {
        if (req.method === 'GET') return await apri(req, res);
        if (req.method === 'POST') {
            const azione = req.body?.azione;
            if (azione === 'crea') return await crea(req, res);
            if (azione === 'salva') return await salva(req, res);
        }
        return res.status(405).json({ errore: 'Richiesta non valida.' });
    } catch (errore) {
        console.error(errore);
        return res.status(500).json({ errore: 'Qualcosa non ha funzionato. Riprova tra poco.' });
    }
}
