(() => {
  'use strict';

  // shorthands
  const $ = (s) => document.querySelector(s);

  // elements
  const levelEl = $('#level');
  const lengthRangeEl = $('#lengthRange');
  const lengthValueEl = $('#lengthValue');
  const lowerEl = $('#lower');
  const upperEl = $('#upper');
  const numbersEl = $('#numbers');
  const symbolsEl = $('#symbols');
  const excludeAmbiguousEl = $('#excludeAmbiguous');
  const passwordEl = $('#password');
  const copyBtn = $('#copyBtn');
  const genBtn = $('#generateBtn');
  const strengthBar = $('#strengthBar');
  const strengthLabel = $('#strengthLabel');

  // character sets (use regular quoted strings to avoid template literal parsing edge cases)
  const LOWER = "abcdefghijklmnopqrstuvwxyz";
  const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const NUM   = "0123456789";
  const SYM   = "!@#$%^&*()-_=+[]{};:,.<>/?|~'\"\\`";  // includes backtick at the end

  const AMBIGUOUS = "Il1O0o{}[]()/\\'\"`~,;:.<>";

  // util
  function setLengthUI(v){
    lengthRangeEl.value = String(v);
    lengthValueEl.textContent = String(v);
  }

  function applyLevelDefaults(level){
    // update controls to sane defaults per level
    if (level === 'easy'){
      setLengthUI(8);
      lowerEl.checked = true;
      upperEl.checked = true;
      numbersEl.checked = false;
      symbolsEl.checked = false;
      excludeAmbiguousEl.checked = true;
    } else if (level === 'medium'){
      setLengthUI(12);
      lowerEl.checked = true;
      upperEl.checked = true;
      numbersEl.checked = true;
      symbolsEl.checked = false;
      excludeAmbiguousEl.checked = true;
    } else if (level === 'strong'){
      setLengthUI(16);
      lowerEl.checked = true;
      upperEl.checked = true;
      numbersEl.checked = true;
      symbolsEl.checked = true;
      excludeAmbiguousEl.checked = true;
    } else if (level === 'insane'){
      setLengthUI(24);
      lowerEl.checked = true;
      upperEl.checked = true;
      numbersEl.checked = true;
      symbolsEl.checked = true;
      excludeAmbiguousEl.checked = false;
    }
    // 'custom' keeps current toggles
  }

  // cryptographically secure integer in [0, maxExclusive)
  function rndInt(maxExclusive){
    const buf = new Uint32Array(1);
    const max = 0x100000000; // 2^32
    const limit = max - (max % maxExclusive);
    while(true){
      crypto.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % maxExclusive;
    }
  }

  function removeAmbiguous(s){
    const set = new Set(AMBIGUOUS.split(''));
    return s.split('').filter(ch => !set.has(ch)).join('');
  }

  function buildPool(opts){
    let pool = "";
    if (opts.lower)   pool += LOWER;
    if (opts.upper)   pool += UPPER;
    if (opts.numbers) pool += NUM;
    if (opts.symbols) pool += SYM;

    if (!pool) throw new Error('Select at least one character set.');

    // de-duplicate
    pool = Array.from(new Set(pool.split(''))).join('');

    if (opts.excludeAmbiguous){
      pool = removeAmbiguous(pool);
    }
    if (!pool) throw new Error('Character pool is empty after exclusions.');
    return pool;
  }

  function pick(pool){ return pool[rndInt(pool.length)]; }

  function shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--){
      const j = rndInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function generate(opts){
    const pool = buildPool(opts);
    const out = [];

    // ensure at least one of each selected set
    if (opts.lower)   out.push(pick(opts.excludeAmbiguous ? removeAmbiguous(LOWER) : LOWER));
    if (opts.upper)   out.push(pick(opts.excludeAmbiguous ? removeAmbiguous(UPPER) : UPPER));
    if (opts.numbers) out.push(pick(opts.excludeAmbiguous ? removeAmbiguous(NUM)   : NUM));
    if (opts.symbols) out.push(pick(opts.excludeAmbiguous ? removeAmbiguous(SYM)   : SYM));

    for (let i = out.length; i < opts.length; i++){
      out.push(pick(pool));
    }
    return shuffle(out).join('');
  }

  function uiOptions(){
    return {
      length: parseInt(lengthRangeEl.value, 10),
      lower: lowerEl.checked,
      upper: upperEl.checked,
      numbers: numbersEl.checked,
      symbols: symbolsEl.checked,
      excludeAmbiguous: excludeAmbiguousEl.checked,
    };
  }

  function updateStrength(pw, opts){
    // entropy approximation
    const pool = buildPool(opts);
    const entropy = Math.round(pw.length * Math.log2(pool.length));
    let label = 'Very Weak';
    if (entropy >= 80) label = 'Insane';
    else if (entropy >= 60) label = 'Strong';
    else if (entropy >= 36) label = 'Okay';
    else if (entropy >= 28) label = 'Weak';

    const percent = Math.max(5, Math.min(100, Math.round(entropy)));
    // render
    // ensure we have fill bar
    let fill = strengthBar.querySelector('.fill');
    if (!fill){
      fill = document.createElement('div');
      fill.className = 'fill';
      fill.style.position = 'absolute';
      fill.style.left = '0'; fill.style.top = '0'; fill.style.bottom = '0';
      fill.style.width = '0%';
      fill.style.borderRadius = '999px';
      fill.style.background = 'linear-gradient(90deg, #ef4444, #f59e0b, #22c55e, #06b6d4)';
      strengthBar.style.position = 'relative';
      strengthBar.appendChild(fill);
    }
    fill.style.width = percent + '%';
    strengthLabel.textContent = `Strength: ${label} • ~${entropy} bits`;
  }

  function regenerate(){
    try {
      const opts = uiOptions();
      const pw = generate(opts);
      passwordEl.value = pw;
      updateStrength(pw, opts);
    } catch (e) {
      passwordEl.value = (e && e.message) ? e.message : 'Error';
      strengthLabel.textContent = 'Strength: —';
    }
  }

  // event wiring
  levelEl.addEventListener('change', () => {
    applyLevelDefaults(levelEl.value);
    regenerate();
  });

  lengthRangeEl.addEventListener('input', () => {
    lengthValueEl.textContent = lengthRangeEl.value;
  });
  lengthRangeEl.addEventListener('change', regenerate);

  [lowerEl, upperEl, numbersEl, symbolsEl, excludeAmbiguousEl].forEach(el => {
    el.addEventListener('change', () => {
      if (levelEl.value !== 'custom') levelEl.value = 'custom';
      regenerate();
    });
  });

  genBtn.addEventListener('click', regenerate);

  copyBtn.addEventListener('click', async () => {
    const pw = passwordEl.value;
    if (!pw) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(pw);
      } else {
        passwordEl.select();
        document.execCommand('copy');
      }
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 1200);
    } catch {
      copyBtn.textContent = 'Failed';
      setTimeout(() => copyBtn.textContent = 'Copy', 1200);
    }
  });

  // initial render
  applyLevelDefaults(levelEl.value);
  regenerate();
})();
