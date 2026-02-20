# Descargar Sonidos de Cartas

Para descargar los sonidos de cartas desde GitHub:

1. Ve a: https://github.com/Henrylq/Clash-Royale-SFX/tree/master/Cards

2. Para cada carta, descarga el archivo `*_deploy_end_01.ogg` o `*_attack_*.ogg`

3. Renombra y guarda según el ID de la carta:
   - Knight → `1.mp3`
   - Archers → `2.mp3`
   - Giant → `4.mp3`
   - PEKKA → `5.mp3`
   - Witch → `8.mp3`
   - Barbarians → `9.mp3`
   - Golem → `10.mp3`
   - Prince → `17.mp3`
   - Wizard → `18.mp3`
   - Hog Rider → `22.mp3`
   - Sparky → `33.mp3`
   - Mega Knight → `50.mp3`

4. Guarda los archivos en: `public/sounds/cards/`

5. Actualiza `CARDS_WITH_SOUNDS` en `src/app/games/sound-quiz/page.tsx` con los IDs descargados

## Mapeo Completo ID → Nombre

Ver `src/data/cards.json` para la lista completa
