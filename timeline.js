(function() {
    var BIB_URL = 'https://raw.githubusercontent.com/grazianoEnzoMarchesani/publications/refs/heads/main/references.bib';
    var CONTAINER_ID = 'timeline-root';
    var SEARCH_ID = 'timeline-search';
    
    // Variabile per salvare tutti i dati
    var allPublications = [];

    var TYPE_MAP = {
        'article':'Journal', 'inbook':'Book Chapter', 'conference':'Conference',
        'phdthesis':'PhD Thesis', 'misc':'Project / Misc', 'techreport':'Report', 'book': 'Book'
    };

    function clean(str) {
        if(!str) return '';
        return str.replace(/[\n\r]+/g,' ').replace(/[{}]/g,'').replace(/\\&/g,'&').replace(/\s+/g,' ').trim();
    }

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
            // Creiamo un campo "searchable" per facilitare la ricerca
            fields.searchStr = (fields.title + ' ' + fields.author + ' ' + fields.year + ' ' + (fields.journal||'') + ' ' + (fields.booktitle||'')).toLowerCase();
            
            entries.push(fields);
        }
        return entries;
    }

    function renderTimeline(data) {
        var container = document.getElementById(CONTAINER_ID);
        if(!container) return;
        container.innerHTML = ''; 

        if(data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:#777;">Nessun risultato trovato.</div>';
            return;
        }

        data.forEach(function(item, idx) {
            var side = (idx % 2 === 0) ? 'timeline-block-right' : 'timeline-block-left';
            var niceType = TYPE_MAP[item.type] || 'Publication';
            var venue = item.journal || item.booktitle || item.publisher || '';
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
                    '<span>' + (item.year || '') + ' | ' + niceType + (venue ? ': '+venue : '') + '</span>' +
                    '<p>Authors: ' + authors + linkHtml + '</p>' +
                '</div>' +
            '</div>';
            container.insertAdjacentHTML('beforeend', html);
        });
    }

    // Funzione di filtro
    function setupSearch() {
        var searchInput = document.getElementById(SEARCH_ID);
        if(!searchInput) return;

        searchInput.addEventListener('keyup', function(e) {
            var term = e.target.value.toLowerCase();
            
            // Filtra l'array globale
            var filtered = allPublications.filter(function(item) {
                return item.searchStr.indexOf(term) > -1;
            });

            renderTimeline(filtered);
        });
    }

    // Avvio
    var container = document.getElementById(CONTAINER_ID);
    if(container) container.innerHTML = '<div style="text-align:center;padding:20px;color:#777;">Caricamento...</div>';

    fetch(BIB_URL)
    .then(function(res) { return res.text(); })
    .then(function(text) {
        allPublications = parseSimple(text);
        // Ordina per anno
        allPublications.sort(function(a, b) { return b.year - a.year; });
        
        // Renderizza tutto inizialmente
        renderTimeline(allPublications);
        
        // Attiva la ricerca
        setupSearch();
    })
    .catch(function(err) {
        if(container) container.innerHTML = '<div style="color:red;text-align:center;">Errore: ' + err.message + '</div>';
    });
})();
