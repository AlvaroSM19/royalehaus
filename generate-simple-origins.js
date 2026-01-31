const fs = require('fs');
const path = require('path');

console.log('🌍 Extrayendo lista de orígenes...\n');

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

// Generar la lista simple
const currentDate = new Date().toLocaleDateString('es-ES', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

let list = `# LISTA DE ORÍGENES - ONE PIECE QUEST
## Generado el ${currentDate}

Total de orígenes únicos: **${sortedOrigins.length}**

---

`;

sortedOrigins.forEach((origin, index) => {
  list += `${(index + 1).toString().padStart(3, ' ')}. ${origin}\n`;
});

list += `
---

*Lista generada automáticamente por generate-simple-origins.js*
`;

// Guardar la lista
const listPath = path.join(__dirname, 'ORIGENES_SIMPLE.md');
fs.writeFileSync(listPath, list, 'utf8');

console.log('✅ Lista simple de orígenes generada exitosamente!');
console.log(`📄 Archivo creado: ${listPath}`);
console.log(`📊 Total de orígenes únicos: ${sortedOrigins.length}`);
console.log('\n📋 Lista completa:');
sortedOrigins.forEach((origin, index) => {
  console.log(`   ${(index + 1).toString().padStart(3, ' ')}. ${origin}`);
});
