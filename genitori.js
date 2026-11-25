// Pagina d'ingresso per i genitori: crea un calendario "per bambini" e apre l'editor di sempre.
// Il segnale perBambini si salva sul server con il calendario. Il bambino lo guarda sul telefono
// del genitore: dopo «✅ Ho finito», su questo telefono si apre sempre la vista del bambino.

const $ = id => document.getElementById(id);

function mostraMessaggio(testo) {
    $('avviso').textContent = testo;
    $('avviso').hidden = false;
}

function leggiMemoria(chiave, predefinito) {
    try {
        return JSON.parse(localStorage.getItem(chiave)) ?? predefinito;
    } catch {
        return predefinito;
    }
}

function scriviMemoria(chiave, valore) {
    try {
        localStorage.setItem(chiave, JSON.stringify(valore));
    } catch {
        // Senza memoria si riparte da questa pagina
    }
}

// Su questo telefono c'è già un calendario per il bambino: si riapre quello
const inVistaBambino = leggiMemoria('vista_bambino', null);
const preparato = leggiMemoria('miei_calendari', []).find(voce => voce.id === leggiMemoria('calendario_bimbi', null));
if (typeof inVistaBambino === 'string' && inVistaBambino) {
    location.replace(`/bimbi.html?c=${encodeURIComponent(inVistaBambino)}`);
} else if (preparato?.chiave) {
    location.replace(`/?c=${encodeURIComponent(preparato.id)}&k=${encodeURIComponent(preparato.chiave)}&per=bimbi`);
}

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
            body: JSON.stringify({ azione: 'crea', titolo: `Il calendario di ${nome}`, perBambini: true })
        });
        const dati = await risposta.json().catch(() => ({}));
        if (!risposta.ok) throw new Error(dati.errore || 'Qualcosa non ha funzionato. Riprova tra poco.');
        // Il nome del bambino va già in "Per chi è il calendario?" (se non riesce, si scrive nell'editor)
        await fetch('/api/calendario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ azione: 'salva', id: dati.id, chiave: dati.chiave, destinatario: nome })
        }).catch(() => {});
        scriviMemoria('calendario_bimbi', dati.id);
        location.href = `/?c=${encodeURIComponent(dati.id)}&k=${encodeURIComponent(dati.chiave)}&per=bimbi`;
    } catch (errore) {
        mostraMessaggio(errore instanceof TypeError ? 'Manca la connessione. Riprova tra poco.' : errore.message);
        pulsante.disabled = false;
        pulsante.textContent = 'Crea il calendario';
    }
});
