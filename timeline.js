// File: timeline.js - v3.0 FIX LAYOUT & FILTERS
(function() {
    // 1. Rendiamo la funzione di filtro GLOBALE accessibile all'HTML
    window.filterPublications = function(filterType, btnElement) {
        // Gestione classe active sui bottoni
        var buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(function(btn) { btn.classList.remove('active'); });
        if(btnElement) btnElement.classList.add('active');

        // Mostra/Nascondi blocchi
        var blocks = document.querySelectorAll('.timeline-block');
        blocks.forEach(function(block) {
            var itemType = block.getAttribute('data-type');
            if (filterType === 'all' || itemType === filterType) {
                block.style.display = 'block';
                // Piccola animazione
                setTimeout(function(){ block.style.opacity = '1'; }, 50);
            } else {
                block.style.display = 'none';
                block.style.opacity = '0';
            }
        });
    };

    // CONFIGURAZIONE
    var BIB_URL = 'https://raw.githubusercontent.com/grazianoEnzoMarchesani/publications/refs/heads/main/references.bib';
    var CONTAINER_ID = 'timeline-root';
    
    var TYPE_MAP = {
        'article': 'Journal', 'inbook': 'Book Chapter', 'conference': 'Conference',
        'phdthesis': 'PhD Thesis', 'misc': 'Software / Misc', 'techreport': 'Report', 'book': 'Book'
    };

    // COLORI COORDINATI AL SITO E AL GRAFO
    var COLOR_MAP = {
        'article':     '#4e76a6', // Blu Avio (Journal)
        'conference':  '#E67E22', // Arancio Vivo (Conference)
        'inbook':      '#8E44AD', // Viola (Book)
        'book':        '#8E44AD',
        'phdthesis':   '#C0392B', // Rosso Scuro
        'misc':        '#27AE60', // Verde (Software/Misc)
        'techreport':  '#7F8C8D'
    };
    var DEFAULT_COLOR = '#4e76a6';

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

    function renderTimeline(data) {
        var root = document.getElementById(CONTAINER_ID);
        if(!root) return;
        root.innerHTML = ''; 

        // 1. AREA FILTRI (Bottoni reali, non solo pallini)
        var filterHtml = '<div class="timeline-filters">';
        filterHtml += '<button class="filter-btn active" onclick="window.filterPublications(\'all\', this)">All</button>';
        
        var usedTypes = [];
        data.forEach(function(item){ if(usedTypes.indexOf(item.type) === -1) usedTypes.push(item.type); });
        var sortOrder = ['article', 'conference', 'inbook', 'misc', 'phdthesis'];
        usedTypes.sort(function(a,b){ return sortOrder.indexOf(a) - sortOrder.indexOf(b); });

        usedTypes.forEach(function(type) {
            var color = COLOR_MAP[type] || DEFAULT_COLOR;
            var label = TYPE_MAP[type] || type;
            // Creo un bottone con bordo colorato e pallino interno
            filterHtml += '<button class="filter-btn" style="border-color:'+color+'; color:#555;" ' + 
                          'onclick="window.filterPublications(\''+type+'\', this)">' +
                          '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+color+';margin-right:6px;"></span>' + 
                          label + '</button>';
        });
        filterHtml += '</div>';

        // 2. TIMELINE TRACK (Il contenitore della linea verticale)
        var entriesHtml = '<div class="timeline-track">';
        
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

                entriesHtml += 
                '<div class="timeline-block '+side+'" data-type="'+item.type+'">' +
                    // Marker con doppio bordo per eleganza
                    '<div class="timeline-marker" style="background: '+markerColor+'; box-shadow: 0 0 0 4px #fff, 0 0 0 6px '+markerColor+';"></div>' +
                    '<div class="timeline-content">' +
                        '<h3>' + (item.title || 'Untitled') + '</h3>' +
                        '<span style="color:'+markerColor+'">' + (item.year || '') + ' | ' + niceType + '</span>' +
                        '<span style="color:#777; font-weight:normal; font-style:italic;">' + (venue ? venue : '') + '</span>' +
                        '<p>Authors: ' + authors + linkHtml + '</p>' +
                    '</div>' +
                '</div>';
            });
        }
        // IMPORTANTE: Clearfix per evitare che il footer risalga
        entriesHtml += '<div style="clear:both;"></div>';
        entriesHtml += '</div>'; // Chiude timeline-track

        root.innerHTML = filterHtml + entriesHtml;
    }

    var container = document.getElementById(CONTAINER_ID);
    if(container) container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Loading...</div>';

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
