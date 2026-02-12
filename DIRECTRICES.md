# Directrices del Proyecto RoyaleHaus

## Base de Datos
- **URL**: `postgresql://postgres:7cb9ufdcgt4jsfz9@72.62.237.156:5432/postgres`
- Base de datos **compartida con OnePieceHaus**
- Las tablas usan prefijos en el campo `kind` para diferenciar apps (ej: `royale:game:win`, `onepiece:daily`)

## Despliegue
- **SIEMPRE hacer `git push` después de cada tarea** para desplegar cambios
- Los builds NO se compilan en el servidor remoto - se despliegan automáticamente tras push
- **NO abrir ventanas de localhost** - todo está en la BD online

## Compilación
- Revisar posibles errores de compilación antes de hacer push
- Usar `npm run build` para verificar que compila correctamente

## Arquitectura
- Next.js 14 con App Router
- TypeScript
- Prisma ORM para acceso a BD
- TailwindCSS para estilos

## Juegos Daily
- **Royaledle, Pixel-Royale, Emoji-Riddle** son juegos diarios
- Cada día a las 00:00 UTC se resetea el desafío
- Los usuarios solo pueden jugar una vez al día
- El progreso se guarda en `DailyParticipation`

## Usuarios Admin
- Usuarios con `role: 'admin'` tienen acceso a `/admin/daily` y `/admin/feedback`
- Para dar admin: `npx tsx scripts/set-admins.ts --set-admin <username>`

## Notas Importantes
- Los usuarios deben registrarse en RoyaleHaus para tener cuenta (BD compartida pero sesiones separadas)
