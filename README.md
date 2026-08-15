# EduVid — Plataforma de Videos Educativos

Plataforma web para la gestión y visualización de un catálogo de videos educativos, desarrollada como proyecto del **1er Parcial** de la asignatura *Desarrollo y Diseño Web* — Universidad Mariano Gálvez de Guatemala (UMG).

Los visitantes pueden navegar el catálogo, filtrar por categoría y reproducir videos libremente. Las funcionalidades interactivas (dar Like, comentar y responder) están restringidas a estudiantes registrados y autenticados.

## 📋 Información académica

| Campo | Detalle |
|-------|---------|
| **Alumno** | Luis David Aroche Contreras |
| **Carné** | 23-7145 |
| **Universidad** | Universidad Mariano Gálvez de Guatemala — Centro Universitario de Guastatoya |
| **Asignatura** | Desarrollo y Diseño Web (Código 036) |
| **Ciclo** | VIII, 2do. Semestre |
| **Catedrático** | Ing. Carlos Amílcar Tezo Palencia |
| **Examen** | 1er. Parcial — Variante A (15 Pts) |

## ✨ Características principales

- **Catálogo de videos** en grid responsivo con tarjetas estilo *glassmorphism* (póster, categoría, duración, likes).
- **Filtros dinámicos por categoría** y **buscador en tiempo real** (con debounce) sincronizado entre navbar y catálogo.
- **Reproductor multi-formato**: YouTube, Vimeo, HTML5 (mp4/webm) e iframes genéricos.
- **Autenticación de estudiantes**: registro y login híbrido (por carné o correo), con máscara automática de carné y validaciones en tiempo real.
- **Sesión persistente** mediante `localStorage`.
- **Sistema de Likes** tipo *toggle* con actualización optimista de UI.
- **Comentarios y respuestas** anidadas a un solo nivel de profundidad, con verificación de autoría para eliminar.
- Diseño **dark mode** moderno con tipografías Inter/Outfit, skeleton loaders y micro-interacciones.

## 🏗️ Arquitectura y stack tecnológico

- **Frontend:** HTML5 semántico, CSS3 moderno y JavaScript Vanilla modular (`fetch`, `async/await`, manejo de estado local).
- **Backend:** consumo de una API REST externa ya desplegada (no incluida en este repositorio).
- **Almacenamiento local:** `localStorage` / `sessionStorage` para persistir la sesión activa (`carne`, `nombre`, `correo`).

## 📁 Estructura del proyecto

```
plataforma-videos-educativos/
├── index.html              # Estructura HTML semántica principal
├── css/
│   └── styles.css          # Sistema de diseño premium / dark mode
├── js/
│   ├── api.js               # Capa centralizada de llamadas REST
│   ├── auth.js               # Serie I: Autenticación y sesión
│   ├── catalog.js            # Serie II: Catálogo, filtros y reproductor
│   ├── interaction.js        # Serie III: Likes, comentarios y respuestas
│   └── app.js                 # Coordinador general + notificaciones (toasts)
└── docs/
    └── planificacion.md    # Documento de planificación detallado del proyecto
```

## 🔌 API REST

El proyecto consume una API REST ya desplegada en la nube:

```
https://backvideo-hpevgdenh7hygvfm.canadacentral-01.azurewebsites.net
```

### Endpoints principales

**Autenticación**
```http
POST /api/estudiantes/registrar   # Registro de nuevo estudiante
POST /api/login                   # Login por carné o correo
```

**Catálogo de videos**
```http
GET /api/videos                              # Catálogo completo
GET /api/videos/{id}                         # Detalle de video
GET /api/videos/categorias                   # Listado de categorías
GET /api/videos/categoria/{nombreCategoria}  # Videos filtrados por categoría
```

**Interacción (requiere sesión activa)**
```http
POST   /api/interaccionvideo/{videoId}/like
POST   /api/interaccionvideo/{videoId}/comentario
POST   /api/interaccionvideo/comentario/{comentarioId}/responder
DELETE /api/interaccionvideo/comentario/{comentarioId}?carne={carne}
```

Más detalle de reglas de negocio, cuerpos de petición y respuestas esperadas en [`docs/planificacion.md`](docs/planificacion.md).

## 🚀 Cómo ejecutar el proyecto

Al ser un proyecto 100% frontend (HTML/CSS/JS vanilla, sin build tools), basta con servirlo como sitio estático:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Luis890D/plataforma-videos-educativos-Parcial1_D_Web-.git
   cd plataforma-videos-educativos-Parcial1_D_Web-
   ```
2. Abre `index.html` directamente en el navegador, o sírvelo con un servidor local, por ejemplo:
   ```bash
   npx serve .
   # o
   python3 -m http.server 8080
   ```
3. Navega a `http://localhost:8080` (o al puerto indicado).

No requiere instalación de dependencias: el frontend se conecta directamente a la API REST ya desplegada en Azure.

## 🧪 Flujo de prueba sugerido

1. Navegar el catálogo como visitante, buscar y filtrar por categoría.
2. Intentar dar "Like" sin sesión → debe redirigir al login.
3. Registrar un estudiante nuevo (carné formato `0000-00-00000`, PIN numérico ≥ 4 dígitos).
4. Iniciar sesión con carné o con correo.
5. Dar Like a un video y quitarlo (toggle).
6. Publicar un comentario y responderlo (verificar que solo permite 1 nivel de respuestas).
7. Eliminar un comentario propio y verificar que no se puede eliminar uno ajeno (403).

## 📄 Documentación adicional

El documento [`docs/planificacion.md`](docs/planificacion.md) contiene la planificación completa del proyecto, dividida en tres series de evaluación:

- **Serie I** — Autenticación, registro y reglas de validación.
- **Serie II** — Interfaz de usuario, catálogo y navegación.
- **Serie III** — Lógica de interacción y gestión de comentarios.

---

*Proyecto desarrollado para el 1er Parcial de Desarrollo y Diseño Web · UMG 2026.*
