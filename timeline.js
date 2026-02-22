// File: timeline.js - v10.0 REFINED
(function() {
    var BIB_URL = 'https://raw.githubusercontent.com/grazianoEnzoMarchesani/publications/refs/heads/main/references.bib';
    var CONTAINER_ID = 'timeline-root';
    
    var TYPE_MAP = { 'article': 'Journal', 'inbook': 'Book Chapter', 'conference': 'Conference', 'phdthesis': 'PhD Thesis', 'misc': 'Software / Misc', 'techreport': 'Report', 'book': 'Book' };
    var COLOR_MAP = { 'article': '#4e76a6', 'conference': '#E67E22', 'inbook': '#8E44AD', 'book': '#8E44AD', 'phdthesis': '#C0392B', 'misc': '#27AE60', 'techreport': '#7F8C8D' };
    var DEFAULT_COLOR = '#4e76a6';

    // Utilità di sanificazione per prevenire XSS
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, function(tag) {
            var charsToReplace = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
            return charsToReplace[tag] || tag;
        });
    }

    // Pulizia testo migliorata per gestire graffe multiple nel BibTeX
    function clean(str) { 
        return str ? str.replace(/[\n\r]+/g,' ').replace(/[{}]/g,'').replace(/\\&/g,'&').replace(/\s+/g,' ').trim() : ''; 
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
            var content = block.substring(braceIdx + 1, block.lastIndexOf('}'));
            var fields = {}; 
            
            // Regex migliorata
            var regex = /([a-zA-Z0-9_]+)\s*=\s*(?:\{([\s\S]*?)\}|"([\s\S]*?)"|(\d+))/g; 
            var match;
            
            while ((match = regex.exec(content)) !== null) {
                fields[match[1].toLowerCase()] = clean(match[2] || match[3] || match[4]);
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
        
        var filterHtml = '<div class="timeline-filters" id="timeline-filters">';
        filterHtml += '<button class="filter-btn active" data-type="all">All</button>';
        
        // Ordine specifico per i filtri
        var sortOrder = ['article','conference','inbook','misc','phdthesis'];
        var usedTypes = [...new Set(data.map(i => i.type))].sort((a,b) => {
            let indexA = sortOrder.indexOf(a);
            let indexB = sortOrder.indexOf(b);
            indexA = indexA === -1 ? 99 : indexA;
            indexB = indexB === -1 ? 99 : indexB;
            return indexA - indexB;
        });

        usedTypes.forEach(t => {
            var color = COLOR_MAP[t] || DEFAULT_COLOR;
            var label = TYPE_MAP[t] || t;
            filterHtml += `<button class="filter-btn" data-type="${t}"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span>${label}</button>`;
        });
        filterHtml += '</div><div class="timeline-track" id="timeline-track">';

        if(data.length === 0) {
            filterHtml += '<div style="text-align:center;">No publications.</div>';
        } else {
            data.forEach((item, idx) => {
                var color = COLOR_MAP[item.type] || DEFAULT_COLOR;
                
                // Creazione Link
                var linkUrl = item.doi ? 'https://doi.org/' + item.doi.replace('https://doi.org/','') : (item.url ? item.url : '');
                var linkText = item.doi ? 'DOI: ' + escapeHTML(item.doi.replace('https://doi.org/','')) : 'View Link';
                var linkHtml = linkUrl ? `<br><a href="${escapeHTML(linkUrl)}" target="_blank" style="color:${color}">${linkText}</a>` : '';
                
                // Assegnazione iniziale classi (viene comunque gestita dal filtro "all" subito dopo)
                var alignClass = (idx % 2 === 0) ? 'timeline-block-right' : 'timeline-block-left';
                
                filterHtml += `
                <div class="timeline-block ${alignClass}" data-type="${escapeHTML(item.type)}">
                    <div class="timeline-marker" style="background:${color};"></div>
                    <div class="timeline-content">
                        <h3>${escapeHTML(item.title || 'Untitled')}</h3>
                        <span style="color:${color}">${escapeHTML(item.year.toString())} | ${escapeHTML(TYPE_MAP[item.type] || 'Pub')}</span>
                        <span style="color:#777;font-weight:normal;font-style:italic;">${escapeHTML(item.journal || item.booktitle || item.publisher || '')}</span>
                        <p>Authors: ${escapeHTML(item.author || '').replace(/ and /gi, ', ')}${linkHtml}</p>
                    </div>
                </div>`;
            });
        }
        
        root.innerHTML = filterHtml + '<div style="clear:both;"></div></div>';
        
        // Attacchiamo gli eventi DOPO aver creato l'HTML
        setupEvents();
    }

    function setupEvents() {
        var filtersContainer = document.getElementById('timeline-filters');
        if (!filtersContainer) return;

        filtersContainer.addEventListener('click', function(e) {
            // Cerca se l'elemento cliccato è un bottone o dentro un bottone
            var btn = e.target.closest('.filter-btn');
            if (!btn) return;

            var filterType = btn.getAttribute('data-type');
            
            // Gestione UI Bottoni
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
                b.style.opacity = (filterType === 'all' || b === btn) ? '1' : '0.5';
            });
            btn.classList.add('active');

            // Logica Filtro e Riallineamento
            var blocks = document.querySelectorAll('.timeline-block');
            var visibleCount = 0; // Contatore per riassegnare Destra/Sinistra dinamicamente

            blocks.forEach(function(block) {
                var itemType = block.getAttribute('data-type');
                var shouldShow = (filterType === 'all' || itemType === filterType);

                if (shouldShow) {
                    // FIX BUG: Riassegna dinamicamente right/left in base all'ordine tra i SOLI elementi visibili
                    block.classList.remove('timeline-block-right', 'timeline-block-left');
                    block.classList.add(visibleCount % 2 === 0 ? 'timeline-block-right' : 'timeline-block-left');
                    visibleCount++;

                    if (block.style.display === 'none') {
                        block.style.display = 'block';
                        block.classList.add('anim-hidden');
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                block.classList.remove('anim-hidden');
                            });
                        });
                    } else {
                        block.classList.remove('anim-hidden');
                    }
                } else {
                    block.classList.add('anim-hidden');
                    // Timeout per aspettare l'animazione CSS
                    setTimeout(() => {
                        if (block.classList.contains('anim-hidden')) {
                            block.style.display = 'none';
                        }
                    }, 500); // 500ms combacia con la transizione CSS
                }
            });
        });
    }

    // INIT
    var container = document.getElementById(CONTAINER_ID);
    if(container) container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Loading publications...</div>';
    
    fetch(BIB_URL)
        .then(r => r.text())
        .then(t => { 
            var d = parseSimple(t); 
            d.sort((a,b) => b.year - a.year); 
            renderTimeline(d); 
        })
        .catch(e => { 
            if(container) container.innerHTML = '<div style="color:red;text-align:center;">Error loading publications. Try reloading the page.</div>'; 
            console.error("Timeline error:", e);
        });

})();
