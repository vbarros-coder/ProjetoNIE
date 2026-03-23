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
  'garantia-executante': {
    allowedTabs: ['Garantia - Executante'],
    passHash: '6cc0606990999099909990999099909990999099909990999099909990999099' // Operacao2015 (Placeholder - Hash real necessário)
  },
  'garantia-trabalhista': {
    allowedTabs: ['Garantia - Adicional Trabalhista'],
    passHash: 'b09267b099909990999099909990999099909990999099909990999099909990' // Adicional2015 (Placeholder)
  },
  'garantia-ecto': {
    allowedTabs: ['Garantia - ECTO'],
    passHash: '7c9267b099909990999099909990999099909990999099909990999099909990' // Sto2018 (Placeholder)
  },
  'garantia-judicial': {
    allowedTabs: ['Garantia Judicial'],
    passHash: 'd09267b099909990999099909990999099909990999099909990999099909990' // SGJudicial1/19 (Placeholder)
  },
  'garantia-ressarcimento': {
    allowedTabs: ['Garantia - Ressarcimento'],
    passHash: 'e09267b099909990999099909990999099909990999099909990999099909990' // Administrativo123 (Placeholder)
  },
  'rcg-sla': {
    allowedTabs: ['RCG (SLA)'],
    passHash: 'f09267b099909990999099909990999099909990999099909990999099909990' // RCG2026 (Placeholder)
  },
  'rcp-sla': {
    allowedTabs: ['RCP (SLA)'],
    passHash: 'a09267b099909990999099909990999099909990999099909990999099909990' // RCP33 (Placeholder)
  },
  'boticario': {
    allowedTabs: ['Boticário'],
    passHash: 'c09267b099909990999099909990999099909990999099909990999099909990' // boticario123 (Placeholder)
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
    allowedTabs: ['PROPERTY', 'Riscos Diversos'],
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
    
    // Verifica se é um login de "Grupo" (geral) ou individual
    const isGeral = userSector.endsWith('-geral') || userSector === 'property' || userSector === 'financeiro' || userSector === 'faturamento' || userSector === 'riscos-diversos';

    return abas.filter(aba => {
        const a = aba.toLowerCase().trim();

        if (!isGeral) {
            // Match exato e estrito para logins de unidade
            // Se for 'property-sla', deve bater exatamente com 'property (sla)'
            // Removemos espaços para comparar de forma mais segura contra erros de digitação nas abas
            return allowedLower.some(k => {
                const cleanK = k.replace(/\s+/g, '');
                const cleanA = a.replace(/\s+/g, '');
                return cleanA === cleanK;
            });
        }

        // Match flexível para logins -geral (ex: 'property' deve ver tudo que contém 'property')
        return allowedLower.some(k => {
            if (a === k) return true;
            if (a.includes(k)) return true;
            // Se o que está permitido for 'property', deve pegar 'property (sla)', 'property (focais)', etc.
            if (k === 'property' && a.includes('property')) return true;
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
});

// ── Carregar dados ────────────────────────────────────────────────
async function carregarDados() {
  try {
    let rawData = {};
    
    // 1. Tentar buscar primeiro do servidor (com bypass de cache)
    // Isso garante que todos os dispositivos (celulares/PCs) vejam a versão mais recente do arquivo dados.json no GitHub/Vercel.
    try {
      const cacheBuster = `v=${new Date().getTime()}`;
      const resp = await fetch(`dados.json?${cacheBuster}`);
      if (resp.ok) {
        rawData = await resp.json();
        console.log('Dados carregados do servidor (dados.json) com sucesso.');
      } else {
        throw new Error('Servidor não retornou dados.json');
      }
    } catch (fetchErr) {
      console.warn('Falha ao buscar do servidor, tentando localStorage...', fetchErr);
      // Fallback para localStorage (importação local do admin)
      const localData = localStorage.getItem('av_dados');
      if (localData) {
        rawData = JSON.parse(localData);
        console.log('Dados carregados do localStorage.');
      } else {
        throw new Error('Nenhum dado disponível localmente ou no servidor.');
      }
    }

    // LIMPEZA GLOBAL DE DADOS (Remover __EMPTY de todas as abas e headers)
      allData = {};
      for (const [aba, content] of Object.entries(rawData)) {
          // Corrigir typo no nome da aba se existir
          let finalAba = aba.trim();
          if (finalAba.toLowerCase().includes('trabalhist') && !finalAba.toLowerCase().includes('trabalhista')) {
              finalAba = finalAba.replace(/Trabalhist/gi, 'Trabalhista');
          }
 
          // 1. Limpar Headers (Apenas __EMPTY e nulos)
          const rawHeaders = (content.headers || []).map(h => {
              let finalH = String(h);
              if (finalH.toLowerCase().includes('trabalhist') && !finalH.toLowerCase().includes('trabalhista')) {
                  finalH = finalH.replace(/Trabalhist/gi, 'Trabalhista');
              }
              return finalH;
          });

          const cleanHeaders = rawHeaders.filter(h => {
              const hu = String(h).toUpperCase().trim();
              return !hu.includes('__EMPTY') && hu !== 'UNDEFINED' && hu !== 'NULL' && hu !== '';
          });

          let finalRows = content.data || [];

          // --- REPARO DE EMERGÊNCIA: Detectar se o JSON está transposto (Procedimentos como linhas) ---
          const firstColKeywords = ['SEGURADORA', 'SISTEMA', 'SLA', 'VISTORIA', 'ASSUNTO', 'RELATÓRIO', 'HONORÁRIO', 'DADOS DA'];
          let kwMatches = 0;
          const firstKey = cleanHeaders[0];
          finalRows.slice(0, 10).forEach(r => {
              const val = String(r[firstKey] || '').toUpperCase();
              if (firstColKeywords.some(k => val.includes(k))) kwMatches++;
          });

          if (kwMatches > 3) {
              console.log(`Aba ${finalAba} carregada como TRANSPOSTA. Corrigindo em tempo real...`);
              const repairedRows = [];
              // Cada header (exceto o primeiro que é o label) é uma seguradora
              for (let i = 1; i < cleanHeaders.length; i++) {
                  const insurerCol = cleanHeaders[i];
                  const newRow = { "Seguradora": insurerCol };
                  finalRows.forEach(origRow => {
                      const label = String(origRow[firstKey] || '').trim();
                      if (label) newRow[label] = origRow[insurerCol];
                  });
                  repairedRows.push(newRow);
              }
              finalRows = repairedRows;
              // O header agora é apenas os labels encontrados
              const newHeaders = ["Seguradora", ...finalRows.map(r => Object.keys(r)).flat()];
              // (Simplificando: carregarDados vai re-gerar cleanHeaders abaixo)
          }

          // 2. Tentar identificar qual coluna é a Seguradora para esta aba
          const currentHeaders = Object.keys(finalRows[0] || {}).filter(h => !h.includes('__EMPTY'));
          
          let insurerKey = currentHeaders[0];
          const sampleRows = finalRows.slice(0, 20);
          
          let bestCol = null;
          let maxScore = -1000;

          for (const key of currentHeaders) {
              const kUpper = key.toUpperCase().trim();
              const values = sampleRows.map(r => String(r[key] || '').trim());
              
              const realVals = values.filter(val => {
                  const vU = val.toUpperCase();
                  return vU !== '' && vU !== 'SIM' && vU !== 'NÃO' && vU !== 'NAO' && vU !== 'S' && vU !== 'N' && 
                         vU !== 'SEM INFORMAÇÃO' && vU !== 'SEM INFORMACAO' && vU !== 'OK' && val.length > 2;
              });

              const uniqueVals = new Set(realVals);
              let score = uniqueVals.size * 20; // Peso altíssimo para unicidade

              // BÔNUS: Campo detectado no Double Header (Hieraquia Superior)
              if (key === "NOME_SEGURADORA_REAL" || key === "__nome_seguradora__") {
                  score += 1000; // Prioridade absoluta
              }

              if (kUpper.includes('SEGURADORA') || kUpper.includes('CIA') || kUpper.includes('COMPANHIA') || kUpper.includes('NOME')) {
                  score += 100;
              }

              // PENALIDADE CRÍTICA: Se os valores contêm termos técnicos, formulários ou prazos
              const technicalTerms = [
                'ATÉ', 'DIAS', 'VISTORIA', 'APÓLICE', 'RELATÓRIO', 'ACORDO', 'ORIENTAÇÃO', 
                'CONTATO', 'PADRÃO', 'CONFORME', 'E-MAIL', 'EMAIL', 'SALVADO', 'ANALISTA', 
                'PREJUIZO', 'VALOR', 'SLA', 'SISTEMA', 'FORMULARIO', 'PF', 'PJ', 'CADASTRO', 
                'DADOS', 'RETER', 'D.V.N', 'RETER A D.V.N', 'ESTIMATIVA', 'HONORÁRIOS', 'REGRAS'
              ];
              let technicalMatches = 0;
              realVals.forEach(v => {
                  const vu = v.toUpperCase();
                  if (technicalTerms.some(term => vu.includes(term))) technicalMatches++;
                  if (v.length > 30) technicalMatches++; // Nomes de seguradoras raramente passam de 30 caracteres
              });

              if (technicalMatches > 0) {
                  score -= (technicalMatches * 50); 
              }

              const avgLength = realVals.length > 0 ? realVals.reduce((a, b) => a + b.length, 0) / realVals.length : 0;
              if (avgLength > 25) score -= 300; // Nomes de seguradoras são curtos

              if (score > maxScore) {
                  maxScore = score;
                  bestCol = key;
              }
          }

          if (bestCol) insurerKey = bestCol;

          // 3. Limpar Rows finais
          const cleanRows = finalRows.map(row => {
              const newRow = {};
              for (const key in row) {
                  const kUpper = String(key).toUpperCase().trim();
                  // Preservar chaves de controle
                  if (key === '__nome_seguradora__' || key === 'NOME_SEGURADORA_REAL' || key === '__insurer_name__') {
                      newRow[key] = row[key];
                      continue;
                  }
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
          }).filter(row => {
              // REMOVER LINHAS QUE SÃO APENAS REPETIÇÃO DO CABEÇALHO
              const keys = Object.keys(row).filter(k => !k.startsWith('__'));
              const values = keys.map(k => String(row[k]).toUpperCase().trim());
              const headerMatches = keys.filter(k => values.includes(k.toUpperCase().trim())).length;
              if (headerMatches > (keys.length / 2)) return false;

              // Identificar o nome da seguradora para esta linha específica
              const nome = getNomeSeguradora(row, keys);
              
              // SE O NOME FOR GENÉRICO ("Seguradora") OU VAZIO, REMOVE A LINHA
              // Isso limpa cartões fantasmas ou linhas de lixo da planilha
              if (!nome || nome === 'Seguradora' || nome.trim() === '') return false;

              // BLACKLIST AGRESSIVA: Remover linhas que parecem títulos de seção ou lixo técnico
              const val = nome.toUpperCase().trim();
              const blacklisted = [
                'INFORMAÇÕES', 'DADOS DA', 'CONTATOS', 'ESTIMATIVA', 'RETER', 'D.V.N', 
                'RETER A D.V.N', 'SIM', 'NÃO', 'NAO', 'OK', 'SEGURADORA', 'SISTEMA', 
                'HONORÁRIOS', 'VALOR', 'SLA', 'VISTORIA', 'ASSUNTO', 'RELATÓRIO',
                'REGULAÇÃO', 'REGULACAO', 'MODELO', 'PRÓPRIO', 'PROPRIO'
              ];
              
              if (blacklisted.some(t => val === t || (val.includes(t) && val.length < 25))) return false;
              
              // Se a maioria das colunas estiver vazia ou contiver apenas Sim/Não, pode ser uma linha de lixo
              // Reduzido para 1 para garantir que seguradoras com pouca informação preenchida não sumam
              const filledCols = values.filter(v => v !== '' && v !== 'SIM' && v !== 'NÃO' && v !== 'NAO' && v.length > 2).length;
              if (filledCols < 1) return false;

              return true;
          });
          
          allData[finalAba] = { headers: Object.keys(cleanRows[0] || {}), data: cleanRows, insurerKey: insurerKey };
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

  // Limpar abas antes de preencher
  const container = document.getElementById('tabs-container');
  container.innerHTML = '';

  // Criar tab buttons - Só mostrar "Todas" para admin ou se tiver mais de 1 aba
  if (isAdmin || abas.length > 1) {
    const btnTodos = document.createElement('button');
    btnTodos.className = 'tab-btn active';
    btnTodos.textContent = 'Todas';
    btnTodos.dataset.aba = '';
    btnTodos.onclick = () => selecionarTab('');
    container.appendChild(btnTodos);
    abaAtiva = '';
  } else {
    // Se tiver apenas uma aba, ela já começa ativa
    abaAtiva = abas[0];
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
  sincronizarTabs();
  renderTabela();
}

function sincronizarTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.aba === abaAtiva);
  });
}

// ── Render Interface (Layout de Cartões) ───────────────────────────
function renderTabela() {
  document.getElementById('loading').classList.add('hidden');
  const sectionsContainer = document.getElementById('sections-container');
  const resultsInfo = document.getElementById('results-info');
  const noResults = document.getElementById('no-results');
  const cardsView = document.getElementById('cards-view');
  const tableContainer = document.getElementById('table-container'); // Manter oculto

  sectionsContainer.innerHTML = '';
  tableContainer.classList.add('hidden');
  
  // Agrupar dados por aba
  let dataByAba = {};
  const abasPermitidas = getAbasPermitidas();

  if (!abaAtiva) {
    abasPermitidas.forEach(aba => {
      const d = allData[aba];
      if (d && d.data && d.data.length > 0) {
        dataByAba[aba] = {
            headers: d.headers,
            rows: d.data,
            insurerKey: d.insurerKey
        };
      }
    });
  } else {
    if (abasPermitidas.includes(abaAtiva)) {
      const d = allData[abaAtiva];
      if (d) {
        dataByAba[abaAtiva] = {
            headers: d.headers,
            rows: d.data,
            insurerKey: d.insurerKey
        };
      }
    }
  }

  // Aplicar filtro de busca e contar total
  let totalCount = 0;
  const t = termoBusca.toLowerCase();

  for (const aba in dataByAba) {
    if (t) {
      dataByAba[aba].rows = dataByAba[aba].rows.filter(row =>
        Object.values(row).some(v => String(v || '').toLowerCase().includes(t))
      );
    }
    totalCount += dataByAba[aba].rows.length;
  }

  resultsInfo.textContent = `${totalCount} seguradora${totalCount !== 1 ? 's' : ''} encontrada${totalCount !== 1 ? 's' : ''}`;

  if (totalCount === 0) {
    cardsView.classList.add('hidden');
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');
  cardsView.classList.remove('hidden');

  // Renderizar cada seção (aba)
  for (const aba in dataByAba) {
    const sectionData = dataByAba[aba];
    if (sectionData.rows.length === 0) continue;

    const section = document.createElement('div');
    section.className = 'section-block mb-12';

    // Header da Seção
    section.innerHTML = `
      <div class="section-header">
        <i class="fas fa-folder-open"></i>
        <span>${escHtml(aba)}</span>
        <span class="section-count">(${sectionData.rows.length})</span>
      </div>
      <div class="cards-grid"></div>
    `;

    const grid = section.querySelector('.cards-grid');

    // Renderizar cartões
    sectionData.rows.forEach(row => {
      const card = document.createElement('div');
      card.className = 'card';
      card.onclick = () => abrirDetalheRow({ ...row, '__aba__': aba });

      const headers = sectionData.headers;
      const insurerKey = sectionData.insurerKey || headers[0];
      
      // USAR A NOVA FUNÇÃO getNomeSeguradora PARA O TÍTULO
      const seguradoraNome = getNomeSeguradora(row, headers);
      
      // Selecionar alguns campos para mostrar no card (ex: os 4 primeiros após a seguradora)
      const otherFields = headers.filter(h => h !== insurerKey).slice(0, 4);
      
      let cardBodyContent = '';
      otherFields.forEach(h => {
          let val = row[h] || '---';
          let formattedVal = escHtml(String(val));
          const checkVal = formattedVal.toLowerCase().trim();
          
          if (checkVal === 'sim' || checkVal === 's') {
            formattedVal = `<span class="badge-sim">SIM</span>`;
          } else if (checkVal === 'não' || checkVal === 'nao' || checkVal === 'n') {
            formattedVal = `<span class="badge-nao">NÃO</span>`;
          }

          cardBodyContent += `
            <div class="card-field">
              <span class="card-field-label">${escHtml(h)}</span>
              <span class="card-field-value">${highlightText(formattedVal, termoBusca)}</span>
            </div>
          `;
      });

      card.innerHTML = `
        <div class="card-header">
          <div>
            <h3 class="card-title">${highlightText(escHtml(seguradoraNome), termoBusca)}</h3>
            <div class="card-subtitle">${escHtml(aba)}</div>
          </div>
          <i class="fas fa-chevron-right opacity-50"></i>
        </div>
        <div class="card-body">
          ${cardBodyContent}
        </div>
        <div class="card-footer">
          <div class="card-more-link">
            <i class="fas fa-plus-circle"></i>
            Ver todos os ${headers.length} campos
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    sectionsContainer.appendChild(section);
  }
}

// ── Detalhe ───────────────────────────────────────────────────────
function abrirDetalheRow(row) {
  const aba = row['__aba__'] || abaAtiva;
  const d = allData[aba] || {};
  const h = d.headers || window._currentHeaders || [];
  
  // Garantir que a seguradora seja o primeiro campo válido usando a nova função
  const seguradora = getNomeSeguradora(row, h);

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

function corrigirTexto(t) {
  if (!t || typeof t !== 'string') return t;
  return t.replace(/Trabalhist/gi, 'Trabalhista');
}

// ── Detectar nome da seguradora no row ───────────────────────────
function getNomeSeguradora(row, headers) {
  // 1. PRIORIDADE MÁXIMA: Campos injetados pelo sistema
  const nomesInjetados = [row['__nome_seguradora__'], row['NOME_SEGURADORA_REAL'], row['__insurer_name__']];
  
  // Regex para termos proibidos (mais flexível com acentos e espaços)
  const forbiddenRegex = /^(SIM|NÃO|NAO|S|N|SEGURADORA|SISTEMA|RETER|D\.V\.N|REGULA[ÇC][ÃA]O|PR[ÓO]PRIO|MODELO|SLA|ASSUNTO|VISTORIA|RELAT[ÓO]RIO|HONOR[ÁA]RIOS|VALOR|DADOS|CONTATO|CADASTRO|PF|PJ|ORIENTA[ÇC][ÃA]O|PADR[ÃA]O|ESTIMATIVA|N\/A|N\.A)$/i;

  for (const n of nomesInjetados) {
    if (n && n.length > 2 && n.length < 40) {
      const nu = String(n).toUpperCase().trim();
      if (!forbiddenRegex.test(nu)) return corrigirTexto(n);
    }
  }

  // 2. LISTA DE SEGURADORAS CONHECIDAS (Para busca em strings longas se necessário)
  const knownInsurers = [
    'AIG', 'ALLIANZ', 'AXA', 'CHUBB', 'ESSOR', 'EXCELSIOR', 'FAIRFAX', 'GENERALI', 
    'HDI', 'KOVR', 'LIBERTY', 'MAPFRE', 'MITSUI', 'POTTENTIAL', 'SANCOR', 
    'SOMBRERO', 'SOMPO', 'TOKIO MARINE', 'ZURICH', 'AVLA', 'BERKLEY', 'BMG', 
    'FATOR', 'PORTO', 'SURA', 'SWISS RE', 'BRADESCO', 'SULAMERICA', 'ITAU', 'CAIXA'
  ];

  const technicalTerms = [
    'ATÉ', 'DIAS', 'VISTORIA', 'APÓLICE', 'RELATÓRIO', 'ACORDO', 'ORIENTAÇÃO', 
    'CONTATO', 'PADRÃO', 'CONFORME', 'E-MAIL', 'EMAIL', 'SALVADO', 'ANALISTA', 
    'PREJUIZO', 'VALOR', 'SLA', 'FORMULARIO', 'PF', 'PJ', 'CADASTRO', 'DADOS', 
    'CONTUDO', 'USAMOS', 'MODELO', 'SIMPLIFICADO', 'RETER', 'D.V.N', 'REGRAS',
    'REGULAÇÃO', 'REGULACAO', 'PRÓPRIO', 'PROPRIO'
  ];

  // 3. Procurar em todas as colunas
  let bestCandidate = null;
  
  for (const h of headers) {
    const v = String(row[h] || '').trim();
    if (!v || v.length < 2) continue;
    
    const vu = v.toUpperCase().trim();
    
    // Se bater no Regex de proibidos, pula na hora
    if (forbiddenRegex.test(vu)) continue;

    // Se a própria coluna se chamar "Seguradora" e o valor for válido (não curto demais)
    if (h.toUpperCase().includes('SEGURADORA') && v.length >= 3 && v.length <= 40) {
        // Se não for um termo técnico, retorna
        const hasTechnical = technicalTerms.some(term => vu.includes(term));
        if (!hasTechnical) return corrigirTexto(v);
    }

    // Tentar encontrar uma seguradora conhecida em qualquer campo (mesmo longo)
    for (const ki of knownInsurers) {
      if (vu.includes(ki)) {
        // Se achou a seguradora mas é um e-mail ou string longa, retorna apenas o nome da seguradora
        if (v.length > 40 || v.includes('@')) return ki;
        if (!bestCandidate) bestCandidate = v;
      }
    }

    if (v.length > 40) continue;
    
    // Se contém termos técnicos ou frases longas, descarta
    const hasTechnical = technicalTerms.some(term => vu.includes(term));
    if (hasTechnical) continue;

    // Se começa com letra maiúscula e é curto, é um ótimo candidato
    if (/^[A-ZÁÉÍÓÚÃÕÂÊÔ]/.test(v)) {
      if (!bestCandidate) bestCandidate = v;
    }
  }

  // 4. Tentativa desesperada: extrair do domínio de e-mails se bestCandidate ainda for nulo
  if (!bestCandidate) {
    for (const h of headers) {
      const v = String(row[h] || '');
      // Regex para pegar o domínio antes do .com ou .global ou .net
      const emailMatch = v.match(/@([a-z0-9-]+)\.(com|global|net|org)/i);
      if (emailMatch && emailMatch[1]) {
        let domain = emailMatch[1].toUpperCase();
        // Ignorar domínios genéricos
        if (!['GMAIL', 'OUTLOOK', 'HOTMAIL', 'ADDVALORA', 'YAHOO', 'UOL', 'TERRA', 'BOL'].includes(domain)) {
          // Limpar nomes comuns (ex: bmgseguros -> BMG, br.hdi.global -> HDI)
          domain = domain.replace(/^BR\.|^PT\.|SEGUROS|SEGURADORA|BR$/g, '');
          if (domain.length > 2) return domain;
        }
      }
    }
  }

  return bestCandidate ? corrigirTexto(bestCandidate) : 'Seguradora';
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
      for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
        const rowValues = rawRows[i].map(v => String(v || '').toUpperCase().trim());
        const hasKeywords = rowValues.some(v => v.includes('SEGURADORA') || v.includes('SISTEMA') || v.includes('CIA') || v.includes('COMPANHIA'));
        const isStatusRow = rowValues.filter(v => v === 'SIM' || v === 'NÃO' || v === 'NAO' || v === 'S' || v === 'N').length > 3;
        const filledCols = rowValues.filter(v => v.length > 0).length;

        if (hasKeywords && !isStatusRow && filledCols > 2) {
          headerIdx = i;
          break;
        }
      }
      
      // Capturar nomes de seguradoras que podem estar na linha imediatamente ACIMA do cabeçalho
      let topHeaders = [];
      if (headerIdx > 0) {
          topHeaders = rawRows[headerIdx - 1].map(v => String(v || '').trim());
      }

      // Lê os dados a partir dessa linha encontrada
      let jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '', range: headerIdx });
      
      // --- DETECÇÃO DE PLANILHA TRANSPOSTA (Seguradoras em colunas, Procedimentos em linhas) ---
      // Se a primeira coluna tem muitos nomes de procedimentos, é transposta.
      const firstColKeywords = ['SEGURADORA', 'SISTEMA', 'SLA', 'VISTORIA', 'ASSUNTO', 'RELATÓRIO', 'HONORÁRIO', 'DADOS DA'];
      let keywordMatches = 0;
      const sampleLimit = Math.min(jsonRows.length, 15);
      
      for (let i = 0; i < sampleLimit; i++) {
          const firstKey = Object.keys(jsonRows[i])[0];
          const val = String(jsonRows[i][firstKey] || '').toUpperCase();
          if (firstColKeywords.some(k => val.includes(k))) keywordMatches++;
      }

      const isTransposed = keywordMatches > 3;

      if (isTransposed) {
          console.log(`Aba ${sheetName} detectada como TRANSPOSTA. Transpondo...`);
          const transposedRows = [];
          const keys = Object.keys(jsonRows[0]); // Chaves originais (__EMPTY, __EMPTY_1...)
          
          // Cada chave (coluna) a partir da 1ª (index 1) é uma seguradora
          for (let colIdx = 1; colIdx < keys.length; colIdx++) {
              const colKey = keys[colIdx];
              const newRow = {};
              
              // O nome da seguradora deve estar no topHeaders (se existir) ou no primeiro valor da coluna
              let insurerName = (topHeaders && topHeaders[colIdx]) || "";
              
              // Se não achou no topHeaders, tenta achar na primeira linha de dados
              if (!insurerName || ['SIM','NÃO','NAO','S','N'].includes(insurerName.toUpperCase())) {
                  // Procura o primeiro valor que pareça um nome na coluna
                  for (let i = 0; i < jsonRows.length; i++) {
                      const v = String(jsonRows[i][colKey] || '').trim();
                      if (v.length > 3 && !['SIM','NÃO','NAO','S','N','OK','SEM INFORMAÇÃO'].includes(v.toUpperCase())) {
                          insurerName = v;
                          break;
                      }
                  }
              }

              if (!insurerName) continue; // Pula se não achou nome

              newRow["Seguradora"] = insurerName;
              
              // Preenche os outros campos (procedimentos)
              jsonRows.forEach(origRow => {
                  const labelKey = Object.keys(origRow)[0];
                  const label = String(origRow[labelKey] || '').trim();
                  if (label && label.length > 2) {
                      newRow[label] = origRow[colKey];
                  }
              });
              
              transposedRows.push(newRow);
          }
          jsonRows = transposedRows;
      } else if (topHeaders.length > 0) {
          // Mesclar topHeaders se existirem (para casos de Double Header não-transposto)
          jsonRows = jsonRows.map(row => {
              const keys = Object.keys(row);
              keys.forEach((key, idx) => {
                  const topVal = topHeaders[idx];
                  if (topVal && topVal.length > 2 && !['SIM','NÃO','NAO','S','N','SEGURADORA','CIA','SISTEMA'].includes(topVal.toUpperCase())) {
                      // Se achou um nome no topo, cria um campo fixo para ele
                      // Isso evita que o nome se perca mesmo se a coluna já tiver outro nome
                      row["NOME_SEGURADORA_REAL"] = topVal;
                      
                      if (key.includes('__EMPTY')) {
                          row[topVal] = row[key];
                      }
                  }
              });
              return row;
          });
      }
      
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
    abaAtiva = '';
    termoBusca = '';
    document.getElementById('input-busca').value = '';

    inicializarInterface();

    statusEl.innerHTML = `
      <div class="flex flex-col items-center gap-2">
        <span class="text-green-600 font-bold">✅ ${Object.keys(newData).length} abas importadas!</span>
        <button onclick="downloadDadosJSON()" class="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-3 py-1 rounded-full flex items-center gap-1 transition-all">
          <i class="fas fa-download"></i> BAIXAR DADOS.JSON PARA O GITHUB
        </button>
        <p class="text-[9px] text-gray-400 max-w-[200px]">Após baixar, substitua o arquivo dados.json na sua pasta do projeto ou GitHub para atualizar todos os celulares.</p>
      </div>
    `;
    statusEl.className = 'mt-4 text-center';

    // Não fechar o modal automaticamente para dar tempo de baixar
    // setTimeout(() => { ... }, 1800); 
  } catch (err) {
    statusEl.textContent = `❌ Erro: ${err.message}`;
    statusEl.className = 'mt-2 text-xs text-center text-red-500';
  }
}

function downloadDadosJSON() {
  const data = localStorage.getItem('av_dados');
  if (!data) return alert('Nenhum dado encontrado para exportar.');
  
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dados.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('Arquivo dados.json baixado! Agora você deve subir este arquivo no seu GitHub para atualizar todos os celulares.');
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
