// Pagina d'ingresso per i genitori: crea un calendario "per bambini" e apre l'editor di sempre.
// Il segnale perBambini si salva sul server con il calendario: nell'editor il link da regalare
// diventa quello della versione per bambini (bimbi.html), anche cambiando telefono.

const $ = id => document.getElementById(id);
const parametri = new URLSearchParams(location.search);

function mostraMessaggio(testo) {
    $('avviso').textContent = testo;
    $('avviso').hidden = false;
}

// Chi arriva da un link con il codice di invito non deve scriverlo
$('codice-invito').value = parametri.get('invito') ?? '';

$('form-genitori').addEventListener('submit', async evento => {
    evento.preventDefault();
    const nome = $('nome-bambino').value.replace(/\s+/g, ' ').trim();
    if (!nome) {
        $('nome-bambino').focus();
        return;
    }
    const pulsante = $('btnCrea');
    pulsante.disabled = true;
    pulsante.textContent = 'Creo il calendario...';
    try {
        const risposta = await fetch('/api/calendario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ azione: 'crea', titolo: `Il calendario di ${nome}`, codice: $('codice-invito').value, perBambini: true })
        });
        const dati = await risposta.json().catch(() => ({}));
        if (!risposta.ok) {
            // Se il sito chiede il codice di invito, compare il campo per scriverlo
            if (risposta.status === 403) $('campo-codice').hidden = false;
            throw new Error(dati.errore || 'Qualcosa non ha funzionato. Riprova tra poco.');
        }
        // Il nome del bambino va già in "Per chi è il calendario?" (se non riesce, si scrive nell'editor)
        await fetch('/api/calendario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ azione: 'salva', id: dati.id, chiave: dati.chiave, destinatario: nome })
        }).catch(() => {});
        location.href = `/?c=${encodeURIComponent(dati.id)}&k=${encodeURIComponent(dati.chiave)}&per=bimbi`;
    } catch (errore) {
        mostraMessaggio(errore instanceof TypeError ? 'Manca la connessione. Riprova tra poco.' : errore.message);
        pulsante.disabled = false;
        pulsante.textContent = 'Crea il calendario';
    }
});
