/* ============================================================
   ד״ר רובוט – לוגיקת האפליקציה
   ניתוב פנימי (hash), רינדור עמודים, מחולל פרומפטים, היסטוריה מקומית
   ============================================================ */
(function () {
  'use strict';

  const HISTORY_KEY = 'drrobot_history_v1';
  const HISTORY_LIMIT = 10;
  const $main = document.getElementById('main');
  const $toast = document.getElementById('toast');

  /* ---------- כלי עזר ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (arr, id) => arr.find((x) => x.id === id);
  const getTrack = (id) => byId(TRACKS, id);
  const getCategory = (track, id) => track && byId(track.categories, id);
  const getTask = (cat, id) => cat && byId(cat.tasks, id);

  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => $toast.classList.remove('show'), 2200);
  }

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [pathPart, queryPart] = raw.split('?');
    const path = pathPart.split('/').filter(Boolean);
    const query = {};
    if (queryPart) new URLSearchParams(queryPart).forEach((v, k) => (query[k] = v));
    return { path, query };
  }

  function navigate(hash) { location.hash = hash; }

  function setActiveNav(route) {
    document.querySelectorAll('.main-nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === route));
    document.getElementById('main-nav').classList.remove('open');
    document.querySelector('.nav-toggle').setAttribute('aria-expanded', 'false');
  }

  function render(html, route, title) {
    $main.innerHTML = html;
    setActiveNav(route);
    document.title = title ? `${title} – ${SITE_NAME}` : `${SITE_NAME} – AI לנשות מערכת הבריאות`;
    window.scrollTo({ top: 0, behavior: 'auto' });
    $main.focus({ preventScroll: true });
  }

  /* ---------- היסטוריה מקומית ---------- */
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  }
  function saveHistory(items) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT))); } catch { /* אחסון חסום */ }
  }
  function addToHistory(entry) {
    const items = loadHistory().filter((h) => h.prompt !== entry.prompt);
    items.unshift(entry);
    saveHistory(items);
  }
  function removeFromHistory(id) {
    saveHistory(loadHistory().filter((h) => h.id !== id));
  }

  /* ---------- העתקה ---------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  }

  /* ============================================================
     עמוד ראשי
     ============================================================ */
  function renderHome() {
    const cards = TRACKS.map((t) => `
      <a class="card track-card c-${t.color}" href="#/track/${t.id}">
        <div class="track-icon" aria-hidden="true">${t.icon}</div>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.tagline)}</p>
        <span class="card-link">כניסה למסלול ←</span>
      </a>`).join('');

    render(`
      <section class="hero">
        <span class="eyebrow">כלי מעשי · בעברית · בלי ז'רגון טכני</span>
        <h1>הבינה המלאכותית עובדת בשבילך, <br>לא במקומך</h1>
        <p class="lead">${esc(SITE_NAME)} הוא כלי אינטראקטיבי לנשים שעובדות במערכת הבריאות. בוחרים את התפקיד ואת המשימה של היום, ממלאים כמה שדות, ומקבלים פרומפט מוכן להעתקה לכל כלי AI. בלי לנחש מה לכתוב, ובלי לסכן פרטיות של מטופלים.</p>
        <div class="hero-cta">
          <a class="btn btn-primary btn-lg" href="#/generator">למחולל הפרומפטים</a>
          <a class="btn btn-secondary btn-lg" href="#/tools">איזה כלי AI לבחור?</a>
        </div>
      </section>

      <section class="section" id="tracks">
        <div class="section-title">
          <h2>בחרי את המסלול שלך</h2>
          <p>לכל תפקיד תוכן משלו: קטגוריות משימות, משימות נפוצות ושדות מותאמים.</p>
        </div>
        <div class="grid grid-3">${cards}</div>
      </section>

      <section class="section">
        <div class="section-title">
          <h2>איך זה עובד</h2>
        </div>
        <div class="steps">
          <div class="step"><h4>בוחרים מסלול</h4><p>מזכירה רפואית, מנהלת מרפאה או מלווה רופא/ה.</p></div>
          <div class="step"><h4>בוחרים משימה</h4><p>מה צריך לקרות היום: הודעה, דוח, נוהל, סיכום.</p></div>
          <div class="step"><h4>ממלאים כמה שדות</h4><p>טון, אורך, למי זה מיועד ורקע כללי. בלי פרטים מזהים.</p></div>
          <div class="step"><h4>מעתיקים ומדביקים</h4><p>הפרומפט המובנה עובר ל-ChatGPT, Claude או כל כלי אחר.</p></div>
        </div>
      </section>

      <section class="section">
        <div class="card" style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;justify-content:space-between">
          <div>
            <h3>למה בעצם צריך פרומפט מובנה?</h3>
            <p class="muted" style="margin:0">כלי AI נותנים תוצאה טובה כשהם יודעים מי מדבר, מה ההקשר, מה בדיוק צריך, באיזה פורמט ומה אסור. המחולל מרכיב את כל זה בשבילך, כך שהתשובה הראשונה כבר קרובה למה שרצית.</p>
          </div>
          <a class="btn btn-primary" href="#/generator">נסי עכשיו</a>
        </div>
      </section>
    `, 'home');
  }

  /* ============================================================
     עמוד מסלול
     ============================================================ */
  function renderTrack(trackId) {
    const t = getTrack(trackId);
    if (!t) return renderNotFound();
    const rec = TOOL_RECOMMENDATIONS[t.id];
    const tool = byId(TOOLS, rec.primary);

    const cats = t.categories.map((c) => `
      <section class="category c-${t.color}" aria-labelledby="cat-${c.id}">
        <div class="category-head">
          <span class="cat-icon" aria-hidden="true">${c.icon}</span>
          <div><h3 id="cat-${c.id}">${esc(c.name)}</h3><p>${esc(c.desc)}</p></div>
        </div>
        <div class="task-list">
          ${c.tasks.map((task) => `
            <a class="task-item" href="#/generator?track=${t.id}&cat=${c.id}&task=${task.id}">
              <strong>${esc(task.name)}</strong>
              <span>${esc(task.desc)}</span>
              <span class="go">יצירת פרומפט ←</span>
            </a>`).join('')}
        </div>
      </section>`).join('');

    render(`
      <nav class="breadcrumbs" aria-label="מיקום"><a href="#/">ראשי</a><span>›</span>${esc(t.name)}</nav>
      <header class="page-head c-${t.color}">
        <div class="track-icon" aria-hidden="true">${t.icon}</div>
        <div class="head-text">
          <h1>${esc(t.name)}</h1>
          <p>${esc(t.desc)}</p>
          <a class="btn btn-primary" href="#/generator?track=${t.id}">למחולל הפרומפטים של המסלול</a>
        </div>
      </header>
      ${cats}
      <div class="tip-box c-${t.color}">
        <h3>הכלי המומלץ למסלול: ${esc(tool.name)} ${tool.icon}</h3>
        <p>${esc(rec.why)} <a href="#/tools">להשוואה המלאה</a></p>
      </div>
    `, null, t.name);
  }

  /* ============================================================
     מחולל פרומפטים
     ============================================================ */
  const gen = { step: 1, track: null, cat: null, task: null, values: {}, prompt: '', generatedFrom: null };

  function renderGenerator(query) {
    // אתחול מצב מהכתובת
    const t = getTrack(query.track);
    const c = getCategory(t, query.cat);
    const task = getTask(c, query.task);
    if (t && t.id !== gen.track) { gen.track = t.id; gen.cat = null; gen.task = null; gen.values = {}; gen.prompt = ''; }
    if (c && c.id !== gen.cat) { gen.cat = c.id; gen.task = null; gen.values = {}; gen.prompt = ''; }
    if (task && task.id !== gen.task) { gen.task = task.id; gen.values = {}; gen.prompt = ''; }
    if (query.step) gen.step = Number(query.step);
    else gen.step = task ? 3 : c ? 3 : t ? 2 : 1;
    if (gen.step === 3 && !gen.task) gen.step = gen.cat ? 3 : gen.track ? 2 : 1;

    render(`
      <nav class="breadcrumbs" aria-label="מיקום"><a href="#/">ראשי</a><span>›</span>מחולל פרומפטים</nav>
      <h1>מחולל פרומפטים</h1>
      <p class="muted">ארבעה שלבים קצרים, ובסוף פרומפט מובנה שמוכן להעתקה. כל מה שתכתבי נשאר במכשיר שלך.</p>
      <div class="stepper" id="stepper" role="tablist" aria-label="שלבי המחולל"></div>
      <div class="gen-layout">
        <div class="gen-form" id="gen-form"></div>
        <div class="gen-output" id="gen-output"></div>
      </div>
      <section class="history" id="history" aria-labelledby="history-title"></section>
    `, 'generator', 'מחולל פרומפטים');

    drawStepper(); drawForm(); drawOutput(); drawHistory();
  }

  function drawStepper() {
    const steps = ['בחירת מסלול', 'קטגוריית משימה', 'מילוי שדות', 'הפרומפט המוכן'];
    const canReach = [true, !!gen.track, !!gen.task, !!gen.prompt];
    document.getElementById('stepper').innerHTML = steps.map((s, i) => {
      const n = i + 1;
      const cls = n === gen.step ? 'current' : n < gen.step && canReach[i] ? 'done' : '';
      return `<button type="button" class="${cls}" data-step="${n}" ${canReach[i] ? '' : 'disabled'} aria-current="${n === gen.step ? 'step' : 'false'}"><span class="num">${n}</span><span>${s}</span></button>`;
    }).join('');
    document.querySelectorAll('#stepper button').forEach((b) => b.addEventListener('click', () => { gen.step = Number(b.dataset.step); drawStepper(); drawForm(); }));
  }

  function drawForm() {
    const $f = document.getElementById('gen-form');
    const t = getTrack(gen.track), c = getCategory(t, gen.cat), task = getTask(c, gen.task);

    if (gen.step === 1) {
      $f.innerHTML = `<div class="card">
        <h2>א. באיזה תפקיד את עובדת?</h2>
        <div class="choice-grid">
          ${TRACKS.map((tr) => `<button type="button" class="choice ${gen.track === tr.id ? 'selected' : ''}" data-track="${tr.id}">
            <span class="choice-icon" aria-hidden="true">${tr.icon}</span><strong>${esc(tr.name)}</strong><span>${esc(tr.tagline)}</span></button>`).join('')}
        </div></div>`;
      $f.querySelectorAll('[data-track]').forEach((b) => b.addEventListener('click', () => {
        if (gen.track !== b.dataset.track) { gen.cat = null; gen.task = null; gen.values = {}; gen.prompt = ''; }
        gen.track = b.dataset.track; gen.step = 2; drawStepper(); drawForm(); drawOutput();
      }));
      return;
    }

    if (gen.step === 2) {
      $f.innerHTML = `<div class="card">
        <h2>ב. מה המשימה של היום?</h2>
        <p class="muted">מסלול: <strong>${esc(t.name)}</strong> · <a href="#" data-back="1">שינוי</a></p>
        ${t.categories.map((cat) => `
          <h3 style="margin-top:1rem">${cat.icon} ${esc(cat.name)}</h3>
          <div class="choice-grid" style="margin-bottom:.5rem">
            ${cat.tasks.map((tk) => `<button type="button" class="choice ${gen.task === tk.id && gen.cat === cat.id ? 'selected' : ''}" data-cat="${cat.id}" data-task="${tk.id}">
              <strong>${esc(tk.name)}</strong><span>${esc(tk.desc)}</span></button>`).join('')}
          </div>`).join('')}
      </div>`;
      $f.querySelector('[data-back]').addEventListener('click', (e) => { e.preventDefault(); gen.step = 1; drawStepper(); drawForm(); });
      $f.querySelectorAll('[data-task]').forEach((b) => b.addEventListener('click', () => {
        if (gen.task !== b.dataset.task || gen.cat !== b.dataset.cat) { gen.values = {}; gen.prompt = ''; }
        gen.cat = b.dataset.cat; gen.task = b.dataset.task; gen.step = 3; drawStepper(); drawForm(); drawOutput();
      }));
      return;
    }

    if (gen.step === 3) {
      const fields = [...task.fields];
      if (!fields.some((f) => f.id === 'format')) fields.push({ ...F.format });
      $f.innerHTML = `<div class="card">
        <h2>ג. כמה פרטים על המשימה</h2>
        <p class="muted"><strong>${esc(t.name)}</strong> › ${esc(c.name)} › <strong>${esc(task.name)}</strong> · <a href="#" data-back="2">שינוי משימה</a></p>
        <form id="task-form" class="form-grid" novalidate>
          ${fields.map((f) => fieldHTML(f, gen.values[f.id] ?? (f.id === 'format' ? task.defaultFormat : ''))).join('')}
          <div class="field-warning" id="sensitive-warning" hidden></div>
          <div class="form-actions">
            <button type="button" class="btn btn-ghost" data-back="2">→ חזרה</button>
            <button type="submit" class="btn btn-primary btn-lg">✨ יצירת הפרומפט</button>
          </div>
        </form></div>`;
      $f.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); gen.step = 2; drawStepper(); drawForm(); }));
      const form = $f.querySelector('#task-form');
      form.addEventListener('input', () => { collectValues(form, fields); checkSensitive(form); });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        collectValues(form, fields);
        let ok = true;
        fields.forEach((f) => {
          const wrap = form.querySelector(`[data-field="${f.id}"]`);
          const bad = f.required && !String(gen.values[f.id] || '').trim();
          wrap.classList.toggle('invalid', bad);
          if (bad) ok = false;
        });
        if (!ok) { toast('יש למלא את השדות המסומנים'); form.querySelector('.invalid input, .invalid select, .invalid textarea')?.focus(); return; }
        gen.prompt = buildPrompt(t, c, task, gen.values, fields);
        gen.generatedFrom = { track: t.id, cat: c.id, task: task.id };
        addToHistory({ id: Date.now().toString(36), ts: Date.now(), track: t.name, task: task.name, prompt: gen.prompt });
        gen.step = 4; drawStepper(); drawForm(); drawOutput(); drawHistory();
        if (window.matchMedia('(max-width: 899px)').matches) document.getElementById('gen-output').scrollIntoView({ behavior: 'smooth' });
      });
      checkSensitive(form);
      return;
    }

    if (gen.step === 4) {
      $f.innerHTML = `<div class="card">
        <h2>ד. הפרומפט מוכן</h2>
        <p>הפרומפט מופיע ${window.matchMedia('(min-width: 900px)').matches ? 'משמאל' : 'למטה'}. העתיקי אותו והדביקי בכלי ה-AI שבחרת.</p>
        <div class="after-copy">
          <strong>מה עושים עכשיו?</strong>
          <ol>
            <li>לוחצים "העתקה" ומדביקים ב-ChatGPT, Claude או כלי אחר. <a href="#/tools">לא בטוחה באיזה? כאן ההשוואה</a>.</li>
            <li>קוראים את התשובה עד הסוף ומתקנים מה שצריך. אפשר לכתוב לכלי "קצר יותר", "חם יותר" או "תני לי שתי גרסאות".</li>
            <li>רק עכשיו ממלאים את הפרטים האמיתיים (שמות, תאריכים) במערכת המרפאה, לא בכלי ה-AI.</li>
          </ol>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" data-back="3">→ עריכת השדות</button>
          <button type="button" class="btn btn-secondary" id="new-prompt">פרומפט חדש</button>
        </div></div>`;
      $f.querySelector('[data-back]').addEventListener('click', () => { gen.step = 3; drawStepper(); drawForm(); });
      $f.querySelector('#new-prompt').addEventListener('click', () => { gen.step = 2; gen.task = null; gen.cat = null; gen.values = {}; gen.prompt = ''; drawStepper(); drawForm(); drawOutput(); });
    }
  }

  function fieldHTML(f, value) {
    const req = f.required ? '<span class="req" aria-hidden="true">*</span>' : '';
    const id = `fld-${f.id}`;
    let control = '';
    if (f.type === 'select') {
      control = `<select id="${id}" name="${f.id}" ${f.required ? 'required' : ''}>
        <option value="">בחרי...</option>
        ${f.options.map((o) => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}
      </select>`;
    } else if (f.type === 'textarea') {
      control = `<textarea id="${id}" name="${f.id}" placeholder="${esc(f.placeholder || '')}" ${f.required ? 'required' : ''}>${esc(value)}</textarea>`;
    } else {
      control = `<input type="text" id="${id}" name="${f.id}" value="${esc(value)}" placeholder="${esc(f.placeholder || '')}" ${f.required ? 'required' : ''}>`;
    }
    return `<div class="field" data-field="${f.id}"><label for="${id}">${esc(f.label)}${req}</label>${control}</div>`;
  }

  function collectValues(form, fields) {
    fields.forEach((f) => { const el = form.elements[f.id]; if (el) gen.values[f.id] = el.value; });
  }

  function checkSensitive(form) {
    const $w = form.querySelector('#sensitive-warning');
    const text = Array.from(form.querySelectorAll('input[type=text], textarea')).map((el) => el.value).join('\n');
    const hits = SENSITIVE_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.msg);
    if (hits.length) {
      $w.hidden = false;
      $w.innerHTML = `<strong>⚠️ רגע לפני שממשיכים:</strong> ${esc(hits[0])} זכרי: לא מזינים פרטים מזהים של מטופלים. אפשר להחליף בתיאור כללי או ב-[סוגריים].`;
    } else { $w.hidden = true; }
  }

  /* ---------- בניית הפרומפט ---------- */
  function buildPrompt(track, cat, task, values, fields) {
    const v = (id) => String(values[id] || '').trim();
    const skip = new Set(['tone', 'length', 'audience', 'background', 'format', 'language']);
    const specifics = fields.filter((f) => !skip.has(f.id) && v(f.id)).map((f) => `- ${f.label.replace(/\s*\(.*?\)\s*$/, '')}: ${v(f.id)}`);

    const ctx = [];
    ctx.push(`אני עובדת כ${track.short} במרפאה בישראל, ואני פונה אליך לעזרה במשימה מתחום "${cat.name}".`);
    if (v('audience')) ctx.push(`התוצר מיועד ל: ${v('audience')}.`);
    if (v('background')) ctx.push(`רקע כללי (ללא פרטים מזהים):\n${v('background')}`);

    const taskLines = [task.goal];
    if (specifics.length) taskLines.push(`פרטי המשימה:\n${specifics.join('\n')}`);

    const fmt = [];
    fmt.push(`- פורמט: ${v('format') || task.defaultFormat || 'טקסט רציף'}`);
    if (v('length')) fmt.push(`- אורך: ${v('length')}`);
    if (v('tone')) fmt.push(`- טון: ${v('tone')}`);
    fmt.push(`- שפה: ${v('language') || 'עברית'}, בלשון פנייה מתאימה לנמען/ת, ללא שגיאות כתיב.`);
    if (task.outputHint) fmt.push(`- ${task.outputHint}`);
    fmt.push('- במקומות שבהם חסר לך פרט (שם, תאריך, שעה), השאר/י מקום ריק בסוגריים מרובעים, למשל [שם המטופל/ת], ואל תמציא/י.');

    const limits = [
      'אל תכלול/י מידע רפואי, אבחנות או המלצות טיפוליות. כל עניין רפואי מופנה לרופא/ה.',
      'אל תמציא/י עובדות, מספרים, מדיניות או נהלים. אם חסר מידע, שאל/י אותי שאלת הבהרה אחת קצרה לפני שתענה/י.',
      'אין להשתמש בשום פרט מזהה של מטופלים. אם נראה לך שהוזן פרט כזה בטעות, התעלם/י ממנו והתרע/י לי.',
      'שמור/י על שפה מכבדת, מקצועית ונגישה, בלי ז\'רגון מיותר.',
      'בסיום, הוסף/י שורה אחת עם הצעה לשיפור או לבדיקה שכדאי לי לעשות לפני השימוש.'
    ];

    return [
      `## תפקיד`,
      `את/ה ${track.role}. את/ה כותב/ת בעברית תקנית, ברורה ואנושית, ומכיר/ה היטב את הרגישות של עבודה מול מטופלים ומידע רפואי.`,
      ``,
      `## הקשר`,
      ctx.join('\n'),
      ``,
      `## משימה`,
      taskLines.join('\n'),
      ``,
      `## פורמט פלט`,
      fmt.join('\n'),
      ``,
      `## מגבלות`,
      limits.map((l) => `- ${l}`).join('\n')
    ].join('\n');
  }

  function drawOutput() {
    const $o = document.getElementById('gen-output');
    if (!$o) return;
    if (!gen.prompt) {
      $o.innerHTML = `<div class="card"><div class="output-head"><h3>הפרומפט שלך</h3></div>
        <div class="prompt-box empty">הפרומפט יופיע כאן אחרי מילוי השדות.<br>הוא יכלול תפקיד, הקשר, משימה, פורמט פלט ומגבלות.</div></div>`;
      return;
    }
    $o.innerHTML = `<div class="card">
      <div class="output-head">
        <h3>הפרומפט שלך</h3>
        <div class="output-actions">
          <button type="button" class="btn btn-primary" id="copy-btn">📋 העתקה</button>
          <button type="button" class="btn btn-secondary btn-sm" id="download-btn">שמירה כקובץ</button>
        </div>
      </div>
      <pre class="prompt-box" id="prompt-text" tabindex="0" aria-label="הפרומפט שנוצר">${esc(gen.prompt)}</pre>
      <p class="muted" style="margin:0;font-size:.88rem">אפשר לערוך את הפרומפט ישירות בכלי ה-AI אחרי ההדבקה. נשמר אוטומטית בהיסטוריה המקומית.</p>
    </div>`;
    $o.querySelector('#copy-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const ok = await copyText(gen.prompt);
      toast(ok ? 'הפרומפט הועתק! עכשיו הדביקי בכלי ה-AI' : 'ההעתקה נכשלה, סמני את הטקסט והעתיקי ידנית');
      if (ok) { btn.textContent = '✓ הועתק'; setTimeout(() => { if (btn.isConnected) btn.textContent = '📋 העתקה'; }, 2000); }
    });
    $o.querySelector('#download-btn').addEventListener('click', () => {
      const blob = new Blob([gen.prompt], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'prompt.txt'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  }

  function drawHistory() {
    const $h = document.getElementById('history');
    if (!$h) return;
    const items = loadHistory();
    $h.innerHTML = `<div class="history-head">
        <h2 id="history-title">היסטוריה (${items.length}/${HISTORY_LIMIT} האחרונים)</h2>
        ${items.length ? '<button type="button" class="btn btn-ghost btn-sm" id="clear-history">ניקוי היסטוריה</button>' : ''}
      </div>
      ${items.length ? `<div class="history-list">${items.map((h) => `
        <div class="history-item">
          <div><div class="title">${esc(h.task)}</div><div class="meta">${esc(h.track)} · ${new Date(h.ts).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</div></div>
          <div class="actions">
            <button type="button" class="btn btn-secondary btn-sm" data-copy="${h.id}">העתקה</button>
            <button type="button" class="btn btn-ghost btn-sm" data-open="${h.id}">הצגה</button>
            <button type="button" class="btn btn-ghost btn-sm" data-del="${h.id}" aria-label="מחיקה">🗑</button>
          </div>
          <div class="preview">${esc(h.prompt.split('\n').find((l) => l && !l.startsWith('#')) || '')}</div>
        </div>`).join('')}</div>`
      : '<div class="empty-state">עדיין אין פרומפטים שמורים. הפרומפטים נשמרים רק בדפדפן הזה, במכשיר הזה.</div>'}`;

    $h.querySelector('#clear-history')?.addEventListener('click', () => {
      if (confirm('למחוק את כל ההיסטוריה המקומית?')) { saveHistory([]); drawHistory(); toast('ההיסטוריה נוקתה'); }
    });
    $h.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
      const h = items.find((x) => x.id === b.dataset.copy);
      toast((await copyText(h.prompt)) ? 'הועתק!' : 'ההעתקה נכשלה');
    }));
    $h.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
      const h = items.find((x) => x.id === b.dataset.open);
      gen.prompt = h.prompt; gen.step = 4; drawStepper(); drawForm(); drawOutput();
      document.getElementById('gen-output').scrollIntoView({ behavior: 'smooth' });
    }));
    $h.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { removeFromHistory(b.dataset.del); drawHistory(); }));
  }

  /* ============================================================
     איזה כלי AI לבחור
     ============================================================ */
  function renderTools() {
    const recs = TRACKS.map((t) => {
      const r = TOOL_RECOMMENDATIONS[t.id]; const p = byId(TOOLS, r.primary); const a = byId(TOOLS, r.alt);
      return `<div class="card rec-card c-${t.color}">
        <span class="badge">${t.icon} ${esc(t.name)}</span>
        <div class="rec-tool">${p.icon} ${esc(p.name)}</div>
        <p style="margin:0">${esc(r.why)}</p>
        <div class="alt"><strong>חלופה:</strong> ${a.icon} ${esc(a.name)}. ${esc(r.altWhy)}</div>
      </div>`;
    }).join('');

    const cards = TOOLS.map((tool) => `
      <div class="card tool-card">
        <div class="tool-head"><span class="ti" aria-hidden="true">${tool.icon}</span><div><h3 style="margin:0">${esc(tool.name)}</h3><div class="by">${esc(tool.by)}</div></div></div>
        <p style="margin:.6rem 0 0">${esc(tool.oneLiner)}</p>
        <h4>יתרונות</h4><ul>${tool.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        <h4>שימי לב</h4><ul>${tool.weaknesses.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        <h4>מתאים במיוחד ל</h4><p style="margin:0">${esc(tool.bestFor)}</p>
        <div class="privacy">🔒 ${esc(tool.privacyNote)}</div>
      </div>`).join('');

    const table = `<div class="table-wrap"><table class="compare">
      <thead><tr><th>כלי</th><th>עברית</th><th>גרסה חינמית</th><th>הכי טוב ל</th></tr></thead>
      <tbody>${TOOLS.map((t) => `<tr><td><strong>${t.icon} ${esc(t.name)}</strong><br><span class="muted" style="font-size:.85rem">${esc(t.by)}</span></td><td>${esc(t.hebrew)}</td><td>${esc(t.free)}</td><td>${esc(t.bestFor)}</td></tr>`).join('')}</tbody>
    </table></div>`;

    render(`
      <nav class="breadcrumbs" aria-label="מיקום"><a href="#/">ראשי</a><span>›</span>איזה כלי AI לבחור</nav>
      <h1>איזה כלי AI לבחור?</h1>
      <p class="muted" style="max-width:760px">האמת הפשוטה: כל הכלים המובילים טובים מאוד למשימות היומיומיות שלך, וההבדלים ביניהם קטנים מהפער בין פרומפט טוב לפרומפט גרוע. בחרי כלי אחד, למדי אותו, ועבדי איתו. למטה ההמלצה שלנו לכל מסלול והשוואה קצרה.</p>

      <section class="section"><div class="section-title"><h2>ההמלצה לכל מסלול</h2></div><div class="grid grid-3">${recs}</div></section>
      <section class="section"><div class="section-title"><h2>השוואה במבט אחד</h2></div>${table}
        <p class="muted mt-1" style="font-size:.88rem">מגבלות הגרסאות החינמיות והמחירים משתנים לעיתים קרובות. בדקי באתר הכלי לפני שמחליטים.</p></section>
      <section class="section"><div class="section-title"><h2>על כל כלי בקצרה</h2></div><div class="grid grid-2">${cards}</div></section>

      <section class="section"><div class="card">
        <h3>שלוש עצות שחשובות יותר מהבחירה בכלי</h3>
        <ol style="margin:0;padding-inline-start:1.2rem">
          <li><strong>בררי מה הארגון מאשר.</strong> אם לקופה או לבית החולים יש כלי ארגוני מאושר, זו הבחירה. <a href="#/safety">לכללי הבטיחות</a>.</li>
          <li><strong>תני לכלי הקשר.</strong> המחולל שלנו עושה את זה בשבילך. <a href="#/generator">נסי</a>.</li>
          <li><strong>בקשי גרסאות.</strong> "תני לי שלוש אפשרויות" או "קצר ב-30%" משדרגים כל תשובה.</li>
        </ol>
      </div></section>
    `, 'tools', 'איזה כלי AI לבחור');
  }

  /* ============================================================
     בטיחות ופרטיות
     ============================================================ */
  function renderSafety() {
    const rules = SAFETY_RULES.map((r) => `
      <div class="card rule">
        <div class="rule-icon" aria-hidden="true">${r.icon}</div>
        <div><h3>${esc(r.title)}</h3><p style="margin:0">${esc(r.text)}</p>
        <div class="do"><strong>מה עושים במקום:</strong> ${esc(r.doThis)}</div></div>
      </div>`).join('');

    render(`
      <nav class="breadcrumbs" aria-label="מיקום"><a href="#/">ראשי</a><span>›</span>בטיחות ופרטיות</nav>
      <h1>כללי בטיחות ופרטיות</h1>
      <p class="muted" style="max-width:760px">כלי AI הם עוזרים נהדרים לניסוח, לארגון ולניהול. הם לא מקום לשמור בו מידע על מטופלים. העמוד הזה מרכז את הכללים שחייבים לדעת לפני שמדביקים משהו בכלי AI, ואת החלופות הפשוטות שעובדות.</p>

      <section class="section"><div class="grid grid-2">${rules}</div></section>

      <section class="section">
        <div class="section-title"><h2>כך נראה פרומפט בטוח</h2><p>אותה משימה, שתי דרכים. ההבדל: אין שום פרט מזהה.</p></div>
        <div class="good-bad">
          <div class="card bad"><div class="label">✗ לא ככה</div>
            <pre>כתבי הודעה ל[שם מלא של מטופלת], ת.ז. [מספר], שיש לה תור לקרדיולוג ב-12.3 בגלל הפרעות קצב, שהתור נדחה.</pre>
            <p class="muted" style="margin:.6rem 0 0;font-size:.9rem">שם, ת.ז., אבחנה ותאריך: כל אחד מהם לבד הוא בעיה. יחד זה תיק רפואי.</p></div>
          <div class="card good"><div class="label">✓ ככה</div>
            <pre>כתבי הודעה למטופלת על דחיית תור למומחה מצד המרפאה, בטון חם ומתנצל, עם הצעה לתור חלופי. השאירי מקום ריק ל[שם], [תאריך] ו[שעה].</pre>
            <p class="muted" style="margin:.6rem 0 0;font-size:.9rem">הכלי כותב את הנוסח. את ממלאת את הפרטים במערכת המרפאה.</p></div>
        </div>
      </section>

      <section class="section"><div class="red-flags">
        <h3>🚩 רשימת "עצרי רגע": אם אחד מאלה נמצא בטקסט, לא מדביקים</h3>
        <ul>
          <li>שם פרטי או שם משפחה של מטופל/ת</li><li>מספר תעודת זהות או דרכון</li><li>מספר טלפון או כתובת מייל</li><li>כתובת מגורים</li>
          <li>תאריך לידה מלא</li><li>מספר תיק, מספר ביקור או ברקוד</li><li>אבחנה, תרופה או תוצאת בדיקה של אדם מסוים</li><li>תמונה, סריקה או צילום מסך מהמערכת</li>
          <li>שם של בן/בת משפחה או מעסיק</li><li>שילוב פרטים שמזהה אדם ביישוב קטן</li>
        </ul>
      </div></section>

      <section class="section"><div class="card">
        <h3>ומה לגבי האתר הזה?</h3>
        <p style="margin:0">${esc(SITE_NAME)} פועל כולו בדפדפן שלך. מה שאת מקלידה בטופס לא נשלח לשום שרת, וההיסטוריה נשמרת רק במכשיר שלך (ואפשר למחוק אותה בכל רגע). עם זאת, גם כאן ההמלצה זהה: אל תקלידי פרטים מזהים, כי הפרומפט בסוף מועתק לכלי AI חיצוני.</p>
      </div></section>
    `, 'safety', 'כללי בטיחות ופרטיות');
  }

  function renderNotFound() {
    render(`<div class="empty-state mt-2"><h2>העמוד לא נמצא</h2><p>אולי הקישור השתנה.</p><a class="btn btn-primary" href="#/">לעמוד הראשי</a></div>`, null, 'לא נמצא');
  }

  /* ============================================================
     ניתוב
     ============================================================ */
  function route() {
    const { path, query } = parseHash();
    const page = path[0] || '';
    switch (page) {
      case '': return renderHome();
      case 'track': return renderTrack(path[1]);
      case 'generator': return renderGenerator(query);
      case 'tools': return renderTools();
      case 'safety': return renderSafety();
      default: return renderNotFound();
    }
  }

  /* ---------- אתחול ---------- */
  document.querySelectorAll('[data-site-name]').forEach((el) => (el.textContent = SITE_NAME));
  document.querySelector('.nav-toggle').addEventListener('click', (e) => {
    const nav = document.getElementById('main-nav');
    const open = nav.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
  window.addEventListener('hashchange', route);
  route();
})();
