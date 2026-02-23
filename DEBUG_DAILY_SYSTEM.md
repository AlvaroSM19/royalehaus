# Debugging Daily System - Guía de Logs

## 🔍 Cómo Ver los Logs

Los logs se mostrarán en diferentes lugares dependiendo del componente:

### 1. **Consola del Navegador (Chrome DevTools)**

Abre las DevTools (F12) y ve a la pestaña **Console**. Verás logs con estos prefijos:

- `[DailyGameCard]` - Logs del componente de las tarjetas daily en la página principal
- `[Royaledle]` - Logs del juego Royaledle (similar para otros juegos)
- `[AdminDaily]` - Logs del panel de administración de dailys

### 2. **Terminal del Servidor (npm run dev)**

En la terminal donde ejecutas `npm run dev`, verás logs de las APIs:

- `[DAILY_API]` - Logs de `/api/daily` (GET y POST)
- `[ADMIN_API]` - Logs de `/api/daily/admin`

## 📋 Flujo de Logs Esperado

### Al Cargar la Página Principal

**En el navegador:**
```
[DailyGameCard] checkCompletion called for: royaledle user: <userId>
[DailyGameCard] Checking completion for: royaledle
[DailyGameCard] API response status: 200
[DailyGameCard] API data: { challenge: {...}, participation: {...} }
[DailyGameCard] Is completed: true/false
[DailyGameCard] Setting completed to: true/false
```

**En el servidor:**
```
[DAILY_API] GET request: { gameType: 'royaledle', dateParam: null }
[DAILY_API] Looking for challenge on date: 2026-02-23
[DAILY_API] Challenge found: { id: '...', cardId: 34 }
[DAILY_API] Session ID: exists
[DAILY_API] Session found: { userId: '...', expired: false }
[DAILY_API] Participation: { completed: true, won: true }
[DAILY_API] Response: {...}
```

### Al Entrar a un Juego Daily

**En el navegador:**
```
[Royaledle] initGame called, user: <userId>
[Royaledle] Fetching daily challenge from API...
[Royaledle] API response status: 200
[Royaledle] API data: {...}
[Royaledle] Already completed, showing result
  O
[Royaledle] Loading challenge card: 34
```

### Al Abrir el Panel Admin

**En el navegador:**
```
[AdminDaily] useEffect - authLoading: false user: { id: '...', role: 'admin' }
[AdminDaily] Is admin, fetching challenges
[AdminDaily] Fetching challenges...
[AdminDaily] Fetching from: 2026-02-13 to: 2026-03-05
[AdminDaily] Response status: 200
[AdminDaily] Received challenges: 84
```

**En el servidor:**
```
[ADMIN_API] GET: Starting admin check
[ADMIN_API] GET: Admin check result: true
[ADMIN_API] GET: Fetching challenges from 2026-02-13 to 2026-03-05
[ADMIN_API] GET: Found 84 challenges
```

## ❌ Problemas Comunes y Sus Logs

### Problema 1: No se encuentra el challenge
```
[DAILY_API] No challenge found for date: 2026-02-23 gameType: royaledle
```
**Solución:** Ejecutar `npx tsx scripts/create-daily-challenges.ts`

### Problema 2: Usuario no está autenticado
```
[DAILY_API] Session ID: null
[DailyGameCard] Not logged in, local completed: false
```
**Solución:** Iniciar sesión

### Problema 3: Panel admin no tiene permisos
```
[ADMIN_API] GET: Admin check result: false
[ADMIN_API] GET: Not admin - denied
```
**Solución:** Usuario no es admin, verificar rol en base de datos

### Problema 4: Error de conexión a base de datos
```
[DAILY_API] GET error: Error: ...
```
**Solución:** Verificar que PostgreSQL está corriendo y variables de entorno

## 🧪 Instrucciones de Testing

### 1. Probar Página Principal
1. Iniciar sesión
2. Abrir la página principal
3. Abrir DevTools (F12) → Console
4. Buscar logs con `[DailyGameCard]`
5. Verificar que muestra el estado correcto

### 2. Probar Juego Daily
1. Click en un juego daily (ej: Royaledle)
2. En Console buscar logs con `[Royaledle]`
3. Verificar que carga la carta correcta
4. Si está completado, verificar que no permite jugar

### 3. Probar Panel Admin
1. Iniciar sesión como admin
2. Ir a `/admin/daily`
3. En Console buscar logs con `[AdminDaily]`
4. En la terminal del servidor buscar logs con `[ADMIN_API]`
5. Verificar que muestra la lista de challenges

## 📊 Compartir Logs para Debugging

Si necesitas ayuda, copia los logs y compártelos. Busca en:

1. **Console del navegador:** Click derecho → "Save as..." para guardar todos los logs
2. **Terminal del servidor:** Copia el output completo

Los logs más importantes usualmente están al principio del flow (cuando cargas la página o entras al juego).

## 🔧 Ejecutar Scripts de Verificación

```bash
# Verificar challenges existentes
npx tsx scripts/check-daily-challenges.ts

# Crear challenges para hoy
npx tsx scripts/create-daily-challenges.ts

# Crear challenges para fecha específica
npx tsx scripts/create-daily-challenges.ts 2026-02-24

# Test completo del flow
npx tsx scripts/test-daily-flow.ts
```

## 🎯 Próximos Pasos

Una vez identificado el problema con los logs:

1. Toma captura de los logs relevantes
2. Identifica el mensaje de error exacto
3. Compara con el flujo esperado arriba
4. Aplica la solución correspondiente
