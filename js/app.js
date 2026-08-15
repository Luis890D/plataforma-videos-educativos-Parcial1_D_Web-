/* ============================================================
   js/app.js — Inicialización y coordinación de la aplicación
   EduVid · Plataforma de Videos Educativos · UMG 2026
   ============================================================ */

'use strict';

// ──────────── MÓDULO TOAST ────────────
/**
 * Sistema de notificaciones Toast globales.
 * Accesible desde cualquier módulo como `Toast.show(msg, type)`.
 */
const Toast = (() => {
  const DURATION = 4000;
  const ICONS = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  /**
   * Muestra una notificación toast en pantalla
   * @param {string} message - Mensaje a mostrar
   * @param {'success'|'error'|'info'|'warning'} type - Tipo de toast
   * @param {number} duration - Duración en ms (por defecto 4000)
   */
  function show(message, type = 'info', duration = DURATION) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${ICONS[type] || 'ℹ️'}</span>
      <span class="toast-msg">${message}</span>
    `;

    container.appendChild(toast);

    // Auto-eliminar
    const removeTimer = setTimeout(() => remove(toast), duration);

    // Click para cerrar manualmente
    toast.addEventListener('click', () => {
      clearTimeout(removeTimer);
      remove(toast);
    });
  }

  function remove(toast) {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  return { show };
})();

// ──────────── INICIALIZACIÓN PRINCIPAL ────────────

/**
 * Punto de entrada principal de la aplicación.
 * Inicializa todos los módulos en el orden correcto.
 */
async function initApp() {
  try {
    // 1. Inicializar autenticación (Serie I)
    Auth.init();

    // 2. Inicializar interacciones globales (Serie III)
    Interaction.init();

    // 3. Inicializar catálogo (Serie II) — carga datos de la API
    await Catalog.init();

    console.log('%c🎬 EduVid inicializado correctamente.', 'color:#6C63FF;font-weight:bold;font-size:14px;');
  } catch (err) {
    console.error('[EduVid] Error al inicializar la aplicación:', err);
    Toast.show('Error al iniciar la aplicación. Recarga la página.', 'error', 6000);
  }
}

// ──────────── ARRANQUE ────────────

// Esperar a que el DOM esté completamente cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp(); // DOM ya listo
}
