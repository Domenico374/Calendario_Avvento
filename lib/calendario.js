import crypto from 'node:crypto';

export const GIORNI = 24;
export const MAX_TITOLO = 80;
export const MAX_MESSAGGIO = 5000;
export const MAX_TESTO_LINK = 80;
export const MAX_BENVENUTO = 300;
export const MAX_LETTERA = 1000;
export const MAX_FIRMA = 40;
export const MAX_LETTERE = 30;
export const MAX_DESTINATARIO = 30;
export const MAX_LETTERA_BABBO = 1500;
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

// Confronto a tempo costante (per la parola segreta della pulizia)
export function stessoSegreto(atteso, ricevuto) {
    return typeof atteso === 'string' && atteso.length > 0 && typeof ricevuto === 'string' && uguali(atteso, ricevuto);
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

// ===== Scadenza dei calendari preparati dai genitori (segnale perBambini) =====
// Il calendario dell'Avvento di un anno si cancella dopo il 31 gennaio dell'anno dopo.
// I calendari dei grandi non hanno scadenza e non vengono mai toccati.
export function scadenzaCalendario(anno) {
    return `${Number(anno) + 1}-01-31`;
}

// Scaduto = calendario dei genitori, con una scadenza valida, e il giorno di scadenza è finito (ora italiana)
export function scaduto(calendario, adesso = Date.now()) {
    if (calendario?.perBambini !== true) return false;
    const scadenza = calendario.scadenza;
    if (typeof scadenza !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(scadenza)) return false;
    const fine = Date.parse(`${scadenza}T23:59:59.999+01:00`);
    return Number.isFinite(fine) && Number(adesso) > fine;
}

// I file dell'archivio di un calendario si chiamano media/<ID>-<tipo>[-<parte casuale>].<estensione>
// (vedi caricaFile in script.js). Solo i nomi esattamente così appartengono al calendario.
export function fileDiQuestoCalendario(nome, id) {
    if (typeof nome !== 'string' || !idValido(id)) return false;
    const idSicuro = id.replace(/-/g, '\\-');
    const tipi = Object.keys(LIMITI_FILE).join('|');
    return new RegExp(`^media/${idSicuro}-(?:${tipi})(?:-[A-Za-z0-9]+)?\\.[A-Za-z0-9]+$`).test(nome);
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

// Il benvenuto scritto da chi prepara il calendario, che compare in stazione
export function pulisciBenvenuto(testo) {
    if (typeof testo !== 'string') return '';
    return testo.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_BENVENUTO);
}

// Il nome di chi riceve il calendario (sul sacco della posta) e la letterina di Babbo Natale per lui
export function pulisciDestinatario(nome) {
    return typeof nome === 'string' ? nome.replace(/\s+/g, ' ').trim().slice(0, MAX_DESTINATARIO) : '';
}

export function pulisciLetteraBabbo(testo) {
    if (typeof testo !== 'string') return '';
    return testo.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_LETTERA_BABBO);
}

// Una letterina a Babbo Natale scritta da chi ha ricevuto il calendario
export function pulisciLettera({ testo, firma } = {}, adesso = new Date()) {
    const pulito = typeof testo === 'string' ? testo.replace(/\r\n?/g, '\n').trim().slice(0, MAX_LETTERA) : '';
    if (!pulito) return null;
    const nome = typeof firma === 'string' ? firma.replace(/\s+/g, ' ').trim().slice(0, MAX_FIRMA) : '';
    return { testo: pulito, firma: nome, data: adesso.toISOString() };
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
    return {
        titolo: calendario.titolo,
        anno: calendario.anno,
        benvenuto: calendario.benvenuto ?? '',
        destinatario: calendario.destinatario ?? '',
        letteraBabbo: calendario.letteraBabbo ?? '',
        aperti,
        giorni
    };
}
