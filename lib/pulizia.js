// Pulizia dei calendari preparati dai genitori, dopo la loro scadenza (31 gennaio dell'anno dopo).
// Regole:
// - guarda solo l'elenco dei calendari dei genitori; i calendari dei grandi non vengono mai toccati
// - cancella solo i file il cui nome appartiene al calendario scaduto (media/<ID>-<tipo>...), mai altro
// - se non è attiva, non cancella niente: scrive solo nel registro cosa cancellerebbe
import { calendariGenitori, eliminaCalendario, leggiCalendario, togliDaElencoGenitori } from './archivio.js';
import { fileDiQuestoCalendario, idValido, scaduto } from './calendario.js';

export async function pulisciScaduti({ redis, elencaFile, cancellaFile, adesso = Date.now(), attiva = false, registro = console.log }) {
    const esito = { attiva, controllati: 0, scaduti: [], file: 0 };
    for (const id of await calendariGenitori(redis)) {
        esito.controllati++;
        if (!idValido(id)) continue;
        const calendario = await leggiCalendario(redis, id);
        if (!calendario) {
            // Già cancellato a mano: si toglie solo dall'elenco
            if (attiva) await togliDaElencoGenitori(redis, id);
            continue;
        }
        if (!scaduto(calendario, adesso)) continue;

        // I file si cercano per nome e si tengono solo quelli esattamente di questo calendario
        const trovati = await elencaFile(`media/${id}-`);
        const file = trovati.filter(blob => fileDiQuestoCalendario(blob.pathname, id));
        esito.scaduti.push(id);
        esito.file += file.length;
        registro(`${attiva ? 'Cancello' : 'PROVA (pulizia spenta), cancellerei'}: calendario ${id}, scadenza ${calendario.scadenza}, ${file.length} file`);
        if (!attiva) continue;
        // Prima i file, poi il calendario: se i file non si cancellano, si riprova il giorno dopo
        if (file.length) await cancellaFile(file.map(blob => blob.url));
        await eliminaCalendario(redis, id);
    }
    return esito;
}
