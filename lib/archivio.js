import { Redis } from '@upstash/redis';
import { GIORNI, applicaModifiche, fileDelCalendario, pulisciBenvenuto, pulisciTitolo } from './calendario.js';

// Ogni calendario è un hash Redis: "meta" con titolo e anno, "g1".."g24" con le caselle piene.
// Redis legge sempre l'ultima versione e cambia solo i campi toccati,
// così due salvataggi vicini non si cancellano a vicenda
const chiaveRedis = id => `calendario:${id}`;

export function creaRedis() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('Database non configurato');
    return new Redis({ url, token });
}

function daHash(hash) {
    if (!hash?.meta) return null;
    const giorni = {};
    for (let numero = 1; numero <= GIORNI; numero++) {
        if (hash[`g${numero}`]) giorni[numero] = hash[`g${numero}`];
    }
    return { ...hash.meta, giorni };
}

export async function leggiCalendario(redis, id) {
    return daHash(await redis.hgetall(chiaveRedis(id)));
}

export async function creaCalendario(redis, id, calendario) {
    await redis.hset(chiaveRedis(id), { meta: { titolo: calendario.titolo, anno: calendario.anno } });
}

// Elimina il calendario e restituisce i suoi file dell'archivio, da togliere
export async function eliminaCalendario(redis, id) {
    const calendario = await leggiCalendario(redis, id);
    if (!calendario) return null;
    await redis.del(chiaveRedis(id));
    return fileDelCalendario(calendario, id);
}

// Applica solo le caselle cambiate. Restituisce il calendario aggiornato
// e i file dell'archivio non più usati, da eliminare
export async function salvaModifiche(redis, id, { titolo, benvenuto, modifiche }) {
    const attuale = await leggiCalendario(redis, id);
    if (!attuale) return { errore: 'Calendario non trovato.', stato: 404 };

    const esito = applicaModifiche(attuale, modifiche, id);
    if (esito.errore) return { errore: esito.errore, stato: 400 };

    const daScrivere = {};
    const daTogliere = [];
    for (const chiave of Object.keys(modifiche ?? {})) {
        const contenuto = esito.calendario.giorni[chiave];
        if (contenuto) daScrivere[`g${Number(chiave)}`] = contenuto;
        else daTogliere.push(`g${Number(chiave)}`);
    }
    const meta = {
        titolo: titolo === undefined ? attuale.titolo : pulisciTitolo(titolo),
        anno: attuale.anno,
        benvenuto: benvenuto === undefined ? (attuale.benvenuto ?? '') : pulisciBenvenuto(benvenuto)
    };
    daScrivere.meta = meta;

    await redis.hset(chiaveRedis(id), daScrivere);
    if (daTogliere.length) await redis.hdel(chiaveRedis(id), ...daTogliere);
    return { calendario: { ...esito.calendario, ...meta }, daEliminare: esito.daEliminare };
}
