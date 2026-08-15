/* ============================================================
   js/api.js — Capa centralizada de llamadas REST
   EduVid · Plataforma de Videos Educativos · UMG 2026
   ============================================================ */

'use strict';

const API = (() => {
  // ──────────── CONFIGURACIÓN ────────────
  const BASE_URL = 'https://backvideo-hpevgdenh7hygvfm.canadacentral-01.azurewebsites.net';

  /**
   * Realiza una petición HTTP a la API REST y retorna los datos JSON.
   * @param {string} endpoint - Ruta relativa (ej. '/api/videos')
   * @param {RequestInit} options - Opciones de fetch (method, body, headers, etc.)
   * @returns {Promise<any>} - Datos de la respuesta JSON
   * @throws {Error} - Error con mensaje del servidor o genérico
   */
  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);

      // Si la respuesta es 204 No Content, retornar null
      if (response.status === 204) return null;

      let data = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const message = (typeof data === 'object' && data !== null)
          ? (data.mensaje || data.message || data.error || `Error ${response.status}`)
          : (data || `Error ${response.status}`);
        const err = new Error(message);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      if (err.status) throw err; // Re-lanzar errores HTTP ya formateados
      // Errores de red o CORS
      const netErr = new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      netErr.status = 0;
      throw netErr;
    }
  }

  // ──────────── SERIE I — AUTENTICACIÓN ────────────

  /**
   * Registrar un nuevo estudiante
   * POST /api/estudiantes/registrar
   */
  const registerStudent = (payload) =>
    request('/api/estudiantes/registrar', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

  /**
   * Iniciar sesión (acepta carné o correo)
   * POST /api/login
   */
  const login = (payload) =>
    request('/api/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

  // ──────────── SERIE II — CATÁLOGO ────────────

  /**
   * Obtener catálogo completo de videos
   * GET /api/videos
   */
  const getVideos = () => request('/api/videos');

  /**
   * Obtener detalle de un video específico
   * GET /api/videos/{id}
   */
  const getVideoById = (id) => request(`/api/videos/${id}`);

  /**
   * Obtener listado de categorías disponibles
   * GET /api/videos/categorias
   */
  const getCategories = () => request('/api/videos/categorias');

  /**
   * Obtener videos filtrados por categoría
   * GET /api/videos/categoria/{nombreCategoria}
   */
  const getVideosByCategory = (categoryName) =>
    request(`/api/videos/categoria/${encodeURIComponent(categoryName)}`);

  // ──────────── SERIE III — INTERACCIONES ────────────

  /**
   * Toggle Like de un video (dar o quitar like)
   * POST /api/interaccionvideo/{videoId}/like
   */
  const toggleLike = (videoId, carne) =>
    request(`/api/interaccionvideo/${videoId}/like`, {
      method: 'POST',
      body: JSON.stringify({ carne }),
    });

  /**
   * Publicar un comentario principal en un video
   * POST /api/interaccionvideo/{videoId}/comentario
   */
  const postComment = (videoId, carne, texto) =>
    request(`/api/interaccionvideo/${videoId}/comentario`, {
      method: 'POST',
      body: JSON.stringify({ carne, texto }),
    });

  /**
   * Responder a un comentario existente (1er nivel de anidamiento)
   * POST /api/interaccionvideo/comentario/{comentarioId}/responder
   */
  const replyComment = (comentarioId, carne, texto) =>
    request(`/api/interaccionvideo/comentario/${comentarioId}/responder`, {
      method: 'POST',
      body: JSON.stringify({ carne, texto }),
    });

  /**
   * Eliminar un comentario (solo el autor puede eliminarlo)
   * DELETE /api/interaccionvideo/comentario/{comentarioId}?carne={carne}
   */
  const deleteComment = (comentarioId, carne) =>
    request(`/api/interaccionvideo/comentario/${comentarioId}?carne=${encodeURIComponent(carne)}`, {
      method: 'DELETE',
    });

  // ──────────── API PÚBLICA ────────────
  return {
    // Auth
    registerStudent,
    login,
    // Catálogo
    getVideos,
    getVideoById,
    getCategories,
    getVideosByCategory,
    // Interacciones
    toggleLike,
    postComment,
    replyComment,
    deleteComment,
    // Constante
    BASE_URL,
  };
})();
