/* ============================================================
   js/auth.js — SERIE I: Autenticación, Registro y Sesión
   EduVid · Plataforma de Videos Educativos · UMG 2026
   ============================================================ */

'use strict';

const Auth = (() => {
  // ──────────── CONSTANTES DE VALIDACIÓN ────────────
  /** Máscara de carné: 4 dígitos - 2 dígitos - 5 dígitos (e.g. 1890-20-11489) */
  const CARNE_REGEX = /^\d{4}-\d{2}-\d{5}$/;
  /** Correo estándar */
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  /** PIN: solo dígitos, sin letras ni espacios, mínimo 4 */
  const PIN_REGEX = /^\d{4,}$/;
  /** Clave en localStorage para la sesión */
  const SESSION_KEY = 'eduvid_session';

  // ──────────── GESTIÓN DE SESIÓN ────────────

  /**
   * Guardar la sesión del estudiante en localStorage
   * @param {{ carne: string, estudiante: string, correo: string, token?: string }} data
   */
  function saveSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }

  /**
   * Obtener los datos de la sesión actual (o null si no existe)
   * @returns {{ carne: string, estudiante: string, correo: string } | null}
   */
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Verificar si hay una sesión activa
   * @returns {boolean}
   */
  function isAuthenticated() {
    return getSession() !== null;
  }

  /**
   * Cerrar sesión: eliminar datos del localStorage
   */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  // ──────────── VALIDACIONES ────────────

  /**
   * Valida el formato del carné universitario
   * @param {string} carne
   * @returns {{ valid: boolean, message: string }}
   */
  function validateCarne(carne) {
    if (!carne || carne.trim() === '') {
      return { valid: false, message: 'El carné es requerido.' };
    }
    if (!CARNE_REGEX.test(carne.trim())) {
      return { valid: false, message: 'Formato inválido. Usa: 0000-00-00000 (e.g. 1890-20-11489).' };
    }
    return { valid: true, message: '' };
  }

  /**
   * Valida el formato de correo electrónico
   * @param {string} correo
   * @returns {{ valid: boolean, message: string }}
   */
  function validateEmail(correo) {
    if (!correo || correo.trim() === '') {
      return { valid: false, message: 'El correo electrónico es requerido.' };
    }
    if (!EMAIL_REGEX.test(correo.trim())) {
      return { valid: false, message: 'Ingresa un correo válido (usuario@dominio.com).' };
    }
    return { valid: true, message: '' };
  }

  /**
   * Valida el PIN numérico de contraseña
   * @param {string} pin
   * @returns {{ valid: boolean, message: string }}
   */
  function validatePin(pin) {
    if (!pin || pin.trim() === '') {
      return { valid: false, message: 'La contraseña (PIN) es requerida.' };
    }
    if (!PIN_REGEX.test(pin.trim())) {
      return { valid: false, message: 'El PIN debe ser estrictamente numérico (solo dígitos, mín. 4).' };
    }
    return { valid: true, message: '' };
  }

  /**
   * Valida el nombre del estudiante
   * @param {string} nombre
   * @returns {{ valid: boolean, message: string }}
   */
  function validateNombre(nombre) {
    if (!nombre || nombre.trim().length < 3) {
      return { valid: false, message: 'Ingresa tu nombre completo (mín. 3 caracteres).' };
    }
    return { valid: true, message: '' };
  }

  /**
   * Aplica máscara automática al campo de carné.
   * Formato: 0000-00-00000
   * Agrega los guiones automáticamente al escribir.
   * @param {HTMLInputElement} input
   */
  function applyCarneMask(input) {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, ''); // Sólo dígitos
      let formatted = '';

      if (value.length <= 4) {
        formatted = value;
      } else if (value.length <= 6) {
        formatted = `${value.slice(0, 4)}-${value.slice(4)}`;
      } else {
        formatted = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 11)}`;
      }

      e.target.value = formatted;

      // Validación visual en tiempo real
      if (formatted.length === 13) {
        const result = validateCarne(formatted);
        setFieldState(input, result.valid, result.message);
      } else {
        clearFieldState(input);
      }
    });
  }

  // ──────────── HELPERS DE UI ────────────

  /**
   * Muestra u oculta el estado de un campo (válido/inválido).
   * @param {HTMLInputElement} input
   * @param {boolean} isValid
   * @param {string} message - Mensaje de error (vacío si válido)
   */
  function setFieldState(input, isValid, message = '') {
    const errorEl = document.getElementById(`${input.id}-error`);
    input.classList.remove('is-valid', 'is-invalid');
    if (isValid) {
      input.classList.add('is-valid');
      if (errorEl) { errorEl.textContent = ''; errorEl.classList.add('hidden'); }
    } else {
      input.classList.add('is-invalid');
      if (errorEl) { errorEl.textContent = message; errorEl.classList.remove('hidden'); }
    }
  }

  /**
   * Limpia el estado visual de un campo.
   * @param {HTMLInputElement} input
   */
  function clearFieldState(input) {
    input.classList.remove('is-valid', 'is-invalid');
    const errorEl = document.getElementById(`${input.id}-error`);
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.add('hidden'); }
  }

  /**
   * Muestra el mensaje de error global de un formulario.
   * @param {string} formErrorId - ID del elemento de error global
   * @param {string} message
   */
  function showFormError(formErrorId, message) {
    const el = document.getElementById(formErrorId);
    if (el) {
      el.textContent = message;
      el.classList.remove('hidden');
    }
  }

  /**
   * Oculta el mensaje de error global de un formulario.
   * @param {string} formErrorId
   */
  function hideFormError(formErrorId) {
    const el = document.getElementById(formErrorId);
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  }

  /**
   * Activa/desactiva el estado de carga de un botón de submit.
   * @param {HTMLButtonElement} btn
   * @param {boolean} loading
   */
  function setButtonLoading(btn, loading) {
    const textEl = btn.querySelector('.btn-text');
    const spinnerEl = btn.querySelector('.btn-spinner');
    btn.disabled = loading;
    if (textEl) textEl.style.opacity = loading ? '0' : '1';
    if (spinnerEl) spinnerEl.classList.toggle('hidden', !loading);
  }

  // ──────────── FLUJO DE REGISTRO (SERIE I) ────────────

  /**
   * Maneja el submit del formulario de registro.
   * Valida todos los campos, llama a la API y gestiona la respuesta.
   * @param {Event} e
   */
  async function handleRegister(e) {
    e.preventDefault();

    const carneInput = document.getElementById('reg-carne');
    const nombreInput = document.getElementById('reg-nombre');
    const correoInput = document.getElementById('reg-correo');
    const pwdInput = document.getElementById('reg-password');
    const submitBtn = document.getElementById('btn-register-submit');

    // Limpiar errores previos
    hideFormError('register-form-error');

    // Validar campos
    const carneVal = validateCarne(carneInput.value);
    const nombreVal = validateNombre(nombreInput.value);
    const correoVal = validateEmail(correoInput.value);
    const pwdVal = validatePin(pwdInput.value);

    setFieldState(carneInput, carneVal.valid, carneVal.message);
    setFieldState(nombreInput, nombreVal.valid, nombreVal.message);
    setFieldState(correoInput, correoVal.valid, correoVal.message);
    setFieldState(pwdInput, pwdVal.valid, pwdVal.message);

    if (!carneVal.valid || !nombreVal.valid || !correoVal.valid || !pwdVal.valid) return;

    // Enviar a la API
    setButtonLoading(submitBtn, true);

    try {
      const payload = {
        carne: carneInput.value.trim(),
        estudiante: nombreInput.value.trim(),
        correo: correoInput.value.trim().toLowerCase(),
        password: pwdInput.value.trim(),
      };

      await API.registerStudent(payload);

      // Éxito: guardar sesión y actualizar UI
      saveSession({
        carne: payload.carne,
        estudiante: payload.estudiante,
        correo: payload.correo,
      });

      Toast.show('✅ Cuenta creada exitosamente. ¡Bienvenido!', 'success');
      closeAuthModal();
      updateUIForAuth();
      e.target.reset();
    } catch (err) {
      const errMsg = err.status === 409
        ? 'El carné o correo ya está registrado. Intenta con otros datos.'
        : (err.message || 'Error al crear la cuenta. Intenta de nuevo.');
      showFormError('register-form-error', errMsg);
      Toast.show(errMsg, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  // ──────────── FLUJO DE LOGIN (SERIE I) ────────────

  /**
   * Maneja el submit del formulario de login.
   * Acepta carné formateado o correo electrónico.
   * @param {Event} e
   */
  async function handleLogin(e) {
    e.preventDefault();

    const usuarioInput = document.getElementById('login-usuario');
    const pwdInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('btn-login-submit');

    hideFormError('login-form-error');

    const usuario = usuarioInput.value.trim();
    const password = pwdInput.value.trim();

    // Validar: usuario no vacío
    if (!usuario) {
      setFieldState(usuarioInput, false, 'Ingresa tu carné o correo.');
      return;
    } else {
      clearFieldState(usuarioInput);
    }

    // Validar: pin no vacío
    const pwdVal = validatePin(password);
    setFieldState(pwdInput, pwdVal.valid, pwdVal.message);
    if (!pwdVal.valid) return;

    setButtonLoading(submitBtn, true);

    try {
      const data = await API.login({ usuario, password });

      // Intentar extraer datos del estudiante de la respuesta
      const session = {
        carne: data?.carne || data?.estudiante?.carne || usuario,
        estudiante: data?.estudiante?.nombre || data?.nombre || data?.estudiante || usuario,
        correo: data?.estudiante?.correo || data?.correo || '',
      };

      saveSession(session);
      Toast.show(`¡Bienvenido, ${session.estudiante.split(' ')[0]}! 👋`, 'success');
      closeAuthModal();
      updateUIForAuth();
    } catch (err) {
      const errMsg = err.status === 401 || err.status === 403
        ? 'Credenciales incorrectas. Verifica tu carné/correo y PIN.'
        : (err.message || 'Error al iniciar sesión. Intenta de nuevo.');
      showFormError('login-form-error', errMsg);
      Toast.show(errMsg, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  // ──────────── ACTUALIZACIÓN DE UI ────────────

  /**
   * Actualiza la interfaz de usuario según el estado de autenticación.
   * Muestra el chip de usuario o los botones de login/register.
   */
  function updateUIForAuth() {
    const session = getSession();
    const guestActions = document.getElementById('auth-actions-guest');
    const userActions = document.getElementById('auth-actions-user');
    const userNameNav = document.getElementById('user-name-nav');
    const userAvatarNav = document.getElementById('user-avatar-nav');
    const dropdownName = document.getElementById('dropdown-name');
    const dropdownCarne = document.getElementById('dropdown-carne');
    const commentAvatar = document.getElementById('comment-avatar-main');
    const commentGuestBlock = document.getElementById('comment-guest-block');
    const commentAuthForm = document.getElementById('comment-auth-form');
    const likeBtn = document.getElementById('like-btn');

    if (session) {
      // Mostrar estado autenticado
      if (guestActions) guestActions.classList.add('hidden');
      if (userActions) userActions.classList.remove('hidden');

      const initials = session.estudiante
        ? session.estudiante.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';

      if (userNameNav) userNameNav.textContent = session.estudiante?.split(' ')[0] || 'Estudiante';
      if (userAvatarNav) userAvatarNav.textContent = initials;
      if (dropdownName) dropdownName.textContent = session.estudiante || 'Estudiante';
      if (dropdownCarne) dropdownCarne.textContent = session.carne || '–';
      if (commentAvatar) commentAvatar.textContent = initials;

      // Sección de comentarios: mostrar formulario autenticado
      if (commentGuestBlock) commentGuestBlock.classList.add('hidden');
      if (commentAuthForm) commentAuthForm.classList.remove('hidden');

      // Habilitar like button
      if (likeBtn) likeBtn.classList.remove('disabled-guest');
    } else {
      // Mostrar estado visitante
      if (guestActions) guestActions.classList.remove('hidden');
      if (userActions) userActions.classList.add('hidden');

      // Sección de comentarios: mostrar bloque de visitante
      if (commentGuestBlock) commentGuestBlock.classList.remove('hidden');
      if (commentAuthForm) commentAuthForm.classList.add('hidden');

      // Deshabilitar like button para visitantes
      if (likeBtn) likeBtn.classList.add('disabled-guest');
    }
  }

  // ──────────── CONTROL DEL MODAL ────────────

  /** Abrir el modal de auth */
  function openAuthModal(tab = 'login') {
    const overlay = document.getElementById('auth-modal-overlay');
    overlay?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
  }

  /** Cerrar el modal de auth */
  function closeAuthModal() {
    const overlay = document.getElementById('auth-modal-overlay');
    overlay?.classList.add('hidden');
    document.body.style.overflow = '';
    // Limpiar formularios
    document.getElementById('form-login')?.reset();
    document.getElementById('form-register')?.reset();
    ['reg-carne', 'reg-nombre', 'reg-correo', 'reg-password', 'login-usuario', 'login-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) clearFieldState(el);
    });
    hideFormError('login-form-error');
    hideFormError('register-form-error');
  }

  /** Cambiar entre pestañas de login y register */
  function switchTab(tab) {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const panelLogin = document.getElementById('panel-login');
    const panelRegister = document.getElementById('panel-register');
    const indicator = document.getElementById('tab-indicator');

    if (tab === 'login') {
      tabLogin?.classList.add('active');
      tabRegister?.classList.remove('active');
      panelLogin?.classList.remove('hidden');
      panelRegister?.classList.add('hidden');
      indicator?.classList.remove('right');
    } else {
      tabRegister?.classList.add('active');
      tabLogin?.classList.remove('active');
      panelRegister?.classList.remove('hidden');
      panelLogin?.classList.add('hidden');
      indicator?.classList.add('right');
    }
  }

  // ──────────── TOGGLE PASSWORD VISIBILITY ────────────
  function bindTogglePassword(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.innerHTML = isText
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    });
  }

  // ──────────── INICIALIZACIÓN ────────────

  /**
   * Inicializa todos los listeners de autenticación.
   * Debe llamarse al cargar la aplicación (app.js).
   */
  function init() {
    // Formulario de registro
    document.getElementById('form-register')?.addEventListener('submit', handleRegister);
    // Formulario de login
    document.getElementById('form-login')?.addEventListener('submit', handleLogin);

    // Botones de apertura del modal
    document.getElementById('btn-open-login')?.addEventListener('click', () => openAuthModal('login'));
    document.getElementById('btn-open-register')?.addEventListener('click', () => openAuthModal('register'));
    document.getElementById('btn-hero-register')?.addEventListener('click', () => openAuthModal('register'));

    // Cerrar modal
    document.getElementById('btn-close-auth-modal')?.addEventListener('click', closeAuthModal);
    document.getElementById('auth-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeAuthModal();
    });

    // Switch entre pestañas
    document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => switchTab('register'));
    document.getElementById('switch-to-register')?.addEventListener('click', () => switchTab('register'));
    document.getElementById('switch-to-login')?.addEventListener('click', () => switchTab('login'));

    // Botón de comentario para visitantes
    document.getElementById('btn-comment-login')?.addEventListener('click', () => openAuthModal('login'));

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      logout();
      updateUIForAuth();
      Toast.show('Sesión cerrada. ¡Hasta pronto! 👋', 'info');
      // Recargar estado del reproductor si está abierto
      const overlay = document.getElementById('video-modal-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        updateUIForAuth();
      }
    });

    // Toggle contraseñas
    bindTogglePassword('toggle-login-pwd', 'login-password');
    bindTogglePassword('toggle-reg-pwd', 'reg-password');

    // Máscara automática de carné
    const carneInput = document.getElementById('reg-carne');
    if (carneInput) applyCarneMask(carneInput);

    // Actualizar UI según sesión existente
    updateUIForAuth();
  }

  // ──────────── API PÚBLICA ────────────
  return {
    init,
    openAuthModal,
    closeAuthModal,
    isAuthenticated,
    getSession,
    saveSession,
    logout,
    updateUIForAuth,
  };
})();
