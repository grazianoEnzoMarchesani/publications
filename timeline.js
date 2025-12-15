// File: timeline.js v2.0 - With Search, Icons and Badges
(function() {
    var BIB_URL = 'https://raw.githubusercontent.com/grazianoEnzoMarchesani/publications/refs/heads/main/references.bib';
    var CONTAINER_ID = 'timeline-root';
    var SEARCH_ID = 'searchInput';
    
    // Configurazione Badge e Icone per tipo
    var TYPE_CONFIG = {
        'article':      { label: 'Journal',      color: '#3498db', icon: 'fa-book-open' }, // Blu
        'inbook':       { label: 'Book Chapter', color: '#9b59b6', icon: 'fa-bookmark' },  // Viola
        'conference':   { label: 'Conference',   color: '#e67e22', icon: 'fa-users' },     // Arancio
        'phdthesis':    { label: 'PhD Thesis',   color: '#2c3e50', icon: 'fa-graduation-cap' }, // Scuro
        'misc':         { label: 'Project',      color: '#16a085', icon: 'fa-project-diagram' }, // Verde acqua
        'techreport':   { label: 'Report',       color: '#7f8c8d', icon: 'fa-file-alt' },
        'book':         { label: 'Book',         color: '#8e44ad', icon: 'fa-book' },
        'default':      { label: 'Publication',  color: '#95a5a6', icon: 'fa-file' }
    };

    var allEntries = []; // Store globale per la ricerca

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
            // Campo combinato per la ricerca
            fields.searchString = (fields.title + " " + fields.author + " " + fields.year + " " + fields.booktitle + " " + fields.journal).toLowerCase();
            entries.push(fields);
        }
        return entries;
    }

    function renderTimeline(data) {
        var container = document.getElementById(CONTAINER_ID);
        if(!container) return;
        container.innerHTML = ''; 

        if(data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#777;">Nessun risultato trovato.</div>';
            return;
        }

        data.forEach(function(item, idx) {
            var side = (idx % 2 === 0) ? 'timeline-block-right' : 'timeline-block-left';
            
            // Configurazione Tipo
            var config = TYPE_CONFIG[item.type] || TYPE_CONFIG['default'];
            var venue = item.journal || item.booktitle || item.publisher || '';
            var authors = (item.author || '').replace(/ and /gi, ', ');
            
            // Link Logic
            var linkHtml = '';
            if (item.doi) {
                var cleanDoi = item.doi.replace('https://doi.org/','');
                linkHtml = '<a href="https://doi.org/'+cleanDoi+'" target="_blank" class="btn-link"><i class="fas fa-external-link-alt"></i> DOI</a>';
            }
            if (item.url) {
                linkHtml += ' <a href="'+item.url+'" target="_blank" class="btn-link"><i class="fas fa-link"></i> Link</a>';
            }
            if(linkHtml) linkHtml = '<div class="links-area">' + linkHtml + '</div>';

            // HTML Card
            var html = 
            '<div class="timeline-block '+side+'">' +
                '<div class="timeline-marker" style="background:'+config.color+'"></div>' +
                '<div class="timeline-content" style="border-left-color:'+config.color+'">' +
                    '<div class="timeline-meta">' +
                        '<span class="badge" style="background:'+config.color+'"><i class="fas '+config.icon+'"></i> '+config.label+'</span>' +
                        '<span class="badge year-badge">'+(item.year || 'n.d.')+'</span>' +
                    '</div>' +
                    '<h3>' + (item.title || 'Untitled') + '</h3>' +
                    (venue ? '<div style="font-size:13px; color:#555; margin-bottom:8px;"><strong>In:</strong> ' + venue + '</div>' : '') +
                    '<p class="author-text">' + authors + '</p>' +
                    linkHtml +
                '</div>' +
            '</div>';
            
            container.insertAdjacentHTML('beforeend', html);
        });
    }

    function initSearch() {
        var input = document.getElementById(SEARCH_ID);
        if(!input) return;
        
        input.addEventListener('input', function(e) {
            var term = e.target.value.toLowerCase();
            var filtered = allEntries.filter(function(entry) {
                return entry.searchString.includes(term);
            });
            renderTimeline(filtered);
        });
    }

    // MAIN EXECUTION
    fetch(BIB_URL)
    .then(function(res) { return res.text(); })
    .then(function(text) {
        allEntries = parseSimple(text);
        allEntries.sort(function(a, b) { return b.year - a.year; });
        
        renderTimeline(allEntries);
        initSearch();
    })
    .catch(function(err) {
        var container = document.getElementById(CONTAINER_ID);
        if(container) container.innerHTML = '<div style="color:red;text-align:center;">Errore caricamento: ' + err.message + '</div>';
    });

})();
