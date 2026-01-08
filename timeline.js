// File: timeline.js - v8.0 ANIMATED
(function() {
    window.filterPublications = function(filterType, btnElement) {
        // 1. Gestione Bottoni (UI)
        var buttons = document.querySelectorAll('.filter-btn');
        var isAll = (filterType === 'all');
        buttons.forEach(function(btn) { 
            if (isAll) {
                btn.style.opacity = '1';
                btn.classList.remove('active');
                if(btn.dataset.type === 'all') btn.classList.add('active');
            } else {
                if (btn === btnElement) {
                    btn.style.opacity = '1';
                    btn.classList.add('active');
                } else {
                    btn.style.opacity = '0.5';
                    btn.classList.remove('active');
                }
            }
        });

        // 2. Gestione Animazione Blocchi
        var blocks = document.querySelectorAll('.timeline-block');
        
        blocks.forEach(function(block) {
            var itemType = block.getAttribute('data-type');
            var shouldShow = (filterType === 'all' || itemType === filterType);

            if (shouldShow) {
                // FASE 1: MOSTRARE
                // Se era nascosto (display:none), rimettilo nel flusso
                if (block.style.display === 'none') {
                    block.style.display = 'block';
                }
                // Piccolo timeout per permettere al browser di registrare il 'display:block'
                // prima di rimuovere la classe di opacità, altrimenti non anima
                setTimeout(function() {
                    block.classList.remove('anim-hidden');
                }, 10);

            } else {
                // FASE 2: NASCONDERE
                // Prima aggiungi la classe per l'animazione (fade out + slide down)
                block.classList.add('anim-hidden');
                
                // Aspetta che l'animazione CSS (0.5s) finisca, poi togli dallo spazio fisico
                setTimeout(function() {
                    // Controllo di sicurezza: nascondi solo se ha ancora la classe hidden
                    // (l'utente potrebbe aver cliccato velocemente un altro filtro nel frattempo)
                    if (block.classList.contains('anim-hidden')) {
                        block.style.display = 'none';
                    }
                }, 500); // 500ms deve corrispondere al transition nel CSS
            }
        });
    };

    var BIB_URL = 'https://raw.githubusercontent.com/grazianoEnzoMarchesani/publications/refs/heads/main/references.bib';
    var CONTAINER_ID = 'timeline-root';
    var TYPE_MAP = { 'article': 'Journal', 'inbook': 'Book Chapter', 'conference': 'Conference', 'phdthesis': 'PhD Thesis', 'misc': 'Software / Misc', 'techreport': 'Report', 'book': 'Book' };
    var COLOR_MAP = { 'article': '#4e76a6', 'conference': '#E67E22', 'inbook': '#8E44AD', 'book': '#8E44AD', 'phdthesis': '#C0392B', 'misc': '#27AE60', 'techreport': '#7F8C8D' };
    var DEFAULT_COLOR = '#4e76a6';

    function clean(str) { return str ? str.replace(/[\n\r]+/g,' ').replace(/[{}]/g,'').replace(/\\&/g,'&').replace(/\s+/g,' ').trim() : ''; }
    function parseSimple(text) {
        var entries = []; var blocks = text.split('@');
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i].trim(); if (!block) continue;
            var braceIdx = block.indexOf('{'); if (braceIdx === -1) continue;
            var type = block.substring(0, braceIdx).toLowerCase();
            var content = block.substring(braceIdx + 1, block.lastIndexOf('}'));
            var fields = {}; var regex = /([a-zA-Z0-9_]+)\s*=\s*(?:\{([^}]*)\}|"([^"]*)"|(\d+))/g; var match;
            while ((match = regex.exec(content)) !== null) fields[match[1].toLowerCase()] = clean(match[2] || match[3] || match[4]);
            fields.year = fields.year ? parseInt(fields.year) : 0; fields.type = type; entries.push(fields);
        }
        return entries;
    }

    function renderTimeline(data) {
        var root = document.getElementById(CONTAINER_ID); if(!root) return; root.innerHTML = ''; 
        
        var filterHtml = '<div class="timeline-filters"><button class="filter-btn active" data-type="all" onclick="window.filterPublications(\'all\', this)">All</button>';
        var usedTypes = [...new Set(data.map(i => i.type))].sort((a,b) => ['article','conference','inbook','misc','phdthesis'].indexOf(a) - ['article','conference','inbook','misc','phdthesis'].indexOf(b));
        usedTypes.forEach(t => {
            filterHtml += '<button class="filter-btn" data-type="'+t+'" onclick="window.filterPublications(\''+t+'\', this)"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+(COLOR_MAP[t]||DEFAULT_COLOR)+';margin-right:8px;"></span>'+(TYPE_MAP[t]||t)+'</button>';
        });
        filterHtml += '</div><div class="timeline-track">';

        if(data.length === 0) filterHtml += '<div style="text-align:center;">No publications.</div>';
        else data.forEach((item, idx) => {
            var color = COLOR_MAP[item.type] || DEFAULT_COLOR;
            var link = item.doi ? '<br><a href="https://doi.org/'+item.doi.replace('https://doi.org/','')+'" target="_blank" style="color:'+color+'">DOI: '+item.doi.replace('https://doi.org/','')+'</a>' : (item.url ? '<br><a href="'+item.url+'" target="_blank" style="color:'+color+'">View Link</a>' : '');
            
            filterHtml += '<div class="timeline-block '+(idx%2===0?'timeline-block-right':'timeline-block-left')+'" data-type="'+item.type+'">' +
                '<div class="timeline-marker" style="background:'+color+';"></div>' +
                '<div class="timeline-content"><h3>'+(item.title||'Untitled')+'</h3><span style="color:'+color+'">'+(item.year||'')+' | '+(TYPE_MAP[item.type]||'Pub')+'</span><span style="color:#777;font-weight:normal;font-style:italic;">'+(item.journal||item.booktitle||item.publisher||'')+'</span><p>Authors: '+(item.author||'').replace(/ and /gi, ', ')+link+'</p></div></div>';
        });
        root.innerHTML = filterHtml + '<div style="clear:both;"></div></div>';
    }

    var container = document.getElementById(CONTAINER_ID);
    if(container) container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Loading...</div>';
    fetch(BIB_URL).then(r => r.text()).then(t => { var d = parseSimple(t); d.sort((a,b)=>b.year-a.year); renderTimeline(d); })
    .catch(e => { if(container) container.innerHTML = '<div style="color:red;text-align:center;">Error: '+e.message+'</div>'; });
})();
