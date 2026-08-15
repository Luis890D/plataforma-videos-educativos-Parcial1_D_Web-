/* ============================================================
   js/catalog.js — SERIE II: Interfaz, Catálogo y Navegación
   EduVid · Plataforma de Videos Educativos · UMG 2026
   ============================================================ */

'use strict';

const Catalog = (() => {
  // ──────────── ESTADO LOCAL ────────────
  let allVideos = [];            // Todos los videos del catálogo
  let filteredVideos = [];       // Videos después de aplicar filtros
  let currentCategory = 'all';  // Categoría activa
  let searchQuery = '';          // Query de búsqueda actual
  let searchDebounceTimer = null;
  let currentVideoId = null;     // ID del video actualmente abierto

  // ──────────── HELPERS DE FORMATO ────────────

  /**
   * Formatea una duración en segundos a mm:ss o hh:mm:ss
   * @param {number|string} seconds
   * @returns {string}
   */
  function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '–';
    const s = parseInt(seconds, 10);
    if (isNaN(s)) return String(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  /**
   * Obtiene la inicial o iniciales de un texto para avatares
   * @param {string} text
   * @returns {string}
   */
  function getInitials(text) {
    if (!text) return '?';
    return text.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  /**
   * Formatea una fecha ISO o timestamp a texto relativo legible
   * @param {string} dateStr
   * @returns {string}
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date;
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (mins < 1) return 'Justo ahora';
      if (mins < 60) return `Hace ${mins} minuto${mins > 1 ? 's' : ''}`;
      if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
      if (days < 30) return `Hace ${days} día${days > 1 ? 's' : ''}`;
      return date.toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  // ──────────── RENDER DE CARDS ────────────

  /**
   * Crea el HTML de una card de video
   * @param {object} video
   * @returns {string} HTML string
   */
  function renderVideoCard(video) {
    const id = video.id || video._id || '';
    const title = video.titulo || video.title || 'Sin título';
    const description = video.descripcion || video.description || '';
    const category = video.categoria || video.category || 'General';
    const duration = formatDuration(video.duracion || video.duration);
    const likes = video.likes || video.cantidadLikes || 0;
    const poster = video.poster || video.thumbnail || video.imagen || '';

    const thumbnailHtml = poster
      ? `<img src="${poster}" alt="${title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'card-thumbnail-placeholder\\'>🎬</div>'" />`
      : `<div class="card-thumbnail-placeholder">🎬</div>`;

    return `
      <article class="video-card" data-video-id="${id}" id="card-${id}" role="button" tabindex="0" aria-label="Ver video: ${title}">
        <div class="card-thumbnail">
          ${thumbnailHtml}
          <div class="card-thumbnail-overlay">
            <div class="play-btn-overlay">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
          ${duration !== '–' ? `<div class="card-duration-badge">${duration}</div>` : ''}
        </div>
        <div class="card-body">
          <span class="card-category">${category}</span>
          <h3 class="card-title">${title}</h3>
          ${description ? `<p class="card-description">${description}</p>` : ''}
          <div class="card-footer">
            <span class="card-likes">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color:#F87171;">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              ${likes}
            </span>
            <span class="card-watch-btn">
              Ver video
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </span>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Renderiza la lista de videos en el grid
   * @param {object[]} videos
   */
  function renderVideos(videos) {
    const grid = document.getElementById('videos-grid');
    const emptyState = document.getElementById('empty-state');
    if (!grid) return;

    if (!videos || videos.length === 0) {
      grid.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }

    emptyState?.classList.add('hidden');
    grid.innerHTML = videos.map(renderVideoCard).join('');

    // Bind click listeners en cada card
    grid.querySelectorAll('.video-card').forEach(card => {
      const videoId = card.dataset.videoId;
      card.addEventListener('click', () => openVideoModal(videoId));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openVideoModal(videoId);
        }
      });
    });
  }

  // ──────────── CARGA DE CATEGORÍAS ────────────

  /**
   * Carga las categorías disponibles desde la API y rellena los chips de filtro
   */
  async function loadCategories() {
    const container = document.getElementById('category-chips-container');
    const statEl = document.getElementById('stat-categories');
    if (!container) return;

    try {
      const data = await API.getCategories();
      const categories = Array.isArray(data) ? data : (data?.categorias || []);

      if (statEl) statEl.textContent = categories.length;

      container.innerHTML = categories.map(cat => {
        const name = typeof cat === 'string' ? cat : (cat.nombre || cat.name || cat);
        return `
          <button class="category-chip" data-category="${name}" id="filter-${name.replace(/\s+/g, '-')}">
            ${name}
          </button>
        `;
      }).join('');

      // Bind listeners
      container.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => filterByCategory(chip.dataset.category, chip));
      });
    } catch {
      container.innerHTML = '';
    }
  }

  // ──────────── FILTROS Y BÚSQUEDA ────────────

  /**
   * Filtra los videos según la categoría y/o búsqueda activa
   */
  function applyFilters() {
    let result = [...allVideos];

    // Filtro por categoría
    if (currentCategory && currentCategory !== 'all') {
      result = result.filter(v => {
        const cat = v.categoria || v.category || '';
        return cat.toLowerCase() === currentCategory.toLowerCase();
      });
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(v => {
        const title = (v.titulo || v.title || '').toLowerCase();
        const desc = (v.descripcion || v.description || '').toLowerCase();
        return title.includes(q) || desc.includes(q);
      });
    }

    filteredVideos = result;

    // Actualizar contador de resultados
    const countEl = document.getElementById('results-count');
    if (countEl) {
      countEl.textContent = result.length === allVideos.length
        ? `${result.length} videos`
        : `${result.length} de ${allVideos.length} videos`;
    }

    renderVideos(filteredVideos);
  }

  /**
   * Filtra por categoría al hacer click en un chip
   * @param {string} category
   * @param {HTMLElement} clickedChip
   */
  async function filterByCategory(category, clickedChip) {
    currentCategory = category;

    // Actualizar estado visual de chips
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    clickedChip?.classList.add('active');

    if (category !== 'all') {
      // Intentar usar el endpoint de categoría para datos frescos
      try {
        const data = await API.getVideosByCategory(category);
        const videos = Array.isArray(data) ? data : (data?.videos || []);
        // Actualizar catálogo filtrado directamente sin aplicar filtro adicional
        filteredVideos = videos;
        // Aplicar además el filtro de búsqueda local si existe
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          filteredVideos = filteredVideos.filter(v => {
            const title = (v.titulo || v.title || '').toLowerCase();
            return title.includes(q);
          });
        }
        renderVideos(filteredVideos);
        const countEl = document.getElementById('results-count');
        if (countEl) countEl.textContent = `${filteredVideos.length} videos en "${category}"`;
        return;
      } catch {
        // Fallback a filtro local si la API de categoría falla
      }
    }

    applyFilters();
  }

  /**
   * Configura la búsqueda en tiempo real con debounce de 300ms
   */
  function setupSearch() {
    const inputs = [
      document.getElementById('catalog-search-input'),
      document.getElementById('nav-search-input'),
    ];

    inputs.forEach(input => {
      if (!input) return;

      input.addEventListener('input', (e) => {
        const clearBtn = document.getElementById('search-clear-btn');
        searchQuery = e.target.value;

        // Sincronizar ambos inputs
        inputs.forEach(i => { if (i && i !== e.target) i.value = searchQuery; });

        // Mostrar/ocultar botón de limpiar
        if (clearBtn) clearBtn.classList.toggle('hidden', !searchQuery);

        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(applyFilters, 300);
      });
    });

    // Botón de limpiar búsqueda
    document.getElementById('search-clear-btn')?.addEventListener('click', () => {
      searchQuery = '';
      inputs.forEach(i => { if (i) i.value = ''; });
      document.getElementById('search-clear-btn')?.classList.add('hidden');
      applyFilters();
    });

    // Reset filtros
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      searchQuery = '';
      currentCategory = 'all';
      inputs.forEach(i => { if (i) i.value = ''; });
      document.getElementById('search-clear-btn')?.classList.add('hidden');
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      document.getElementById('filter-all')?.classList.add('active');
      applyFilters();
    });
  }

  // ──────────── CARGA DEL CATÁLOGO ────────────

  /**
   * Carga el catálogo completo de videos desde la API
   */
  async function loadVideos() {
    const grid = document.getElementById('videos-grid');
    const statEl = document.getElementById('stat-videos');

    // Mostrar skeletons
    if (grid) {
      grid.innerHTML = Array(6).fill('<div class="video-card-skeleton"></div>').join('');
    }

    try {
      const data = await API.getVideos();
      allVideos = Array.isArray(data) ? data : (data?.videos || []);
      filteredVideos = [...allVideos];

      if (statEl) statEl.textContent = allVideos.length;
      applyFilters();
    } catch (err) {
      if (grid) grid.innerHTML = '';
      const emptyState = document.getElementById('empty-state');
      if (emptyState) {
        emptyState.classList.remove('hidden');
        emptyState.querySelector('h3').textContent = 'No se pudo cargar el catálogo';
        emptyState.querySelector('p').textContent = err.message || 'Verifica tu conexión e intenta de nuevo.';
      }
    }
  }

  // ──────────── MODAL DEL REPRODUCTOR ────────────

  /**
   * Abre el reproductor de video con los datos del video seleccionado
   * @param {string|number} videoId
   */
  async function openVideoModal(videoId) {
    currentVideoId = videoId;
    const overlay = document.getElementById('video-modal-overlay');
    overlay?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Resetear estado del modal
    resetVideoModal();

    try {
      const video = await API.getVideoById(videoId);
      populateVideoModal(video);

      // Cargar comentarios
      if (typeof Interaction !== 'undefined') {
        Interaction.loadComments(videoId);
        Interaction.initVideoModal(videoId);
      }

    } catch (err) {
      Toast.show('Error al cargar el video. Intenta de nuevo.', 'error');
      closeVideoModal();
    }
  }

  /**
   * Resetea el estado del modal de video a estado de carga
   */
  function resetVideoModal() {
    const elements = {
      'video-modal-title': 'Cargando...',
      'video-modal-description': '',
      'video-category-badge': '...',
      'video-duration': '–',
      'video-likes-count': '–',
    };

    Object.entries(elements).forEach(([id, text]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });

    // Mostrar loading state del player
    const loadingState = document.getElementById('video-loading-state');
    const iframe = document.getElementById('video-iframe');
    const html5Video = document.getElementById('video-html5');
    if (loadingState) loadingState.style.display = 'flex';
    if (iframe) { iframe.src = ''; iframe.classList.add('hidden'); }
    if (html5Video) { html5Video.src = ''; html5Video.classList.add('hidden'); }

    // Reset like button
    const likeBtn = document.getElementById('like-btn');
    if (likeBtn) {
      likeBtn.dataset.liked = 'false';
      likeBtn.dataset.videoId = '';
      likeBtn.classList.remove('liked');
    }

    // Reset comentarios
    const commentsList = document.getElementById('comments-list');
    if (commentsList) {
      commentsList.innerHTML = `
        <div class="comments-loading" id="comments-loading">
          <div class="spinner-ring small"></div>
          <span>Cargando comentarios...</span>
        </div>
      `;
    }
  }

  /**
   * Rellena el modal del video con los datos recibidos de la API
   * @param {object} video
   */
  function populateVideoModal(video) {
    const title = video.titulo || video.title || 'Sin título';
    const description = video.descripcion || video.description || '';
    const category = video.categoria || video.category || 'General';
    const duration = formatDuration(video.duracion || video.duration);
    const likes = video.likes || video.cantidadLikes || 0;
    const videoUrl = video.url || video.video || video.enlace || '';
    const id = video.id || video._id || currentVideoId;

    // Título y descripción
    const titleEl = document.getElementById('video-modal-title');
    if (titleEl) titleEl.textContent = title;

    const descEl = document.getElementById('video-modal-description');
    if (descEl) descEl.textContent = description;

    // Categoria
    const catBadge = document.getElementById('video-category-badge');
    if (catBadge) catBadge.textContent = category;

    // Duración y likes en meta row
    const durEl = document.getElementById('video-duration');
    if (durEl) {
      durEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        ${duration}
      `;
    }

    const likesMetaEl = document.getElementById('video-likes-count');
    if (likesMetaEl) {
      likesMetaEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#F87171">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        ${likes} Me gusta
      `;
    }

    // Like button
    const likeBtn = document.getElementById('like-btn');
    const likeCountBtn = document.getElementById('like-count-btn');
    if (likeBtn) {
      likeBtn.dataset.videoId = id;
      likeBtn.dataset.liked = 'false';
      if (likeCountBtn) likeCountBtn.textContent = likes;
    }

    // Reproductor de video
    loadVideoPlayer(videoUrl);

    // Control de acceso visual para visitantes
    Auth.updateUIForAuth();
  }

  /**
   * Carga el reproductor de video (iframe o video HTML5)
   * @param {string} url
   */
  function loadVideoPlayer(url) {
    const loadingState = document.getElementById('video-loading-state');
    const iframe = document.getElementById('video-iframe');
    const html5Video = document.getElementById('video-html5');

    if (!url) {
      if (loadingState) {
        loadingState.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color:var(--text-muted)">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span style="color:var(--text-muted)">Video no disponible</span>
        `;
      }
      return;
    }

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const youtubeId = extractYoutubeId(url);
      if (youtubeId && iframe) {
        iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0`;
        iframe.classList.remove('hidden');
        if (loadingState) loadingState.style.display = 'none';
        return;
      }
    }

    // Vimeo
    if (url.includes('vimeo.com') && iframe) {
      const vimeoId = url.split('/').pop();
      iframe.src = `https://player.vimeo.com/video/${vimeoId}`;
      iframe.classList.remove('hidden');
      if (loadingState) loadingState.style.display = 'none';
      return;
    }

    // Video HTML5 directo (mp4, webm, etc.)
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) && html5Video) {
      html5Video.src = url;
      html5Video.classList.remove('hidden');
      if (loadingState) loadingState.style.display = 'none';
      return;
    }

    // Iframe genérico para cualquier otro URL
    if (iframe) {
      iframe.src = url;
      iframe.classList.remove('hidden');
      if (loadingState) loadingState.style.display = 'none';
    }
  }

  /**
   * Extrae el ID de un video de YouTube desde una URL
   * @param {string} url
   * @returns {string|null}
   */
  function extractYoutubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  /**
   * Cierra el modal del reproductor
   */
  function closeVideoModal() {
    const overlay = document.getElementById('video-modal-overlay');
    overlay?.classList.add('hidden');
    document.body.style.overflow = '';

    // Detener video al cerrar
    const iframe = document.getElementById('video-iframe');
    const html5Video = document.getElementById('video-html5');
    if (iframe) iframe.src = '';
    if (html5Video) { html5Video.pause(); html5Video.src = ''; }

    currentVideoId = null;
  }

  // ──────────── SCROLL Y NAVBAR ────────────

  function setupNavbarScroll() {
    const navbar = document.getElementById('main-navbar');
    const handleScroll = () => {
      navbar?.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Hace scroll suave hacia el catálogo
   */
  function scrollToCatalog() {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }

  // ──────────── INICIALIZACIÓN ────────────

  async function init() {
    setupNavbarScroll();

    // Botón Hero Explorar
    document.getElementById('btn-hero-explore')?.addEventListener('click', scrollToCatalog);

    // Cerrar modal de video
    document.getElementById('btn-close-video-modal')?.addEventListener('click', closeVideoModal);
    document.getElementById('video-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeVideoModal();
    });

    // Filtro "Todos"
    document.getElementById('filter-all')?.addEventListener('click', (e) => {
      filterByCategory('all', e.currentTarget);
    });

    setupSearch();

    // Cargar datos en paralelo
    await Promise.allSettled([
      loadCategories(),
      loadVideos(),
    ]);
  }

  return {
    init,
    openVideoModal,
    closeVideoModal,
    allVideos: () => allVideos,
    currentVideoId: () => currentVideoId,
    formatDate,
    getInitials,
  };
})();
