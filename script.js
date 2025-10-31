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

// Variabili audio
let audioNatalizio = null;
let audioAttivo = false;

// ========== SISTEMA MULTI-UTENTE ==========
let UTENTE_CORRENTE = '';

function inizializzaUtente() {
    // Verifica se c'è un utente nell'URL
    const urlParams = new URLSearchParams(window.location.search);
    const userFromURL = urlParams.get('user');
    
    if (userFromURL) {
        UTENTE_CORRENTE = userFromURL;
        localStorage.setItem('utente_calendario', UTENTE_CORRENTE);
    } else {
        // Usa l'utente salvato o creane uno nuovo
        UTENTE_CORRENTE = localStorage.getItem('utente_calendario') || 'utente_' + Date.now();
        localStorage.setItem('utente_calendario', UTENTE_CORRENTE);
    }
    
    console.log('Utente corrente:', UTENTE_CORRENTE);
}

// Inizializzazione quando la pagina carica
document.addEventListener('DOMContentLoaded', function() {
    inizializzaUtente();
    caricaCalendario();
    inizializzaDragDrop();
    aggiornaSpazioDisplay();
    inizializzaAudio();
});

// ========== FUNZIONI AUDIO NATALIZIE ==========

function inizializzaAudio() {
    audioNatalizio = document.getElementById('jingleNatalizio');
    if (!audioNatalizio) {
        console.log('Elemento audio non trovato');
        return;
    }
    audioNatalizio.volume = 0.6; // Volume aumentato
    
    console.log('Jingle Bells inizializzato - pronto per essere attivato');
    
    // Precarica l'audio
    audioNatalizio.load();
}

function toggleAudio() {
    const btnAudio = document.getElementById('btnAudio');
    if (!btnAudio) {
        console.log('Pulsante audio non trovato');
        return;
    }
    
    if (!audioAttivo) {
        // Attiva audio - Jingle Bells!
        audioNatalizio.play().then(() => {
            audioAttivo = true;
            btnAudio.textContent = '🔇 Disattiva Jingle Bells';
            btnAudio.classList.add('attivo');
            console.log('🎵 Jingle Bells attivato!');
            mostraMessaggio('🎶 Jingle Bells attivato!', 'successo');
        }).catch(e => {
            console.log('Errore attivazione Jingle Bells:', e);
            // Riprova con interazione utente
            mostraMessaggio('🎅 Clicca di nuovo per attivare Jingle Bells!', 'info');
            audioNatalizio.play().then(() => {
                audioAttivo = true;
                btnAudio.textContent = '🔇 Disattiva Jingle Bells';
                btnAudio.classList.add('attivo');
            });
        });
    } else {
        // Disattiva audio
        audioNatalizio.pause();
        audioNatalizio.currentTime = 0; // Riavvolgi
        audioAttivo = false;
        btnAudio.textContent = '🎵 Attiva Jingle Bells';
        btnAudio.classList.remove('attivo');
        console.log('Jingle Bells disattivato');
        mostraMessaggio('🔇 Musica disattivata', 'info');
    }
}

// Suono magico quando si aprono le caselle
function suonoAperturaCasella() {
    try {
        const suono = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magic-chime-1937.mp3');
        suono.volume = 0.4;
        suono.play().catch(e => console.log('Suono magico non riprodotto:', e));
    } catch (error) {
        console.log('Errore suono apertura:', error);
    }
}

// ========== GESTIONE CALENDARIO ==========

function caricaCalendario() {
    for (let giorno = 1; giorno <= 24; giorno++) {
        // MODIFICA: carica solo i contenuti dell'utente corrente
        const contenuto = localStorage.getItem(`giorno_${giorno}_${UTENTE_CORRENTE}`);
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
    suonoAperturaCasella();
    const contenutoSalvato = localStorage.getItem(`giorno_${giorno}_${UTENTE_CORRENTE}`);
    
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
    // MODIFICA: carica solo i contenuti dell'utente corrente
    const contenuto = localStorage.getItem(`giorno_${giornoCorrente}_${UTENTE_CORRENTE}`);
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
        dataSalvataggio: new Date().toISOString(),
        utente: UTENTE_CORRENTE // Aggiungi l'utente ai dati
    };
    
    // MODIFICA: aggiungi l'utente alla chiave
    localStorage.setItem(`giorno_${giornoCorrente}_${UTENTE_CORRENTE}`, JSON.stringify(dati));
    
    // Aggiorna interfaccia
    const pulsante = document.querySelector(`.pulsante[onclick*="${giornoCorrente}"]`);
    if (pulsante) {
        pulsante.classList.add('contenutoSalvato');
    }
    
    caricaContenutoGiorno();
    aggiornaSpazioDisplay();
    
    mostraMessaggio('Contenuto salvato con successo!', 'successo');
    return true;
}

function eliminaContenuto() {
    if (confirm('Sei sicuro di voler eliminare il contenuto di questo giorno?')) {
        // MODIFICA: elimina solo i contenuti dell'utente corrente
        localStorage.removeItem(`giorno_${giornoCorrente}_${UTENTE_CORRENTE}`);
        
        // Aggiorna interfaccia
        const pulsante = document.querySelector(`.pulsante[onclick*="${giornoCorrente}"]`);
        if (pulsante) {
            pulsante.classList.remove('contenutoSalvato');
        }
        
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
    
    if (!dropArea || !fileInput) {
        console.log('Elementi drag-drop non trovati');
        return;
    }
    
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
    
    if (qualitaSlider && qualitaValue) {
        qualitaSlider.addEventListener('input', function() {
            qualitaValue.textContent = Math.round(this.value * 100) + '%';
            if (fileOriginale) {
                processaImmagine(fileOriginale);
            }
        });
    }
    
    // Inizializza select dimensione
    const dimensioneSelect = document.getElementById('dimensioneSelect');
    if (dimensioneSelect) {
        dimensioneSelect.addEventListener('change', function() {
            if (fileOriginale) {
                processaImmagine(fileOriginale);
            }
        });
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    const dropArea = document.getElementById('dropArea');
    if (dropArea) {
        dropArea.classList.add('dragover');
    }
}

function unhighlight() {
    const dropArea = document.getElementById('dropArea');
    if (dropArea) {
        dropArea.classList.remove('dragover');
    }
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
        const qualitaSlider = document.getElementById('qualitaSlider');
        const dimensioneSelect = document.getElementById('dimensioneSelect');
        
        const qualita = qualitaSlider ? parseFloat(qualitaSlider.value) : 0.8;
        const dimensioneMax = dimensioneSelect ? dimensioneSelect.value : '1200';
        
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
        const risparmioSpazio = document.getElementById('risparmioSpazio');
        if (risparmioSpazio) {
            risparmioSpazio.innerHTML = 
                `🎉 Risparmiato il ${risparmio}% di spazio!<br>
                 ${dimensioneOriginaleMB}MB → ${dimensioneComprimitaMB}MB`;
        }
        
        // Mostra sezione anteprima
        const anteprimaCompressione = document.getElementById('anteprimaCompressione');
        if (anteprimaCompressione) {
            anteprimaCompressione.style.display = 'block';
        }
        
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
    if (!container) return;
    
    const dimensioneMB = (dimensioneBytes / (1024 * 1024)).toFixed(2);
    
    container.innerHTML = `
        <img src="${src}" alt="Anteprima ${tipo}" style="max-width: 100%; max-height: 150px; border-radius: 8px;">
        <p>${dimensioneMB} MB</p>
    `;
}

async function caricaDaURL() {
    const urlInput = document.getElementById('urlImmagine');
    if (!urlInput) return;
    
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
    const anteprimaCompressione = document.getElementById('anteprimaCompressione');
    if (anteprimaCompressione) {
        anteprimaCompressione.style.display = 'none';
    }
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    const urlImmagine = document.getElementById('urlImmagine');
    if (urlImmagine) urlImmagine.value = '';
}

// === EDITOR MESSAGGIO ===
function mostraEditorMessaggio() {
    nascondiTuttiEditor();
    document.getElementById('editor-messaggio').style.display = 'block';
    document.querySelector('.azioni .bottone').onclick = salvaContenutoMessaggio;
}

function salvaContenutoMessaggio() {
    const testoInput = document.getElementById('testo-messaggio');
    if (!testoInput) return;
    
    const testo = testoInput.value.trim();
    if (!testo) {
        mostraMessaggio('Inserisci un messaggio!', 'errore');
        return;
    }
    
    salvaContenuto('messaggio', testo, 0.01);
    testoInput.value = '';
}

// === EDITOR AUDIO ===
function mostraEditorAudio() {
    nascondiTuttiEditor();
    document.getElementById('editor-audio').style.display = 'block';
    document.querySelector('.azioni .bottone').onclick = salvaContenutoAudio;
}

function salvaContenutoAudio() {
    const fileInput = document.getElementById('fileAudio');
    const urlInput = document.getElementById('urlAudio');
    
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const dimensioneMB = file.size / (1024 * 1024);
            salvaContenuto('audio', e.target.result, dimensioneMB);
            fileInput.value = '';
        };
        
        reader.readAsDataURL(file);
    } else if (urlInput && urlInput.value.trim()) {
        salvaContenuto('audio', urlInput.value.trim(), 0.1);
        urlInput.value = '';
    } else {
        mostraMessaggio('Carica un file audio o inserisci un URL!', 'errore');
    }
}

function salvaAudioDaURL() {
    const urlInput = document.getElementById('urlAudio');
    if (!urlInput) return;
    
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
    const urlInput = document.getElementById('urlVideo');
    
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const dimensioneMB = file.size / (1024 * 1024);
            salvaContenuto('video', e.target.result, dimensioneMB);
            fileInput.value = '';
        };
        
        reader.readAsDataURL(file);
    } else if (urlInput && urlInput.value.trim()) {
        salvaContenuto('video', urlInput.value.trim(), 0.1);
        urlInput.value = '';
    } else {
        mostraMessaggio('Carica un file video o inserisci un URL!', 'errore');
    }
}

function salvaVideoDaURL() {
    const urlInput = document.getElementById('urlVideo');
    if (!urlInput) return;
    
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
    const urlInput = document.getElementById('urlYouTube');
    if (!urlInput) return;
    
    const url = urlInput.value.trim();
    if (!url) {
        mostraMessaggio('Inserisci un URL di YouTube!', 'errore');
        return;
    }
    
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        mostraMessaggio('Inserisci un URL valido di YouTube!', 'errore');
        return;
    }
    
    salvaContenuto('youtube', url, 0.01);
    urlInput.value = '';
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
        const btnRegistra = document.getElementById('btnRegistra');
        const controlliRegistrazione = document.getElementById('controlliRegistrazione');
        if (btnRegistra) btnRegistra.style.display = 'none';
        if (controlliRegistrazione) controlliRegistrazione.style.display = 'block';
        
        // Avvia timer
        tempoRegistrazione = 0;
        timerInterval = setInterval(() => {
            tempoRegistrazione++;
            const minuti = Math.floor(tempoRegistrazione / 60).toString().padStart(2, '0');
            const secondi = (tempoRegistrazione % 60).toString().padStart(2, '0');
            const timer = document.getElementById('timerRegistrazione');
            if (timer) timer.textContent = `${minuti}:${secondi}`;
        }, 1000);
        
    } catch (error) {
        console.error('Errore nella registrazione:', error);
        mostraMessaggio('Errore nell\'accesso al microfono', 'errore');
    }
}

function fermaRegistrazione() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        if (timerInterval) clearInterval(timerInterval);
        
        // Ripristina interfaccia
        const btnRegistra = document.getElementById('btnRegistra');
        const controlliRegistrazione = document.getElementById('controlliRegistrazione');
        const timer = document.getElementById('timerRegistrazione');
        
        if (btnRegistra) btnRegistra.style.display = 'block';
        if (controlliRegistrazione) controlliRegistrazione.style.display = 'none';
        if (timer) timer.textContent = '00:00';
    }
}

function salvaContenutoMessaggioVocale() {
    const fileInput = document.getElementById('fileVocale');
    
    if (fileInput && fileInput.files.length > 0) {
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
        // MODIFICA: calcola solo lo spazio dell'utente corrente
        const contenuto = localStorage.getItem(`giorno_${giorno}_${UTENTE_CORRENTE}`);
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
    
    const spazioDisplay = document.getElementById('spazio-display');
    if (spazioDisplay) {
        spazioDisplay.innerHTML = `
            <strong>Spazio: ${spazioUtilizzato.toFixed(1)}MB / ${CONFIG.spazioTotale}MB</strong>
            <div class="barra-progresso">
                <div class="barra-riempimento" style="width: ${percentuale}%"></div>
            </div>
            <small>Libero: ${spazioLibero.toFixed(1)}MB</small>
        `;
        
        // Cambia colore in base allo spazio rimanente
        if (spazioLibero < 10) {
            spazioDisplay.style.color = '#dc3545';
        } else if (spazioLibero < 25) {
            spazioDisplay.style.color = '#ffc107';
        } else {
            spazioDisplay.style.color = '#28a745';
        }
    }
}

function controllaSpazio() {
    const spazioUtilizzato = calcolaSpazioUtilizzato();
    const giorni = [];
    
    for (let i = 1; i <= 24; i++) {
        // MODIFICA: controlla solo i contenuti dell'utente corrente
        const contenuto = localStorage.getItem(`giorno_${i}_${UTENTE_CORRENTE}`);
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
            // MODIFICA: elimina solo i contenuti dell'utente corrente
            localStorage.removeItem(`giorno_${i}_${UTENTE_CORRENTE}`);
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
    messaggiEsistenti.forEach(msg => {
        if (msg.parentNode) {
            msg.remove();
        }
    });
    
    const messaggio = document.createElement('div');
    messaggio.className = `messaggio-stato messaggio-${tipo}`;
    messaggio.textContent = testo;
    
    const editorAttivo = document.querySelector('.editor-dinamico[style*="display: block"]');
    if (editorAttivo) {
        editorAttivo.insertBefore(messaggio, editorAttivo.firstChild);
    } else {
        const modalContent = document.querySelector('.modal-content');
        const azioni = document.querySelector('.azioni');
        if (modalContent && azioni) {
            modalContent.insertBefore(messaggio, azioni);
        }
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
