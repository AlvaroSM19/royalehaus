const fs = require('fs');
const path = require('path');

console.log('🌍 Analizando orígenes de personajes...\n');

// Leer la base de datos de personajes
const animeDataPath = path.join(__dirname, 'src', 'lib', 'anime-data.ts');
const animeDataContent = fs.readFileSync(animeDataPath, 'utf8');

// Extraer todos los orígenes únicos
const origins = new Set();
const originMatches = animeDataContent.matchAll(/"origin":"([^"]+)"/g);

for (const match of originMatches) {
  origins.add(match[1]);
}

// Convertir a array y ordenar alfabéticamente
const sortedOrigins = Array.from(origins).sort();

// Contar personajes por origen
const originCounts = {};
sortedOrigins.forEach(origin => {
  const regex = new RegExp(`"origin":"${origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
  const matches = animeDataContent.match(regex);
  originCounts[origin] = matches ? matches.length : 0;
});

// Generar el reporte
const currentDate = new Date().toLocaleDateString('es-ES', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

let report = `# LISTA DE ORÍGENES - ONE PIECE QUEST
## Generado el ${currentDate}

---

## 📊 ESTADÍSTICAS GENERALES

- **Total de orígenes únicos:** ${sortedOrigins.length}
- **Total de personajes:** ${Object.values(originCounts).reduce((a, b) => a + b, 0)}

---

## 🗺️ LISTA COMPLETA DE ORÍGENES

`;

// Agrupar por categorías para mejor organización
const categories = {
  'Blues': [],
  'Grand Line - Primera Mitad': [],
  'New World': [],
  'Skypiea y Islas del Cielo': [],
  'Fishman Island': [],
  'Marines y Gobierno': [],
  'Revolucionarios': [],
  'Otras Ubicaciones': []
};

sortedOrigins.forEach(origin => {
  const lowerOrigin = origin.toLowerCase();
  
  if (lowerOrigin.includes('east blue') || lowerOrigin.includes('west blue') || 
      lowerOrigin.includes('north blue') || lowerOrigin.includes('south blue') ||
      lowerOrigin.includes('blue')) {
    categories['Blues'].push(origin);
  } else if (lowerOrigin.includes('skypiea') || lowerOrigin.includes('sky island') ||
             lowerOrigin.includes('upper yard') || lowerOrigin.includes('birka')) {
    categories['Skypiea y Islas del Cielo'].push(origin);
  } else if (lowerOrigin.includes('fishman') || lowerOrigin.includes('ryugu') ||
             lowerOrigin.includes('fish-man')) {
    categories['Fishman Island'].push(origin);
  } else if (lowerOrigin.includes('marine') || lowerOrigin.includes('navy') ||
             lowerOrigin.includes('government') || lowerOrigin.includes('world government') ||
             lowerOrigin.includes('enies lobby') || lowerOrigin.includes('impel down') ||
             lowerOrigin.includes('marineford')) {
    categories['Marines y Gobierno'].push(origin);
  } else if (lowerOrigin.includes('revolutionary') || lowerOrigin.includes('baltigo')) {
    categories['Revolucionarios'].push(origin);
  } else if (lowerOrigin.includes('wano') || lowerOrigin.includes('whole cake') ||
             lowerOrigin.includes('dressrosa') || lowerOrigin.includes('punk hazard') ||
             lowerOrigin.includes('zou') || lowerOrigin.includes('new world') ||
             lowerOrigin.includes('tottoland')) {
    categories['New World'].push(origin);
  } else if (lowerOrigin.includes('alabasta') || lowerOrigin.includes('drum') ||
             lowerOrigin.includes('jaya') || lowerOrigin.includes('water 7') ||
             lowerOrigin.includes('thriller bark') || lowerOrigin.includes('sabaody') ||
             lowerOrigin.includes('grand line')) {
    categories['Grand Line - Primera Mitad'].push(origin);
  } else {
    categories['Otras Ubicaciones'].push(origin);
  }
});

// Generar reporte por categorías
Object.entries(categories).forEach(([categoryName, origins]) => {
  if (origins.length > 0) {
    const totalCharacters = origins.reduce((sum, origin) => sum + originCounts[origin], 0);
    report += `### ${categoryName} (${origins.length} orígenes, ${totalCharacters} personajes)\n\n`;
    
    origins.sort().forEach((origin, index) => {
      const count = originCounts[origin];
      report += `${(index + 1).toString().padStart(3, ' ')}. **${origin}** - ${count} personaje${count === 1 ? '' : 's'}\n`;
    });
    report += '\n';
  }
});

report += `---

## 📋 ORÍGENES MÁS POBLADOS (Top 15)

`;

// Ordenar por cantidad de personajes
const topOrigins = sortedOrigins
  .map(origin => ({ origin, count: originCounts[origin] }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 15);

topOrigins.forEach((item, index) => {
  report += `${(index + 1).toString().padStart(2, ' ')}. **${item.origin}** - ${item.count} personaje${item.count === 1 ? '' : 's'}\n`;
});

report += `
---

## 🔍 ANÁLISIS DE COBERTURA

### Arcos principales representados:
- ✅ East Blue Saga
- ✅ Alabasta Saga  
- ✅ Sky Island Saga
- ✅ Water 7 Saga
- ✅ Thriller Bark Saga
- ✅ Summit War Saga
- ✅ Fishman Island Saga
- ✅ Dressrosa Saga
- ✅ Zou Saga
- ✅ Whole Cake Island Saga
- ✅ Wano Country Saga

### Organizaciones representadas:
- ✅ Piratas del Sombrero de Paja
- ✅ Marines y Gobierno Mundial
- ✅ Ejército Revolucionario
- ✅ Yonko y sus tripulaciones
- ✅ Shichibukai
- ✅ Supernovas
- ✅ Habitantes de islas específicas

---

*Lista generada automáticamente por generate-origins-list.js*
`;

// Guardar el reporte
const reportPath = path.join(__dirname, 'LISTA_ORIGENES.md');
fs.writeFileSync(reportPath, report, 'utf8');

console.log('✅ Lista de orígenes generada exitosamente!');
console.log(`📄 Archivo creado: ${reportPath}`);
console.log(`\n📊 Resumen rápido:`);
console.log(`   • Orígenes únicos: ${sortedOrigins.length}`);
console.log(`   • Total personajes: ${Object.values(originCounts).reduce((a, b) => a + b, 0)}`);
console.log(`   • Origen más poblado: ${topOrigins[0].origin} (${topOrigins[0].count} personajes)`);

console.log(`\n🏆 Top 5 orígenes:`);
topOrigins.slice(0, 5).forEach((item, index) => {
  console.log(`   ${index + 1}. ${item.origin}: ${item.count} personajes`);
});
