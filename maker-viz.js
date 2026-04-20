/* ========= MAKER-VIZ engine =========
   Config shape:
   {
     mount:    '#app',        // where to render
     title:    '🤖 Title',
     subtitle: 'short text',
     vars:     { name: { label, value, color?, note? }, ... },
     lines:    ['html 1', 'html 2', ...],     // code lines (HTML allowed, use <span class="chip">..</span>)
     phases:   ['phaseA', 'phaseB', ...],     // one step = one phase
     extras:   [                              // optional per-viz controls
       { kind:'slider', id, label, min, max, value, step?, onInput(v,s,ui) },
       { kind:'toggle', id, label, value, onToggle(v,s,ui) }
     ],
     stage:    (state, ui) => svgString,      // renders stage from state
     run:      (phase, state, ui) => { ... }, // mutates state, calls ui helpers
     speedMap: { 1:900, 2:600, 3:400, 4:220, 5:110 }
   }
   ui helpers passed to run(): { flash(varName), flip(varName), narrate(str), activeLine(n), check(n,on), redraw() }
============================================== */

window.MakerViz = (function(){
  const DEFAULT_SPEEDS = { 1:900, 2:600, 3:400, 4:220, 5:110 };

  function h(tag, attrs, ...kids){
    const el = document.createElement(tag);
    for (const k in (attrs||{})) {
      if (k === 'class') el.className = attrs[k];
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    kids.flat().forEach(c => {
      if (c == null) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  function triggerAnim(el, cls){
    el.classList.remove(cls);
    void el.offsetWidth; // force reflow so the animation restarts
    el.classList.add(cls);
  }

  function create(cfg){
    const mount = typeof cfg.mount === 'string' ? document.querySelector(cfg.mount) : cfg.mount;
    if (!mount) throw new Error('MakerViz: mount not found');

    // ---- STATE ----
    const state = {};
    for (const k in cfg.vars) state[k] = cfg.vars[k].value;
    let phaseIdx = 0;
    let playing  = false;
    let timer    = null;
    const speeds = cfg.speedMap || DEFAULT_SPEEDS;

    // ---- LAYOUT ----
    mount.innerHTML = '';
    const titleEl = h('h1', {class:'mv-title'}, cfg.title || '');
    const subEl   = cfg.subtitle ? h('p', {class:'mv-subtitle'}, cfg.subtitle) : null;

    const stageEl = h('div', {class:'mv-stage'});
    const stageInner = h('div', {class:'stage-inner'});
    const msgEl = h('div', {class:'mv-msg'}, 'Press PLAY or STEP to start! ▶️');
    stageEl.appendChild(stageInner);
    stageEl.appendChild(msgEl);

    // extras
    let extrasEl = null;
    if (cfg.extras && cfg.extras.length) {
      extrasEl = h('div', {class:'mv-extras'});
      cfg.extras.forEach(ex => {
        if (ex.kind === 'slider') {
          const val = h('span', {class:'val'}, String(ex.value));
          const box = h('div', {class:'slider-box'},
            h('label', {}, ex.label),
            (() => {
              const inp = h('input', {type:'range', id: ex.id, min: String(ex.min), max: String(ex.max), step: String(ex.step||1), value: String(ex.value)});
              inp.addEventListener('input', () => {
                const v = Number(inp.value);
                val.textContent = String(v);
                if (ex.onInput) ex.onInput(v, state, ui);
              });
              return inp;
            })(),
            val
          );
          extrasEl.appendChild(box);
        } else if (ex.kind === 'toggle') {
          const btn = h('button', {class:'toggle' + (ex.value ? ' on' : ''), id: ex.id}, (ex.value ? 'ON' : 'OFF'));
          let on = !!ex.value;
          btn.addEventListener('click', () => {
            on = !on;
            btn.classList.toggle('on', on);
            btn.textContent = on ? 'ON' : 'OFF';
            if (ex.onToggle) ex.onToggle(on, state, ui);
          });
          const box = h('div', {class:'toggle-box'}, h('label', {}, ex.label), btn);
          extrasEl.appendChild(box);
        }
      });
    }

    // learn zone
    const learnEl = h('div', {class:'mv-learn'}, h('h3', {}, '🔍 Secret Code Peek!'));
    const varsEl = h('div', {class:'mv-vars'});
    const varEls = {};
    const valEls = {};
    const noteEls = {};
    for (const k in cfg.vars) {
      const v = cfg.vars[k];
      const valEl = h('div', {class:'vvalue'}, String(v.value));
      if (v.color) valEl.style.color = v.color;
      const noteEl = h('div', {class:'vnote'}, v.note || '');
      const vBox = h('div', {class:'mv-var', id:'var-'+k},
        h('div', {class:'vlabel'}, v.label || k),
        valEl,
        noteEl
      );
      if (v.color) vBox.style.borderColor = v.color;
      varsEl.appendChild(vBox);
      varEls[k] = vBox;
      valEls[k] = valEl;
      noteEls[k] = noteEl;
    }
    learnEl.appendChild(varsEl);

    const codeEl = h('div', {class:'mv-code'});
    const lineEls = [];
    (cfg.lines || []).forEach((html, i) => {
      const line = h('div', {class:'mv-line', id:'line-'+(i+1)});
      line.innerHTML = `<span class="badge">${i+1}</span><span class="ptr">👉</span>${html}<span class="check">✅</span>`;
      codeEl.appendChild(line);
      lineEls.push(line);
    });
    learnEl.appendChild(codeEl);

    // controls
    const playBtn  = h('button', {}, '▶️ PLAY');
    const stepBtn  = h('button', {class:'step'}, '👆 STEP');
    const resetBtn = h('button', {class:'stop'}, '🔄 RESET');
    const speedInp = h('input', {type:'range', min:'1', max:'5', step:'1', value:'3'});
    const ctrlEl = h('div', {class:'mv-ctrl'},
      playBtn, stepBtn, resetBtn,
      h('div', {class:'speed'}, h('label', {}, '🐢 Speed 🐇'), speedInp)
    );

    // mount all
    mount.appendChild(titleEl);
    if (subEl) mount.appendChild(subEl);
    mount.appendChild(stageEl);
    if (extrasEl) mount.appendChild(extrasEl);
    mount.appendChild(learnEl);
    mount.appendChild(ctrlEl);

    // ---- UI helpers ----
    const ui = {
      flash(name){ if (varEls[name]) triggerAnim(varEls[name], 'flash'); },
      flip(name){  if (varEls[name]) triggerAnim(varEls[name], 'flip'); },
      narrate(text){ msgEl.textContent = text; },
      activeLine(n){
        lineEls.forEach((l, i) => l.classList.toggle('active', (i+1) === n));
      },
      check(n, on=true){
        const l = lineEls[n-1];
        if (!l) return;
        const c = l.querySelector('.check');
        if (c) c.classList.toggle('show', on);
      },
      setVar(name, value, opts={}){
        // Preserve numeric state: if current is number but value is a string (display),
        // keep the numeric state and only update display.
        const keepNumeric = typeof state[name] === 'number' && typeof value === 'string';
        if (!keepNumeric) state[name] = value;
        if (valEls[name]) valEls[name].textContent = opts.display != null ? opts.display : String(value);
        if (opts.note != null && noteEls[name]) noteEls[name].textContent = opts.note;
        if (opts.flash) ui.flash(name);
        if (opts.flip)  ui.flip(name);
      },
      setNote(name, note){ if (noteEls[name]) noteEls[name].textContent = note; },
      redraw(){ stageInner.innerHTML = cfg.stage ? cfg.stage(state, ui) : ''; },
      clearChecks(){ lineEls.forEach(l => l.querySelector('.check')?.classList.remove('show')); },
      state
    };

    // ---- RUN LOOP ----
    function advanceOne(){
      ui.clearChecks();
      const phase = cfg.phases[phaseIdx];
      if (cfg.run) cfg.run(phase, state, ui);
      ui.redraw();
      phaseIdx = (phaseIdx + 1) % cfg.phases.length;
    }
    function getDelay(){ return speeds[Number(speedInp.value)] || 400; }
    function loop(){
      if (!playing) return;
      advanceOne();
      timer = setTimeout(loop, getDelay());
    }
    function startPlay(){
      playing = true;
      playBtn.textContent = '⏸️ PAUSE';
      stepBtn.disabled = true;
      loop();
    }
    function pausePlay(){
      playing = false;
      playBtn.textContent = '▶️ PLAY';
      stepBtn.disabled = false;
      if (timer) { clearTimeout(timer); timer = null; }
    }
    function reset(){
      pausePlay();
      for (const k in cfg.vars) {
        state[k] = cfg.vars[k].value;
        if (valEls[k]) valEls[k].textContent = String(cfg.vars[k].value);
        if (noteEls[k]) noteEls[k].textContent = cfg.vars[k].note || '';
      }
      phaseIdx = 0;
      ui.activeLine(0);
      ui.clearChecks();
      ui.narrate('Reset! Press PLAY or STEP to start ▶️');
      if (cfg.onReset) cfg.onReset(state, ui);
      ui.redraw();
    }

    playBtn.addEventListener('click', () => playing ? pausePlay() : startPlay());
    stepBtn.addEventListener('click', () => { if (playing) pausePlay(); advanceOne(); });
    resetBtn.addEventListener('click', reset);
    speedInp.addEventListener('input', () => { if (playing) { pausePlay(); startPlay(); } });

    // initial paint
    if (cfg.onInit) cfg.onInit(state, ui);
    ui.redraw();

    return { state, ui, advanceOne, startPlay, pausePlay, reset };
  }

  return { create };
})();
