// File: timeline.js (v4.0 - Bulletproof Search & Clean Design)
(function() {
    var BIB_URL = 'https://raw.githubusercontent.com/grazianoEnzoMarchesani/publications/refs/heads/main/references.bib';
    var CONTAINER_ID = 'timeline-root';
    
    // Mappa dei tipi per etichette pulite
    var TYPE_MAP = {
        'article': 'Journal', 
        'inbook': 'Book Chapter', 
        'conference': 'Conference',
        'phdthesis': 'PhD Thesis', 
        'misc': 'Project', 
        'techreport': 'Report', 
        'book': 'Book'
    };

    // Variabile globale per contenere i dati
    var allEntries = []; 

    // Funzione pulizia stringhe
    function clean(str) {
        if(!str) return '';
        return str.replace(/[\n\r]+/g,' ').replace(/[{}]/g,'').replace(/\\&/g,'&').replace(/\s+/g,' ').trim();
    }

    // Parser BibTeX Semplificato
    function parseSimple(text) {
        var entries = [];
        var blocks = text.split('@');
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i].trim();
            if (!block) continue;
            var braceIdx = block.indexOf('{');
            if (braceIdx === -1) continue;
            var type = block.substring(0, braceIdx).toLowerCase();
            var content = block.substring(braceIdx + 1);
            var lastBrace = content.lastIndexOf('}');
            if (lastBrace !== -1) content = content.substring(0, lastBrace);

            var fields = {};
            var regex = /([a-zA-Z0-9_]+)\s*=\s*(?:\{([^}]*)\}|"([^"]*)"|(\d+))/g;
            var match;
            while ((match = regex.exec(content)) !== null) {
                var key = match[1].toLowerCase();
                var val = match[2] || match[3] || match[4];
                fields[key] = clean(val);
            }
            
            // Dati essenziali
            fields.year = fields.year ? parseInt(fields.year) : 0;
            fields.type = type;
            
            // Creiamo una stringa unica per la ricerca (titolo + autori + anno + editore)
            // Usiamo || '' per evitare crash su campi vuoti
            var searchBase = (fields.title || '') + " " + (fields.author || '') + " " + (fields.year || '') + " " + (fields.journal || '') + " " + (fields.booktitle || '');
            fields.searchString = searchBase.toLowerCase();
            
            entries.push(fields);
        }
        return entries;
    }

    // Funzione che disegna la timeline
    function renderTimeline(data) {
        var container = document.getElementById(CONTAINER_ID);
        if(!container) return;
        container.innerHTML = ''; 

        if(data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-style:italic;">Nessun risultato trovato.</div>';
            return;
        }

        data.forEach(function(item, idx) {
            // Alternanza destra/sinistra
            var side = (idx % 2 === 0) ? 'timeline-block-right' : 'timeline-block-left';
            
            // Formattazione Tipo e Luogo
            var niceType = TYPE_MAP[item.type] || 'Publication';
            var venue = item.journal || item.booktitle || item.publisher || '';
            var contextString = (item.year || 'n.d.') + ' | ' + niceType + (venue ? ': ' + venue : '');

            // Formattazione Autori
            var authors = (item.author || '').replace(/ and /gi, ', ');
            
            // Link (DOI o URL)
            var linkHtml = '';
            if (item.doi) {
                var cleanDoi = item.doi.replace('https://doi.org/','');
                linkHtml = '<br><a href="https://doi.org/'+cleanDoi+'" target="_blank">DOI: '+cleanDoi+'</a>';
            } else if (item.url) {
                linkHtml = '<br><a href="'+item.url+'" target="_blank">View Link</a>';
            }

            // HTML PULITO (Gerarchia: H3 > SPAN > P)
            var html = 
            '<div class="timeline-block '+side+'">' +
                '<div class="timeline-marker"></div>' +
                '<div class="timeline-content">' +
                    '<h3>' + (item.title || 'Untitled') + '</h3>' +
                    '<span>' + contextString + '</span>' +
                    '<p>Authors: ' + authors + linkHtml + '</p>' +
                '</div>' +
            '</div>';
            
            container.insertAdjacentHTML('beforeend', html);
        });
    }

    // Caricamento Dati
    fetch(BIB_URL)
    .then(function(res) { return res.text(); })
    .then(function(text) {
        allEntries = parseSimple(text);
        // Ordine cronologico inverso (dal più recente)
        allEntries.sort(function(a, b) { return b.year - a.year; }); 
        
        // Disegna tutto all'inizio
        renderTimeline(allEntries);
    })
    .catch(function(err) {
        var c = document.getElementById(CONTAINER_ID);
        if(c) c.innerHTML = 'Errore caricamento: ' + err.message;
    });

    // GESTIONE RICERCA (Event Delegation - Metodo infallibile)
    // Ascoltiamo l'intera pagina. Se l'evento viene da "searchInput", filtriamo.
    document.addEventListener('input', function(e) {
        if (e.target && e.target.id === 'searchInput') {
            var term = e.target.value.toLowerCase();
            
            // Filtriamo
            var filtered = allEntries.filter(function(entry) {
                return entry.searchString.indexOf(term) !== -1;
            });
            
            // Ridisegniamo
            renderTimeline(filtered);
        }
    });

})();
