/* ===================================================================
   Grupo Addvalora – app.js
   Sistema de Consulta de Procedimentos por Seguradora
   =================================================================== */

// ── Configuração de admin ──────────────────────────────────────────
// ATENÇÃO: em produção real, use autenticação do servidor.
// Para GitHub Pages (site estático), usamos hash da senha.
// ── Configurações de Acesso ─────────────────────────────────────────
// Senha padrão para todos os setores: addvalora2025
const DEFAULT_PASS_HASH = '97310a54bfb0de4f089997d00f8b908c39e9064ee9438893010d4f0b61248c57';

const SECTORS_CONFIG = {
  // --- Logins Individuais por Unidade (Acesso Único e Estrito) ---
  'property-sla': { 
    allowedTabs: ['PROPERTY (SLA)'],
    passHash: '0e1efb99794ba6352960aad911a3d98ec664a4fbd677d18227921262ea7a613e' // Grupo2003
  },
  'property-focais': { allowedTabs: ['PROPERTY (Focais)'] },
  'rcg-sla': { 
    allowedTabs: ['RCG (SLA)'],
    passHash: '77e5859e8d2126c0f2d0ea199439198c32c2bfe4daaa01eb845c44722e3b79da' // RCG2026
  },
  'rcp-sla': { 
    allowedTabs: ['RCP (SLA)'],
    passHash: '63f549e988c256b1b0066b3c6b3b7ea3d41e2bffb5a561179e78e5e5509754ec' // RCP33
  },
  'garantia-judicial': { 
    allowedTabs: ['Garantia Judicial'],
    passHash: 'ff2be005daea1c9c3b291770ac11f063a70509559fd6d283343d6f36f5ebc298' // SGJudicial1/19
  },
  'garantia-ressarcimento': { 
    allowedTabs: ['Garantia - Ressarcimento'],
    passHash: '0c8befb4e70052c020d136ea7aeb74c11427d70360a2d3ba4f5e3453480f5fbb' // Administrativo123
  },
  'garantia-trabalhista': { 
    allowedTabs: ['Garantia - Adicional Trabalhista'],
    passHash: 'b09267b0165122e7763a6631c8a4a324000bde171a7f4366a223bb47078cbad6' // Adicional2015
  },
  'garantia-executante': { 
    allowedTabs: ['Garantia - Executante'],
    passHash: 'd586365fb474228abbc048f267804222b1415f7a61627167800f2f2a03ca9b1f' // Operacao2015
  },
  'garantia-ecto': { 
    allowedTabs: ['Garantia - ECTO'],
    passHash: '614e5e3620a8303f8a6fbdc35598dda674e66844eba008aa682d87305096ca1b' // Sto2018
  },
  'boticario': { 
    allowedTabs: ['Boticário'],
    passHash: 'f150b8762925ba342154e1e961853169b65e3cdcb2b9fee745d8d67459b0a7d2' // boticario123
  },
  'juridico': { allowedTabs: ['Jurídico'] },
  'contencioso': { allowedTabs: ['Contencioso'] },
  'transportes': { allowedTabs: ['Transportes'] },
  'carga': { allowedTabs: ['Carga'] },

  // --- Logins de Grupo (Opcional, caso queira ver a área toda) ---
  'property': { 
    allowedTabs: ['PROPERTY (SLA)', 'PROPERTY (Focais)', 'Riscos Diversos'],
    passHash: '0e1efb99794ba6352960aad911a3d98ec664a4fbd677d18227921262ea7a613e' // Grupo2003
  },
  'garantia-geral': { allowedTabs: ['Garantia Judicial', 'Garantia - Ressarcimento', 'Garantia - Adicional Trabalhista', 'Garantia - Executante', 'Garantia - ECTO'] },
  'financeiro-geral': { allowedTabs: ['Financeiro', 'Faturamento'] },
  'juridico-geral': { allowedTabs: ['Jurídico', 'Contencioso'] },
  'transportes-geral': { allowedTabs: ['Transportes', 'Carga'] }
};

// ── Utilitários ───────────────────────────────────────────────────
function getAbasPermitidas() {
  let abas = Object.keys(allData);
  if (isAdmin) return abas; // Admin vê tudo

  if (userSector && SECTORS_CONFIG[userSector]) {
    const allowed = SECTORS_CONFIG[userSector].allowedTabs;
    const allowedLower = allowed.map(k => k.toLowerCase().trim());
    
    const isGeral = userSector.endsWith('-geral') || userSector === 'property';

    return abas.filter(aba => {
        const a = aba.toLowerCase().trim();

        if (!isGeral) {
            // Match exato para logins de unidade (insensível a maiúsculas/minúsculas e espaços)
            return allowedLower.includes(a);
        }

        // Match flexível para logins -geral
        return allowedLower.some(k => {
            if (a === k) return true;
            if (a.includes(k)) return true;
            return false;
        });
    });
  }
  return [];
}

const ADMIN_CREDENTIALS = {
  user: 'admin',
  passHash: DEFAULT_PASS_HASH
};

// ── Estado global ──────────────────────────────────────────────────
let allData = {};          // { aba: { headers:[], data:[] } }
let abaAtiva = '';         // aba selecionada
let termoBusca = '';       // texto de busca
let isAdmin = false;       // logado como admin?
let userSector = null;     // setor do usuário logado (ex: 'property')

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('Sistema Addvalora carregado.');
  
  // Travas de segurança via JS
  document.addEventListener('contextmenu', e => e.preventDefault()); // Desabilita botão direito
  
  // Bloqueio de Copiar e Colar (Exceto na área de login)
  document.addEventListener('copy', e => {
    if (e.target.closest('#login-overlay, #modal-login')) return;
    e.preventDefault();
    alert('A cópia de dados é restrita por segurança.');
  });
  document.addEventListener('paste', e => {
    if (e.target.closest('#login-overlay, #modal-login')) return;
    e.preventDefault();
  });
  document.addEventListener('selectstart', e => {
    if (e.target.closest('#login-overlay, #modal-login') || e.target.closest('.selectable')) {
        return;
    }
    e.preventDefault();
  });

  document.addEventListener('keydown', e => {
    // Desabilita F12, Ctrl+Shift+I, Ctrl+U (Ver código fonte)
    // Ctrl+C, Ctrl+V são permitidos APENAS na área de login
    const isLoginArea = e.target.closest('#login-overlay, #modal-login');
    
    const forbiddenKeys = [123]; // F12
    const isDevToolsCombo = (
      (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
      (e.ctrlKey && e.keyCode === 85)    // Ctrl+U
    );

    const isCopyPasteCombo = (
      (e.ctrlKey && e.keyCode === 67) || // Ctrl+C
      (e.ctrlKey && e.keyCode === 86)    // Ctrl+V
    );

    if (forbiddenKeys.includes(e.keyCode) || isDevToolsCombo) {
      e.preventDefault();
      alert('Esta ação foi desabilitada por motivos de segurança.');
      return;
    }

    if (isCopyPasteCombo && !isLoginArea) {
      e.preventDefault();
      alert('A cópia de dados é restrita por segurança.');
    }
  });

  // Verificar sessão salva
  const isAdminSession = sessionStorage.getItem('av_admin') === '1';
  const savedSector = sessionStorage.getItem('av_sector');

  if (isAdminSession) {
    isAdmin = true;
    userSector = null;
    setAdminMode(true);
    document.getElementById('login-overlay').classList.add('hidden');
  } else if (savedSector) {
    isAdmin = false;
    userSector = savedSector;
    setAdminMode(false);
    document.getElementById('login-overlay').classList.add('hidden');
  }

  carregarDados();
  document.getElementById('input-busca').addEventListener('input', e => {
    termoBusca = e.target.value.trim();
    renderTabela();
  });
  document.getElementById('select-aba').addEventListener('change', e => {
    abaAtiva = e.target.value;
    sincronizarTabs();
    renderTabela();
  });
});

// ── Carregar dados ────────────────────────────────────────────────
async function carregarDados() {
  try {
    let rawData = {};
    // Tenta carregar do localStorage (se importado pelo admin)
    const localData = localStorage.getItem('av_dados');
    if (localData) {
      rawData = JSON.parse(localData);
    } else {
      const resp = await fetch('dados.json');
      if (!resp.ok) throw new Error('Falha ao carregar dados');
      rawData = await resp.json();
    }

    // LIMPEZA GLOBAL DE DADOS (Remover __EMPTY de todas as abas e headers)
     allData = {};
     for (const [aba, content] of Object.entries(rawData)) {
         // Corrigir typo no nome da aba se existir
         let finalAba = aba.trim();
         if (finalAba.toLowerCase().includes('trabalhist') && !finalAba.toLowerCase().includes('trabalhista')) {
             finalAba = finalAba.replace(/Trabalhist/gi, 'Trabalhista');
         }

         const cleanHeaders = (content.headers || []).map(h => {
             // Corrigir typo no header
             let finalH = String(h);
             if (finalH.toLowerCase().includes('trabalhist') && !finalH.toLowerCase().includes('trabalhista')) {
                 finalH = finalH.replace(/Trabalhist/gi, 'Trabalhista');
             }
             return finalH;
         }).filter(h => !String(h).toUpperCase().includes('__EMPTY'));

         const cleanRows = (content.data || []).map(row => {
             const newRow = {};
             // Copiar apenas chaves que não sejam __EMPTY e corrigir typos
             for (const key in row) {
                 const kUpper = String(key).toUpperCase();
                 if (!kUpper.includes('__EMPTY') && kUpper !== 'UNDEFINED' && kUpper !== 'NULL') {
                     let finalKey = key;
                     if (key.toLowerCase().includes('trabalhist') && !key.toLowerCase().includes('trabalhista')) {
                         finalKey = key.replace(/Trabalhist/gi, 'Trabalhista');
                     }

                     let val = row[key];
                     if (typeof val === 'string' && val.toLowerCase().includes('trabalhist') && !val.toLowerCase().includes('trabalhista')) {
                         val = val.replace(/Trabalhist/gi, 'Trabalhista');
                     }
                     newRow[finalKey] = val;
                 }
             }
             return newRow;
         });
         allData[finalAba] = { headers: cleanHeaders, data: cleanRows };
     }

    inicializarInterface();
  } catch (err) {
    document.getElementById('loading').innerHTML = `
      <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i>
      <p class="text-red-400">Erro ao carregar dados: ${err.message}</p>`;
  }
}

// Hash simples para comparar senha (SHA-256 via Web Crypto API)
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Inicializar interface ─────────────────────────────────────────
function inicializarInterface() {
  const abas = getAbasPermitidas();

  if (!abas.length) {
    document.getElementById('loading').innerHTML = `
      <i class="fas fa-lock text-4xl text-orange-400 mb-3"></i>
      <p class="text-gray-500">Seu setor não possui acesso a categorias.</p>`;
    return;
  }

  // Limpar select e abas antes de preencher
  const sel = document.getElementById('select-aba');
  sel.innerHTML = '<option value="">Unidade</option>';
  const container = document.getElementById('tabs-container');
  container.innerHTML = '';

  // Preencher select
  abas.forEach(aba => {
    const opt = document.createElement('option');
    opt.value = aba;
    opt.textContent = aba;
    sel.appendChild(opt);
  });

  // Criar tab buttons - Só mostrar "Todas as Unidades" para admin ou se tiver mais de 1 aba
  if (isAdmin || abas.length > 1) {
    const btnTodos = document.createElement('button');
    btnTodos.className = 'tab-btn active';
    btnTodos.textContent = 'Todas as Unidades';
    btnTodos.dataset.aba = '';
    btnTodos.onclick = () => selecionarTab('');
    container.appendChild(btnTodos);
    abaAtiva = '';
  } else {
    // Se tiver apenas uma aba, ela já começa ativa
    abaAtiva = abas[0];
    sel.value = abaAtiva;
  }

  abas.forEach(aba => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (aba === abaAtiva ? ' active' : '');
    btn.textContent = aba;
    btn.dataset.aba = aba;
    btn.onclick = () => selecionarTab(aba);
    container.appendChild(btn);
  });

  renderTabela();
}

// ── Selecionar aba ────────────────────────────────────────────────
function selecionarTab(aba) {
  abaAtiva = aba;
  document.getElementById('select-aba').value = aba;
  sincronizarTabs();
  renderTabela();
}

function sincronizarTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.aba === abaAtiva);
  });
}

// ── Render tabela ─────────────────────────────────────────────────
function renderTabela() {
  document.getElementById('loading').classList.add('hidden');

  // Juntar dados de todas as abas ou aba ativa
  let rows = [];
  let headers = [];

  if (!abaAtiva) {
    const abasPermitidas = getAbasPermitidas();

    // Todas as abas permitidas
    abasPermitidas.forEach((aba, idx) => {
      const d = allData[aba];
      if (!d || !d.data || d.data.length === 0) return;
      if (idx === 0 || headers.length === 0) {
          headers = (d.headers || []).filter(h => !h.includes('__EMPTY'));
      }
      d.data.forEach(row => rows.push({ ...row, '__aba__': aba }));
    });
  } else {
    // Se selecionou uma aba específica, verificar se o usuário tem permissão
    const abasPermitidas = getAbasPermitidas();
    if (!abasPermitidas.includes(abaAtiva)) {
        document.getElementById('table-container').classList.add('hidden');
        document.getElementById('no-results').classList.remove('hidden');
        return;
    }

    const d = allData[abaAtiva];
    if (d) {
      headers = (d.headers || []).filter(h => !h.includes('__EMPTY'));
      rows = (d.data || []).map(r => ({ ...r, '__aba__': abaAtiva }));
    }
  }

  // Filtrar por busca
  if (termoBusca) {
    const t = termoBusca.toLowerCase();
    rows = rows.filter(row =>
      Object.values(row).some(v => String(v || '').toLowerCase().includes(t))
    );
  }

  // Atualizar contador
  document.getElementById('results-count').textContent =
    `${rows.length} registro${rows.length !== 1 ? 's' : ''} encontrado${rows.length !== 1 ? 's' : ''}`;

  if (!rows.length) {
    document.getElementById('table-container').classList.add('hidden');
    document.getElementById('no-results').classList.remove('hidden');
    return;
  }

  document.getElementById('no-results').classList.add('hidden');
  document.getElementById('table-container').classList.remove('hidden');

  // Montar cabeçalho
  const thead = document.getElementById('table-head');
  thead.innerHTML = '';
  const trHead = document.createElement('tr');

  // Coluna aba (quando mostrando todas)
  if (!abaAtiva) {
    const th = document.createElement('th');
    th.textContent = 'Categoria';
    th.className = 'sticky left-0';
    trHead.appendChild(th);
  }

  // Primeiras colunas mais importantes
  const colsPrioritarias = headers.filter(h => {
      const hu = String(h).toUpperCase();
      return !hu.includes('__EMPTY') && hu !== 'UNDEFINED' && hu !== 'NULL';
  }).slice(0, 8);
  colsPrioritarias.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    trHead.appendChild(th);
  });

  const thAcao = document.createElement('th');
  thAcao.textContent = '';
  thAcao.style.width = '40px';
  trHead.appendChild(thAcao);
  thead.appendChild(trHead);

  // Montar corpo
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.className = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';

      if (!abaAtiva) {
        const td = document.createElement('td');
        td.innerHTML = `<span class="badge-admin">${escHtml(row['__aba__'] || '')}</span>`;
        tr.appendChild(td);
      }

      // Encontrar a chave real da seguradora (primeira coluna que não seja __aba__)
      const keys = Object.keys(row);
      const insurerKey = keys.find(k => {
          const kUpper = k.toUpperCase();
          return kUpper.includes('SEGURADORA') || kUpper.includes('CIA') || kUpper.includes('SISTEMA') || kUpper.includes('COMPANHIA');
      }) || keys.find(k => k !== '__aba__' && !k.includes('__EMPTY')) || keys[0];

      colsPrioritarias.forEach(h => {
        const td = document.createElement('td');
        const val = row[h] || '';
        td.title = val;
        
        let formattedVal = escHtml(String(val));

        // Estilo especial para a primeira coluna (Seguradora)
        if (h === insurerKey) {
            td.style.fontWeight = '600';
            td.style.color = 'var(--orange-dark)';
        }
        
        // Aplicar Badges Sim/Não (mais robusto)
        const checkVal = formattedVal.toLowerCase().trim();
        if (checkVal === 'sim' || checkVal === 's') {
          formattedVal = `<span class="badge-sim">SIM</span>`;
        } else if (checkVal === 'não' || checkVal === 'nao' || checkVal === 'n') {
          formattedVal = `<span class="badge-nao">NÃO</span>`;
        }

        td.innerHTML = highlightText(formattedVal, termoBusca);
        tr.appendChild(td);
      });

    // Botão de detalhe
    const tdAcao = document.createElement('td');
    tdAcao.className = 'text-center';
    tdAcao.innerHTML = `<button onclick="abrirDetalhe(${idx}, event)" class="text-orange-400 hover:text-orange-600 text-xs px-1">
      <i class="fas fa-eye"></i>
    </button>`;
    tr.appendChild(tdAcao);

    // Click na linha abre detalhe
    tr.onclick = (e) => {
      if (e.target.closest('button')) return;
      abrirDetalheRow(row);
    };

    tbody.appendChild(tr);
  });

  // Armazenar rows para acesso no detalhe
  window._currentRows = rows;
  window._currentHeaders = headers;
}

// ── Detalhe ───────────────────────────────────────────────────────
function abrirDetalhe(idx, e) {
  e.stopPropagation();
  abrirDetalheRow(window._currentRows[idx]);
}

function abrirDetalheRow(row) {
  const aba = row['__aba__'] || abaAtiva;
  const d = allData[aba] || {};
  const h = d.headers || window._currentHeaders || [];
  
  // Garantir que a seguradora seja o primeiro campo válido
  const seguradora = row['Seguradora'] || row['SEGURADORA'] || row[h[0]] || 'Detalhes';

  document.getElementById('modal-titulo').textContent = `${aba} — ${seguradora}`;

  const content = document.getElementById('modal-conteudo');
  content.innerHTML = '';

  // Dicionário de ícones baseado em palavras-chave do campo
  const iconMap = {
    'seguradora': 'fa-building-shield',
    'sistema': 'fa-laptop-code',
    'assunto': 'fa-envelope-open-text',
    'sla': 'fa-clock',
    'contato': 'fa-phone-flip',
    'email': 'fa-envelope',
    'e-mail': 'fa-envelope',
    'relatório': 'fa-file-lines',
    'vistoria': 'fa-clipboard-check',
    'prazo': 'fa-calendar-day',
    'faturamento': 'fa-file-invoice-dollar',
    'honorário': 'fa-hand-holding-dollar'
  };

  // Filtrar e renderizar apenas chaves válidas
  const keysToRender = h.filter(key => {
      const kUpper = String(key).toUpperCase();
      return !kUpper.includes('__EMPTY') && kUpper !== 'UNDEFINED' && kUpper !== 'NULL' && key !== '__aba__';
  });

  keysToRender.forEach(key => {
    const val = row[key];
    if (!val && val !== 0) return;
    const div = document.createElement('div');
    div.className = 'detalhe-item selectable';
    
    let formattedVal = escHtml(String(val));
    const checkVal = formattedVal.toLowerCase().trim();
    if (checkVal === 'sim' || checkVal === 's') {
        formattedVal = `<span class="badge-sim">SIM</span>`;
    } else if (checkVal === 'não' || checkVal === 'nao' || checkVal === 'n') {
        formattedVal = `<span class="badge-nao">NÃO</span>`;
    }

    // Escolher ícone
    let iconClass = 'fa-circle-info'; // Ícone padrão
    const keyLower = key.toLowerCase();
    for (const [keyword, icon] of Object.entries(iconMap)) {
        if (keyLower.includes(keyword)) {
            iconClass = icon;
            break;
        }
    }

    div.innerHTML = `<div class="detalhe-label">
        <i class="fas ${iconClass}"></i>
        ${escHtml(key)}
      </div>
      <div class="detalhe-valor">${highlightText(formattedVal, termoBusca)}</div>`;
    content.appendChild(div);
  });

  document.getElementById('modal-detalhe').classList.remove('hidden');
}

function fecharModal(id) {
    document.getElementById(id)?.classList.add('hidden');
    if (id === 'modal-importar') resetImportModal();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function highlightText(html, term) {
  if (!term) return html;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="highlight">$1</mark>');
}

// ── Login de Usuário / Setor ─────────────────────────────────────────
async function doUserLogin() {
  console.log('Tentativa de login iniciada...');
  try {
    const userInputEl = document.getElementById('user-login-name');
    const passInputEl = document.getElementById('user-login-pass');
    const errEl = document.getElementById('user-login-error');

    if (!userInputEl || !passInputEl) {
        console.error('Elementos de login não encontrados!');
        return;
    }

    const userInput = userInputEl.value.trim().toLowerCase();
    const pass = passInputEl.value;

    const hash = await sha256(pass);

    // Limpar qualquer sessão anterior antes de tentar novo login
    sessionStorage.removeItem('av_admin');
    sessionStorage.removeItem('av_sector');

    if (SECTORS_CONFIG[userInput]) {
      const expectedHash = SECTORS_CONFIG[userInput].passHash || DEFAULT_PASS_HASH;
      if (hash === expectedHash) {
        sessionStorage.setItem('av_sector', userInput);
        userSector = userInput;
        isAdmin = false;
        setAdminMode(false);
        document.getElementById('login-overlay').classList.add('hidden');
        carregarDados();
        return;
      }
    } else if (userInput === ADMIN_CREDENTIALS.user) {
      if (hash === ADMIN_CREDENTIALS.passHash) {
        sessionStorage.setItem('av_admin', '1');
        isAdmin = true;
        userSector = null;
        setAdminMode(true);
        document.getElementById('login-overlay').classList.add('hidden');
        carregarDados();
        return;
      }
    }
    
    errEl.classList.remove('hidden');
  } catch (error) {
    console.error('Erro no login:', error);
    alert('Erro ao processar login. Verifique sua conexão ou tente novamente.');
  }
}

function userLogout() {
  sessionStorage.removeItem('av_sector');
  sessionStorage.removeItem('av_admin');
  userSector = null;
  isAdmin = false;
  setAdminMode(false);
  window.location.reload();
}

// ── Login Admin ───────────────────────────────────────────────────
async function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');

  const hash = await sha256(pass);

  if (user === ADMIN_CREDENTIALS.user && hash === ADMIN_CREDENTIALS.passHash) {
    sessionStorage.removeItem('av_sector'); // Limpa qualquer setor anterior
    sessionStorage.setItem('av_admin', '1');
    setAdminMode(true);
    document.getElementById('modal-login').classList.add('hidden');
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    carregarDados(); // Garante atualização dos filtros
  } else {
    errEl.classList.remove('hidden');
  }
}

function adminLogout() {
  sessionStorage.removeItem('av_admin');
  sessionStorage.removeItem('av_sector');
  isAdmin = false;
  userSector = null;
  setAdminMode(false);
  window.location.reload();
}

function setAdminMode(active) {
  isAdmin = active;
  const btnImportar = document.getElementById('btn-importar');
  const btnLogin = document.getElementById('btn-admin-login');
  const btnLogout = document.getElementById('btn-admin-logout');

  if (active) {
    btnImportar.classList.remove('hidden');
    btnImportar.classList.add('flex');
    btnLogin.classList.add('hidden');
    btnLogout.classList.remove('hidden');
    btnLogout.classList.add('flex');
  } else {
    btnImportar.classList.add('hidden');
    btnImportar.classList.remove('flex');
    btnLogin.classList.remove('hidden');
    btnLogout.classList.add('hidden');
    btnLogout.classList.remove('flex');
  }
}

// ── Importar Planilha (admin) ─────────────────────────────────────
let selectedFile = null;

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  selectedFile = file;
  const nameEl = document.getElementById('file-name');
  nameEl.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  nameEl.classList.remove('hidden');
  document.getElementById('btn-processar').disabled = false;
  document.getElementById('import-status').classList.add('hidden');
}

function resetImportModal() {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('file-name').classList.add('hidden');
  document.getElementById('import-status').classList.add('hidden');
  document.getElementById('btn-processar').disabled = true;
}

async function processarPlanilha() {
  if (!selectedFile) return;
  const statusEl = document.getElementById('import-status');
  statusEl.textContent = 'Processando…';
  statusEl.className = 'mt-2 text-xs text-center text-orange-500';
  statusEl.classList.remove('hidden');

  try {
    const ab = await selectedFile.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array', raw: false });

    const newData = {};
    wb.SheetNames.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      
      // Converte tudo para array de arrays primeiro para encontrar o cabeçalho real
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!rawRows.length) return;

      // Encontrar a linha que contém "Seguradora" ou "Cia" ou "Sistema"
      // Geralmente é o cabeçalho real.
      let headerIdx = 0;
      for (let i = 0; i < Math.min(rawRows.length, 12); i++) {
        const rowValues = rawRows[i].map(v => String(v || '').toUpperCase().trim());
        // Critérios para ser cabeçalho:
        // 1. Conter palavras-chave
        const hasKeywords = rowValues.some(v => v.includes('SEGURADORA') || v.includes('SISTEMA') || v.includes('CIA') || v.includes('COMPANHIA'));
        // 2. Não ser uma linha de dados (Sim/Não)
        const isStatusRow = rowValues.filter(v => v === 'SIM' || v === 'NÃO' || v === 'NAO' || v === 'S' || v === 'N').length > 2;
        // 3. Ter um número razoável de colunas preenchidas
        const filledCols = rowValues.filter(v => v.length > 0).length;

        if (hasKeywords && !isStatusRow && filledCols > 2) {
          headerIdx = i;
          break;
        }
      }
      
      // Lê os dados a partir dessa linha encontrada
      let jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '', range: headerIdx });
      
      // CORREÇÃO DE CABEÇALHOS: Se houver "Trabalhist" no nome das colunas
      const sampleRow = jsonRows[0] || {};
      const oldHeaders = Object.keys(sampleRow);
      const headMap = {};
      let hasHeaderFix = false;
      oldHeaders.forEach(h => {
          if (h.toLowerCase().includes('trabalhist') && !h.toLowerCase().includes('trabalhista')) {
              headMap[h] = h.replace(/Trabalhist/gi, 'Trabalhista');
              hasHeaderFix = true;
          }
      });

      // Limpeza e correção de linhas
      jsonRows = jsonRows.map(row => {
        // Corrigir chaves do objeto se o header estava errado
        if (hasHeaderFix) {
            for (const oldKey in headMap) {
                if (row.hasOwnProperty(oldKey)) {
                    row[headMap[oldKey]] = row[oldKey];
                    delete row[oldKey];
                }
            }
        }

        const keys = Object.keys(row);
        if (!keys.length) return null;
        
        // CORREÇÃO: Pegar a primeira chave que NÃO seja __EMPTY
        const realFirstKey = keys.find(k => !k.includes('__EMPTY')) || keys[0];
        let val = String(row[realFirstKey] || '').trim();
        
        // CORREÇÃO AUTOMÁTICA DE TYPO no conteúdo: Trabalhist -> Trabalhista
        if (val.toLowerCase().includes('trabalhist') && !val.toLowerCase().includes('trabalhista')) {
            val = val.replace(/Trabalhist/gi, 'Trabalhista');
            row[realFirstKey] = val;
        }
        return row;
      }).filter(row => {
        if (!row) return false;
        const keys = Object.keys(row);
        if (!keys.length) return false;

        // Tentar achar qual coluna tem o nome da seguradora (primeira coluna preenchida que não seja status)
        const firstColKey = keys.find(k => {
            const v = String(row[k] || '').toUpperCase().trim();
            return v !== '' && v !== 'SIM' && v !== 'NÃO' && v !== 'NAO' && v !== 'S' && v !== 'N';
        }) || keys[0];

        const val = String(row[firstColKey] || '').trim();
        const valUpper = val.toUpperCase();

        // 1. Se o valor for muito curto (1-3 letras) e for Sim/Não/S/N, descarta
        if (val.length <= 3 && (valUpper === 'SIM' || valUpper === 'NÃO' || valUpper === 'NAO' || valUpper === 'S' || valUpper === 'N' || valUpper === 'OK')) {
            return false;
        }

        // 2. Se a primeira coluna real for vazia, removemos
        if (!val) return false;

        // 3. Remover títulos de seção comuns
        const blacklistedTitles = [
            'INFORMAÇÕES DA SEGURADORA', 
            'DADOS DA SEGURADORA', 
            'DADOS DA CIA', 
            'SLA',
            'PROPERTY', 
            'CONTATOS',
            'SIM', 'NÃO', 'NAO', 'OK'
        ];
        if (blacklistedTitles.some(t => valUpper.includes(t) && valUpper.length < 30)) return false;

        // 4. Checagem final: se a linha só tem "Sim/Não" em todas as colunas ou está vazia, descarta
        const allValues = Object.values(row).map(v => String(v).toUpperCase().trim());
        const statusCount = allValues.filter(v => v === 'SIM' || v === 'NÃO' || v === 'NAO' || v === 'S' || v === 'N').length;
        const hasActualData = allValues.some(v => v !== '' && v !== 'SIM' && v !== 'NÃO' && v !== 'NAO' && v !== 'S' && v !== 'N' && v !== 'UNDEFINED' && v !== 'NULL');
        
        // Se a maioria das colunas forem status, pode ser uma linha de cabeçalho errada ou lixo
        if (statusCount > 5 && !hasActualData) return false;

        // 5. Se o nome da seguradora (primeira coluna) for vazio ou apenas um traço/ponto, descarta
        if (val.length < 2 || val === '-' || val === '.') return false;

        return hasActualData;
      });

      if (!jsonRows.length) return;
      
      // Pegar os headers reais da primeira linha válida de dados (ou do objeto json)
      // Filtrar __EMPTY logo na origem (case-insensitive)
      const headers = Object.keys(jsonRows[0]).filter(h => {
          const hu = String(h).toUpperCase();
          return !hu.includes('__EMPTY') && hu !== 'UNDEFINED' && hu !== 'NULL';
      });
      
      // CORREÇÃO DO NOME DA ABA (Sheet Name)
      let finalSheetName = sheetName.trim();
      if (finalSheetName.toLowerCase().includes('trabalhist') && !finalSheetName.toLowerCase().includes('trabalhista')) {
          finalSheetName = finalSheetName.replace(/Trabalhist/gi, 'Trabalhista');
      }

      newData[finalSheetName] = { headers, data: jsonRows };
    });

    if (!Object.keys(newData).length) throw new Error('Planilha sem dados legíveis.');

    // Salvar no localStorage
    localStorage.setItem('av_dados', JSON.stringify(newData));
    allData = newData;

    // Resetar interface
    document.getElementById('tabs-container').innerHTML = '';
    document.getElementById('select-aba').innerHTML = '<option value="">Unidade</option>';
    abaAtiva = '';
    termoBusca = '';
    document.getElementById('input-busca').value = '';

    inicializarInterface();

    statusEl.textContent = `✅ ${Object.keys(newData).length} abas importadas com sucesso!`;
    statusEl.className = 'mt-2 text-xs text-center text-green-600';

    setTimeout(() => {
      document.getElementById('modal-importar').classList.add('hidden');
      resetImportModal();
    }, 1800);
  } catch (err) {
    statusEl.textContent = `❌ Erro: ${err.message}`;
    statusEl.className = 'mt-2 text-xs text-center text-red-500';
  }
}

// ── Fechar modais ─────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['modal-login', 'modal-importar', 'modal-detalhe', 'modal-login-admin'].forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
  }
});

// Fechar ao clicar fora do conteúdo (no overlay)
document.addEventListener('click', e => {
  const modals = ['modal-login', 'modal-importar', 'modal-detalhe'];
  modals.forEach(id => {
    const modal = document.getElementById(id);
    if (modal && e.target === modal) {
      modal.classList.add('hidden');
      if (id === 'modal-importar') resetImportModal();
    }
  });
});
