// File: timeline.js - Versione "Elegant Interactive"
(function() {
    var BIB_URL = 'https://raw.githubusercontent.com/grazianoEnzoMarchesani/publications/refs/heads/main/references.bib';
    var CONTAINER_ID = 'timeline-root';
    
    // MAPPATURA TIPI
    var TYPE_MAP = {
        'article': 'Journal', 
        'inbook': 'Book Chapter', 
        'conference': 'Conference',
        'phdthesis': 'PhD Thesis', 
        'misc': 'Software / Misc', 
        'techreport': 'Report', 
        'book': 'Book'
    };

    // PALETTE COLORI (Campionata dal tuo Network Graph)
    var COLOR_MAP = {
        'article':     '#4e76a6', // Blu Avio (il tuo colore base)
        'conference':  '#D66060', // Rosa Antico/Rosso (nodo Thermo-Fluid)
        'inbook':      '#9B7098', // Malva/Viola (nodo Generative Alg.)
        'book':        '#9B7098', // Idem
        'phdthesis':   '#8D6E63', // Marrone Terra
        'misc':        '#E69F5C', // Arancio Pastello (nodo Arch. Innovation)
        'techreport':  '#78909C'  // Grigio Bluastro
    };
    var DEFAULT_COLOR = '#4e76a6';

    // FUNZIONI DI PARSING (Invariate)
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
            entries.push(fields);
        }
        return entries;
    }

    // FUNZIONE FILTRO INTERATTIVO
    window.filterPublications = function(filterType, btnElement) {
        // 1. Gestione classe active sui bottoni
        var buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(function(btn) { btn.classList.remove('active'); });
        if(btnElement) btnElement.classList.add('active');

        // 2. Mostra/Nascondi blocchi
        var blocks = document.querySelectorAll('.timeline-block');
        blocks.forEach(function(block) {
            var itemType = block.getAttribute('data-type');
            if (filterType === 'all' || itemType === filterType) {
                block.style.display = 'block';
                // Piccola animazione di fade-in
                block.style.opacity = '0';
                setTimeout(function(){ block.style.opacity = '1'; }, 50);
            } else {
                block.style.display = 'none';
            }
        });
    }

    function renderTimeline(data) {
        var root = document.getElementById(CONTAINER_ID);
        if(!root) return;
        root.innerHTML = ''; 

        // 1. CREAZIONE AREA FILTRI (Fuori dalla timeline vera e propria per evitare intersezioni)
        var filterHtml = '<div class="timeline-filters">';
        // Tasto "ALL"
        filterHtml += '<button class="filter-btn active" onclick="filterPublications(\'all\', this)">All</button>';
        
        // Tasti dinamici in base ai tipi presenti
        var usedTypes = [];
        data.forEach(function(item){ if(usedTypes.indexOf(item.type) === -1) usedTypes.push(item.type); });
        
        // Ordine custom dei bottoni se vuoi, o l'ordine di apparizione
        var sortOrder = ['article', 'conference', 'inbook', 'misc', 'phdthesis'];
        usedTypes.sort(function(a,b){ return sortOrder.indexOf(a) - sortOrder.indexOf(b); });

        usedTypes.forEach(function(type) {
            var color = COLOR_MAP[type] || DEFAULT_COLOR;
            var label = TYPE_MAP[type] || type;
            filterHtml += '<button class="filter-btn" style="border-color:'+color+'; color:'+color+'" ' + 
                          'onmouseover="this.style.background=\''+color+'\'; this.style.color=\'#fff\'" ' +
                          'onmouseout="if(!this.classList.contains(\'active\')){this.style.background=\'transparent\'; this.style.color=\''+color+'\'} else {this.style.color=\'#fff\'}" '+
                          'onclick="filterPublications(\''+type+'\', this)">' + label + '</button>';
        });
        filterHtml += '</div>';

        // 2. CREAZIONE CONTENITORE TIMELINE (dove ci sarà la riga verticale)
        var entriesHtml = '<div class="timeline-entries-wrapper">';
        
        if(data.length === 0) {
            entriesHtml += '<div style="text-align:center;padding:20px;">Nessuna pubblicazione trovata.</div>';
        } else {
            data.forEach(function(item, idx) {
                var side = (idx % 2 === 0) ? 'timeline-block-right' : 'timeline-block-left';
                var niceType = TYPE_MAP[item.type] || 'Publication';
                var venue = item.journal || item.booktitle || item.publisher || '';
                var authors = (item.author || '').replace(/ and /gi, ', ');
                var markerColor = COLOR_MAP[item.type] || DEFAULT_COLOR;

                var linkHtml = '';
                if (item.doi) {
                    var cleanDoi = item.doi.replace('https://doi.org/','');
                    linkHtml = '<br><a href="https://doi.org/'+cleanDoi+'" target="_blank" style="color:'+markerColor+'">DOI: '+cleanDoi+'</a>';
                } else if (item.url) {
                    linkHtml = '<br><a href="'+item.url+'" target="_blank" style="color:'+markerColor+'">View Link</a>';
                }

                // Aggiungo data-type per il filtro
                entriesHtml += 
                '<div class="timeline-block '+side+'" data-type="'+item.type+'">' +
                    '<div class="timeline-marker" style="background: '+markerColor+'; box-shadow: 0 0 0 3px #fff, 0 0 0 5px '+markerColor+'; border:none;"></div>' + // Marker più raffinato
                    '<div class="timeline-content">' +
                        '<h3>' + (item.title || 'Untitled') + '</h3>' +
                        '<span style="color:'+markerColor+'">' + (item.year || '') + ' | ' + niceType + '</span>' +
                        '<span style="color:#999; font-weight:normal; font-style:italic;">' + (venue ? venue : '') + '</span>' +
                        '<p>Authors: ' + authors + linkHtml + '</p>' +
                    '</div>' +
                '</div>';
            });
        }
        entriesHtml += '</div>'; // chiusura wrapper

        root.innerHTML = filterHtml + entriesHtml;
        
        // Fix CSS dinamico per gestire hover attivi sui bottoni generati
        var styleEl = document.createElement('style');
        styleEl.innerHTML = '.filter-btn.active { background-color: #555 !important; color: #fff !important; border-color: #555 !important; }'; 
        // Per i bottoni colorati, la gestione active specifica viene fatta sovrascrivendo l'inline style nel click, 
        // ma per pulizia usiamo un piccolo helper JS nel click handler o lasciamo il CSS gestire "All".
        // Per semplicità qui sopra ho usato inline events, ma aggiungo una regola CSS per il pulsante "All".
        document.head.appendChild(styleEl);
    }

    // Esecuzione
    var container = document.getElementById(CONTAINER_ID);
    if(container) container.innerHTML = '<div id="loading-msg" style="text-align:center;padding:20px;color:#999;">Loading publications...</div>';

    fetch(BIB_URL)
    .then(function(res) { return res.text(); })
    .then(function(text) {
        var data = parseSimple(text);
        data.sort(function(a, b) { return b.year - a.year; });
        renderTimeline(data);
    })
    .catch(function(err) {
        if(container) container.innerHTML = '<div style="color:red;text-align:center;">Error: ' + err.message + '</div>';
    });
})();
