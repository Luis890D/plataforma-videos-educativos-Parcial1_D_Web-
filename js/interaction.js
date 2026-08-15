/* ============================================================
   js/interaction.js — SERIE III: Likes, Comentarios e Interacciones
   EduVid · Plataforma de Videos Educativos · UMG 2026
   ============================================================ */

'use strict';

const Interaction = (() => {
  // ──────────── ESTADO LOCAL ────────────
  let currentVideoId = null;
  let likeState = {};        // { [videoId]: boolean } — estado de like por video
  let likeCounts = {};       // { [videoId]: number } — contadores de likes
  let openReplyForms = {};   // { [commentId]: boolean } — reply forms visibles

  // ──────────── LIKES — TOGGLE (SERIE III) ────────────

  /**
   * Maneja el click en el botón de Like (Toggle).
   * Regla de negocio: un estudiante sólo puede dar un Like por video.
   * Si ya dio Like y vuelve a presionar, se remueve (descuenta del contador global).
   * @param {string|number} videoId
   */
  async function handleLikeToggle(videoId) {
    const session = Auth.getSession();

    // Control de acceso visual para visitantes
    if (!session) {
      Toast.show('🔒 Debes iniciar sesión para dar Me gusta.', 'info');
      Auth.openAuthModal('login');
      return;
    }

    const likeBtn = document.getElementById('like-btn');
    const likeCountEl = document.getElementById('like-count-btn');
    const likesMetaEl = document.getElementById('video-likes-count');

    // Optimistic UI: actualizar inmediatamente antes de la respuesta
    const wasLiked = likeState[videoId] === true;
    const currentCount = likeCounts[videoId] || 0;

    likeState[videoId] = !wasLiked;
    const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    likeCounts[videoId] = newCount;

    // Actualizar UI inmediatamente (optimistic)
    updateLikeUI(likeBtn, likeCountEl, likesMetaEl, likeState[videoId], newCount);

    try {
      const data = await API.toggleLike(videoId, session.carne);

      // Confirmar con el valor real del servidor si lo devuelve
      if (data !== null && data !== undefined) {
        const serverLikes = data?.likes ?? data?.cantidadLikes ?? data?.totalLikes ?? newCount;
        likeCounts[videoId] = serverLikes;
        updateLikeUI(likeBtn, likeCountEl, likesMetaEl, likeState[videoId], serverLikes);
      }

      const msg = likeState[videoId] ? '❤️ ¡Me gusta!' : '💔 Me gusta removido';
      Toast.show(msg, 'info');
    } catch (err) {
      // Revertir en caso de error
      likeState[videoId] = wasLiked;
      likeCounts[videoId] = currentCount;
      updateLikeUI(likeBtn, likeCountEl, likesMetaEl, wasLiked, currentCount);
      Toast.show(err.message || 'Error al procesar Me gusta.', 'error');
    }
  }

  /**
   * Actualiza la UI del botón de Like y sus contadores
   * @param {HTMLElement} likeBtn
   * @param {HTMLElement} likeCountEl
   * @param {HTMLElement} likesMetaEl
   * @param {boolean} isLiked
   * @param {number} count
   */
  function updateLikeUI(likeBtn, likeCountEl, likesMetaEl, isLiked, count) {
    if (likeBtn) {
      likeBtn.classList.toggle('liked', isLiked);
      likeBtn.dataset.liked = String(isLiked);
    }
    if (likeCountEl) likeCountEl.textContent = count;
    if (likesMetaEl) {
      likesMetaEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#F87171">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        ${count} Me gusta
      `;
    }
  }

  // ──────────── COMENTARIOS — PUBLICAR (SERIE III) ────────────

  /**
   * Publica un comentario principal en el video actual.
   * POST /api/interaccionvideo/{videoId}/comentario
   */
  async function handlePostComment() {
    const session = Auth.getSession();
    if (!session) {
      Toast.show('🔒 Debes iniciar sesión para comentar.', 'info');
      Auth.openAuthModal('login');
      return;
    }

    const textarea = document.getElementById('new-comment-text');
    const submitBtn = document.getElementById('btn-submit-comment');
    const texto = textarea?.value?.trim();

    if (!texto) {
      Toast.show('Escribe un comentario antes de publicar.', 'warning');
      textarea?.focus();
      return;
    }

    submitBtn.disabled = true;
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-spinner" style="width:14px;height:14px;border-width:2px;animation:spin 0.7s linear infinite;display:inline-block;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:white;"></span>';

    try {
      const data = await API.postComment(currentVideoId, session.carne, texto);

      // Limpiar textarea
      if (textarea) { textarea.value = ''; }
      updateCharCount(0);

      // Agregar comentario al DOM (optimistic o con datos del servidor)
      const newComment = data?.comentario || data || {
        id: data?.id || Date.now(),
        carne: session.carne,
        estudiante: session.estudiante,
        texto,
        fecha: new Date().toISOString(),
        respuestas: [],
      };

      prependComment(newComment);
      Toast.show('💬 Comentario publicado exitosamente.', 'success');
    } catch (err) {
      Toast.show(err.message || 'Error al publicar el comentario.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  // ──────────── COMENTARIOS — RESPONDER (SERIE III) ────────────

  /**
   * Publica una respuesta a un comentario existente (1 nivel de profundidad).
   * POST /api/interaccionvideo/comentario/{comentarioId}/responder
   * Regla: las respuestas NO pueden tener sub-respuestas.
   * @param {string|number} comentarioId
   * @param {HTMLTextAreaElement} textarea
   * @param {HTMLButtonElement} submitBtn
   */
  async function handleReplyComment(comentarioId, textarea, submitBtn) {
    const session = Auth.getSession();
    if (!session) {
      Toast.show('🔒 Inicia sesión para responder.', 'info');
      Auth.openAuthModal('login');
      return;
    }

    const texto = textarea?.value?.trim();
    if (!texto) {
      Toast.show('Escribe una respuesta antes de publicar.', 'warning');
      textarea?.focus();
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '...';

    try {
      const data = await API.replyComment(comentarioId, session.carne, texto);

      if (textarea) textarea.value = '';

      // Cerrar formulario de respuesta
      const replyForm = document.getElementById(`reply-form-${comentarioId}`);
      if (replyForm) replyForm.classList.remove('visible');
      openReplyForms[comentarioId] = false;

      // Agregar respuesta al árbol del comentario
      const newReply = data?.respuesta || data || {
        id: data?.id || Date.now(),
        carne: session.carne,
        estudiante: session.estudiante,
        texto,
        fecha: new Date().toISOString(),
      };

      appendReply(comentarioId, newReply);
      Toast.show('↩️ Respuesta publicada.', 'success');
    } catch (err) {
      Toast.show(err.message || 'Error al publicar la respuesta.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  // ──────────── COMENTARIOS — ELIMINAR (SERIE III) ────────────

  /**
   * Elimina un comentario o respuesta.
   * Regla: solo el autor puede eliminar su comentario (verificación de autoría).
   * DELETE /api/interaccionvideo/comentario/{comentarioId}?carne={carne}
   * @param {string|number} comentarioId
   * @param {HTMLElement} commentEl — Elemento DOM del comentario
   */
  async function handleDeleteComment(comentarioId, commentEl) {
    const session = Auth.getSession();
    if (!session) return;

    // Confirmación visual antes de eliminar
    const confirmed = confirm('¿Estás seguro de que deseas eliminar este comentario?');
    if (!confirmed) return;

    try {
      await API.deleteComment(comentarioId, session.carne);

      // Animar y remover el elemento del DOM
      commentEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      commentEl.style.opacity = '0';
      commentEl.style.transform = 'translateX(-20px)';
      setTimeout(() => commentEl.remove(), 300);

      Toast.show('🗑️ Comentario eliminado.', 'info');
    } catch (err) {
      if (err.status === 403) {
        Toast.show('⛔ No tienes permiso para eliminar este comentario.', 'error');
      } else {
        Toast.show(err.message || 'Error al eliminar el comentario.', 'error');
      }
    }
  }

  // ──────────── RENDER DE COMENTARIOS ────────────

  /**
   * Renderiza un comentario completo con sus respuestas
   * @param {object} comment
   * @param {boolean} isReply — true si es una respuesta (no renderizar botón "Responder")
   * @returns {string} HTML string
   */
  function renderComment(comment, isReply = false) {
    const session = Auth.getSession();
    const id = comment.id || comment._id || '';
    const autor = comment.estudiante || comment.autor || comment.nombre || 'Estudiante';
    const carne = comment.carne || '';
    const texto = comment.texto || comment.contenido || '';
    const fecha = Catalog.formatDate(comment.fecha || comment.createdAt);
    const respuestas = comment.respuestas || comment.replies || [];
    const isOwner = session && session.carne === carne;
    const initials = Catalog.getInitials(autor);

    const deleteBtn = isOwner
      ? `<button class="comment-action-btn delete" data-comment-id="${id}" aria-label="Eliminar comentario">
           <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
           Eliminar
         </button>`
      : '';

    // Botón responder solo en comentarios principales (1 nivel de profundidad)
    const replyBtn = (!isReply && session)
      ? `<button class="comment-action-btn reply" data-comment-id="${id}" aria-label="Responder">
           <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
           Responder
         </button>`
      : '';

    // Formulario de respuesta (solo en comentarios principales)
    const replyForm = (!isReply && session)
      ? `<div class="reply-form-wrapper" id="reply-form-${id}">
           <div class="comment-form-avatar" style="width:26px;height:26px;font-size:0.65rem;">${Catalog.getInitials(session.estudiante)}</div>
           <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
             <textarea class="reply-textarea" id="reply-textarea-${id}" placeholder="Escribe tu respuesta..." rows="2" maxlength="400"></textarea>
             <div style="display:flex;gap:6px;justify-content:flex-end;">
               <button class="btn btn-ghost btn-sm cancel-reply-btn" data-comment-id="${id}">Cancelar</button>
               <button class="btn btn-primary btn-sm submit-reply-btn" data-comment-id="${id}">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                 Publicar
               </button>
             </div>
           </div>
         </div>`
      : '';

    // Respuestas (solo 1 nivel de anidamiento)
    const repliesHtml = (!isReply && respuestas.length > 0)
      ? `<div class="replies-container" id="replies-${id}">
           ${respuestas.map(r => renderComment(r, true)).join('')}
         </div>`
      : (!isReply ? `<div class="replies-container" id="replies-${id}"></div>` : '');

    const containerClass = isReply ? 'reply-item' : 'comment-item';

    return `
      <div class="${containerClass}" data-comment-id="${id}" id="${isReply ? 'reply' : 'comment'}-${id}">
        <div class="comment-header">
          <div class="comment-avatar">${initials}</div>
          <div class="comment-meta">
            <span class="comment-author">${autor}</span>
            ${fecha ? `<span class="comment-date">${fecha}</span>` : ''}
          </div>
        </div>
        <p class="comment-text">${texto}</p>
        <div class="comment-actions">
          ${replyBtn}
          ${deleteBtn}
        </div>
        ${replyForm}
        ${repliesHtml}
      </div>
    `;
  }

  /**
   * Agrega un nuevo comentario al inicio de la lista (prepend)
   * @param {object} comment
   */
  function prependComment(comment) {
    const list = document.getElementById('comments-list');
    if (!list) return;

    // Remover estado "sin comentarios" si existe
    list.querySelector('.no-comments')?.remove();

    const div = document.createElement('div');
    div.innerHTML = renderComment(comment);
    const commentEl = div.firstElementChild;
    list.insertBefore(commentEl, list.firstChild);

    // Bind listeners en el nuevo comentario
    bindCommentListeners(commentEl);
  }

  /**
   * Agrega una respuesta al contenedor de respuestas de un comentario
   * @param {string|number} comentarioId
   * @param {object} reply
   */
  function appendReply(comentarioId, reply) {
    const repliesContainer = document.getElementById(`replies-${comentarioId}`);
    if (!repliesContainer) return;

    const div = document.createElement('div');
    div.innerHTML = renderComment(reply, true);
    const replyEl = div.firstElementChild;
    repliesContainer.appendChild(replyEl);

    // Bind listeners (solo botón eliminar en respuestas)
    bindCommentListeners(replyEl);
  }

  // ──────────── BIND DE LISTENERS ────────────

  /**
   * Vincula los event listeners de un elemento de comentario o respuesta.
   * Soporta: botón Responder, Cancelar respuesta, Publicar respuesta y Eliminar.
   * @param {HTMLElement} commentEl
   */
  function bindCommentListeners(commentEl) {
    // Botón Responder
    commentEl.querySelectorAll('.comment-action-btn.reply[data-comment-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.dataset.commentId;
        toggleReplyForm(commentId);
      });
    });

    // Botón Cancelar respuesta
    commentEl.querySelectorAll('.cancel-reply-btn[data-comment-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.dataset.commentId;
        const form = document.getElementById(`reply-form-${commentId}`);
        if (form) { form.classList.remove('visible'); }
        openReplyForms[commentId] = false;
      });
    });

    // Botón Publicar respuesta
    commentEl.querySelectorAll('.submit-reply-btn[data-comment-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.dataset.commentId;
        const textarea = document.getElementById(`reply-textarea-${commentId}`);
        handleReplyComment(commentId, textarea, btn);
      });
    });

    // Botón Eliminar comentario/respuesta
    commentEl.querySelectorAll('.comment-action-btn.delete[data-comment-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentId = btn.dataset.commentId;
        // Buscar el elemento contenedor del comentario/respuesta
        const el = document.getElementById(`comment-${commentId}`) ||
                   document.getElementById(`reply-${commentId}`);
        if (el) handleDeleteComment(commentId, el);
      });
    });
  }

  /**
   * Muestra/oculta el formulario de respuesta de un comentario
   * @param {string|number} commentId
   */
  function toggleReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (!form) return;

    const isOpen = openReplyForms[commentId];
    openReplyForms[commentId] = !isOpen;
    form.classList.toggle('visible', !isOpen);

    if (!isOpen) {
      const textarea = document.getElementById(`reply-textarea-${commentId}`);
      textarea?.focus();
    }
  }

  // ──────────── CARGA DE COMENTARIOS ────────────

  /**
   * Carga y renderiza los comentarios del video actual desde la API.
   * La API puede devolver los comentarios en el detalle del video o en un endpoint dedicado.
   * @param {string|number} videoId
   */
  async function loadComments(videoId) {
    const list = document.getElementById('comments-list');
    if (!list) return;

    list.innerHTML = `
      <div class="comments-loading" id="comments-loading">
        <div class="spinner-ring small"></div>
        <span>Cargando comentarios...</span>
      </div>
    `;

    try {
      // Intentar obtener comentarios del detalle del video
      const videoData = await API.getVideoById(videoId);
      const comments = videoData?.comentarios || videoData?.comments || [];

      renderCommentsList(comments);
    } catch {
      list.innerHTML = `
        <div class="no-comments">
          <div class="no-comments-icon">💬</div>
          <p>Sé el primero en comentar</p>
        </div>
      `;
    }
  }

  /**
   * Renderiza la lista completa de comentarios en el DOM
   * @param {object[]} comments
   */
  function renderCommentsList(comments) {
    const list = document.getElementById('comments-list');
    if (!list) return;

    if (!comments || comments.length === 0) {
      list.innerHTML = `
        <div class="no-comments">
          <div class="no-comments-icon">💬</div>
          <p>Aún no hay comentarios. ¡Sé el primero!</p>
        </div>
      `;
      return;
    }

    list.innerHTML = comments.map(c => renderComment(c)).join('');

    // Bind listeners en todos los comentarios renderizados
    list.querySelectorAll('.comment-item').forEach(el => bindCommentListeners(el));
    list.querySelectorAll('.reply-item').forEach(el => bindCommentListeners(el));
  }

  // ──────────── CONTADOR DE CARACTERES ────────────

  /**
   * Actualiza el contador de caracteres del textarea de comentario
   * @param {number} count
   */
  function updateCharCount(count) {
    const el = document.getElementById('comment-char-count');
    if (el) el.textContent = `${count}/500`;
  }

  // ──────────── INICIALIZACIÓN DEL MODAL ────────────

  /**
   * Inicializa los listeners de interacción dentro del modal de video.
   * Debe llamarse cada vez que se abre un nuevo video.
   * @param {string|number} videoId
   */
  function initVideoModal(videoId) {
    currentVideoId = videoId;

    // Like button
    const likeBtn = document.getElementById('like-btn');
    if (likeBtn) {
      // Remover listener anterior clonando el nodo
      const newLikeBtn = likeBtn.cloneNode(true);
      likeBtn.parentNode.replaceChild(newLikeBtn, likeBtn);

      // Restaurar estado visual
      const isLiked = likeState[videoId] === true;
      newLikeBtn.classList.toggle('liked', isLiked);
      newLikeBtn.dataset.liked = String(isLiked);

      if (!Auth.isAuthenticated()) {
        newLikeBtn.classList.add('disabled-guest');
      }

      newLikeBtn.addEventListener('click', () => {
        if (newLikeBtn.classList.contains('disabled-guest') && !Auth.isAuthenticated()) {
          Toast.show('🔒 Inicia sesión para dar Me gusta.', 'info');
          Auth.openAuthModal('login');
          return;
        }
        handleLikeToggle(videoId);
      });
    }

    // Submit de comentario
    const submitBtn = document.getElementById('btn-submit-comment');
    if (submitBtn) {
      const newBtn = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newBtn, submitBtn);
      newBtn.addEventListener('click', handlePostComment);
    }

    // Contador de caracteres del textarea
    const textarea = document.getElementById('new-comment-text');
    if (textarea) {
      textarea.value = '';
      updateCharCount(0);
      const newTA = textarea.cloneNode(true);
      textarea.parentNode.replaceChild(newTA, textarea);
      newTA.addEventListener('input', (e) => updateCharCount(e.target.value.length));
    }

    // Actualizar UI de autenticación en el modal
    Auth.updateUIForAuth();
  }

  // ──────────── INICIALIZACIÓN GLOBAL ────────────

  function init() {
    // La mayor parte de la inicialización ocurre en initVideoModal()
    // cuando se abre cada video, pero aquí configuramos listeners globales.

    // Escape key cierra el modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const videoOverlay = document.getElementById('video-modal-overlay');
        if (videoOverlay && !videoOverlay.classList.contains('hidden')) {
          Catalog.closeVideoModal();
        }
      }
    });
  }

  return {
    init,
    initVideoModal,
    loadComments,
    handleLikeToggle,
    handlePostComment,
    handleReplyComment,
    handleDeleteComment,
  };
})();
