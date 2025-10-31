// Configurazione capacità avanzata
const CONFIG = {
    spazioTotale: 100, // 100MB totali!
    limitePerFoto: 10, // 10MB max per foto (prima della compressione)
    limitePerVideo: 30, // 30MB max per video
    formatiSupportati: {
        foto: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
        audio: ['mp3', 'wav', 'ogg', 'm4a'],
        video: ['mp4', 'webm', 'mov', 'avi']
    },
    compressione: {
        qualitaDefault: 0.8,
        maxLarghezza: 1600,
        maxAltezza: 1600
    }
};

// Variabili globali
let giornoCorrente = 1;
let modalitaAdmin = true;
let fileOriginale = null;
let immagineComprimita = null;
let mediaRecorder = null;
let audioChunks = [];
let timerInterval = null;
let tempoRegistrazione = 0;

// Inizializzazione quando la pagina carica
document.addEventListener('DOMContentLoaded', function() {
    caricaCalendario();
    inizializzaDragDrop();
    aggiornaSpazioDisplay();
    inizializzaAudio(); // ← AGGIUNGI QUESTA RIGA!
});

// ========== GESTIONE CALENDARIO ==========

function caricaCalendario() {
    for (let giorno = 1; giorno <= 24; giorno++) {
        const contenuto = localStorage.getItem(`giorno_${giorno}`);
        if (contenuto) {
            const pulsante = document.querySelector(`.pulsante[onclick*="${giorno}"]`);
            if (pulsante) {
                pulsante.classList.add('contenutoSalvato');
            }
        }
    }
}

function gestisciClickCasella(giorno) {
    // Doppio click per modalità admin
    if (event.detail === 2) {
        apriModal(giorno);
    } else {
        // Click singolo per visualizzazione normale
        apriCasellaVisualizzazione(giorno);
    }
}

function apriModal(giorno) {
    giornoCorrente = giorno;
    modalitaAdmin = true;
    
    // Mostra modal amministrazione
    document.getElementById('modal-amministrazione').style.display = 'block';
    document.getElementById('modal-visualizzazione').style.display = 'none';
    
    // Aggiorna interfaccia
    aggiornaInterfacciaModal();
    caricaContenutoGiorno();
    
    // Mostra modal
    document.getElementById('modal').classList.add('mostra');
}

function apriCasellaVisualizzazione(giorno) {
    const contenutoSalvato = localStorage.getItem(`giorno_${giorno}`);
    
    if (contenutoSalvato) {
        const dati = JSON.parse(contenutoSalvato);
        mostraVisualizzazione(giorno, dati);
    } else {
        // Se non c'è contenuto, mostra modalità admin
        apriModal(giorno);
    }
}

function mostraVisualizzazione(giorno, dati) {
    document.getElementById('modal-amministrazione').style.display = 'none';
    document.getElementById('modal-visualizzazione').style.display = 'block';
    
    // Imposta il titolo
    document.getElementById('visualizzazione-titolo').textContent = `${giorno} dicembre`;
    
    // Imposta il contenuto in base al tipo
    const container = document.getElementById('visualizzazione-contenuto');
    container.innerHTML = '';
    
    switch(dati.tipo) {
        case 'messaggio':
            container.innerHTML = `<div class="contenuto-messaggio">${dati.contenuto}</div>`;
            break;
        case 'foto':
            container.innerHTML = `<div class="contenuto-immagine"><img src="${dati.contenuto}" alt="Immagine del ${giorno} dicembre"></div>`;
            break;
        case 'audio':
            container.innerHTML = `<div class="contenuto-audio"><audio controls src="${dati.contenuto}"></audio></div>`;
            break;
        case 'video':
            container.innerHTML = `<div class="contenuto-video"><video controls src="${dati.contenuto}" style="max-width:100%"></video></div>`;
            break;
        case 'youtube':
            const videoId = estraiIdYouTube(dati.contenuto);
            container.innerHTML = `<div class="contenuto-video"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
            break;
        case 'messaggio-vocale':
            container.innerHTML = `<div class="contenuto-audio"><audio controls src="${dati.contenuto}"></audio><p>🎤 Messaggio vocale</p></div>`;
            break;
    }
    
    // Mostra la modal
    document.getElementById('modal').classList.add('mostra');
    modalitaAdmin = false;
}

function estraiIdYouTube(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function tornaAdAdmin() {
    document.getElementById('modal-amministrazione').style.display = 'block';
    document.getElementById('modal-visualizzazione').style.display = 'none';
    modalitaAdmin = true;
    caricaContenutoGiorno();
}

function chiudiModal() {
    document.getElementById('modal').classList.remove('mostra');
    if (!modalitaAdmin) {
        tornaAdAdmin(); // Ripristina la modalità admin quando si chiude
    }
    // Reset editor
    nascondiTuttiEditor();
    resetUploadFoto();
}

function aggiornaInterfacciaModal() {
    // Aggiorna dati giorno
    document.getElementById('modal-data-giorno').textContent = `${giornoCorrente} dicembre`;
    document.getElementById('modal-numero-giorno').textContent = giornoCorrente;
    
    // Aggiorna debug info
    document.getElementById('debug-giorno').textContent = giornoCorrente;
}

function cambiaGiorno(direzione) {
    const nuovoGiorno = giornoCorrente + direzione;
    if (nuovoGiorno >= 1 && nuovoGiorno <= 24) {
        giornoCorrente = nuovoGiorno;
        aggiornaInterfacciaModal();
        caricaContenutoGiorno();
        nascondiTuttiEditor();
    }
}

// ========== GESTIONE CONTENUTI ==========

function caricaContenutoGiorno() {
    const contenuto = localStorage.getItem(`giorno_${giornoCorrente}`);
    const container = document.getElementById('anteprima-contenuto-attuale');
    
    if (contenuto) {
        const dati = JSON.parse(contenuto);
        document.getElementById('debug-tipo').textContent = dati.tipo;
        
        switch(dati.tipo) {
            case 'messaggio':
                container.innerHTML = `<div class="messaggio-testo">${dati.contenuto}</div>`;
                break;
            case 'foto':
                container.innerHTML = `<div class="contenuto-immagine"><img src="${dati.contenuto}" alt="Anteprima" style="max-width: 200px; max-height: 150px;"></div>`;
                break;
            case 'audio':
                container.innerHTML = `<div class="contenuto-audio"><audio controls src="${dati.contenuto}" style="max-width: 100%;"></audio></div>`;
                break;
            case 'video':
                container.innerHTML = `<div class="contenuto-video"><video controls src="${dati.contenuto}" style="max-width: 200px; max-height: 150px;"></video></div>`;
                break;
            case 'youtube':
                const videoId = estraiIdYouTube(dati.contenuto);
                container.innerHTML = `<div class="contenuto-video"><iframe width="200" height="113" src="https://www.youtube.com/embed/${videoId}" frameborder="0"></iframe></div>`;
                break;
            case 'messaggio-vocale':
                container.innerHTML = `<div class="contenuto-audio"><audio controls src="${dati.contenuto}" style="max-width: 100%;"></audio><p>🎤 Messaggio vocale</p></div>`;
                break;
        }
    } else {
        container.innerHTML = '<p class="nessun-contenuto">Nessun contenuto salvato per questo giorno</p>';
        document.getElementById('debug-tipo').textContent = '-';
    }
}

function salvaContenuto(tipo, contenuto, dimensione = 0) {
    // Controllo spazio
    const spazioAttuale = calcolaSpazioUtilizzato();
    const nuovoSpazio = spazioAttuale + dimensione;
    
    if (nuovoSpazio > CONFIG.spazioTotale) {
        alert(`Spazio insufficiente! Hai ${spazioAttuale.toFixed(1)}MB utilizzati su ${CONFIG.spazioTotale}MB totali.`);
        return false;
    }
    
    // Salva i dati
    const dati = {
        tipo: tipo,
        contenuto: contenuto,
        dimensione: dimensione,
        dataSalvataggio: new Date().toISOString()
    };
    
    localStorage.setItem(`giorno_${giornoCorrente}`, JSON.stringify(dati));
    
    // Aggiorna interfaccia
    const pulsante = document.querySelector(`.pulsante[onclick*="${giornoCorrente}"]`);
    pulsante.classList.add('contenutoSalvato');
    
    caricaContenutoGiorno();
    aggiornaSpazioDisplay();
    
    mostraMessaggio('Contenuto salvato con successo!', 'successo');
    return true;
}

function eliminaContenuto() {
    if (confirm('Sei sicuro di voler eliminare il contenuto di questo giorno?')) {
        localStorage.removeItem(`giorno_${giornoCorrente}`);
        
        // Aggiorna interfaccia
        const pulsante = document.querySelector(`.pulsante[onclick*="${giornoCorrente}"]`);
        pulsante.classList.remove('contenutoSalvato');
        
        caricaContenutoGiorno();
        aggiornaSpazioDisplay();
        
        mostraMessaggio('Contenuto eliminato!', 'successo');
    }
}

// ========== EDITOR CONTENUTI ==========

function nascondiTuttiEditor() {
    const editors = document.querySelectorAll('.editor-dinamico');
    editors.forEach(editor => {
        editor.style.display = 'none';
    });
}

// === EDITOR FOTO ===
function mostraEditorFoto() {
    nascondiTuttiEditor();
    document.getElementById('editor-foto').style.display = 'block';
    // Aggiorna pulsante salva
    document.querySelector('.azioni .bottone').onclick = salvaContenutoFoto;
}

function inizializzaDragDrop() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle file input change
    fileInput.addEventListener('change', handleFileSelect, false);
    
    // Inizializza slider qualità
    const qualitaSlider = document.getElementById('qualitaSlider');
    const qualitaValue = document.getElementById('qualitaValue');
    
    qualitaSlider.addEventListener('input', function() {
        qualitaValue.textContent = Math.round(this.value * 100) + '%';
        if (fileOriginale) {
            processaImmagine(fileOriginale);
        }
    });
    
    // Inizializza select dimensione
    document.getElementById('dimensioneSelect').addEventListener('change', function() {
        if (fileOriginale) {
            processaImmagine(fileOriginale);
        }
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    document.getElementById('dropArea').classList.add('dragover');
}

function unhighlight() {
    document.getElementById('dropArea').classList.remove('dragover');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        
        // Verifica formato
        const estensione = file.name.split('.').pop().toLowerCase();
        if (!CONFIG.formatiSupportati.foto.includes(estensione)) {
            mostraMessaggio('Formato file non supportato! Usa JPG, PNG, GIF, WEBP o BMP.', 'errore');
            return;
        }
        
        // Verifica dimensione
        const dimensioneMB = file.size / (1024 * 1024);
        if (dimensioneMB > CONFIG.limitePerFoto) {
            mostraMessaggio(`File troppo grande! Massimo ${CONFIG.limitePerFoto}MB`, 'errore');
            return;
        }
        
        fileOriginale = file;
        processaImmagine(file);
    }
}

async function processaImmagine(file) {
    mostraMessaggio('Sto processando l\'immagine...', 'info');
    
    try {
        const qualita = parseFloat(document.getElementById('qualitaSlider').value);
        const dimensioneMax = document.getElementById('dimensioneSelect').value;
        
        // Leggi il file originale
        const arrayBuffer = await file.arrayBuffer();
        const blobOriginale = new Blob([arrayBuffer], { type: file.type });
        const urlOriginale = URL.createObjectURL(blobOriginale);
        
        // Mostra anteprima originale
        mostraAnteprima('anteprimaOriginale', urlOriginale, blobOriginale.size, 'originale');
        
        // Comprimi l'immagine
        immagineComprimita = await comprimiImmagineAvanzata(file, qualita, dimensioneMax);
        
        // Calcola dimensioni
        const dimensioneOriginaleMB = (blobOriginale.size / (1024 * 1024)).toFixed(2);
        const dimensioneComprimitaMB = ((immagineComprimita.length * 0.75) / (1024 * 1024)).toFixed(2);
        const risparmio = (((blobOriginale.size - (immagineComprimita.length * 0.75)) / blobOriginale.size) * 100).toFixed(1);
        
        // Mostra anteprima compressa
        mostraAnteprima('anteprimaCompressa', immagineComprimita, immagineComprimita.length * 0.75, 'compressa');
        
        // Mostra risparmio
        document.getElementById('risparmioSpazio').innerHTML = 
            `🎉 Risparmiato il ${risparmio}% di spazio!<br>
             ${dimensioneOriginaleMB}MB → ${dimensioneComprimitaMB}MB`;
        
        // Mostra sezione anteprima
        document.getElementById('anteprimaCompressione').style.display = 'block';
        
        mostraMessaggio('Immagine pronta! Clicca Salva per confermare.', 'successo');
        
    } catch (error) {
        console.error('Errore nella compressione:', error);
        mostraMessaggio('Errore nella compressione dell\'immagine', 'errore');
    }
}

function comprimiImmagineAvanzata(file, qualita, dimensioneMax) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let { larghezza, altezza } = calcolaDimensioni(img.width, img.height, dimensioneMax);
                
                canvas.width = larghezza;
                canvas.height = altezza;
                
                // Migliora la qualità del ridimensionamento
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, larghezza, altezza);
                
                // Converti in base64 con qualità specificata
                const immagineComprimata = canvas.toDataURL('image/jpeg', qualita);
                resolve(immagineComprimata);
            };
            
            img.onerror = reject;
        };
        
        reader.onerror = reject;
    });
}

function calcolaDimensioni(larghezzaOriginale, altezzaOriginale, dimensioneMax) {
    if (dimensioneMax === 'originale') {
        return { larghezza: larghezzaOriginale, altezza: altezzaOriginale };
    }
    
    const max = parseInt(dimensioneMax);
    let larghezza = larghezzaOriginale;
    let altezza = altezzaOriginale;
    
    if (larghezzaOriginale > altezzaOriginale && larghezzaOriginale > max) {
        larghezza = max;
        altezza = (altezzaOriginale * max) / larghezzaOriginale;
    } else if (altezzaOriginale > max) {
        altezza = max;
        larghezza = (larghezzaOriginale * max) / altezzaOriginale;
    }
    
    return { larghezza: Math.round(larghezza), altezza: Math.round(altezza) };
}

function mostraAnteprima(elementId, src, dimensioneBytes, tipo) {
    const container = document.getElementById(elementId);
    const dimensioneMB = (dimensioneBytes / (1024 * 1024)).toFixed(2);
    
    container.innerHTML = `
        <img src="${src}" alt="Anteprima ${tipo}" style="max-width: 100%; max-height: 150px; border-radius: 8px;">
        <p>${dimensioneMB} MB</p>
    `;
}

async function caricaDaURL() {
    const urlInput = document.getElementById('urlImmagine');
    const url = urlInput.value.trim();
    
    if (!url) {
        mostraMessaggio('Inserisci un URL valido', 'errore');
        return;
    }
    
    try {
        mostraMessaggio('Sto scaricando l\'immagine...', 'info');
        
        // Verifica che sia un'immagine
        const estensione = url.split('.').pop().toLowerCase().split('?')[0];
        if (!CONFIG.formatiSupportati.foto.includes(estensione)) {
            mostraMessaggio('L\'URL non punta a un\'immagine supportata', 'errore');
            return;
        }
        
        // Scarica l'immagine
        const response = await fetch(url);
        if (!response.ok) throw new Error('Errore nel download');
        
        const blob = await response.blob();
        const file = new File([blob], 'immagine.jpg', { type: blob.type });
        
        fileOriginale = file;
        processaImmagine(file);
        
    } catch (error) {
        console.error('Errore nel caricamento da URL:', error);
        mostraMessaggio('Errore nel caricamento dell\'immagine dall\'URL', 'errore');
    }
}

function salvaContenutoFoto() {
    if (!immagineComprimita) {
        mostraMessaggio('Prima carica un\'immagine!', 'errore');
        return;
    }
    
    const dimensioneMB = (immagineComprimita.length * 0.75) / (1024 * 1024);
    const successo = salvaContenuto('foto', immagineComprimita, dimensioneMB);
    
    if (successo) {
        resetUploadFoto();
    }
}

function resetUploadFoto() {
    immagineComprimita = null;
    fileOriginale = null;
    document.getElementById('anteprimaCompressione').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('urlImmagine').value = '';
}

// === EDITOR MESSAGGIO ===
function mostraEditorMessaggio() {
    nascondiTuttiEditor();
    document.getElementById('editor-messaggio').style.display = 'block';
    document.querySelector('.azioni .bottone').onclick = salvaContenutoMessaggio;
}

function salvaContenutoMessaggio() {
    const testo = document.getElementById('testo-messaggio').value.trim();
    if (!testo) {
        mostraMessaggio('Inserisci un messaggio!', 'errore');
        return;
    }
    
    salvaContenuto('messaggio', testo, 0.01); // Messaggi occupano pochissimo spazio
    document.getElementById('testo-messaggio').value = '';
}

// === EDITOR AUDIO ===
function mostraEditorAudio() {
    nascondiTuttiEditor();
    document.getElementById('editor-audio').style.display = 'block';
    document.querySelector('.azioni .bottone').onclick = salvaContenutoAudio;
}

function salvaContenutoAudio() {
    const fileInput = document.getElementById('fileAudio');
    const urlInput = document.getElementById('urlAudio').value.trim();
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const dimensioneMB = file.size / (1024 * 1024);
            salvaContenuto('audio', e.target.result, dimensioneMB);
            fileInput.value = '';
        };
        
        reader.readAsDataURL(file);
    } else if (urlInput) {
        salvaContenuto('audio', urlInput, 0.1); // URL occupa poco spazio
        document.getElementById('urlAudio').value = '';
    } else {
        mostraMessaggio('Carica un file audio o inserisci un URL!', 'errore');
    }
}

function salvaAudioDaURL() {
    const urlInput = document.getElementById('urlAudio');
    const url = urlInput.value.trim();
    
    if (url) {
        salvaContenuto('audio', url, 0.1);
        urlInput.value = '';
    } else {
        mostraMessaggio('Inserisci un URL valido!', 'errore');
    }
}

// === EDITOR VIDEO ===
function mostraEditorVideo() {
    nascondiTuttiEditor();
    document.getElementById('editor-video').style.display = 'block';
    document.querySelector('.azioni .bottone').onclick = salvaContenutoVideo;
}

function salvaContenutoVideo() {
    const fileInput = document.getElementById('fileVideo');
    const urlInput = document.getElementById('urlVideo').value.trim();
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const dimensioneMB = file.size / (1024 * 1024);
            salvaContenuto('video', e.target.result, dimensioneMB);
            fileInput.value = '';
        };
        
        reader.readAsDataURL(file);
    } else if (urlInput) {
        salvaContenuto('video', urlInput, 0.1);
        document.getElementById('urlVideo').value = '';
    } else {
        mostraMessaggio('Carica un file video o inserisci un URL!', 'errore');
    }
}

function salvaVideoDaURL() {
    const urlInput = document.getElementById('urlVideo');
    const url = urlInput.value.trim();
    
    if (url) {
        salvaContenuto('video', url, 0.1);
        urlInput.value = '';
    } else {
        mostraMessaggio('Inserisci un URL valido!', 'errore');
    }
}

// === EDITOR YOUTUBE ===
function mostraEditorYouTube() {
    nascondiTuttiEditor();
    document.getElementById('editor-youtube').style.display = 'block';
    document.querySelector('.azioni .bottone').onclick = salvaYouTube;
}

function salvaYouTube() {
    const url = document.getElementById('urlYouTube').value.trim();
    if (!url) {
        mostraMessaggio('Inserisci un URL di YouTube!', 'errore');
        return;
    }
    
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        mostraMessaggio('Inserisci un URL valido di YouTube!', 'errore');
        return;
    }
    
    salvaContenuto('youtube', url, 0.01);
    document.getElementById('urlYouTube').value = '';
}

// === EDITOR MESSAGGIO VOCALE ===
function mostraEditorMessaggioVocale() {
    nascondiTuttiEditor();
    document.getElementById('editor-messaggio-vocale').style.display = 'block';
    document.querySelector('.azioni .bottone').onclick = salvaContenutoMessaggioVocale;
}

async function iniziaRegistrazione() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Salva automaticamente
            const dimensioneMB = audioBlob.size / (1024 * 1024);
            salvaContenuto('messaggio-vocale', audioUrl, dimensioneMB);
            
            // Ferma lo stream
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        
        // Mostra controlli registrazione
        document.getElementById('btnRegistra').style.display = 'none';
        document.getElementById('controlliRegistrazione').style.display = 'block';
        
        // Avvia timer
        tempoRegistrazione = 0;
        timerInterval = setInterval(() => {
            tempoRegistrazione++;
            const minuti = Math.floor(tempoRegistrazione / 60).toString().padStart(2, '0');
            const secondi = (tempoRegistrazione % 60).toString().padStart(2, '0');
            document.getElementById('timerRegistrazione').textContent = `${minuti}:${secondi}`;
        }, 1000);
        
    } catch (error) {
        console.error('Errore nella registrazione:', error);
        mostraMessaggio('Errore nell\'accesso al microfono', 'errore');
    }
}

function fermaRegistrazione() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        clearInterval(timerInterval);
        
        // Ripristina interfaccia
        document.getElementById('btnRegistra').style.display = 'block';
        document.getElementById('controlliRegistrazione').style.display = 'none';
        document.getElementById('timerRegistrazione').textContent = '00:00';
    }
}

function salvaContenutoMessaggioVocale() {
    const fileInput = document.getElementById('fileVocale');
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const dimensioneMB = file.size / (1024 * 1024);
            salvaContenuto('messaggio-vocale', e.target.result, dimensioneMB);
            fileInput.value = '';
        };
        
        reader.readAsDataURL(file);
    } else {
        mostraMessaggio('Registra un messaggio vocale o carica un file audio!', 'errore');
    }
}

// ========== GESTIONE SPAZIO ==========

function calcolaSpazioUtilizzato() {
    let spazioTotale = 0;
    
    for (let giorno = 1; giorno <= 24; giorno++) {
        const contenuto = localStorage.getItem(`giorno_${giorno}`);
        if (contenuto) {
            const dati = JSON.parse(contenuto);
            spazioTotale += dati.dimensione || 0;
        }
    }
    
    return spazioTotale;
}

function aggiornaSpazioDisplay() {
    const spazioUtilizzato = calcolaSpazioUtilizzato();
    const spazioLibero = CONFIG.spazioTotale - spazioUtilizzato;
    const percentuale = (spazioUtilizzato / CONFIG.spazioTotale) * 100;
    
    document.getElementById('spazio-display').innerHTML = `
        <strong>Spazio: ${spazioUtilizzato.toFixed(1)}MB / ${CONFIG.spazioTotale}MB</strong>
        <div class="barra-progresso">
            <div class="barra-riempimento" style="width: ${percentuale}%"></div>
        </div>
        <small>Libero: ${spazioLibero.toFixed(1)}MB</small>
    `;
    
    // Cambia colore in base allo spazio rimanente
    const display = document.getElementById('spazio-display');
    if (spazioLibero < 10) {
        display.style.color = '#dc3545';
    } else if (spazioLibero < 25) {
        display.style.color = '#ffc107';
    } else {
        display.style.color = '#28a745';
    }
}

function controllaSpazio() {
    const spazioUtilizzato = calcolaSpazioUtilizzato();
    const giorni = [];
    
    for (let i = 1; i <= 24; i++) {
        const contenuto = localStorage.getItem(`giorno_${i}`);
        if (contenuto) {
            const dati = JSON.parse(contenuto);
            giorni.push({
                giorno: i,
                tipo: dati.tipo,
                dimensione: dati.dimensione || 0
            });
        }
    }
    
    // Ordina per dimensione (decrescente)
    giorni.sort((a, b) => b.dimensione - a.dimensione);
    
    let messaggio = `Spazio totale utilizzato: ${spazioUtilizzato.toFixed(2)}MB / ${CONFIG.spazioTotale}MB\n\n`;
    messaggio += "Giorni che occupano più spazio:\n";
    
    giorni.slice(0, 5).forEach(g => {
        messaggio += `Giorno ${g.giorno}: ${g.dimensione.toFixed(2)}MB (${g.tipo})\n`;
    });
    
    if (giorni.length === 0) {
        messaggio += "Nessun contenuto salvato.";
    }
    
    alert(messaggio);
}

function pulisciTutto() {
    if (confirm("Sei sicuro di voler cancellare TUTTI i contenuti? Questa azione non può essere annullata.")) {
        for (let i = 1; i <= 24; i++) {
            localStorage.removeItem(`giorno_${i}`);
            const pulsante = document.querySelector(`.pulsante[onclick*="${i}"]`);
            if (pulsante) {
                pulsante.classList.remove('contenutoSalvato');
            }
        }
        aggiornaSpazioDisplay();
        caricaContenutoGiorno();
        mostraMessaggio("Tutti i contenuti sono stati cancellati!", 'successo');
    }
}

// ========== FUNZIONI DI SUPPORTO ==========

function mostraMessaggio(testo, tipo) {
    // Rimuovi messaggi precedenti
    const messaggiEsistenti = document.querySelectorAll('.messaggio-stato');
    messaggiEsistenti.forEach(msg => msg.remove());
    
    const messaggio = document.createElement('div');
    messaggio.className = `messaggio-stato messaggio-${tipo}`;
    messaggio.textContent = testo;
    
    const editorAttivo = document.querySelector('.editor-dinamico[style*="display: block"]');
    if (editorAttivo) {
        editorAttivo.insertBefore(messaggio, editorAttivo.firstChild);
    } else {
        document.querySelector('.modal-content').insertBefore(messaggio, document.querySelector('.azioni'));
    }
    
    // Auto-rimuovi dopo 5 secondi
    setTimeout(() => {
        if (messaggio.parentNode) {
            messaggio.remove();
        }
    }, 5000);
}

// Funzione generica per salvare il contenuto attuale
function salvaContenutoAttuale() {
    // Questa funzione viene sovrascritta dai vari editor
    mostraMessaggio('Seleziona un tipo di contenuto e compila i campi!', 'errore');
}
// ========== FUNZIONI AUDIO NATALIZIE ==========

// Variabili audio
let audioNatalizio = null;
let audioAttivo = false;

// Funzioni Audio
function inizializzaAudio() {
    audioNatalizio = document.getElementById('jingleNatalizio');
    audioNatalizio.volume = 0.3; // Volume basso di default
    
    // Auto-play quando l'utente clicca da qualche parte
    document.addEventListener('click', function inizializzaPlay() {
        if (!audioAttivo) {
            audioNatalizio.play().then(() => {
                audioAttivo = true;
                document.getElementById('btnAudio').textContent = '🔇 Musica';
                document.getElementById('btnAudio').classList.add('attivo');
            }).catch(e => {
                console.log('Audio non attivato automaticamente');
            });
        }
    });
}

function toggleAudio() {
    const btnAudio = document.getElementById('btnAudio');
    
    if (!audioAttivo) {
        // Attiva audio
        audioNatalizio.play().then(() => {
            audioAttivo = true;
            btnAudio.textContent = '🔇 Musica';
            btnAudio.classList.add('attivo');
        }).catch(e => {
            console.log('Errore riproduzione audio:', e);
        });
    } else {
        // Disattiva audio
        audioNatalizio.pause();
        audioAttivo = false;
        btnAudio.textContent = '🎵 Attiva Musica';
        btnAudio.classList.remove('attivo');
    }
}

// Suono magico quando si aprono le caselle
function suonoAperturaCasella() {
    const suono = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magic-chime-1937.mp3');
    suono.volume = 0.3;
    suono.play();
}

// Modifica la funzione di apertura casella per aggiungere il suono
function apriCasellaVisualizzazione(giorno) {
    suonoAperturaCasella(); // ← AGGIUNGI QUESTA RIGA
    const contenutoSalvato = localStorage.getItem(`giorno_${giorno}`);
    
    if (contenutoSalvato) {
        const dati = JSON.parse(contenutoSalvato);
        mostraVisualizzazione(giorno, dati);
    } else {
        apriModal(giorno);
    }
}
