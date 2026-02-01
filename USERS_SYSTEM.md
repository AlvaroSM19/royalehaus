# Sistema de Usuarios y Leaderboards - RoyaleHaus

## 📋 Resumen de la Implementación

Se ha implementado un sistema completo de usuarios, autenticación, progreso y leaderboards, diseñado para compartir la base de datos con OnePieceHaus.

## 🏗️ Estructura de Archivos Creados

```
prisma/
  schema.prisma          # Esquema compartido con tablas específicas de RoyaleHaus

src/
  server/
    prisma.ts            # Cliente de Prisma singleton
    auth-store.ts        # Gestión de usuarios y sesiones
    rate-limit.ts        # Limitador de peticiones
    xp-service.ts        # Sistema de XP y niveles
    progress-store.ts    # Progreso y leaderboards

  lib/
    useAuth.ts           # Hook de autenticación (cliente)
    progress.ts          # Sistema de progreso (cliente)
    xp-rules.ts          # Reglas de XP por juego

  app/
    auth/
      page.tsx           # Página de login/registro
    leaderboard/
      page.tsx           # Página de leaderboards
    logbook/
      page.tsx           # Perfil y estadísticas del usuario
    api/
      auth/
        login/route.ts   # API de login
        register/route.ts # API de registro
        me/route.ts      # API de sesión actual
        logout/route.ts  # API de logout
        profile/route.ts # API de actualizar perfil
      progress/
        route.ts         # API de progreso
      xp/
        route.ts         # API de XP
      leaderboard/
        route.ts         # API de leaderboard simple
      leaderboards/
        route.ts         # API de leaderboards por juego

  components/
    AuthNav.tsx          # Navegación de auth en header
    LevelBadge.tsx       # Badge de nivel
```

## 🔗 Base de Datos Compartida

### Tablas Compartidas (usadas por ambas apps)
- `User` - Usuarios con XP global
- `Session` - Sesiones de autenticación

### Tablas Específicas de RoyaleHaus
- `RoyaleProgress` - Progreso de juegos
- `RoyaleXpEvent` - Eventos de XP
- `RoyaleFeedback` - Feedback de usuarios
- `RoyaleSiteStat` - Estadísticas del sitio

## 🎮 Juegos Soportados

1. **Royaledle** - Adivina la carta
2. **Higher Lower** - Mayor o menor
3. **Impostor** - Encuentra el impostor
4. **Wordle** - Wordle de Clash Royale

## 🚀 Configuración

### 1. Variables de Entorno
Crear archivo `.env` basado en `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/animehaus?schema=public"
```

**Importante:** Usar la MISMA DATABASE_URL que OnePieceHaus para compartir usuarios.

### 2. Migración de Base de Datos
Si es una base de datos nueva:
```bash
npx prisma migrate dev --name init
```

Si ya existe la BD de OnePieceHaus, solo generar el cliente:
```bash
npx prisma generate
```

Y aplicar cambios incrementales:
```bash
npx prisma db push
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

## 📊 Sistema de XP

### Valores de XP por Juego:
- **Royaledle**: 100 XP (win) + 200 XP (first try) + 50 XP (≤3 attempts)
- **Higher Lower**: 20 XP × streak + bonuses (5/10/25 streak)
- **Impostor**: 30 XP × streak + bonuses (3/5/10 streak)
- **Wordle**: 80 XP (win) + 200 XP (first try) + 50 XP (≤3 attempts)

### Caps Diarios:
- Global: 3000 XP/día
- Por juego: 1200 XP/día

## 🔒 Autenticación

El sistema usa cookies HTTP-only con sesiones de 30 días.
Los usuarios pueden:
- Registrarse con email/username/password
- Iniciar sesión con email o username
- Cerrar sesión
- Ver su perfil en /logbook
- Ver leaderboards en /leaderboard

## 🎯 Integración con los Juegos

Para registrar una partida, usar las funciones de `@/lib/progress`:

```typescript
import { recordHigherLowerSession, recordRoyaledleSession, recordImpostorSession, recordWordleSession } from '@/lib/progress';

// Ejemplo Higher Lower
recordHigherLowerSession(streak);

// Ejemplo Royaledle
recordRoyaledleSession(attempts, won);

// Ejemplo Impostor
recordImpostorSession(streak, score);

// Ejemplo Wordle
recordWordleSession(won, attempt, wordLength);
```

Esto automáticamente:
1. Guarda el progreso localmente
2. Sincroniza con el servidor (si autenticado)
3. Otorga XP correspondiente
