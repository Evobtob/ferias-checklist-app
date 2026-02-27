const statusEl = document.getElementById('status');
const rowsBody = document.getElementById('rowsBody');
const addRowBtn = document.getElementById('addRowBtn');

const TABLE = 'trip_checklist_rows';
let supabase;
let rows = [];
let saveTimers = new Map();

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#ff9f9f' : 'var(--muted)';
}

function debounceSave(id, field, value) {
  const key = `${id}:${field}`;
  if (saveTimers.has(key)) clearTimeout(saveTimers.get(key));
  const t = setTimeout(() => saveField(id, field, value), 500);
  saveTimers.set(key, t);
}

async function saveField(id, field, value) {
  setStatus('A guardar…');
  const { error } = await supabase
    .from(TABLE)
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return setStatus(`Erro ao guardar: ${error.message}`, true);
  setStatus('Guardado.');
}

function rowTemplate(r, idx) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${idx + 1}</td>
    <td><input type="text" data-id="${r.id}" data-field="campo" value="${(r.campo || '').replace(/"/g, '&quot;')}" placeholder="Ex: Botas de trilho"></td>
    <td><input type="text" data-id="${r.id}" data-field="praia" value="${(r.praia || '').replace(/"/g, '&quot;')}" placeholder="Ex: Protetor solar"></td>
    <td><input type="text" data-id="${r.id}" data-field="neve" value="${(r.neve || '').replace(/"/g, '&quot;')}" placeholder="Ex: Casaco térmico"></td>
    <td><button class="danger" data-delete="${r.id}">Apagar</button></td>
  `;
  return tr;
}

function render() {
  rowsBody.innerHTML = '';
  rows.forEach((r, i) => rowsBody.appendChild(rowTemplate(r, i)));
}

async function loadRows() {
  setStatus('A carregar dados…');
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('ord', { ascending: true });

  if (error) return setStatus(`Erro a ler dados: ${error.message}`, true);
  rows = data || [];
  render();
  setStatus('Pronto.');
}

async function addRow() {
  const nextOrd = rows.length ? Math.max(...rows.map(r => r.ord || 0)) + 1 : 1;
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ord: nextOrd, campo: '', praia: '', neve: '' })
    .select('*')
    .single();

  if (error) return setStatus(`Erro ao criar linha: ${error.message}`, true);
  rows.push(data);
  render();
  setStatus('Linha criada.');
}

async function deleteRow(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return setStatus(`Erro ao apagar: ${error.message}`, true);
  rows = rows.filter(r => r.id !== id);
  render();
  setStatus('Linha apagada.');
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

  supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  bindEvents();
  await loadRows();
}

init();
