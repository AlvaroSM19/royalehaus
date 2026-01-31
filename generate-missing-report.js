const fs = require('fs');
const path = require('path');

console.log('🔍 Analizando personajes e imágenes...\n');

// Leer la lista de personajes de la base de datos
const animeDataPath = path.join(__dirname, 'src', 'lib', 'anime-data.ts');
const animeDataContent = fs.readFileSync(animeDataPath, 'utf8');

// Extraer los IDs de los personajes de la base de datos
const dbCharacterIds = [];
const characterMatches = animeDataContent.matchAll(/"id":"(op-[^"]+)"/g);
for (const match of characterMatches) {
  dbCharacterIds.push(match[1]);
}

// Extraer también los nombres para el reporte
const dbCharacterData = [];
const nameMatches = animeDataContent.matchAll(/"id":"(op-[^"]+)","name":"([^"]+)"/g);
for (const match of nameMatches) {
  dbCharacterData.push({
    id: match[1],
    name: match[2]
  });
}

// Leer la lista de imágenes disponibles
const imagesPath = path.join(__dirname, 'public', 'images', 'characters');
const imageFiles = fs.readdirSync(imagesPath)
  .filter(file => file.startsWith('op-') && file.endsWith('.webp'))
  .map(file => file.replace('.webp', ''));

// Encontrar personajes en DB pero sin imagen
const charactersWithoutImage = dbCharacterIds.filter(id => !imageFiles.includes(id));

// Encontrar imágenes sin personaje en DB
const imagesWithoutCharacter = imageFiles.filter(id => !dbCharacterIds.includes(id));

// Generar el reporte
const currentDate = new Date().toLocaleDateString('es-ES', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

let report = `# REPORTE DE PERSONAJES E IMÁGENES
## Generado el ${currentDate}

---

## 📊 ESTADÍSTICAS GENERALES

- **Total de personajes en BD:** ${dbCharacterIds.length}
- **Total de imágenes disponibles:** ${imageFiles.length}
- **Personajes sin imagen:** ${charactersWithoutImage.length}
- **Imágenes sin personaje en BD:** ${imagesWithoutCharacter.length}
- **Porcentaje de completitud:** ${Math.round(((dbCharacterIds.length - charactersWithoutImage.length) / dbCharacterIds.length) * 100)}%

---

## ❌ PERSONAJES EN LA BASE DE DATOS SIN IMAGEN (${charactersWithoutImage.length})

`;

if (charactersWithoutImage.length > 0) {
  charactersWithoutImage.forEach((id, index) => {
    const characterData = dbCharacterData.find(char => char.id === id);
    const name = characterData ? characterData.name : 'Nombre no encontrado';
    report += `${(index + 1).toString().padStart(3, ' ')}. **${id}** - ${name}\n`;
  });
} else {
  report += '🎉 ¡Todos los personajes de la base de datos tienen imagen!\n';
}

report += `
---

## 📸 IMÁGENES SIN PERSONAJE EN LA BASE DE DATOS (${imagesWithoutCharacter.length})

`;

if (imagesWithoutCharacter.length > 0) {
  // Agrupar por categorías para mejor organización
  const charactersByCategory = {
    bigmom: [],
    marines: [],
    others: []
  };

  imagesWithoutCharacter.forEach(id => {
    // Algunos patrones comunes para categorizar
    if (id.includes('charlotte') || ['op-galette', 'op-smoothie', 'op-custard', 'op-myukuru'].includes(id)) {
      charactersByCategory.bigmom.push(id);
    } else if (['op-bastille', 'op-doberman', 'op-onigumo', 'op-strawberry', 'op-yamakaji'].includes(id)) {
      charactersByCategory.marines.push(id);
    } else {
      charactersByCategory.others.push(id);
    }
  });

  if (charactersByCategory.bigmom.length > 0) {
    report += `### 🍰 Familia Big Mom / Charlotte (${charactersByCategory.bigmom.length})\n`;
    charactersByCategory.bigmom.forEach((id, index) => {
      report += `${(index + 1).toString().padStart(3, ' ')}. **${id}**\n`;
    });
    report += '\n';
  }

  if (charactersByCategory.marines.length > 0) {
    report += `### ⚓ Marines (${charactersByCategory.marines.length})\n`;
    charactersByCategory.marines.forEach((id, index) => {
      report += `${(index + 1).toString().padStart(3, ' ')}. **${id}**\n`;
    });
    report += '\n';
  }

  if (charactersByCategory.others.length > 0) {
    report += `### 🏴‍☠️ Otros personajes (${charactersByCategory.others.length})\n`;
    charactersByCategory.others.forEach((id, index) => {
      report += `${(index + 1).toString().padStart(3, ' ')}. **${id}**\n`;
    });
  }
} else {
  report += '🎉 ¡Todas las imágenes tienen su personaje correspondiente en la base de datos!\n';
}

report += `
---

## 🔧 RECOMENDACIONES

### Para personajes sin imagen:
- Buscar y agregar las imágenes faltantes en formato .webp
- Verificar que los nombres de archivo coincidan exactamente con los IDs

### Para imágenes sin personaje:
- Considerar agregar estos personajes a la base de datos
- Verificar si son duplicados o variaciones de personajes existentes
- Eliminar imágenes que no sean necesarias

---

## 📋 CHECKLIST DE TAREAS

### Imágenes faltantes (${charactersWithoutImage.length}):
`;

charactersWithoutImage.forEach(id => {
  const characterData = dbCharacterData.find(char => char.id === id);
  const name = characterData ? characterData.name : 'Nombre no encontrado';
  report += `- [ ] **${id}** - ${name}\n`;
});

report += `
### Personajes a añadir (Top 20):
`;

// Mostrar solo los primeros 20 para no abrumar
const topImages = imagesWithoutCharacter.slice(0, 20);
topImages.forEach(id => {
  report += `- [ ] **${id}**\n`;
});

if (imagesWithoutCharacter.length > 20) {
  report += `- [ ] ... y ${imagesWithoutCharacter.length - 20} más\n`;
}

report += `
---

*Reporte generado automáticamente por generate-missing-report.js*
`;

// Guardar el reporte
const reportPath = path.join(__dirname, 'PERSONAJES_FALTANTES.md');
fs.writeFileSync(reportPath, report, 'utf8');

console.log('✅ Reporte generado exitosamente!');
console.log(`📄 Archivo creado: ${reportPath}`);
console.log(`\n📊 Resumen rápido:`);
console.log(`   • Personajes en BD: ${dbCharacterIds.length}`);
console.log(`   • Imágenes disponibles: ${imageFiles.length}`);
console.log(`   • Personajes sin imagen: ${charactersWithoutImage.length}`);
console.log(`   • Imágenes sin personaje: ${imagesWithoutCharacter.length}`);
console.log(`   • Completitud: ${Math.round(((dbCharacterIds.length - charactersWithoutImage.length) / dbCharacterIds.length) * 100)}%`);
