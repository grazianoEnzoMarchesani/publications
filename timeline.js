// File: timeline.js (v5.0 - Aggressive Search Fix)
(function() {
    var BIB_URL = 'https://raw.githubusercontent.com/grazianoEnzoMarchesani/publications/refs/heads/main/references.bib';
    var CONTAINER_ID = 'timeline-root';
    var SEARCH_ID = 'searchInput';
    
    var TYPE_MAP = {
        'article': 'Journal', 'inbook': 'Book Chapter', 'conference': 'Conference',
        'phdthesis': 'PhD Thesis', 'misc': 'Project', 'techreport': 'Report', 'book': 'Book'
    };

    var allEntries = []; 

    // Pulizia stringhe
    function clean(str) {
        if(!str) return '';
        return str.replace(/[\n\r]+/g,' ').replace(/[{}]/g,'').replace(/\\&/g,'&').replace(/\s+/g,' ').trim();
    }

    // Parsing
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
            
            fields.year = fields.year ? parseInt(fields.year) : 0;
            fields.type = type;
            // Stringa di ricerca completa (tutto minuscolo per facilitare)
            var fullText = (fields.title||'') + " " + (fields.author||'') + " " + (fields.year||'') + " " + (fields.journal||'') + " " + (fields.booktitle||'');
            fields.searchString = fullText.toLowerCase();
            
            entries.push(fields);
        }
        return entries;
    }

    // Render Timeline
    function renderTimeline(data) {
        var container = document.getElementById(CONTAINER_ID);
        if(!container) return;
        container.innerHTML = ''; 

        if(data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Nessun risultato trovato.</div>';
            return;
        }

        data.forEach(function(item, idx) {
            var side = (idx % 2 === 0) ? 'timeline-block-right' : 'timeline-block-left';
            var niceType = TYPE_MAP[item.type] || 'Publication';
            var venue = item.journal || item.booktitle || item.publisher || '';
            var contextString = (item.year || 'n.d.') + ' | ' + niceType + (venue ? ': ' + venue : '');
            var authors = (item.author || '').replace(/ and /gi, ', ');
            
            var linkHtml = '';
            if (item.doi) {
                var cleanDoi = item.doi.replace('https://doi.org/','');
                linkHtml = '<br><a href="https://doi.org/'+cleanDoi+'" target="_blank">DOI: '+cleanDoi+'</a>';
            } else if (item.url) {
                linkHtml = '<br><a href="'+item.url+'" target="_blank">View Link</a>';
            }

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

    // Funzione di ricerca effettiva
    function performSearch(term) {
        term = term.toLowerCase();
        var filtered = allEntries.filter(function(entry) {
            return entry.searchString.indexOf(term) !== -1;
        });
        renderTimeline(filtered);
    }

    // Inizializzazione Logica
    fetch(BIB_URL)
    .then(function(res) { return res.text(); })
    .then(function(text) {
        allEntries = parseSimple(text);
        allEntries.sort(function(a, b) { return b.year - a.year; });
        renderTimeline(allEntries);
        
        // --- FIX RICERCA: Polling per trovare l'input ---
        var attempts = 0;
        var interval = setInterval(function() {
            var input = document.getElementById(SEARCH_ID);
            if (input) {
                // Trovato! Colleghiamo gli eventi
                clearInterval(interval);
                
                // Evento mentre scrivi
                input.oninput = function(e) { performSearch(e.target.value); };
                // Evento invio (per sicurezza)
                input.onkeyup = function(e) { performSearch(e.target.value); };
                
                console.log("Timeline Search: Connected successfully.");
            }
            attempts++;
            if (attempts > 20) clearInterval(interval); // Smetti di cercare dopo 10 secondi
        }, 500);
    })
    .catch(function(err) {
        var c = document.getElementById(CONTAINER_ID);
        if(c) c.innerHTML = 'Error: ' + err.message;
    });

})();
