const statusEl = document.getElementById('status');
const rowsBody = document.getElementById('rowsBody');
const addRowBtn = document.getElementById('addRowBtn');

const TABLE = 'trip_checklist_rows';
let rows = [];
let saveTimers = new Map();

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#ff9f9f' : 'var(--muted)';
}

function apiHeaders() {
  return {
    apikey: window.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };
}

async function api(path, options = {}) {
  const res = await fetch(`${window.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...apiHeaders(), ...(options.headers || {}) }
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error((data && data.message) || `HTTP ${res.status}`);
  return data;
}

function debounceSave(id, field, value) {
  const key = `${id}:${field}`;
  if (saveTimers.has(key)) clearTimeout(saveTimers.get(key));
  const t = setTimeout(() => saveField(id, field, value), 450);
  saveTimers.set(key, t);
}

async function saveField(id, field, value) {
  try {
    setStatus('A guardar…');
    await api(`${TABLE}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value, updated_at: new Date().toISOString() })
    });
    setStatus('Guardado.');
  } catch (e) {
    setStatus(`Erro ao guardar: ${e.message}`, true);
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function rowTemplate(r, idx) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${idx + 1}</td>
    <td><input type="text" data-id="${r.id}" data-field="campo" value="${esc(r.campo)}" placeholder="Ex: Botas de trilho"></td>
    <td><input type="text" data-id="${r.id}" data-field="praia" value="${esc(r.praia)}" placeholder="Ex: Protetor solar"></td>
    <td><input type="text" data-id="${r.id}" data-field="neve" value="${esc(r.neve)}" placeholder="Ex: Casaco térmico"></td>
    <td><button class="danger" data-delete="${r.id}">Apagar</button></td>
  `;
  return tr;
}

function render() {
  rowsBody.innerHTML = '';
  rows.forEach((r, i) => rowsBody.appendChild(rowTemplate(r, i)));
}

async function loadRows() {
  try {
    setStatus('A carregar dados…');
    rows = await api(`${TABLE}?select=*&order=ord.asc`);
    render();
    setStatus('Pronto.');
  } catch (e) {
    setStatus(`Erro a ler dados: ${e.message}`, true);
  }
}

async function addRow() {
  try {
    const nextOrd = rows.length ? Math.max(...rows.map(r => r.ord || 0)) + 1 : 1;
    const created = await api(TABLE, {
      method: 'POST',
      body: JSON.stringify([{ ord: nextOrd, campo: '', praia: '', neve: '' }])
    });
    rows.push(created[0]);
    render();
    setStatus('Linha criada.');
  } catch (e) {
    setStatus(`Erro ao criar linha: ${e.message}`, true);
  }
}

async function deleteRow(id) {
  try {
    await api(`${TABLE}?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    rows = rows.filter(r => r.id !== id);
    render();
    setStatus('Linha apagada.');
  } catch (e) {
    setStatus(`Erro ao apagar: ${e.message}`, true);
  }
}

function bindEvents() {
  addRowBtn.addEventListener('click', addRow);

  rowsBody.addEventListener('input', (e) => {
    if (e.target.matches('input[type="text"]')) {
      const id = e.target.dataset.id;
      const field = e.target.dataset.field;
      debounceSave(id, field, e.target.value);
    }
  });

  rowsBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-delete]');
    if (!btn) return;
    if (!confirm('Queres mesmo apagar esta linha?')) return;
    deleteRow(btn.dataset.delete);
  });
}

async function init() {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY || window.SUPABASE_URL.includes('YOUR_PROJECT_REF')) {
    return setStatus('Configura o ficheiro supabase-config.js com URL e ANON KEY.', true);
  }

  bindEvents();
  await loadRows();
}

init();
