// Livro de Memórias — JS
// Tudo em vanilla JS para facilitar a edição. Comentários em PT-BR.
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const state = {
  capitulos: [],
  filtro: "",
  tema: localStorage.getItem("tema") || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
};

function aplicarTema() {
  const root = document.documentElement;
  root.classList.toggle('dark', state.tema === 'dark');
  $('#temaToggle').setAttribute('aria-pressed', state.tema === 'dark');
  localStorage.setItem('tema', state.tema);
}

function alternarTema() {
  state.tema = state.tema === 'dark' ? 'light' : 'dark';
  aplicarTema();
}

function toggleSidebar(open) {
  const sb = $('#sidebar');
  const btn = $('.menu-btn');
  const isOpen = open ?? !sb.classList.contains('open');
  sb.classList.toggle('open', isOpen);
  btn.setAttribute('aria-expanded', String(isOpen));
}

async function carregarConteudo() {
  try {
    const res = await fetch('content.json', {cache: 'no-store'});
    const data = await res.json();
    state.capitulos = data.capitulos
      .map(c => ({...c, dataObj: c.data ? new Date(c.data) : null}))
      .sort((a,b) => (a.dataObj && b.dataObj) ? a.dataObj - b.dataObj : 0);
    montarSidebar();
    montarTimeline();
  } catch (e) {
    console.error('Erro ao carregar conteúdo:', e);
    $('#listaTimeline').innerHTML = '<li>Não consegui carregar o conteúdo. Verifique o arquivo <code>content.json</code>.</li>';
  }
}

function montarSidebar() {
  const ul = $('#capitulos');
  ul.innerHTML = '';
  const tpl = $('#tplCapituloItem');
  state.capitulos
    .filter(c => filtrar(c))
    .forEach((cap, idx) => {
      const li = tpl.content.cloneNode(true);
      const btn = li.querySelector('.capitulo-link');
      btn.textContent = `${cap.emoji || '📖'} ${cap.titulo}`;
      btn.addEventListener('click', () => abrirCapitulo(idx));
      btn.setAttribute('data-index', idx);
      ul.appendChild(li);
    });
}

function montarTimeline() {
  const ol = $('#listaTimeline');
  ol.innerHTML = '';
  const tpl = $('#tplTimelineItem');
  state.capitulos
    .filter(c => filtrar(c))
    .forEach((cap, idx) => {
      const li = tpl.content.cloneNode(true);
      li.querySelector('.data').textContent = cap.data || '';
      li.querySelector('.titulo').textContent = cap.titulo;
      li.querySelector('.resumo').textContent = cap.resumo || '';
      li.querySelector('.card').addEventListener('click', () => abrirCapitulo(idx));
      ol.appendChild(li);
    });
}

function filtrar(cap){
  const q = state.filtro.trim().toLowerCase();
  if(!q) return true;
  return [cap.titulo, cap.resumo, cap.texto].some(s => (s||'').toLowerCase().includes(q));
}

function abrirCapitulo(index){
  const cap = state.capitulos[index];
  if(!cap) return;
  const view = $('#capituloView');
  view.hidden = false;
  view.innerHTML = '';
  const tpl = $('#tplCapituloView');
  const node = tpl.content.cloneNode(true);

  node.querySelector('.capitulo-data').textContent = cap.data || '';
  node.querySelector('.capitulo-titulo').textContent = cap.titulo;
  node.querySelector('.capitulo-subtitulo').textContent = cap.resumo || '';

  const galeria = node.querySelector('.galeria');
  (cap.imagens || []).forEach(img => {
    const fig = document.createElement('figure');
    const image = document.createElement('img');
    image.loading = 'lazy';
    image.src = img.src;
    image.alt = img.alt || '';
    const fc = document.createElement('figcaption');
    fc.textContent = img.legenda || '';
    fig.appendChild(image);
    if(fc.textContent) fig.appendChild(fc);
    galeria.appendChild(fig);
  });

  const texto = node.querySelector('.capitulo-texto');
  texto.innerHTML = (cap.texto || '').split('\n').map(p => `<p>${p}</p>`).join('');

  const musica = document.getElementById("musica-fundo");
const botao = document.getElementById("toggle-musica");

botao.addEventListener("click", () => {
  if (musica.paused) {
    musica.play();
    botao.textContent = "⏸️ Pausar Música";
  } else {
    musica.pause();
    botao.textContent = "🎵 Música";
  }
});

  const mapaLink = node.querySelector('#mapaLink');
  if(cap.mapa){
    mapaLink.href = cap.mapa;
    mapaLink.removeAttribute('disabled');
  } else {
    mapaLink.setAttribute('aria-disabled', 'true');
    mapaLink.classList.add('btn-disabled');
    mapaLink.addEventListener('click', e => e.preventDefault());
  }

  const audio = node.querySelector('#audioTrilha');
  if(cap.trilha){
    audio.src = cap.trilha;
  } else {
    audio.replaceWith(document.createComment('sem trilha'));
  }

  view.appendChild(node);

  // marca capítulo ativo no menu
  $$('.capitulo-link').forEach(b => b.removeAttribute('aria-current'));
  const btnAtivo = $(`.capitulo-link[data-index="${index}"]`);
  if(btnAtivo) btnAtivo.setAttribute('aria-current', 'page');

  // rola para o conteúdo
  $('#conteudo').scrollIntoView({behavior:'smooth', block:'start'});
}

function aleatorio(){
  if(!state.capitulos.length) return;
  const idx = Math.floor(Math.random() * state.capitulos.length);
  abrirCapitulo(idx);
}

function imprimir(){
  window.print();
}

function initEventos(){
  $('#temaToggle').addEventListener('click', alternarTema);
  $('.menu-btn').addEventListener('click', () => toggleSidebar());
  $('#começarBtn').addEventListener('click', () => {
    const primeiro = state.capitulos.findIndex(c => c);
    if(primeiro >= 0) abrirCapitulo(primeiro);
  });
  $('#shuffleBtn').addEventListener('click', aleatorio);
  $('#printBtn').addEventListener('click', imprimir);
  $('#busca').addEventListener('input', (e) => {
    state.filtro = e.target.value;
    montarSidebar();
    montarTimeline();
  });

  // Fechar sidebar ao clicar fora (mobile)
  document.addEventListener('click', (e) => {
    const sb = $('#sidebar');
    if(window.innerWidth > 900) return;
    if(!sb.contains(e.target) && !e.target.closest('.menu-btn')){
      sb.classList.remove('open');
      $('.menu-btn').setAttribute('aria-expanded','false');
    }
  });

  // tecla / para focar busca
  document.addEventListener('keydown', (e) => {
    if(e.key === '/' && document.activeElement !== $('#busca')){
      e.preventDefault();
      $('#busca').focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  aplicarTema();
  initEventos();
  carregarConteudo();
});

