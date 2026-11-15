# 🎄 Calendario_Avvento

**Un viaggio di 24 giorni di Meraviglia – calendario multimediale interattivo**

Ognuno crea il proprio calendario, lo riempie con foto, messaggi, link ai video, audio e messaggi vocali, poi lo regala con un link. Chi lo riceve esplora un villaggio innevato: ogni giorno di dicembre, secondo l'ora italiana, si apre una casa e dentro c'è un regalo da scartare.

Il sito è il progetto Vercel **villaggio-avvento**: https://villaggio-avvento.vercel.app

## Come funziona

- `/` apre il villaggio vuoto: al primo clic su una casa si sceglie per chi è il calendario e il calendario viene creato. Dal telefono c'è un modulo.
- `/demo.html` è la demo del villaggio, con regali di esempio.
- Il codice di invito è facoltativo: si chiede solo se `CODICE_INVITO` è impostato su Vercel, e in quel caso il link è `/?invito=CODICE`.
- `/?c=ID&k=CHIAVE` è il link segreto di modifica. Non esiste un modo per recuperarlo se si perde.
- `/?c=ID` è il link da regalare. I giorni chiusi non escono dal server.

Su schermi larghi almeno 900 px si usa il villaggio (`villaggio.js`): chi riceve il calendario apre una casa al giorno, chi lo prepara clicca le case per mettere le sorprese. Sui telefoni c'è la griglia di caselle.

## Dove stanno i dati

- **Redis (Upstash)**: titolo, anno e contenuto di ogni casella, in un hash per calendario. L'editor salva una casella alla volta, così due salvataggi vicini non si cancellano a vicenda.
- **Vercel Blob**: foto, audio, video e messaggi vocali. Non si usa per i dati dei calendari, perché dopo una sovrascrittura le letture restano vecchie per circa un minuto.

## Limiti

Foto 3 MB dopo la compressione, audio e messaggi vocali 10 MB, video 30 MB. Il piano gratuito di Vercel Blob include 1 GB di spazio e 10 GB di traffico al mese: oltre questi limiti l'archivio si blocca fino a 30 giorni, senza costi.

## Variabili su Vercel

- `KV_REST_API_URL`, `KV_REST_API_TOKEN`: database Redis, aggiunte dall'integrazione Upstash
- `BLOB_READ_WRITE_TOKEN`: accesso all'archivio dei file
- `BLOB_BASE_URL`: indirizzo pubblico dell'archivio
- `CODICE_INVITO` (facoltativa): se c'è, serve per creare un calendario
- `SEGRETO`: firma i link di modifica. Se cambia, i link già creati non funzionano più.

## Demo

I pezzi della demo stanno in `demo/`. Dopo ogni modifica al villaggio:

```bash
node demo/costruisci.cjs
```

## Prove

```bash
npm test
```
