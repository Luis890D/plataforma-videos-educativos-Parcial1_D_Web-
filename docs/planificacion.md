# Planificación Integral del Proyecto: Plataforma de Videos Educativos (1er Parcial - UMG)

**Universidad Mariano Gálvez de Guatemala**
**Centro Universitario de Guastayoya · Facultad de Ingeniería**

| Campo | Detalle |
|-------|---------|
| **Alumno** | Luis David Aroche Contreras |
| **Carné** | 23-7145 |
| **Asignatura** | Desarrollo y Diseño Web |
| **Código** | 036 |
| **Ciclo** | VIII |
| **Fecha** | 15/08/2026 |
| **Semestre** | 2do. |
| **Duración** | 120 Min. |
| **Catedrático** | Ing. Carlos Amílcar Tezo Palencia |
| **Examen** | 1er. Parcial |
| **Variante** | A — 15 Puntos |

---

## Puntuación por Serie

| Serie I | Serie II | Serie III | Serie IV |
|---------|----------|-----------|----------|
| 5 pts   | 5 pts    | 5 pts     | — |

---

## Contexto General del Proyecto

Se requiere el desarrollo de una solución web integral para la gestión y visualización de un catálogo de videos educativos. Los usuarios visitantes pueden navegar por la plataforma, filtrar el contenido y reproducir los videos de forma libre. Sin embargo, el acceso a las funcionalidades interactivas (dar 'Like', comentar, responder y gestionar comentarios) está estrictamente restringido a usuarios registrados e identificados en el sistema.

**URL Base de la API REST (desarrollo local):**
```
https://backvideo-hpevgdenh7hygvfm.canadacentral-01.azurewebsites.net
```

---

## Arquitectura y Stack Tecnológico

- **Frontend:** HTML5 semántico, CSS3 moderno (Glassmorphism, Dark Mode, Micro-interacciones, diseño responsivo y tipografía moderna Inter/Outfit) y Vanilla JavaScript modular estructurado (`fetch`, `Async/Await`, State Management local).
- **Almacenamiento Local de Sesión:** `localStorage` / `sessionStorage` para persistir la sesión activa del estudiante (`carne`, `nombre`, `correo`).
- **Estructura Modular:**

```
plataforma-videos-educativos/
├── index.html              ← Estructura HTML semántica principal
├── css/
│   └── styles.css          ← Sistema de diseño premium dark mode
├── js/
│   ├── api.js              ← Capa centralizada de llamadas REST
│   ├── auth.js             ← Serie I: Autenticación y Sesión
│   ├── catalog.js          ← Serie II: Catálogo, Filtros y Reproductor
│   ├── interaction.js      ← Serie III: Likes, Comentarios, Respuestas
│   └── app.js              ← Coordinador + Toast global
└── docs/
    └── planificacion.md    ← Este documento
```

---

## Planificación 1: SERIE I — Autenticación, Registro y Reglas de Validación (5 Pts)

### Objetivo
Construir el sistema de acceso y control de identidad para habilitar las funciones interactivas del sistema, cumpliendo todas las reglas de negocio y validaciones estrictas definidas en el enunciado.

### Reglas de Negocio Implementadas

| Regla | Descripción | Implementación |
|-------|-------------|----------------|
| **Máscara de Carné** | Formato `0000-00-00000` (e.g. `1890-20-11489`) | Auto-formato en tiempo real con Regex `/^\d{4}-\d{2}-\d{5}$/` |
| **Validación de Correo** | Estructura estándar `usuario@dominio.com` | Regex `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` |
| **PIN Numérico** | Solo dígitos, sin letras ni espacios, mínimo 4 dígitos | Regex `/^\d{4,}$/` |
| **Unicidad de Datos** | No se permiten carné o correo duplicados | Captura y presentación visual de errores HTTP 400/409 |
| **Login Híbrido** | Campo de usuario acepta carné **o** correo indistintamente | Campo `usuario` validado contra ambos formatos |
| **Sesión Persistente** | Datos del estudiante guardados en `localStorage` | `saveSession()`, `getSession()`, `logout()` |

### Endpoints Implementados

#### Registro de Nuevo Estudiante
```http
POST /api/estudiantes/registrar
Content-Type: application/json

{
  "carne": "1890-20-11489",
  "estudiante": "JUAN PEREZ",
  "correo": "juan.perez@correo.com",
  "password": "1234"
}
```

#### Inicio de Sesión (Login)
```http
POST /api/login
Content-Type: application/json

{
  "usuario": "1890-20-11489",
  "password": "1234"
}
```
> El campo `usuario` recuerda que puede ser carné o correo.

### Tareas Realizadas (Serie I)

- [x] Modal de Login/Registro con pestañas dinámicas (Tabs) animadas
- [x] Máscara automática del carné (agrega guiones al escribir)
- [x] Validación visual en tiempo real (is-valid / is-invalid)
- [x] Toggle de visibilidad de contraseña
- [x] Función `registerStudent()` con manejo de errores y toasts
- [x] Función `loginStudent()` con login dual carné/correo
- [x] Sesión persistente con `localStorage`
- [x] Actualización reactiva de la Navbar (chip de usuario, avatar, dropdown)
- [x] Botón Logout con limpieza de sesión

---

## Planificación 2: SERIE II — Interfaz de Usuario, Catálogo y Navegación (5 Pts)

### Objetivo
Desarrollar una interfaz moderna, atractiva e intuitiva con vista de catálogo completo, filtros dinámicos por categoría, buscador en tiempo real, reproductor de video dedicado y control visual de accesos para visitantes no autenticados.

### Funcionalidades Implementadas

| Funcionalidad | Descripción |
|---------------|-------------|
| **Galería de Videos** | Grid responsivo con cards glassmorphism: póster, badge de categoría, duración, título, descripción y contador de likes |
| **Filtros por Categoría** | Chips dinámicos desde `/api/videos/categorias`, filtrado por `/api/videos/categoria/{nombre}` |
| **Buscador en Tiempo Real** | Input con debounce 300ms, búsqueda por título y descripción, botón limpiar |
| **Reproductor Multi-formato** | Soporte para YouTube, Vimeo, HTML5 (mp4/webm) e iframes genéricos |
| **Control de Acceso Visual** | Botones de Like y comentarios bloqueados/redirigen a Login si el usuario es visitante |
| **Skeleton Loaders** | Placeholders animados mientras carga el catálogo y las categorías |

### Endpoints Implementados

```http
GET /api/videos                              → Catálogo completo
GET /api/videos/{id}                         → Detalle de video
GET /api/videos/categorias                   → Listado de categorías
GET /api/videos/categoria/{nombreCategoria}  → Videos por categoría
```

### Tareas Realizadas (Serie II)

- [x] Navbar con logo, buscador integrado y estado de autenticación
- [x] Hero Section con orbs animados, estadísticas dinámicas y CTA
- [x] Grid de cards premium con animaciones hover fluidas
- [x] Skeleton loaders durante la carga inicial
- [x] Chips de categorías generados dinámicamente desde la API
- [x] Buscador con debounce 300ms sincronizado (Navbar + Catálogo)
- [x] Modal reproductor con soporte multi-formato
- [x] Información completa del video (título, descripción, categoría, duración, likes)
- [x] Estado vacío animado cuando no hay resultados
- [x] Contador de resultados en tiempo real

---

## Planificación 3: SERIE III — Lógica de Interacción y Gestión de Comentarios (5 Pts)

### Objetivo
Implementar la capa de interactividad dinámica para estudiantes autenticados: sistema de Likes tipo Toggle, comentarios principales, respuestas anidadas de exactamente 1 nivel de profundidad, y eliminación con verificación de autoría.

### Reglas de Negocio Implementadas

| Regla | Descripción | Implementación |
|-------|-------------|----------------|
| **Toggle Like** | Un estudiante solo puede dar un Like por video. Si ya dio Like y vuelve a presionar, se remueve | Optimistic UI + llamada API, estado revertible en error |
| **Comentarios Principales** | Vinculados directamente al `videoId` | `POST /api/interaccionvideo/{videoId}/comentario` |
| **Respuestas 1er Nivel** | Se puede responder a un comentario principal, pero **las respuestas no pueden tener sub-respuestas** | Árbol de profundidad máxima 1, botón "Responder" solo visible en comentarios raíz |
| **Verificación de Autoría** | Botón "Eliminar" visible únicamente en comentarios propios del carné autenticado | Comparación `session.carne === comment.carne`, respuesta 403 manejada |

### Endpoints Implementados

```http
POST /api/interaccionvideo/{videoId}/like
Body: { "carne": "1890-20-11489" }

POST /api/interaccionvideo/{videoId}/comentario
Body: { "carne": "1890-20-11489", "texto": "Excelente explicación del framework." }

POST /api/interaccionvideo/comentario/{comentarioId}/responder
Body: { "carne": "1890-20-11489", "texto": "Totalmente de acuerdo con tu punto de vista." }

DELETE /api/interaccionvideo/comentario/{comentarioId}?carne=1890-20-11489
```

### Tareas Realizadas (Serie III)

- [x] Botón Like reactivo con animación heartbeat y Optimistic UI
- [x] Árbol de comentarios con timestamps relativos ("Hace 5 minutos")
- [x] Formularios de comentario y respuesta con validación de campo vacío
- [x] Contador de caracteres en textarea (0/500)
- [x] Toggle de formulario de respuesta por comentario
- [x] Botón Eliminar visible solo en comentarios propios
- [x] Confirmación antes de eliminar
- [x] Animación de salida al eliminar un comentario
- [x] Manejo explícito de error 403 Forbidden en eliminación

---

## Plan de Verificación

### Pruebas de API con Postman

| Tipo | Endpoint | Método | Resultado Esperado |
|------|----------|--------|-------------------|
| Catálogo | `/api/videos` | GET | Lista de videos |
| Detalle | `/api/videos/{id}` | GET | Objeto de video |
| Categorías | `/api/videos/categorias` | GET | Lista de categorías |
| Por Categoría | `/api/videos/categoria/{nombre}` | GET | Videos filtrados |
| Registro | `/api/estudiantes/registrar` | POST | 200/201 con datos del estudiante |
| Login | `/api/login` | POST | 200 con token/sesión |
| Like | `/api/interaccionvideo/{id}/like` | POST | Toggle confirmado |
| Comentario | `/api/interaccionvideo/{id}/comentario` | POST | Comentario creado |
| Responder | `/api/interaccionvideo/comentario/{id}/responder` | POST | Respuesta creada |
| Eliminar | `/api/interaccionvideo/comentario/{id}` | DELETE | 200 o 403 si no es autor |

### Pruebas Manuales de UI

- [ ] Flujo visitante: navegar, buscar, filtrar, intentar dar like → redirige a login
- [ ] Registro con carné `1890-20-11489` y PIN `1234`
- [ ] Login con carné y con correo electrónico
- [ ] Verificar chip de usuario en navbar y dropdown de logout
- [ ] Filtros de categoría dinámicos y buscador en tiempo real
- [ ] Abrir reproductor de video y verificar carga
- [ ] Toggle Like dos veces (dar y quitar)
- [ ] Publicar comentario principal
- [ ] Responder a un comentario (verificar que solo es 1 nivel)
- [ ] Eliminar comentario propio y verificar animación
- [ ] Intentar eliminar comentario ajeno → 403 Forbidden

---

*Documento generado el 15/08/2026 para el 1er Parcial de Desarrollo y Diseño Web · UMG*
