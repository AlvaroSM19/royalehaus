# Sistema de Daily Challenges - RoyaleHaus

## ✅ Estado Actual: FUNCIONANDO CORRECTAMENTE

El sistema de daily challenges ahora funciona completamente con sincronización entre dispositivos y navegadores.

## 🎯 Cómo Funciona

### 1. Base de Datos
- **Tabla**: `DailyChallenge` - Almacena los desafíos diarios
  - `date`: Fecha YYYY-MM-DD
  - `gameType`: 'royaledle', 'emoji-riddle', 'pixel-royale'
  - `cardId`: ID de la carta del día
  
- **Tabla**: `DailyParticipation` - Almacena progreso de usuarios
  - `challengeId`: Referencia al challenge
  - `userId`: Usuario que jugó
  - `completed`: Si completó el juego
  - `won`: Si ganó
  - `attempts`: Número de intentos

### 2. Flujo de Usuario Autenticado

```
┌─────────────────┐
│ Usuario inicia  │
│    sesión       │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Abre página     │
│    principal    │
└────────┬────────┘
         │
         v
┌────────────────────────────────────┐
│ DailyGameCard llama:               │
│ GET /api/daily?game=royaledle      │
└────────┬───────────────────────────┘
         │
         v
┌────────────────────────────────────┐
│ API responde:                      │
│ {                                  │
│   challenge: {                     │
│     cardId: 165,  ← SIEMPRE       │
│     date: "2026-02-21"             │
│   },                               │
│   participation: {                 │
│     completed: true/false,         │
│     won: true/false                │
│   }                                │
│ }                                  │
└────────┬───────────────────────────┘
         │
         ├───→ SI completed=true
         │     └─→ Mostrar como completado ✓
         │
         └───→ SI completed=false/null
               └─→ Mostrar como disponible ○
```

### 3. Flujo al Entrar al Juego

```
┌─────────────────┐
│ Usuario entra   │
│   al juego      │
└────────┬────────┘
         │
         v
┌────────────────────────────────────┐
│ initGame() llama GET /api/daily    │
└────────┬───────────────────────────┘
         │
         v
    ¿Completed?
         │
         ├───→ SÍ
         │     ├─→ setDailyCompleted(true)
         │     ├─→ setGameOver(true)
         │     ├─→ Mostrar resultado
         │     └─→ Prevenir nuevos guesses
         │
         └───→ NO
               ├─→ Cargar carta del challenge
               ├─→ Permitir jugar
               └─→ Al completar → POST /api/daily
```

### 4. Al Completar el Juego

```
┌─────────────────┐
│ Usuario gana o  │
│  usa todos los  │
│    intentos     │
└────────┬────────┘
         │
         v
┌────────────────────────────────────┐
│ POST /api/daily                    │
│ {                                  │
│   gameType: "royaledle",           │
│   guessedCardId: 165,              │
│   won: true                        │
│ }                                  │
└────────┬───────────────────────────┘
         │
         v
┌────────────────────────────────────┐
│ API crea/actualiza participation:  │
│ {                                  │
│   completed: true,                 │
│   won: true,                       │
│   attempts: 3,                     │
│   completedAt: timestamp           │
│ }                                  │
└────────┬───────────────────────────┘
         │
         v
┌────────────────────────────────────┐
│ localStorage se actualiza también: │
│ - royaledle-last-daily: "2026-02-21"
│ - royaledle-daily-result: {...}   │
└─────────────────────────────────────┘
```

## 🔧 Scripts Útiles

### Crear Challenges para Hoy
```bash
npx tsx scripts/create-daily-challenges.ts
```

### Crear Challenges para una Fecha Específica
```bash
npx tsx scripts/create-daily-challenges.ts 2026-02-21
```

### Verificar Estado de los Challenges
```bash
npx tsx scripts/check-daily-challenges.ts
```

### Probar el Flujo Completo
```bash
npx tsx scripts/test-daily-flow.ts
```

## 🎮 Prevención de Re-jugar

Los juegos previenen volver a jugar mediante:

1. **royaledle/page.tsx**: `if (gameOver || !targetCard || dailyCompleted) return;`
2. **pixel-royale/page.tsx**: `if (dailyCompleted) return;`
3. **emoji-riddle/page.tsx**: `if (dailyCompleted) return;`

## 📊 Verificación de Estado

### En la Página Principal (DailyGameCard)
- **Usuario autenticado**: Consulta `/api/daily?game={gameType}`
- **Usuario no autenticado**: Usa localStorage como fallback
- **Actualización**: Se verifica cada 2 segundos

### Dentro del Juego
- Al iniciar: Consulta API y carga estado correcto
- Si completado: Muestra resultado y previene jugar
- Si no completado: Carga carta del challenge y permite jugar

## 🔄 Sincronización entre Dispositivos

Para usuarios autenticados:
1. Completa el juego en Dispositivo A
2. Se guarda en PostgreSQL
3. Abre en Dispositivo B
4. API devuelve estado completado
5. Se muestra como completado automáticamente

## ⚠️ Importante

- **SIEMPRE** enviar `cardId` en la respuesta API (incluso cuando no está completado)
- **SIEMPRE** verificar `dailyCompleted` antes de permitir guesses
- **SIEMPRE** usar `targetCard.id` al enviar POST (no `card.id` del guess)
- **Challenges** se crean manualmente mediante scripts (no auto-generados)

## 🐛 Debugging

Si un usuario reporta que no se marca como completado:

1. Verificar que existe el challenge para hoy:
```bash
npx tsx scripts/create-daily-challenges.ts
```

2. Verificar en la consola del navegador:
```javascript
// Debe mostrar los datos del challenge
fetch('/api/daily?game=royaledle', {credentials: 'include'})
  .then(r => r.json())
  .then(console.log)
```

3. Verificar que la participation se creó en la BD:
```sql
SELECT * FROM "DailyParticipation" 
WHERE "userId" = 'user_id_here' 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

## 📅 Mantenimiento

Cada día necesitas crear los challenges:
```bash
npx tsx scripts/create-daily-challenges.ts
```

Opcionalmente, puedes crear un cron job o GitHub Action para automatizarlo.
