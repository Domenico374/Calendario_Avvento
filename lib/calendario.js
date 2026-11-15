import crypto from 'node:crypto';

export const GIORNI = 24;
export const MAX_TITOLO = 80;
export const MAX_MESSAGGIO = 5000;
export const MAX_TESTO_LINK = 80;
const MAX_LINK = 500;

// Solo indirizzi web veri: niente javascript: o altri schemi pericolosi
export function linkSicuro(valore) {
    if (typeof valore !== 'string' || valore.length > MAX_LINK) return null;
    try {
        const url = new URL(valore.trim());
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch {
        return null;
    }
}

// Dimensioni massime per ogni file caricato
export const LIMITI_FILE = {
    foto: { byte: 3 * 1024 * 1024, tipi: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
    audio: { byte: 10 * 1024 * 1024, tipi: ['audio/*'] },
    vocale: { byte: 10 * 1024 * 1024, tipi: ['audio/*', 'video/webm'] },
    video: { byte: 30 * 1024 * 1024, tipi: ['video/mp4', 'video/webm', 'video/quicktime'] }
};

const TIPI_CON_FILE = Object.keys(LIMITI_FILE);

function segreto() {
    if (!process.env.SEGRETO) throw new Error('SEGRETO mancante');
    return process.env.SEGRETO;
}

export function firma(scopo, id) {
    return crypto.createHmac('sha256', segreto()).update(`${scopo}:${id}`).digest('base64url').slice(0, 32);
}

function uguali(a, b) {
    const bufferA = Buffer.from(String(a));
    const bufferB = Buffer.from(String(b));
    return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

export function idValido(id) {
    return typeof id === 'string' && /^[A-Za-z0-9_-]{10,16}$/.test(id);
}

export function chiaveValida(id, chiave) {
    return idValido(id) && typeof chiave === 'string' && uguali(firma('modifica', id), chiave);
}

// Se CODICE_INVITO non è impostato su Vercel, chiunque può creare un calendario
export function codiceValido(codice) {
    const atteso = process.env.CODICE_INVITO;
    if (!atteso) return true;
    return typeof codice === 'string' && uguali(atteso, codice.trim());
}

export function nuovoId() {
    return crypto.randomBytes(9).toString('base64url');
}

function dataRoma(adesso) {
    const parti = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Rome', year: 'numeric', month: 'numeric', day: 'numeric'
    }).formatToParts(adesso);
    const valore = tipo => Number(parti.find(p => p.type === tipo).value);
    return { anno: valore('year'), mese: valore('month'), giorno: valore('day') };
}

// L'anno del prossimo dicembre ancora utile: dopo il 24 si passa all'anno seguente
export function annoCalendario(adesso = new Date()) {
    const { anno, mese, giorno } = dataRoma(adesso);
    return mese === 12 && giorno > GIORNI ? anno + 1 : anno;
}

// Quanti giorni sono sbloccati, secondo l'ora italiana
export function giorniAperti(annoScelto, adesso = new Date()) {
    const { anno, mese, giorno } = dataRoma(adesso);
    if (anno < annoScelto || (anno === annoScelto && mese < 12)) return 0;
    if (anno === annoScelto) return Math.min(giorno, GIORNI);
    return GIORNI;
}

export function pulisciTitolo(titolo) {
    const pulito = typeof titolo === 'string' ? titolo.trim().slice(0, MAX_TITOLO) : '';
    return pulito || "Calendario dell'Avvento";
}

function urlDelCalendario(url, id) {
    const base = process.env.BLOB_BASE_URL;
    return typeof url === 'string' && Boolean(base) && url.startsWith(`${base}/media/${id}-`);
}

export function pulisciContenuto(contenuto, id) {
    if (!contenuto || typeof contenuto !== 'object') return null;
    const { tipo } = contenuto;

    if (tipo === 'messaggio') {
        const testo = typeof contenuto.testo === 'string' ? contenuto.testo.trim() : '';
        return testo && testo.length <= MAX_MESSAGGIO ? { tipo, testo } : null;
    }
    if (tipo === 'youtube') {
        return /^[A-Za-z0-9_-]{11}$/.test(contenuto.video ?? '') ? { tipo, video: contenuto.video } : null;
    }
    if (tipo === 'link') {
        const url = linkSicuro(contenuto.url);
        if (!url) return null;
        const testo = typeof contenuto.testo === 'string' ? contenuto.testo.trim().slice(0, MAX_TESTO_LINK) : '';
        return testo ? { tipo, url, testo } : { tipo, url };
    }
    if (TIPI_CON_FILE.includes(tipo)) {
        return urlDelCalendario(contenuto.url, id) ? { tipo, url: contenuto.url } : null;
    }
    return null;
}

export function pulisciGiorni(giorni, id) {
    const puliti = {};
    if (!giorni || typeof giorni !== 'object') return puliti;
    for (let numero = 1; numero <= GIORNI; numero++) {
        const contenuto = pulisciContenuto(giorni[numero], id);
        if (contenuto) puliti[numero] = contenuto;
    }
    return puliti;
}

// Applica al calendario solo le caselle cambiate (null = svuota la casella).
// Restituisce anche i file non più usati, da togliere dall'archivio
export function applicaModifiche(calendario, modifiche, id) {
    const giorni = { ...calendario.giorni };
    const daEliminare = [];
    for (const [chiave, contenuto] of Object.entries(modifiche ?? {})) {
        const numero = Number(chiave);
        if (!Number.isInteger(numero) || numero < 1 || numero > GIORNI) return { errore: 'Giorno non valido.' };
        const pulito = contenuto === null ? null : pulisciContenuto(contenuto, id);
        if (contenuto !== null && !pulito) return { errore: 'Contenuto non valido.' };
        const precedente = giorni[numero];
        if (precedente?.url && urlDelCalendario(precedente.url, id) && precedente.url !== pulito?.url) daEliminare.push(precedente.url);
        if (pulito) giorni[numero] = pulito;
        else delete giorni[numero];
    }
    return { calendario: { ...calendario, giorni }, daEliminare };
}

// I file dell'archivio usati da un calendario, da togliere quando lo si elimina
export function fileDelCalendario(calendario, id) {
    return Object.values(calendario?.giorni ?? {}).map(contenuto => contenuto?.url).filter(url => urlDelCalendario(url, id));
}

// Ciò che può vedere chi ha il link: mai i giorni ancora chiusi
export function vistaPubblica(calendario, adesso = new Date()) {
    const aperti = giorniAperti(calendario.anno, adesso);
    const giorni = {};
    for (let numero = 1; numero <= aperti; numero++) {
        if (calendario.giorni[numero]) giorni[numero] = calendario.giorni[numero];
    }
    return { titolo: calendario.titolo, anno: calendario.anno, aperti, giorni };
}
