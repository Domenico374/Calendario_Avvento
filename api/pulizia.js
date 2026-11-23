import { del, list } from '@vercel/blob';
import { creaRedis } from '../lib/archivio.js';
import { stessoSegreto } from '../lib/calendario.js';
import { pulisciScaduti } from '../lib/pulizia.js';

// La chiama Vercel una volta al giorno (vedi "crons" in vercel.json).
// CRON_SECRET è obbligatoria: senza, la pulizia non parte.
// PULIZIA_ATTIVA=si per cancellare davvero; altrimenti scrive solo nel registro cosa cancellerebbe.
export default async function handler(req, res) {
    const segreto = process.env.CRON_SECRET;
    if (!segreto) {
        console.error('Pulizia ferma: CRON_SECRET non impostata.');
        return res.status(500).json({ errore: 'Pulizia non configurata.' });
    }
    if (!stessoSegreto(`Bearer ${segreto}`, req.headers?.authorization)) {
        return res.status(401).json({ errore: 'Non autorizzato.' });
    }

    const attiva = process.env.PULIZIA_ATTIVA === 'si';
    try {
        const esito = await pulisciScaduti({ redis: creaRedis(), elencaFile: elencaTutti, cancellaFile: del, attiva });
        console.log(`Pulizia ${attiva ? 'attiva' : 'spenta (solo registro)'}: ${esito.controllati} calendari dei genitori controllati, ${esito.scaduti.length} scaduti, ${esito.file} file`);
        return res.status(200).json(esito);
    } catch (errore) {
        console.error('Pulizia non riuscita:', errore);
        return res.status(500).json({ errore: 'Pulizia non riuscita.' });
    }
}

async function elencaTutti(prefisso) {
    const tutti = [];
    let cursor;
    do {
        const pagina = await list({ prefix: prefisso, cursor, limit: 1000 });
        tutti.push(...pagina.blobs);
        cursor = pagina.hasMore ? pagina.cursor : undefined;
    } while (cursor);
    return tutti;
}
