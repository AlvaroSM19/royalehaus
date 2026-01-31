# 📋 PLAN DE DESARROLLO - ANIMEHAUS

## 🎯 OBJETIVO DEL PROYECTO
Plataforma web de mini-juegos y quizzes basados en anime (One Piece) con 168 personajes.
Inspirado en futbol-11.com pero 100% temática anime.

## ⚠️ PREMISAS FUNDAMENTALES
- **IDIOMA**: La página debe estar íntegramente en **INGLÉS** - Toda la UI, textos, botones, descripciones, etc.
- **NO usar español** en ningún elemento visible al usuario
- **Consistencia**: Mantener el inglés en todas las páginas y componentes

## 🗂️ ESTRUCTURA DE DATOS ACTUAL
- **Base de datos**: `op-db.json` con 168 personajes de One Piece
- **Campos disponibles**: id, name, crew, imageUrl, haki, bounty, origin, hakiTypes, devilFruit, features

## 🎮 MINI-JUEGOS A DESARROLLAR

### 1. 🎯 ANIME GRID (Prioridad Alta)
- Grid 3x3 interactivo
- Validación cruzada (fila + columna)
- Timer 20 minutos
- Sistema de puntuación y hints
- **Dependencias**: Búsqueda con autocompletado, validación de condiciones

### 2. 🔤 ANIME WORDLE (Prioridad Media)
- 6 intentos para adivinar personaje
- Timer 5 minutos
- Sistema de colores y teclado virtual
- **Dependencias**: Filtrado de nombres (3-12 caracteres)

### 3. ⚡ HIGHER OR LOWER (Prioridad Media)
- Comparación de bounties
- Sistema de rachas
- **Dependencias**: Filtro de personajes con bounty válido

### 4. 🕵️ IMPOSTOR (Prioridad Baja)
- Encuentra el personaje que no pertenece
- Categorías temáticas dinámicas
- **Dependencias**: Agrupación por características

## 🛠️ STACK TECNOLÓGICO DECISIONES

### Framework y Librerías
- **Next.js 14** con App Router
- **TypeScript** para tipado fuerte
- **Tailwind CSS** para styling
- **shadcn/ui** para componentes
- **Framer Motion** para animaciones
- **Lucide React** para iconos

### Estructura de Carpetas Decidida
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── games/
│   │   ├── grid/
│   │   ├── wordle/
│   │   ├── higher-lower/
│   │   └── impostor/
│   └── characters/
├── components/
│   ├── ui/ (shadcn)
│   ├── games/
│   └── layout/
├── lib/
│   ├── utils.ts
│   ├── characters.ts
│   └── game-logic/
├── types/
│   └── character.ts
└── data/
    └── characters.json
```

## 🎨 DIRECTRICES DE DISEÑO

### Paleta de Colores
- **Primario**: Azul marino (#1e3a8a) y naranja (#f97316)
- **Secundario**: Grises oscuros para modo oscuro
- **Acentos**: Amarillo (#eab308) para elementos destacados

### Tipografía
- **Font principal**: Inter
- **Jerarquía**: text-8xl (headers) → text-lg (contenido)
- **Peso**: font-bold para títulos con gradientes

### Animaciones y Efectos
- Transiciones suaves: `transition-all duration-300`
- Hover effects en cards y botones
- Gradientes animados en backgrounds
- Loading spinners para estados de carga

### Responsive Design
- **Mobile First**: Optimización principal para móvil
- **Breakpoints**: sm:640px, md:768px, lg:1024px, xl:1280px
- **Grids**: 1 col (mobile) → 2-3 cols (tablet) → 4 cols (desktop)

## 📐 ARQUITECTURA DE COMPONENTES

### Componentes Base (Reutilizables)
- `CharacterCard`: Para mostrar personajes
- `GameCard`: Para preview de juegos
- `SearchInput`: Con autocompletado
- `Timer`: Componente de temporizador
- `ScoreDisplay`: Mostrar puntuaciones

### Componentes de Layout
- `Header`: Navegación principal
- `Footer`: Links y SEO
- `GameLayout`: Layout específico para juegos
- `Sidebar`: Navegación lateral (opcional)

### Componentes de Juego
- `GridGame`: Lógica del grid 3x3
- `WordleGame`: Mecánica de adivinanza
- `HigherLowerGame`: Comparación de bounties
- `ImpostorGame`: Detección de intruso

## 🔧 CONFIGURACIONES TÉCNICAS

### Next.js Config
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['localhost'],
  },
  experimental: {
    typedRoutes: true,
  },
}
```

### Tailwind Config
- Tema personalizado con colores anime
- Configuración de animaciones personalizadas
- Utilidades específicas para juegos

## 📊 MODELO DE DATOS

### Interface Character (TypeScript)
```typescript
interface AnimeCharacter {
  id: string
  name: string
  crew: string | null
  imageUrl: string
  haki: boolean
  bounty: number | null
  origin: string
  hakiTypes: string[]
  devilFruit: string | null
  features: string[]
}
```

### Utilidades de Datos
- Funciones de filtrado por características
- Validadores de condiciones de juego
- Generadores de categorías aleatorias
- Cache de consultas frecuentes

## 🚀 FASES DE DESARROLLO

### Fase 1: Configuración Base (COMPLETADA ✅)
- [x] Crear documento de planificación
- [x] Configurar Next.js 14 + TypeScript
- [x] Instalar y configurar Tailwind + shadcn/ui
- [x] Migrar base de datos de personajes
- [x] Crear tipos TypeScript
- [x] Configurar estructura de carpetas
- [x] Crear layout principal con navegación
- [x] Crear página de inicio con hero section
- [x] Configurar CSS globals con tema anime

### Fase 2: Componentes Base (COMPLETADA PARCIAL ✅)
- [x] Layout principal (Header/Footer) - COMPLETADO
- [x] Página de inicio con hero section - COMPLETADO
- [x] Sistema de navegación - COMPLETADO
- [x] Game cards para preview - COMPLETADO
- [ ] Componente CharacterCard
- [ ] SearchInput Component con autocompletado
- [ ] Timer Component para juegos

### Fase 3: Anime Grid (MVP)
- [ ] Componente Grid 3x3
- [ ] Lógica de validación
- [ ] Sistema de búsqueda
- [ ] Timer y puntuación

### Fase 4: Resto de Juegos
- [ ] Anime Wordle
- [ ] Higher or Lower
- [ ] Impostor

### Fase 5: Optimización y Deploy
- [ ] SEO y metadata
- [ ] Optimización de imágenes
- [ ] Testing responsive
- [ ] Deploy en Vercel

## 📝 DECISIONES TÉCNICAS TOMADAS

### 1. Estructura de la Base de Datos ✅
- **Decisión**: Mantener `op-db.json` como fuente única de verdad
- **Razón**: Simplicidad para prototipo, fácil migración futura
- **Impacto**: Todas las consultas serán en memoria
- **Implementado**: Migrado a `src/data/characters.json` con 168 personajes

### 2. Gestión de Estado ✅
- **Decisión**: React Context + useState para estado de juegos
- **Razón**: Evitar complejidad innecesaria de Redux para este scope
- **Impacto**: Estado local por juego, estado global mínimo
- **Implementado**: Preparado en tipos TypeScript

### 3. Enrutamiento ✅
- **Decisión**: App Router de Next.js 14
- **Razón**: Mejor SEO, streaming, y características modernas
- **Impacto**: Estructura de carpetas basada en rutas
- **Implementado**: Configurado con layout principal

### 4. Styling ✅
- **Decisión**: Tailwind CSS + shadcn/ui (simplificado)
- **Razón**: Desarrollo rápido + componentes consistentes
- **Impacto**: Clases utilitarias + componentes pre-diseñados
- **Implementado**: CSS globals con tema anime oscuro

### 6. Idioma y Localización ✅
- **Decisión**: Página íntegramente en INGLÉS
- **Razón**: Alcance internacional y consistencia con la temática anime global
- **Impacto**: Todos los textos, UI, botones y descripciones deben estar en inglés
- **Implementado**: ✅ CORREGIDO - Página principal y layout traducidos completamente al inglés

## 🎯 MÉTRICAS DE ÉXITO
- Tiempo de carga < 2 segundos
- Responsive en todos los dispositivos
- 4 juegos completamente funcionales
- Base de datos de 168 personajes integrada
- SEO optimizado

## 📋 PRÓXIMOS PASOS INMEDIATOS

### ✅ COMPLETADO:
- **Configuración Base**: Next.js 14, TypeScript, Tailwind CSS configurados
- **Layout Principal**: Header con navegación y footer implementados
- **Página de Inicio**: Hero section, game cards, features y CTA implementados
- **Servidor de Desarrollo**: Ejecutándose en http://localhost:3000

### ✅ COMPLETADO:
- **Configuración Base**: Next.js 14, TypeScript, Tailwind CSS configurados
- **Layout Principal**: Header con navegación y footer implementados  
- **Página de Inicio**: Hero section, game cards, features y CTA implementados
- **Servidor de Desarrollo**: Ejecutándose en http://localhost:3002
- **🌐 INGLÉS COMPLETO**: 
  - ✅ Página principal traducida al inglés
  - ✅ Comentarios de código traducidos al inglés
  - ✅ Base de datos y utilidades en inglés
  - ✅ Tipos TypeScript documentados en inglés
  - ✅ CSS y estilos completamente en inglés
- **🔧 ERRORES COMPLETAMENTE RESUELTOS**:
  - ✅ Errores de imports TypeScript resueltos
  - ✅ Paths relativos configurados correctamente
  - ✅ Archivo duplicado home-page.tsx eliminado
  - ✅ Estructura de datos JSON refactorizada
  - ✅ CSS theme() functions corregidas
  - ✅ Servidor funcionando sin errores webpack/runtime
  - ✅ Compilación limpia: 514 modules, 3.8s inicial

### 🔄 SIGUIENTES TAREAS PRIORITARIAS:

#### 1. Páginas Adicionales
- [ ] **Games Hub** (`/games`): Página con todos los juegos disponibles
- [ ] **Characters Page** (`/characters`): Browse de 168 personajes con filtros
- [ ] **Página 404**: Error handling personalizado

#### 2. Componentes Reutilizables
- [ ] **CharacterCard Component**: Para mostrar personajes individual
- [ ] **SearchInput Component**: Con autocompletado para personajes
- [ ] **Timer Component**: Para los juegos con límite de tiempo
- [ ] **Loading Components**: Skeletons y spinners

#### 3. Primer Juego - Anime Grid (MVP)
- [ ] **Página del juego** (`/games/grid`): Layout específico para el juego
- [ ] **Grid Component**: Grid 3x3 interactivo
- [ ] **Validation Logic**: Sistema de validación de condiciones
- [ ] **Search System**: Autocompletado con personajes
- [ ] **Game State**: Context para manejar estado del juego

#### 4. Optimizaciones
- [ ] **Mobile Menu**: Menú hamburguesa funcional
- [ ] **Responsive Fixes**: Ajustes para móviles
- [ ] **Performance**: Lazy loading e imágenes optimizadas

---
**Estado Actual**: Página principal funcionando ✅ - Servidor ejecutándose correctamente
**Próxima Prioridad**: Implementar páginas adicionales y componentes base
**URL Local**: http://localhost:3000
**Última actualización**: 1 Agosto 2025 - 12:30
