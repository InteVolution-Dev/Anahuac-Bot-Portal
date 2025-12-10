# Anahuac Bot Portal

Portal web moderno para la creación y gestión de bots conversacionales personalizados.

## Descripción

Anahuac Bot Portal es una aplicación web que permite crear, configurar y gestionar flujos de conversación para bots de IA. Cuenta con una interfaz intuitiva para diseñar interacciones complejas, gestionar bases de conocimiento y configurar variables dinámicas.

## Características Principales

-   🔐 **Sistema de autenticación** con rutas protegidas
-   🤖 **Gestión de Bots** - Crear, editar y listar múltiples bots
-   🔄 **Editor de Flujos** - Diseño visual de conversaciones
-   📚 **Base de Conocimiento** - Gestión de información del bot
-   🎨 **Variables Dinámicas** - Configuración de parámetros personalizados
-   📱 **Interfaz Responsive** - Diseño adaptable a todos los dispositivos
-   🌙 **Tema Moderno** - UI limpia y profesional con Tailwind CSS
-   ⚡ **Rendimiento Optimizado** - Construido con Vite para carga rápida

## Tecnologías

-   **React 19** - Biblioteca de interfaz de usuario
-   **TypeScript** - Tipado estático para JavaScript
-   **React Router DOM** - Navegación y rutas
-   **Tailwind CSS 4** - Framework de estilos utility-first
-   **Lucide React** - Iconos modernos
-   **Framer Motion** - Animaciones fluidas
-   **React Hook Form** - Gestión de formularios
-   **Vite 7** - Build tool y servidor de desarrollo

## Requisitos Previos

-   Node.js (versión 18 o superior)
-   npm o yarn

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/InteVolution-Dev/Anahuac-Bot-Portal.git

# Navegar al directorio
cd Anahuac-Bot-Portal

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Scripts Disponibles

```bash
# Modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview

# Linting
npm run lint
```

## Estructura del Proyecto

```
Anahuac-Bot-Portal/
├── src/
│   ├── app/                 # Páginas principales
│   │   ├── Home.tsx        # Dashboard principal
│   │   ├── CrearFlujo.tsx  # Creador de flujos
│   │   └── EditarFlujo.tsx # Editor de flujos
│   ├── components/          # Componentes reutilizables
│   │   ├── Login.tsx
│   │   ├── BotList.tsx
│   │   ├── BaseDeConocimiento.tsx
│   │   ├── AgregarVarable.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ui/             # Componentes UI base
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── NavBar.tsx
│   ├── App.tsx             # Componente principal
│   └── main.tsx            # Punto de entrada
├── public/                  # Archivos estáticos
└── package.json            # Dependencias y scripts
```

## Uso

1. **Iniciar Sesión**: Accede a la aplicación con tus credenciales
2. **Dashboard**: Visualiza y gestiona todos tus bots
3. **Crear Bot**: Utiliza el botón "Crear Flujo" para iniciar un nuevo bot
4. **Configurar**: Define variables, acciones y base de conocimiento
5. **Editar**: Modifica flujos existentes según tus necesidades

## Desarrollo

El proyecto utiliza:

-   ESLint para mantener la calidad del código
-   TypeScript para type safety
-   Vite para hot module replacement durante el desarrollo

## Licencia

Proyecto privado - © InteVolution

## Contacto

Para soporte o consultas, contacta al equipo de InteVolution.
