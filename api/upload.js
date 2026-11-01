import { handleUpload } from '@vercel/blob/client';
import { LIMITI_FILE, chiaveValida } from '../lib/calendario.js';

// Autorizza il browser a caricare un solo file direttamente nell'archivio
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ errore: 'Richiesta non valida.' });

    try {
        const risposta = await handleUpload({
            body: req.body,
            request: req,
            onBeforeGenerateToken: async (percorso, datiCliente) => {
                const { id, chiave, tipo } = JSON.parse(datiCliente ?? '{}');
                const limite = LIMITI_FILE[tipo];
                if (!limite || !chiaveValida(id, chiave) || !percorso.startsWith(`media/${id}-`)) {
                    throw new Error('Caricamento non autorizzato.');
                }
                return {
                    allowedContentTypes: limite.tipi,
                    maximumSizeInBytes: limite.byte,
                    addRandomSuffix: true
                };
            },
            onUploadCompleted: async () => {}
        });
        return res.status(200).json(risposta);
    } catch (errore) {
        console.error(errore);
        return res.status(400).json({ errore: errore.message });
    }
}
