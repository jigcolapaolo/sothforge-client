# SothForge Frontend

Frontend web de SothForge para la gestión de proyectos, organizaciones, tableros y tareas. Está desarrollado con Next.js 16, React 19 y usa la API de SothForge como capa de negocio y persistencia. El proyecto fue construido con apoyo de GitHub Copilot, manteniendo una arquitectura modular y centrada en la experiencia de trabajo colaborativo.

## Descripción general

SothForge es una solución de trabajo en equipo orientada a la planificación y ejecución de proyectos. Este frontend permite:

- autenticación de usuarios con login y registro;
- gestión de organizaciones y miembros;
- creación, edición y administración de proyectos;
- visualización y gestión de tableros y tareas;
- asignación de responsables y control de estados;
- administración de etiquetas, roles y permisos;
- búsqueda rápida de proyectos, tableros y tareas en el espacio de trabajo;
- perfil del usuario y cierre de sesión.

La aplicación sigue un patrón de rutas protegidas y utiliza un shell principal para mantener una experiencia consistente en todo el dashboard.

## Stack tecnológico

- Next.js 16
- React 19
- TypeScript
- React Router DOM
- Tailwind CSS
- Lucide React
- GitHub Copilot como apoyo de desarrollo

## Funcionalidades principales

### Autenticación y acceso

La app implementa un flujo de sesión basado en tokens:

- registro de usuario;
- inicio de sesión;
- refresh automático de sesión cuando el access token expira;
- cierre de sesión individual o global;
- protección de rutas privadas mediante `ProtectedRoute`.

### Organización y miembros

El cliente permite:

- listar organizaciones del usuario;
- crear nuevas organizaciones;
- gestionar miembros y roles dentro de una organización;
- transferir propiedad del espacio;
- abandonar una organización;
- administrar etiquetas de organización.

### Proyectos y tableros

El frontend soporta:

- selección de organización activa;
- listado de proyectos por organización;
- creación y actualización de proyectos;
- listado de tableros asociados a un proyecto;
- navegación directa a cada tablero o tarea.

### Tareas y flujo de trabajo

Dentro de cada tablero es posible:

- crear tareas;
- editar tareas existentes;
- cambiar estados, prioridad y fechas límite;
- asignar responsables;
- visualizar descripciones y metadatos;
- explorar tareas desde una búsqueda contextual del espacio.

### Perfil de usuario

La interfaz incluye:

- vista del perfil del usuario;
- edición de datos básicos de la cuenta;
- cambio de contraseña;
- contexto de sesión activo.

## Requisitos previos

Antes de arrancar el proyecto, asegúrate de tener instalado:

- Node.js 20 o superior
- npm

## Instalación

```bash
npm install
```

## Configuración de entorno

Este frontend depende del backend de SothForge. La base URL de la API se configura con la variable de entorno:

```bash
NEXT_PUBLIC_API_URL=https://sothforge-api.onrender.com
```

Si no se define, el cliente usa esta URL por defecto:

```bash
https://sothforge-api.onrender.com
```

## Ejecución en desarrollo

```bash
npm run dev
```

Abre la siguiente URL en tu navegador:

```text
http://localhost:3000
```

## Scripts disponibles

```bash
npm run dev      # inicia el entorno de desarrollo
npm run build    # genera la build de producción
npm run start    # ejecuta la aplicación compilada
npm run lint     # valida el código con ESLint
npm run format   # formatea el proyecto con Prettier
npm run format:check  # comprueba el formato
```

## Estructura del proyecto

```text
src/
  app/
    router/
    ...
  features/
    auth/
    boards/
    dashboard/
    organizations/
    projects/
    tasks/
    users/
  layouts/
  lib/
  shared/
```

Principales puntos de interés:

- `src/lib/api.ts`: cliente HTTP centralizado para la API de SothForge.
- `src/lib/auth.tsx`: manejo de sesión y autenticación.
- `src/app/router/AppRouter.tsx`: enrutamiento principal de la aplicación.
- `src/layouts/AppShell.tsx`: shell de navegación y búsqueda del espacio de trabajo.

## Limitaciones y consideraciones de la API de SothForge

Es importante entender que este frontend no funciona de forma aislada: depende completamente de la API de SothForge para autenticar usuarios, cargar organizaciones, proyectos, tableros y tareas.

### Límites funcionales

- La API debe estar disponible y accesible desde la URL configurada.
- El cliente asume una respuesta JSON con estructura compatible con `data`, o un array directo, y normaliza varias variaciones para evitar fallos por forma de payload.
- La autenticación usa JWT con access token y refresh token.
- El refresh token se almacena en `sessionStorage`, por lo que la sesión se mantiene solo en el navegador y depende del contexto del usuario.
- La app muestra estados vacíos y mensajes de error cuando la API no responde o no devuelve datos.
- No es un backend independiente; es una capa de consumo y presentación de datos del sistema SothForge.

### Recomendaciones

- Mantener la API disponible en el entorno de desarrollo y producción.
- Verificar siempre `NEXT_PUBLIC_API_URL` antes de desplegar.
- Probar cambios del frontend con datos reales del backend para validar contratos de respuesta.
- Considerar que algunas operaciones pueden depender de permisos del usuario y roles dentro de cada organización.

## Estado del proyecto

Este frontend está orientado a una experiencia de trabajo colaborativo y de gestión de proyectos en el ecosistema SothForge. Está listo para conectarse a la API y facilitar la interacción del usuario con el flujo principal de negocio, siempre que el backend esté disponible y responda con los contratos esperados.
