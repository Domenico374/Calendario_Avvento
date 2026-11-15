import { del } from '@vercel/blob';
import { creaCalendario, creaRedis, leggiCalendario, salvaModifiche } from '../lib/archivio.js';
import {
    annoCalendario, chiaveValida, codiceValido, firma, idValido, nuovoId, pulisciTitolo, vistaPubblica
} from '../lib/calendario.js';

// I testi e i link stanno nel database; foto, audio e video restano nell'archivio Blob
async function crea(req, res, redis) {
    const { codice, titolo } = req.body ?? {};
    if (!codiceValido(codice)) return res.status(403).json({ errore: 'Codice di invito non valido.' });

    const id = nuovoId();
    await creaCalendario(redis, id, { titolo: pulisciTitolo(titolo), anno: annoCalendario() });
    return res.status(201).json({ id, chiave: firma('modifica', id) });
}

// L'editor manda solo le caselle cambiate (null = svuota)
async function salva(req, res, redis) {
    const { id, chiave, titolo, modifiche } = req.body ?? {};
    if (!chiaveValida(id, chiave)) return res.status(403).json({ errore: 'Link di modifica non valido.' });

    const esito = await salvaModifiche(redis, id, { titolo, modifiche });
    if (esito.errore) return res.status(esito.stato).json({ errore: esito.errore });
    if (esito.daEliminare.length) await del(esito.daEliminare).catch(errore => console.error('Pulizia file:', errore));
    return res.status(200).json(esito.calendario);
}

async function apri(req, res, redis) {
    const { id, chiave } = req.query;
    if (!idValido(id)) return res.status(404).json({ errore: 'Calendario non trovato.' });
    if (chiave && !chiaveValida(id, chiave)) return res.status(403).json({ errore: 'Link di modifica non valido.' });

    const calendario = await leggiCalendario(redis, id);
    if (!calendario) return res.status(404).json({ errore: 'Calendario non trovato.' });

    return res.status(200).json(chiave ? { ...calendario, modifica: true } : vistaPubblica(calendario));
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    try {
        const redis = creaRedis();
        if (req.method === 'GET') return await apri(req, res, redis);
        if (req.method === 'POST') {
            const azione = req.body?.azione;
            if (azione === 'crea') return await crea(req, res, redis);
            if (azione === 'salva') return await salva(req, res, redis);
        }
        return res.status(405).json({ errore: 'Richiesta non valida.' });
    } catch (errore) {
        console.error(errore);
        return res.status(500).json({ errore: 'Qualcosa non ha funzionato. Riprova tra poco.' });
    }
}
