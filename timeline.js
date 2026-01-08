// File: timeline.js - v5.0 MINIMAL DESIGN
(function() {
    // Funzione filtro globale
    window.filterPublications = function(filterType, btnElement) {
        // 1. Gestione visuale dei bottoni (stile "legenda attiva")
        var buttons = document.querySelectorAll('.filter-btn');
        var isAll = (filterType === 'all');
        
        buttons.forEach(function(btn) { 
            // Se è "All", resetta tutto. Se è un filtro, sfoca gli altri.
            if (isAll) {
                btn.style.opacity = '1';
                btn.classList.remove('active'); // Rimuove grassetto
                if(btn.dataset.type === 'all') btn.classList.add('active');
            } else {
                // Se il bottone cliccato è questo
                if (btn === btnElement) {
                    btn.style.opacity = '1';
                    btn.classList.add('active');
                } else {
                    btn.style.opacity = '0.4'; // Gli altri sbiadiscono
                    btn.classList.remove('active');
                }
            }
        });

        // 2. Logica mostras/nascondi blocchi
        var blocks = document.querySelectorAll('.timeline-block');
        blocks.forEach(function(block) {
            var itemType = block.getAttribute('data-type');
            if (filterType === 'all' || itemType === filterType) {
                block.style.display = 'block';
                setTimeout(function(){ block.style.opacity = '1'; }, 50);
            } else {
                block.style.display = 'none';
                block.style.opacity = '0';
            }
        });
    };

    var BIB_URL = 'https://raw.githubusercontent.com/grazianoEnzoMarchesani/publications/refs/heads/main/references.bib';
    var CONTAINER_ID = 'timeline-root';
    
    var TYPE_MAP = {
        'article': 'Journal', 'inbook': 'Book Chapter', 'conference': 'Conference',
        'phdthesis': 'PhD Thesis', 'misc': 'Software / Misc', 'techreport': 'Report', 'book': 'Book'
    };

    // I tuoi colori
    var COLOR_MAP = {
        'article':     '#4e76a6', 
        'conference':  '#E67E22', 
        'inbook':      '#8E44AD', 
        'book':        '#8E44AD',
        'phdthesis':   '#C0392B', 
        'misc':        '#27AE60', 
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

        // --- FILTRI MINIMAL (Simile a Legenda) ---
        var filterHtml = '<div class="timeline-filters">';
        // Tasto All
        filterHtml += '<button class="filter-btn active" data-type="all" onclick="window.filterPublications(\'all\', this)">All</button>';
        
        var usedTypes = [];
        data.forEach(function(item){ if(usedTypes.indexOf(item.type) === -1) usedTypes.push(item.type); });
        var sortOrder = ['article', 'conference', 'inbook', 'misc', 'phdthesis'];
        usedTypes.sort(function(a,b){ return sortOrder.indexOf(a) - sortOrder.indexOf(b); });

        usedTypes.forEach(function(type) {
            var color = COLOR_MAP[type] || DEFAULT_COLOR;
            var label = TYPE_MAP[type] || type;
            // Bottone pulito: solo pallino e testo
            filterHtml += '<button class="filter-btn" data-type="'+type+'" onclick="window.filterPublications(\''+type+'\', this)">' +
                          '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+color+';margin-right:8px;"></span>' + 
                          label + '</button>';
        });
        filterHtml += '</div>';

        // --- TIMELINE TRACK ---
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
                    // Marker Semplice (Style inline pulito)
                    '<div class="timeline-marker" style="background: '+markerColor+';"></div>' +
                    '<div class="timeline-content">' +
                        '<h3>' + (item.title || 'Untitled') + '</h3>' +
                        '<span style="color:'+markerColor+'">' + (item.year || '') + ' | ' + niceType + '</span>' +
                        '<span style="color:#777; font-weight:normal; font-style:italic;">' + (venue ? venue : '') + '</span>' +
                        '<p>Authors: ' + authors + linkHtml + '</p>' +
                    '</div>' +
                '</div>';
            });
        }
        entriesHtml += '<div style="clear:both;"></div>';
        entriesHtml += '</div>';

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
