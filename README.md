# 🎄 Calendario_Avvento

**Un viaggio di 24 giorni di Meraviglia – calendario multimediale interattivo**

Ognuno crea il proprio calendario, lo riempie con foto, messaggi, audio, video e messaggi vocali, poi lo regala con un link. Chi lo riceve vede ogni casella solo dal suo giorno di dicembre, secondo l'ora italiana.

## Come funziona

- `/` crea un nuovo calendario con il codice di invito.
- `/?c=ID&k=CHIAVE` è il link segreto di modifica. Non esiste un modo per recuperarlo se si perde.
- `/?c=ID` è il link da regalare. I giorni chiusi non escono dal server.

## Limiti

Foto 3 MB dopo la compressione, audio e messaggi vocali 10 MB, video 30 MB. I file stanno su Vercel Blob: il piano gratuito include 1 GB di spazio e 10 GB di traffico al mese. Oltre questi limiti l'archivio si blocca fino a 30 giorni, senza costi.

## Variabili su Vercel

- `BLOB_READ_WRITE_TOKEN`: accesso all'archivio
- `BLOB_BASE_URL`: indirizzo pubblico dell'archivio
- `CODICE_INVITO`: codice per creare un calendario
- `SEGRETO`: firma i link di modifica. Se cambia, i link già creati non funzionano più.

## Prove

```bash
npm test
```
